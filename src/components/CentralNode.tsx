import { motion } from "framer-motion";

interface CentralNodeProps {
  x: number;
  y: number;
  /** Number of connected projects, shown as a live counter. */
  connections: number;
  /** Primary label inside the core. */
  label?: string;
  /** Secondary label under the primary one. */
  sublabel?: string;
  /** Accent color of the glow/ring (defaults to brand green). */
  accent?: string;
  /** Caption under the core. */
  caption?: string;
}

/** Converts a #rrggbb hex to an `r,g,b` triplet for rgba() glows. */
function rgb(hex: string): string {
  const n = parseInt(hex.replace("#", ""), 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}

/**
 * A glossy dark hub with a neon halo — mirroring the brand's reception signage.
 * Used both for the SynapTech SpA core and, when a category is focused, as that
 * category's central synapse.
 */
export function CentralNode({
  x,
  y,
  connections,
  label = "SynapTech",
  sublabel = "SpA",
  accent = "#92c83a",
  caption,
}: CentralNodeProps) {
  const c = rgb(accent);

  return (
    <div
      className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: x, top: y }}
    >
      <div className="relative flex flex-col items-center">
        {/* Breathing halo. */}
        <motion.div
          className="absolute h-40 w-40 rounded-full blur-2xl"
          style={{ backgroundColor: `rgba(${c},0.2)` }}
          animate={{ scale: [1, 1.18, 1], opacity: [0.35, 0.6, 0.35] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Rotating accent ring. */}
        <motion.div
          className="absolute h-28 w-28 rounded-full border"
          style={{ borderStyle: "dashed", borderColor: `rgba(${c},0.3)` }}
          animate={{ rotate: 360 }}
          transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
        />

        {/* Core — glossy dark sphere with an accent rim glow. */}
        <motion.div
          className="relative flex h-24 w-24 flex-col items-center justify-center rounded-full"
          style={{
            background:
              "radial-gradient(circle at 35% 30%, #2a2a2e 0%, #131316 55%, #060607 100%)",
            border: `1px solid rgba(${c},0.5)`,
          }}
          animate={{
            boxShadow: [
              `0 0 20px rgba(${c},0.45), 0 0 60px rgba(${c},0.25)`,
              `0 0 32px rgba(${c},0.7), 0 0 90px rgba(${c},0.4)`,
              `0 0 20px rgba(${c},0.45), 0 0 60px rgba(${c},0.25)`,
            ],
          }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Glossy top highlight. */}
          <span className="pointer-events-none absolute left-1/2 top-2 h-6 w-12 -translate-x-1/2 rounded-full bg-white/10 blur-md" />
          <span
            className="max-w-[5.5rem] text-center text-[13px] font-semibold leading-tight tracking-tight"
            style={{ color: `rgba(${c},1)`, filter: "brightness(1.6)" }}
          >
            {label}
          </span>
          {sublabel && (
            <span
              className="text-[10px] font-light uppercase tracking-[0.2em]"
              style={{ color: `rgba(${c},0.85)` }}
            >
              {sublabel}
            </span>
          )}
        </motion.div>

        <div className="absolute -bottom-8 whitespace-nowrap text-center text-[11px] font-light text-zinc-500">
          {caption ?? `${connections} sinapsis activas`}
        </div>
      </div>
    </div>
  );
}
