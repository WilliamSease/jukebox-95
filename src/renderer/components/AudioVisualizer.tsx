import { useEffect, useRef } from 'react';

export interface AudioVisualizerProps {
  analyserRef: React.RefObject<AnalyserNode | null>;
  width?: number;
  height?: number;
  barCount?: number;
}

/**
 * Classic segmented LED-style spectrum visualizer (Winamp / hardware VU meter
 * look). Runs its own requestAnimationFrame loop and draws straight to canvas
 * — deliberately NOT piped through React state, since analyser data updates
 * ~60x/sec and that would hammer re-renders for no benefit.
 *
 * Safe to mount before playback starts — analyserRef.current is null until
 * the first track plays, and this just draws a decaying-to-flat display
 * until it appears.
 */
export function AudioVisualizer({
  analyserRef,
  width = 120,
  height = 32,
  barCount = 16,
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  // per-bar smoothing: fast rise, slow decay — the classic VU meter feel
  const smoothedRef = useRef<number[]>(new Array(barCount).fill(0));

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx2d = canvas?.getContext('2d');
    if (!canvas || !ctx2d) return;

    const segmentHeight = 3;
    const segmentGap = 1;
    const barGap = 2;
    const barWidth = (width - barGap * (barCount - 1)) / barCount;
    const segmentsPerBar = Math.max(
      1,
      Math.floor(height / (segmentHeight + segmentGap)),
    );

    let dataArray: Uint8Array | null = null;

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);

      ctx2d.fillStyle = '#0a0a0a';
      ctx2d.fillRect(0, 0, width, height);

      const analyser = analyserRef.current;
      if (
        analyser &&
        (!dataArray || dataArray.length !== analyser.frequencyBinCount)
      ) {
        dataArray = new Uint8Array(analyser.frequencyBinCount);
      }
      if (analyser && dataArray) analyser.getByteFrequencyData(dataArray);

      for (let i = 0; i < barCount; i++) {
        const raw = dataArray
          ? (dataArray[Math.floor((i / barCount) * dataArray.length)] ?? 0)
          : 0;
        const target = raw / 255;

        const prev = smoothedRef.current[i];
        smoothedRef.current[i] = target > prev ? target : prev * 0.85;
        const level = smoothedRef.current[i];

        const litSegments = Math.round(level * segmentsPerBar);
        const x = i * (barWidth + barGap);

        for (let seg = 0; seg < segmentsPerBar; seg++) {
          const y = height - (seg + 1) * (segmentHeight + segmentGap);
          const heightFraction = seg / segmentsPerBar;
          const isLit = seg < litSegments;

          let color = '#1a3a1a'; // unlit segment
          if (isLit) {
            if (heightFraction > 0.85)
              color = '#ff3b3b'; // red peak
            else if (heightFraction > 0.6)
              color = '#ffd23b'; // yellow
            else color = '#3bff5e'; // green
          }

          ctx2d.fillStyle = color;
          ctx2d.fillRect(x, y, barWidth, segmentHeight);
        }
      }
    };

    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, [analyserRef, width, height, barCount]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ imageRendering: 'pixelated', border: '1px solid #444' }}
    />
  );
}
