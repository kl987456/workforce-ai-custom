import { useEffect, useRef } from "react";

/**
 * Decorative oscilloscope-style waveform — signals "live audio", not driven
 * by real amplitude data. Hunar does not expose a live audio stream to the
 * browser (only a final recording + result once the call ends), so like the
 * bar-style Waveform it replaces, this is honestly a visual cue, not a meter.
 */
export function CanvasWaveform({ active = true }: { active?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = canvas.clientWidth || 300;
    const height = canvas.clientHeight || 64;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const styles = getComputedStyle(document.documentElement);
    const primary = styles.getPropertyValue("--color-primary").trim() || "#22d3ee";
    const tertiary = styles.getPropertyValue("--color-tertiary").trim() || "#4ade80";

    let raf = 0;
    let t = 0;
    const mid = height / 2;

    function frame() {
      ctx!.clearRect(0, 0, width, height);

      if (!active) {
        ctx!.globalAlpha = 0.4;
        ctx!.strokeStyle = tertiary;
        ctx!.lineWidth = 1.5;
        ctx!.beginPath();
        ctx!.moveTo(0, mid);
        ctx!.lineTo(width, mid);
        ctx!.stroke();
        return;
      }

      t += 0.09;
      ctx!.globalAlpha = 1;
      [
        { color: primary, amp: 0.34, freq: 1.6, phase: 0, lw: 2.2 },
        { color: tertiary, amp: 0.2, freq: 2.8, phase: 1.4, lw: 1.3 },
      ].forEach(({ color, amp, freq, phase, lw }) => {
        ctx!.strokeStyle = color;
        ctx!.lineWidth = lw;
        ctx!.shadowColor = color;
        ctx!.shadowBlur = 8;
        ctx!.beginPath();
        for (let x = 0; x <= width; x += 4) {
          const jitter = Math.sin(x * 0.05 + t * 3) * 0.15;
          const y = mid + Math.sin(x * 0.02 * freq + t + phase) * mid * amp * (1 + jitter);
          if (x === 0) ctx!.moveTo(x, y);
          else ctx!.lineTo(x, y);
        }
        ctx!.stroke();
      });
      ctx!.shadowBlur = 0;
      raf = requestAnimationFrame(frame);
    }

    frame();
    return () => cancelAnimationFrame(raf);
  }, [active]);

  return <canvas ref={canvasRef} className="h-16 w-full" aria-hidden="true" />;
}
