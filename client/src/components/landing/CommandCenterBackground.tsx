import { useEffect, useRef } from "react";

/**
 * Cinematic command-center backdrop rendered on a single canvas:
 *   • drifting financial "particles" (faint gold/chrome motes)
 *   • flowing vertical data streams (ticker-like light trails)
 *   • a slow dotted globe breathing in the lower-centre
 *   • a subtle profit curve motion behind the hero
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
      const pCount = Math.min(110, Math.max(40, Math.round(area / 20000)));
      particles = Array.from({ length: pCount }, () => ({
        x: rand(0, width),
        y: rand(0, height),
        r: rand(0.4, 1.9),
        vy: rand(-0.12, -0.5),
        vx: rand(-0.12, 0.12),
        a: rand(0.08, 0.45),
        gold: Math.random() < 0.5,
      }));

      const sCount = Math.min(30, Math.max(12, Math.round(width / 64)));
      streams = Array.from({ length: sCount }, () => ({
        x: rand(0, width),
        y: rand(0, height),
        len: rand(70, 200),
        speed: rand(0.6, 2.4),
        a: rand(0.04, 0.18),
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
      buildChartGradient();
      // Setting canvas.width clears the bitmap; under reduced motion there is no
      // loop to repaint, so draw one static frame here.
      if (prefersReduced) drawFrame();
    };

    let t = 0;

    // The chart stroke gradient only depends on width, so build it once per
    // resize instead of allocating a new gradient on every animation frame.
    let chartGradient: CanvasGradient | null = null;
    const buildChartGradient = () => {
      const grad = ctx.createLinearGradient(0, 0, width, 0);
      grad.addColorStop(0, "rgba(212,175,55,0)");
      grad.addColorStop(0.5, "rgba(212,175,55,0.12)");
      grad.addColorStop(1, "rgba(212,175,55,0)");
      chartGradient = grad;
    };

    // Dotted globe in the lower-centre (orthographic projection).
    const drawGlobe = () => {
      const cx = width * 0.5;
      const cy = height * 0.62;
      const radius = Math.min(width, height) * 0.34;
      const rot = t * 0.0016;
      const latStep = Math.PI / 22;
      const lonStep = Math.PI / 22;
      for (let lat = -Math.PI / 2; lat <= Math.PI / 2; lat += latStep) {
        const ny = Math.sin(lat);
        const ringR = Math.cos(lat);
        for (let lon = 0; lon < Math.PI * 2; lon += lonStep) {
          const nx = ringR * Math.cos(lon + rot);
          const nz = ringR * Math.sin(lon + rot);
          if (nz < 0) continue; // back hemisphere
          const x = cx + nx * radius;
          const y = cy - ny * radius;
          const depth = 0.35 + nz * 0.65;
          ctx.beginPath();
          ctx.arc(x, y, 0.9 * depth, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(168,176,190,${0.1 * depth})`;
          ctx.fill();
        }
      }
    };

    const drawChart = () => {
      const baseY = height * 0.5;
      const amp = height * 0.05;
      ctx.beginPath();
      for (let x = 0; x <= width; x += 8) {
        const n =
          Math.sin(x * 0.006 + t * 0.012) * 0.6 +
          Math.sin(x * 0.013 + t * 0.02) * 0.4;
        const y = baseY - n * amp - (x / width) * height * 0.05;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = chartGradient ?? "rgba(212,175,55,0.12)";
      ctx.lineWidth = 1.2;
      ctx.stroke();
    };

    let raf = 0;
    // Paint a single frame (no scheduling) so it can be reused for the static
    // reduced-motion render and for repainting after a resize.
    const drawFrame = () => {
      ctx.clearRect(0, 0, width, height);
      t += 1;

      drawGlobe();

      streams.forEach((s) => {
        const g = ctx.createLinearGradient(s.x, s.y, s.x, s.y + s.len);
        g.addColorStop(0, `rgba(180,188,200,0)`);
        g.addColorStop(0.5, `rgba(205,210,219,${s.a})`);
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

      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.gold
          ? `rgba(225,190,90,${p.a})`
          : `rgba(205,210,219,${p.a})`;
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
    };

    const loop = () => {
      drawFrame();
      raf = requestAnimationFrame(loop);
    };

    resize();
    window.addEventListener("resize", resize);

    const onVisibility = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden && !prefersReduced) {
        raf = requestAnimationFrame(loop);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    if (prefersReduced) {
      drawFrame();
    } else {
      raf = requestAnimationFrame(loop);
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
