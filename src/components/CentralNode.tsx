import { motion } from "framer-motion";

interface CentralNodeProps {
  x: number;
  y: number;
  /** Number of connected projects, shown as a live counter. */
  connections: number;
}

/**
 * The SynapTech SpA core. A glossy dark hub with a green neon halo — mirroring
 * the brand's reception signage — that anchors the network at the canvas center.
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
          className="absolute h-40 w-40 rounded-full bg-lime-400/20 blur-2xl"
          animate={{ scale: [1, 1.18, 1], opacity: [0.35, 0.6, 0.35] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Rotating accent ring. */}
        <motion.div
          className="absolute h-28 w-28 rounded-full border border-lime-300/30"
          animate={{ rotate: 360 }}
          transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
          style={{ borderStyle: "dashed" }}
        />

        {/* Core — glossy dark sphere with a green rim glow. */}
        <motion.div
          className="relative flex h-24 w-24 flex-col items-center justify-center rounded-full ring-1 ring-lime-300/50"
          style={{
            background:
              "radial-gradient(circle at 35% 30%, #2a2a2e 0%, #131316 55%, #060607 100%)",
          }}
          animate={{
            boxShadow: [
              "0 0 20px rgba(146,200,58,0.45), 0 0 60px rgba(146,200,58,0.25)",
              "0 0 32px rgba(146,200,58,0.7), 0 0 90px rgba(146,200,58,0.4)",
              "0 0 20px rgba(146,200,58,0.45), 0 0 60px rgba(146,200,58,0.25)",
            ],
          }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Glossy top highlight. */}
          <span className="pointer-events-none absolute left-1/2 top-2 h-6 w-12 -translate-x-1/2 rounded-full bg-white/10 blur-md" />
          <span className="text-sm font-semibold tracking-tight text-lime-50">
            SynapTech
          </span>
          <span className="text-[10px] font-light uppercase tracking-[0.2em] text-lime-300/80">
            SpA
          </span>
        </motion.div>

        <div className="absolute -bottom-8 whitespace-nowrap text-center text-[11px] font-light text-zinc-500">
          {connections} sinapsis activas
        </div>
      </div>
    </div>
  );
}
