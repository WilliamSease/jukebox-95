import { useEffect, useRef, useState, useCallback } from 'react';
import type { Child, SubsonicAPI as SubsonicAPIType } from 'subsonic-api' with {
  'resolution-mode': 'import',
};
import type { GlobalReducer } from './useGlobalState';

export interface UsePlayerEngineResult {
  /** Attach this to a hidden <audio> element rendered once in App.tsx */
  audioRef: React.RefObject<HTMLAudioElement | null>;
  /** Resolved cover art URL for the current nowPlaying track (or null) —
   *  a data: URL for local tracks, an authenticated URL for Subsonic tracks */
  albumArtUrl: string | null;
  isPlaying: boolean;
  /** True while the current track is loading, before playback starts.
   *  Meaningful for local tracks (disk read via IPC) and Subsonic tracks alike. */
  isBuffering: boolean;
  /** Current playback position in seconds — mirrors globalState.player.progress */
  progress: number;
  duration: number;
  /** 0–100, safe to feed straight into a range input's value */
  progressPercent: number;
  isLastTrack: boolean;
  isFirstTrack: boolean;
  /** Convenience — equivalent to dispatch({ player: { nowPlaying: song, progress: 0 } }) */
  play: (song: Child) => void;
  pause: () => void;
  resume: () => void;
  togglePlay: () => void;
  seek: (seconds: number) => void;
  next: () => void;
  previous: () => void;
  repeat: boolean;
  toggleRepeat: () => void;
  shuffle: boolean;
  toggleShuffle: () => void;
  /** 0–1 */
  volume: number;
  setVolume: (level: number) => void;
}

/** Formats seconds as "m:ss" for transport bar display, e.g. 275 -> "4:35" */
export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Owns the actual <audio> element and reacts to globalState.player.nowPlaying.
 * Call this ONCE, at the top of App.tsx, right where useGlobalState() is called.
 * Anything downstream can start playback just by dispatching a new nowPlaying —
 * no need to route through this hook directly.
 *
 * Two track sources, one element: Subsonic tracks play from a plain
 * authenticated URL; local tracks (id starting with "local:") play from a
 * Blob built out of bytes read over IPC, since a file on disk has no URL to
 * hand the <audio> element. Neither path touches Web Audio — just the
 * element's native playback — so there's no CORS consideration here at all.
 */
export function usePlayerEngine([
  globalState,
  dispatch,
]: GlobalReducer): UsePlayerEngineResult {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [albumArtUrl, setAlbumArtUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [duration, setDuration] = useState(0);
  const [repeat, setRepeat] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [volume, setVolumeState] = useState(1);

  // The blob: URL currently assigned to audio.src (local tracks only) —
  // tracked so we can revoke it when a new track loads (or on unmount).
  // Blob URLs pin their backing ArrayBuffer in memory until revoked.
  const currentBlobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (currentBlobUrlRef.current)
        URL.revokeObjectURL(currentBlobUrlRef.current);
    };
  }, []);

  // Hydrate saved volume once on mount (falls back to 1 if nothing saved yet)
  useEffect(() => {
    window.settings.get<number>('volume').then((saved) => {
      if (typeof saved === 'number') setVolumeState(saved);
    });
  }, []);

  useEffect(() => {
    window.settings.set('volume', volume);
  }, [volume]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  const { nowPlaying, tracksInPlayer, progress } = globalState.player;

  const currentIndex = nowPlaying
    ? tracksInPlayer.findIndex((t) => t.id === nowPlaying.id)
    : -1;

  const historyRef = useRef<string[]>([]);

  useEffect(() => {
    if (!nowPlaying) return;
    const last = historyRef.current[historyRef.current.length - 1];
    if (last !== nowPlaying.id) historyRef.current.push(nowPlaying.id);
  }, [nowPlaying?.id]);

  // Whenever nowPlaying changes to a different track: load and play it.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !nowPlaying) return;

    let cancelled = false;
    setIsBuffering(true);

    (async () => {
      try {
        // Clear out any previous local track's blob before loading the next
        // one, regardless of what kind of track is loading next.
        if (currentBlobUrlRef.current) {
          URL.revokeObjectURL(currentBlobUrlRef.current);
          currentBlobUrlRef.current = null;
        }

        if (nowPlaying.id.startsWith('local:')) {
          const { buffer, contentType } =
            await window.localLibrary.fetchFileBlob(nowPlaying.path!);
          if (cancelled) return;
          const blob = new Blob([buffer], { type: contentType });
          const blobUrl = URL.createObjectURL(blob);
          currentBlobUrlRef.current = blobUrl;
          audio.src = blobUrl;
        } else {
          const url = await window.subsonic.getStreamUrl(nowPlaying.id);
          if (cancelled) return;
          audio.src = url;
        }

        audio.currentTime = 0;
        await audio.play();
      } catch (err) {
        if (!cancelled) {
          dispatch({
            ui: {
              errorMessage: `Couldn't play "${nowPlaying.title}": ${
                err instanceof Error ? err.message : String(err)
              }`,
            },
          });
        }
      } finally {
        if (!cancelled) setIsBuffering(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // Only re-run when the *track itself* changes, not on every nowPlaying object identity change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nowPlaying?.id]);

  // Whenever the current track changes: resolve an art URL for it.
  // Local tracks are resolved on demand (one small IPC call for whichever
  // track is actually playing) — NOT embedded in every Song at scan time,
  // since that's what ran the heap out of memory at 30k songs.
  useEffect(() => {
    if (!nowPlaying) {
      setAlbumArtUrl(null);
      return;
    }

    let cancelled = false;

    if (nowPlaying.id.startsWith('local:')) {
      window.localLibrary.fetchCoverArt(nowPlaying.path!).then((url) => {
        if (!cancelled) setAlbumArtUrl(url);
      });
      return () => {
        cancelled = true;
      };
    }

    const coverArtId =
      nowPlaying.coverArt ?? nowPlaying.albumId ?? nowPlaying.id;

    window.subsonic.getCoverArtUrl(coverArtId, 300).then((url) => {
      if (!cancelled) setAlbumArtUrl(url);
    });

    return () => {
      cancelled = true;
    };
  }, [nowPlaying?.id, nowPlaying?.coverArt, nowPlaying?.albumId]);

  // Keep globalState.player.progress in sync with the real <audio> element,
  // and track play/pause/duration locally.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () =>
      dispatch({ player: { progress: audio.currentTime } });
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      setIsPlaying(false);
      nextRef.current();
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
    };
  }, [dispatch]);

  const play = useCallback(
    (song: Child) => dispatch({ player: { nowPlaying: song, progress: 0 } }),
    [dispatch],
  );

  const next = useCallback(() => {
    if (tracksInPlayer.length === 0) return;

    if (shuffle) {
      const pool =
        tracksInPlayer.length > 1
          ? tracksInPlayer.filter((t) => t.id !== nowPlaying?.id)
          : tracksInPlayer;
      const pick = pool[Math.floor(Math.random() * pool.length)];
      if (pick) dispatch({ player: { nowPlaying: pick, progress: 0 } });
      return;
    }

    if (currentIndex === -1) return;
    const nextTrack = tracksInPlayer[currentIndex + 1];
    if (nextTrack) {
      dispatch({ player: { nowPlaying: nextTrack, progress: 0 } });
    } else if (repeat) {
      dispatch({ player: { nowPlaying: tracksInPlayer[0], progress: 0 } });
    }
  }, [shuffle, repeat, currentIndex, tracksInPlayer, nowPlaying?.id, dispatch]);

  const previous = useCallback(() => {
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      return;
    }

    if (shuffle) {
      const hist = historyRef.current;
      if (hist.length > 1) {
        hist.pop();
        const prevId = hist[hist.length - 1];
        const prevTrack = tracksInPlayer.find((t) => t.id === prevId);
        if (prevTrack)
          dispatch({ player: { nowPlaying: prevTrack, progress: 0 } });
      }
      return;
    }

    if (currentIndex === -1) return;
    const prevTrack = tracksInPlayer[currentIndex - 1];
    if (prevTrack) {
      dispatch({ player: { nowPlaying: prevTrack, progress: 0 } });
    } else if (repeat) {
      dispatch({
        player: {
          nowPlaying: tracksInPlayer[tracksInPlayer.length - 1],
          progress: 0,
        },
      });
    }
  }, [shuffle, repeat, currentIndex, tracksInPlayer, dispatch]);

  const toggleRepeat = useCallback(() => setRepeat((r) => !r), []);
  const toggleShuffle = useCallback(() => setShuffle((s) => !s), []);

  const nextRef = useRef(next);
  nextRef.current = next;

  const pause = useCallback(() => audioRef.current?.pause(), []);
  const resume = useCallback(() => audioRef.current?.play(), []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) audio.play();
    else audio.pause();
  }, []);

  const seek = useCallback((seconds: number) => {
    if (audioRef.current) audioRef.current.currentTime = seconds;
  }, []);

  const setVolume = useCallback((level: number) => {
    const clamped = Math.min(1, Math.max(0, level));
    setVolumeState(clamped);
    if (audioRef.current) audioRef.current.volume = clamped;
  }, []);

  return {
    audioRef,
    albumArtUrl,
    isPlaying,
    isBuffering,
    progress,
    duration,
    progressPercent: duration > 0 ? (progress / duration) * 100 : 0,
    isFirstTrack: shuffle
      ? historyRef.current.length <= 1
      : !repeat && currentIndex <= 0,
    isLastTrack: shuffle
      ? tracksInPlayer.length <= 1
      : !repeat &&
        (currentIndex === -1 || currentIndex === tracksInPlayer.length - 1),
    play,
    pause,
    resume,
    togglePlay,
    seek,
    next,
    previous,
    repeat,
    toggleRepeat,
    shuffle,
    toggleShuffle,
    volume,
    setVolume,
  };
}
