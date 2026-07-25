import { useEffect, useRef, useState, useCallback } from 'react';
import type { Child } from 'subsonic-api' with { 'resolution-mode': 'import' };
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
   * instead of jumping back a track. Otherwise goes to the previous track.
   */
  previous: () => void;
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

  const { nowPlaying, tracksInPlayer, progress } = globalState.player;

  const currentIndex = nowPlaying
    ? tracksInPlayer.findIndex((t) => t.id === nowPlaying.id)
    : -1;

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
    if (currentIndex === -1) return;
    const nextTrack = tracksInPlayer[currentIndex + 1];
    if (nextTrack) dispatch({ player: { nowPlaying: nextTrack, progress: 0 } });
  }, [currentIndex, tracksInPlayer, dispatch]);

  const previous = useCallback(() => {
    if (currentIndex === -1) return;
    // more than 3s in -> restart current track, matching standard player UX
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      return;
    }
    const prevTrack = tracksInPlayer[currentIndex - 1];
    if (prevTrack) dispatch({ player: { nowPlaying: prevTrack, progress: 0 } });
  }, [currentIndex, tracksInPlayer, dispatch]);

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
    isFirstTrack: currentIndex <= 0,
    isLastTrack:
      currentIndex === -1 || currentIndex === tracksInPlayer.length - 1,
    play,
    pause,
    resume,
    togglePlay,
    seek,
    next,
    previous,
  };
}
