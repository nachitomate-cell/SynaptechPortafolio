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

/**
 * A living backdrop of drifting "neurons": soft green particles that float and
 * link to nearby neighbours (constellation effect), echoing the synaptic theme.
 * Pure canvas + requestAnimationFrame; sits behind the network and ignores
 * pointer events. Honors reduced-motion by rendering a still field.
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

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const count = intense ? 72 : 44;
    const speed = intense ? 0.00016 : 0.00009;
    const linkDist = intense ? 150 : 120;

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
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = (a.x - b.x) * w;
          const dy = (a.y - b.y) * h;
          const dist = Math.hypot(dx, dy);
          if (dist < linkDist) {
            ctx.strokeStyle = `rgba(146,200,58,${(1 - dist / linkDist) * 0.1})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x * w, a.y * h);
            ctx.lineTo(b.x * w, b.y * h);
            ctx.stroke();
          }
        }
      }

      // Glowing nodes.
      for (const p of particles) {
        const x = p.x * w;
        const y = p.y * h;
        const glow = ctx.createRadialGradient(x, y, 0, x, y, p.r * 6);
        glow.addColorStop(0, "rgba(163,217,74,0.45)");
        glow.addColorStop(1, "rgba(163,217,74,0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, p.r * 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(206,240,150,0.75)";
        ctx.beginPath();
        ctx.arc(x, y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    let raf = 0;
    let last = performance.now();
    if (reducedMotion) {
      render(0);
    } else {
      const loop = (now: number) => {
        const dt = Math.min(now - last, 60);
        last = now;
        render(dt);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(raf);
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
