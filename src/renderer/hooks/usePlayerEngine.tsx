import { useEffect, useRef, useState, useCallback } from 'react';
import type { Child, SubsonicAPI as SubsonicAPIType } from 'subsonic-api' with {
  'resolution-mode': 'import',
};
import type { GlobalReducer } from './useGlobalState';

export interface UsePlayerEngineResult {
  /** Attach this to a hidden <audio> element rendered once in App.tsx */
  audioRef: React.RefObject<HTMLAudioElement | null>;
  /** Resolved, authenticated cover art URL for the current nowPlaying track (or null) */
  albumArtUrl: string | null;
  isPlaying: boolean;
  /** Current playback position in seconds — mirrors globalState.player.progress */
  progress: number;
  duration: number;
  /** 0–100, safe to feed straight into a range input's value */
  progressPercent: number;
  /** True once nowPlaying is the last track in tracksInPlayer (or list is empty) */
  isLastTrack: boolean;
  /** True once nowPlaying is the first track in tracksInPlayer (or list is empty) */
  isFirstTrack: boolean;
  /** Convenience — equivalent to dispatch({ player: { nowPlaying: song, progress: 0 } }) */
  play: (song: Child) => void;
  pause: () => void;
  resume: () => void;
  togglePlay: () => void;
  seek: (seconds: number) => void;
  /** Advances to the next track in tracksInPlayer relative to nowPlaying. No-op at the end of the queue. */
  next: () => void;
  /**
   * Standard player UX: if more than 3s into the current track, restarts it
   * instead of jumping back a track. Otherwise goes to the previous track
   * (or steps back through shuffle history, if shuffle is on).
   */
  previous: () => void;
  /** When true, next() wraps to the start of the queue at the end (and vice versa for previous) */
  repeat: boolean;
  toggleRepeat: () => void;
  /** When true, next() picks a random remaining track instead of the next sequential one */
  shuffle: boolean;
  toggleShuffle: () => void;
  /** 0–1 */
  volume: number;
  /** Clamped to 0–1, applied to the <audio> element immediately, and persisted to settings */
  setVolume: (level: number) => void;
  /**
   * Web Audio analyser tapped off the current track, for a spectrum visualizer.
   * Null until the first track plays (created lazily on first play). Pass
   * straight to <AudioVisualizer analyserRef={...} />.
   */
  analyserRef: React.RefObject<AnalyserNode | null>;
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
 */
export function usePlayerEngine([
  globalState,
  dispatch,
]: GlobalReducer): UsePlayerEngineResult {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [albumArtUrl, setAlbumArtUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [repeat, setRepeat] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [volume, setVolume] = useState(1);

  // Hydrate saved volume once on mount (falls back to 1 if nothing saved yet)
  useEffect(() => {
    window.settings.get<number>('volume').then((saved) => {
      if (typeof saved === 'number') setVolume(saved);
    });
  }, []);

  useEffect(() => {
    window.settings.set('volume', volume);
  }, [volume]);

  // Keep the actual <audio> element's volume in sync, including right after
  // a new src is assigned (some browsers can reset volume on src changes)
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  const { nowPlaying, tracksInPlayer, progress } = globalState.player;

  const currentIndex = nowPlaying
    ? tracksInPlayer.findIndex((t) => t.id === nowPlaying.id)
    : -1;

  // Actual play-order history (not queue order) — lets shuffle's "previous"
  // step back through what really played, instead of just picking another
  // random track. Ref, not state: it shouldn't trigger re-renders on its own.
  const historyRef = useRef<string[]>([]);

  useEffect(() => {
    if (!nowPlaying) return;
    const last = historyRef.current[historyRef.current.length - 1];
    if (last !== nowPlaying.id) historyRef.current.push(nowPlaying.id);
  }, [nowPlaying?.id]);

  // Lazily-created Web Audio graph, tapped for the visualizer. Created on first
  // play (not on mount) so context creation happens inside a real user-gesture
  // chain, per browser autoplay policy. IMPORTANT: once createMediaElementSource
  // is called, ALL of the audio element's output routes through this graph —
  // source MUST connect through to ctx.destination or playback goes silent.
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const ensureAudioGraph = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || analyserRef.current) return analyserRef.current;

    const ctx = new AudioContext();
    const source = ctx.createMediaElementSource(audio);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 64; // 32 frequency bins — chunky, Winamp-scale bars

    source.connect(analyser);
    analyser.connect(ctx.destination);

    audioContextRef.current = ctx;
    analyserRef.current = analyser;
    return analyser;
  }, []);

  // Whenever nowPlaying changes to a different track: fetch the stream URL and play it.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !nowPlaying) return;

    let cancelled = false;

    (async () => {
      try {
        const url = await window.subsonic.getStreamUrl(nowPlaying.id);
        if (cancelled) return;
        audio.src = url;
        audio.currentTime = 0;

        ensureAudioGraph();
        if (audioContextRef.current?.state === 'suspended') {
          await audioContextRef.current.resume();
        }

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
      }
    })();

    return () => {
      cancelled = true;
    };
    // Only re-run when the *track itself* changes, not on every nowPlaying object identity change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nowPlaying?.id]);

  // Whenever the cover art reference changes: resolve an authenticated art URL.
  // `coverArt` is Subsonic's own art-reference id and is usually distinct from the song id.
  useEffect(() => {
    if (!nowPlaying) {
      setAlbumArtUrl(null);
      return;
    }
    const coverArtId =
      nowPlaying.coverArt ?? nowPlaying.albumId ?? nowPlaying.id;
    let cancelled = false;

    window.subsonic.getCoverArtUrl(coverArtId, 300).then((url) => {
      if (!cancelled) setAlbumArtUrl(url);
    });

    return () => {
      cancelled = true;
    };
  }, [nowPlaying?.coverArt, nowPlaying?.albumId, nowPlaying?.id]);

  // Keep globalState.player.progress in sync with the real <audio> element,
  // and track play/pause/duration locally (no need to push those into global state).
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
      // pick any track other than the current one (falls back to itself if it's the only track)
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
      dispatch({ player: { nowPlaying: tracksInPlayer[0], progress: 0 } }); // wrap to start
    }
  }, [shuffle, repeat, currentIndex, tracksInPlayer, nowPlaying?.id, dispatch]);

  const previous = useCallback(() => {
    // more than 3s in -> restart current track, matching standard player UX
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      return;
    }

    if (shuffle) {
      // step back through actual play history, not the queue's sequential order
      const hist = historyRef.current;
      if (hist.length > 1) {
        hist.pop(); // drop the current track — it'll get re-pushed when nowPlaying changes back
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
      }); // wrap to end
    }
  }, [shuffle, repeat, currentIndex, tracksInPlayer, dispatch]);

  const toggleRepeat = useCallback(() => setRepeat((r) => !r), []);
  const toggleShuffle = useCallback(() => setShuffle((s) => !s), []);

  // Always-current ref so the 'ended' listener (registered once) can call
  // next() without that effect needing to re-run every time the queue changes.
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

  return {
    audioRef,
    albumArtUrl,
    isPlaying,
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
    analyserRef,
  };
}
