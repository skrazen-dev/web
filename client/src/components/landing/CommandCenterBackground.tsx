import { useEffect, useRef } from "react";

/**
 * Cinematic command-center backdrop rendered on a single canvas:
 *   • drifting financial "particles" (faint gold/chrome motes)
 *   • flowing vertical data streams (ticker-like light trails)
 *   • a slow, subtle profit curve breathing across the lower third
 *
 * Deliberately restrained — no neon, no glow spam. Pauses when the tab is
 * hidden and honours prefers-reduced-motion.
 */
export function CommandCenterBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReduced = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    type Particle = { x: number; y: number; r: number; vy: number; vx: number; a: number; gold: boolean };
    type Stream = { x: number; y: number; len: number; speed: number; a: number };

    let particles: Particle[] = [];
    let streams: Stream[] = [];

    const rand = (min: number, max: number) => min + Math.random() * (max - min);

    const build = () => {
      const area = width * height;
      const pCount = Math.min(90, Math.max(36, Math.round(area / 24000)));
      particles = Array.from({ length: pCount }, () => ({
        x: rand(0, width),
        y: rand(0, height),
        r: rand(0.4, 1.8),
        vy: rand(-0.12, -0.45),
        vx: rand(-0.12, 0.12),
        a: rand(0.08, 0.4),
        gold: Math.random() < 0.45,
      }));

      const sCount = Math.min(26, Math.max(10, Math.round(width / 70)));
      streams = Array.from({ length: sCount }, () => ({
        x: rand(0, width),
        y: rand(0, height),
        len: rand(60, 180),
        speed: rand(0.6, 2.2),
        a: rand(0.04, 0.16),
      }));
    };

    const resize = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
    };

    let t = 0;
    const drawChart = () => {
      // Slow-breathing profit curve along the lower third.
      const baseY = height * 0.72;
      const amp = height * 0.06;
      ctx.beginPath();
      for (let x = 0; x <= width; x += 8) {
        const n =
          Math.sin(x * 0.006 + t * 0.012) * 0.6 +
          Math.sin(x * 0.013 + t * 0.02) * 0.4;
        const y = baseY - n * amp - (x / width) * height * 0.06;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      const grad = ctx.createLinearGradient(0, 0, width, 0);
      grad.addColorStop(0, "rgba(212,175,55,0)");
      grad.addColorStop(0.5, "rgba(212,175,55,0.22)");
      grad.addColorStop(1, "rgba(212,175,55,0)");
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.4;
      ctx.stroke();
    };

    let raf = 0;
    const render = () => {
      ctx.clearRect(0, 0, width, height);
      t += 1;

      // Data streams (vertical light trails)
      streams.forEach((s) => {
        const g = ctx.createLinearGradient(s.x, s.y, s.x, s.y + s.len);
        g.addColorStop(0, `rgba(180,188,200,0)`);
        g.addColorStop(0.5, `rgba(200,205,214,${s.a})`);
        g.addColorStop(1, `rgba(212,175,55,0)`);
        ctx.strokeStyle = g;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x, s.y + s.len);
        ctx.stroke();
        s.y += s.speed;
        if (s.y > height) {
          s.y = -s.len;
          s.x = rand(0, width);
        }
      });

      // Particles
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.gold
          ? `rgba(212,175,55,${p.a})`
          : `rgba(200,205,214,${p.a})`;
        ctx.fill();
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -4) {
          p.y = height + 4;
          p.x = rand(0, width);
        }
        if (p.x < -4) p.x = width + 4;
        if (p.x > width + 4) p.x = -4;
      });

      drawChart();
      raf = requestAnimationFrame(render);
    };

    resize();
    window.addEventListener("resize", resize);

    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
      } else if (!prefersReduced) {
        raf = requestAnimationFrame(render);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    if (prefersReduced) {
      // Draw a single static frame.
      render();
      cancelAnimationFrame(raf);
    } else {
      raf = requestAnimationFrame(render);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
