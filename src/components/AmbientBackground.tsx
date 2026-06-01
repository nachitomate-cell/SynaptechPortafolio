import { useEffect, useRef } from "react";

interface AmbientBackgroundProps {
  /** More particles + faster drift, used in the ambient/screensaver mode. */
  intense?: boolean;
  /** Render a calm static field instead of animating. */
  reducedMotion?: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
}

/** Pre-renders the soft "neuron" glow once so the loop only does drawImage. */
function makeGlowSprite(): HTMLCanvasElement {
  const SP = 64;
  const c = document.createElement("canvas");
  c.width = c.height = SP;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(SP / 2, SP / 2, 0, SP / 2, SP / 2, SP / 2);
  g.addColorStop(0, "rgba(206,240,150,0.9)");
  g.addColorStop(0.25, "rgba(163,217,74,0.45)");
  g.addColorStop(1, "rgba(163,217,74,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, SP, SP);
  return c;
}

/**
 * A living backdrop of drifting "neurons": soft green particles that float and
 * link to nearby neighbours (constellation effect), echoing the synaptic theme.
 *
 * Tuned for low overhead: the glow is drawn from a cached sprite (no per-frame
 * gradients), the loop is throttled to ~30fps, DPR is capped, and it pauses
 * entirely when the tab is hidden. Honors reduced-motion with a still field.
 */
export function AmbientBackground({
  intense = false,
  reducedMotion = false,
}: AmbientBackgroundProps) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const count = intense ? 56 : 30;
    const speed = intense ? 0.00016 : 0.00009;
    const linkDist = intense ? 150 : 120;
    const sprite = makeGlowSprite();

    let w = 0;
    let h = 0;
    const particles: Particle[] = Array.from({ length: count }, () => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * speed,
      vy: (Math.random() - 0.5) * speed,
      r: Math.random() * 1.6 + 0.6,
    }));

    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const render = (dt: number) => {
      ctx.clearRect(0, 0, w, h);

      for (const p of particles) {
        if (!reducedMotion) {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          if (p.x < 0 || p.x > 1) p.vx *= -1;
          if (p.y < 0 || p.y > 1) p.vy *= -1;
        }
      }

      // Constellation links between nearby particles.
      ctx.lineWidth = 1;
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        const ax = a.x * w;
        const ay = a.y * h;
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const dx = ax - b.x * w;
          const dy = ay - b.y * h;
          const dist = Math.hypot(dx, dy);
          if (dist < linkDist) {
            ctx.strokeStyle = `rgba(146,200,58,${(1 - dist / linkDist) * 0.1})`;
            ctx.beginPath();
            ctx.moveTo(ax, ay);
            ctx.lineTo(b.x * w, b.y * h);
            ctx.stroke();
          }
        }
      }

      // Glowing nodes (cached sprite — cheap).
      for (const p of particles) {
        const size = p.r * 13;
        ctx.drawImage(sprite, p.x * w - size / 2, p.y * h - size / 2, size, size);
      }
    };

    let raf = 0;
    let last = performance.now();
    const interval = 1000 / 30; // throttle to ~30fps
    let acc = 0;

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const elapsed = now - last;
      last = now;
      acc += elapsed;
      if (acc < interval) return;
      render(Math.min(acc, 80));
      acc = 0;
    };

    const start = () => {
      if (raf) return;
      last = performance.now();
      acc = 0;
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    if (reducedMotion) {
      render(0);
    } else {
      const onVisibility = () =>
        document.hidden ? stop() : start();
      document.addEventListener("visibilitychange", onVisibility);
      start();
      return () => {
        stop();
        window.removeEventListener("resize", resize);
        document.removeEventListener("visibilitychange", onVisibility);
      };
    }

    return () => {
      stop();
      window.removeEventListener("resize", resize);
    };
  }, [intense, reducedMotion]);

  return (
    <canvas
      ref={ref}
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden
    />
  );
}
