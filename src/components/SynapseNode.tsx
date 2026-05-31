import { useState } from "react";
import { motion } from "framer-motion";
import type { PositionedProject } from "../types";

interface SynapseNodeProps {
  node: PositionedProject;
  /** Stagger index for entrance + idle animation. */
  index: number;
  /** Remove this synapse from the network. */
  onDelete: (id: string) => void;
  /** Accent color for the rim/glow/label (defaults to brand green). */
  accent?: string;
}

/**
 * A peripheral project node: a glossy dark sphere ringed in the accent color —
 * echoing the SynapTech "data synapse" nodes — with a minimalist label beneath.
 * Hovering lifts and brightens the node, reveals its category, and exposes a
 * delete control to disconnect the synapse.
 */
export function SynapseNode({
  node,
  index,
  onDelete,
  accent = "#a3d94a",
}: SynapseNodeProps) {
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
        {/* Accent glow aura, intensifies on hover. */}
        <motion.div
          className="absolute h-10 w-10 rounded-full blur-md"
          style={{ backgroundColor: accent }}
          animate={{ scale: hovered ? 1.6 : 1, opacity: hovered ? 0.55 : 0.28 }}
          transition={{ duration: 0.3 }}
        />

        {/* The node — glossy dark sphere with an accent rim. */}
        <motion.div
          className="relative h-4 w-4 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 35% 30%, #2c2c30 0%, #141417 60%, #070708 100%)",
            boxShadow: `0 0 10px ${accent}`,
            border: `2px solid ${accent}`,
          }}
          animate={{ scale: hovered ? 1.4 : 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
        >
          {/* Tiny glossy highlight. */}
          <span className="pointer-events-none absolute left-1/2 top-0.5 h-1 w-1.5 -translate-x-1/2 rounded-full bg-white/40 blur-[1px]" />
        </motion.div>

        {/* Delete control — appears on hover above the node. */}
        <motion.button
          type="button"
          aria-label={`Borrar sinapsis ${node.name}`}
          onClick={(e) => {
            e.stopPropagation();
            onDelete(node.id);
          }}
          initial={false}
          animate={{ opacity: hovered ? 1 : 0, scale: hovered ? 1 : 0.6 }}
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          transition={{ duration: 0.15 }}
          style={{ pointerEvents: hovered ? "auto" : "none" }}
          className="absolute -right-3.5 -top-3.5 flex h-5 w-5 items-center justify-center rounded-full border border-red-400/40 bg-zinc-900/90 text-[11px] leading-none text-red-300 backdrop-blur-sm hover:border-red-400 hover:text-red-200"
        >
          ✕
        </motion.button>

        {/* Minimalist label. */}
        <div
          className={`absolute flex w-max flex-col items-center ${
            labelBelow ? "top-5" : "bottom-5"
          }`}
        >
          <span
            className="text-xs font-medium text-zinc-200 transition-colors"
            style={hovered ? { color: accent } : undefined}
          >
            {node.name}
          </span>
          <motion.span
            className="text-[10px] font-light uppercase tracking-wider"
            style={{ color: accent }}
            initial={false}
            animate={{
              opacity: hovered ? 0.85 : 0,
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
