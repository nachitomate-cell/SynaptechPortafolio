import { motion } from "framer-motion";

interface SynapseLinkProps {
  /** Core coordinates. */
  from: { x: number; y: number };
  /** Peripheral node coordinates. */
  to: { x: number; y: number };
  /** Unique id used to scope the gradient/pulse for this edge. */
  id: string;
  /** Stagger index so pulses along the network feel alive, not synchronized. */
  index: number;
}

/**
 * A single synaptic connection: a faint static trace with a luminous pulse that
 * travels from the core toward the peripheral node.
 *
 * The pulse is a short dash segment animated along the line via strokeDashoffset
 * — the technique that gives the smooth "energy flowing through the wire" look.
 */
export function SynapseLink({ from, to, id, index }: SynapseLinkProps) {
  const length = Math.hypot(to.x - from.x, to.y - from.y);
  const gradientId = `synapse-grad-${id}`;
  const pulseId = `synapse-pulse-${id}`;

  return (
    <g>
      <defs>
        {/* Static fade: brighter at the core, dimmer at the node. */}
        <linearGradient
          id={gradientId}
          gradientUnits="userSpaceOnUse"
          x1={from.x}
          y1={from.y}
          x2={to.x}
          y2={to.y}
        >
          <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.12" />
        </linearGradient>

        {/* Moving pulse: a hot white-cyan core that fades at both ends. */}
        <linearGradient
          id={pulseId}
          gradientUnits="userSpaceOnUse"
          x1={from.x}
          y1={from.y}
          x2={to.x}
          y2={to.y}
        >
          <stop offset="0%" stopColor="#22d3ee" stopOpacity="0" />
          <stop offset="50%" stopColor="#e0fbff" stopOpacity="1" />
          <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Base trace. */}
      <line
        x1={from.x}
        y1={from.y}
        x2={to.x}
        y2={to.y}
        stroke={`url(#${gradientId})`}
        strokeWidth={1.5}
        strokeLinecap="round"
      />

      {/* Travelling pulse. A small visible dash followed by a long gap; we
          animate the offset so the dash sweeps from core to node and repeats. */}
      <motion.line
        x1={from.x}
        y1={from.y}
        x2={to.x}
        y2={to.y}
        stroke={`url(#${pulseId})`}
        strokeWidth={2.5}
        strokeLinecap="round"
        style={{ filter: "drop-shadow(0 0 4px rgba(34,211,238,0.9))" }}
        strokeDasharray={`${length * 0.18} ${length}`}
        initial={{ strokeDashoffset: length * 1.18 }}
        animate={{ strokeDashoffset: -length * 0.18 }}
        transition={{
          duration: 2.4,
          repeat: Infinity,
          ease: "easeInOut",
          delay: index * 0.35,
        }}
      />
    </g>
  );
}
