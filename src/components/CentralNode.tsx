import { motion } from "framer-motion";

interface CentralNodeProps {
  x: number;
  y: number;
  /** Number of connected projects, shown as a live counter. */
  connections: number;
}

/**
 * The SynapTech SpA core. A neon-glowing hub with a slow breathing halo that
 * anchors the entire network at the center of the canvas.
 */
export function CentralNode({ x, y, connections }: CentralNodeProps) {
  return (
    <div
      className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: x, top: y }}
    >
      <div className="relative flex flex-col items-center">
        {/* Breathing halo. */}
        <motion.div
          className="absolute h-40 w-40 rounded-full bg-cyan-400/20 blur-2xl"
          animate={{ scale: [1, 1.18, 1], opacity: [0.35, 0.6, 0.35] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Rotating accent ring. */}
        <motion.div
          className="absolute h-28 w-28 rounded-full border border-cyan-300/30"
          animate={{ rotate: 360 }}
          transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
          style={{ borderStyle: "dashed" }}
        />

        {/* Core. */}
        <motion.div
          className="relative flex h-24 w-24 flex-col items-center justify-center rounded-full bg-zinc-900 shadow-neon ring-1 ring-cyan-300/40"
          animate={{
            boxShadow: [
              "0 0 20px rgba(34,211,238,0.45), 0 0 60px rgba(34,211,238,0.25)",
              "0 0 32px rgba(34,211,238,0.7), 0 0 90px rgba(34,211,238,0.4)",
              "0 0 20px rgba(34,211,238,0.45), 0 0 60px rgba(34,211,238,0.25)",
            ],
          }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <span className="text-sm font-semibold tracking-tight text-cyan-50">
            SynapTech
          </span>
          <span className="text-[10px] font-light uppercase tracking-[0.2em] text-cyan-300/70">
            SpA
          </span>
        </motion.div>

        <div className="absolute -bottom-8 whitespace-nowrap text-center text-[11px] font-light text-zinc-500">
          {connections} {connections === 1 ? "sinapsis" : "sinapsis"} activas
        </div>
      </div>
    </div>
  );
}
