import { useState } from "react";
import { motion } from "framer-motion";
import type { PositionedProject } from "../types";

interface SynapseNodeProps {
  node: PositionedProject;
  /** Stagger index for entrance + idle animation. */
  index: number;
}

/**
 * A peripheral project node: a glossy dark sphere ringed in lime — echoing the
 * SynapTech "data synapse" nodes — with a minimalist label beneath it. Hovering
 * lifts and brightens the node and reveals its category.
 */
export function SynapseNode({ node, index }: SynapseNodeProps) {
  const [hovered, setHovered] = useState(false);

  // Place the label on the outward side so it never overlaps the core.
  const labelBelow = Math.sin(node.angle) >= -0.2;

  return (
    <motion.div
      className="group absolute flex -translate-x-1/2 -translate-y-1/2 cursor-pointer flex-col items-center"
      style={{ left: node.x, top: node.y }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 18,
        delay: index * 0.04,
      }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
    >
      {/* Idle floating so the network feels organic. */}
      <motion.div
        className="relative flex flex-col items-center"
        animate={{ y: [0, -4, 0] }}
        transition={{
          duration: 3 + (index % 4) * 0.4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        {/* Green glow aura, intensifies on hover. */}
        <motion.div
          className="absolute h-10 w-10 rounded-full bg-lime-400/30 blur-md"
          animate={{ scale: hovered ? 1.6 : 1, opacity: hovered ? 0.85 : 0.4 }}
          transition={{ duration: 0.3 }}
        />

        {/* The node — glossy dark sphere with a lime rim. */}
        <motion.div
          className="relative h-4 w-4 rounded-full ring-2 ring-lime-300/70"
          style={{
            background:
              "radial-gradient(circle at 35% 30%, #2c2c30 0%, #141417 60%, #070708 100%)",
            boxShadow: "0 0 10px rgba(146,200,58,0.8)",
          }}
          animate={{ scale: hovered ? 1.4 : 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
        >
          {/* Tiny glossy highlight. */}
          <span className="pointer-events-none absolute left-1/2 top-0.5 h-1 w-1.5 -translate-x-1/2 rounded-full bg-white/40 blur-[1px]" />
        </motion.div>

        {/* Minimalist label. */}
        <div
          className={`absolute flex w-max flex-col items-center ${
            labelBelow ? "top-5" : "bottom-5"
          }`}
        >
          <span className="text-xs font-medium text-zinc-200 transition-colors group-hover:text-lime-200">
            {node.name}
          </span>
          <motion.span
            className="text-[10px] font-light uppercase tracking-wider text-lime-400/80"
            initial={false}
            animate={{
              opacity: hovered ? 1 : 0,
              height: hovered ? "auto" : 0,
            }}
            transition={{ duration: 0.2 }}
          >
            {node.category}
          </motion.span>
        </div>
      </motion.div>
    </motion.div>
  );
}
