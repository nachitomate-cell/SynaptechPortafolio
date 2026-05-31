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
 * A single synaptic connection rendered as a curved arc — echoing the
 * SynapTech brand "data synapse" diagram. A faint static trace carries a
 * luminous green pulse that travels from the core toward the peripheral node.
 *
 * The pulse is a short dash animated along the path via strokeDashoffset, with
 * `pathLength={1}` normalizing the geometry so the motion works on any curve.
 */
export function SynapseLink({ from, to, id, index }: SynapseLinkProps) {
  // Build a quadratic bezier that bows out perpendicular to the radius, giving
  // the organic curved-synapse look from the brand guidelines.
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy) || 1;
  const mx = (from.x + to.x) / 2;
  const my = (from.y + to.y) / 2;
  // Perpendicular unit vector; alternate the bow direction per edge.
  const px = -dy / length;
  const py = dx / length;
  const bow = length * 0.16 * (index % 2 === 0 ? 1 : -1);
  const cx = mx + px * bow;
  const cy = my + py * bow;

  const d = `M ${from.x} ${from.y} Q ${cx} ${cy} ${to.x} ${to.y}`;

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
          <stop offset="0%" stopColor="#a3d94a" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#7bb22e" stopOpacity="0.12" />
        </linearGradient>

        {/* Moving pulse: a hot lime core that fades at both ends. */}
        <linearGradient
          id={pulseId}
          gradientUnits="userSpaceOnUse"
          x1={from.x}
          y1={from.y}
          x2={to.x}
          y2={to.y}
        >
          <stop offset="0%" stopColor="#a3d94a" stopOpacity="0" />
          <stop offset="50%" stopColor="#eaffc4" stopOpacity="1" />
          <stop offset="100%" stopColor="#a3d94a" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Base trace. */}
      <path
        d={d}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={1.5}
        strokeLinecap="round"
      />

      {/* Travelling pulse: a short visible dash sweeping core → node, repeating.
          pathLength={1} lets us express the dash + offset in normalized units. */}
      <motion.path
        d={d}
        fill="none"
        pathLength={1}
        stroke={`url(#${pulseId})`}
        strokeWidth={2.5}
        strokeLinecap="round"
        style={{ filter: "drop-shadow(0 0 4px rgba(146,200,58,0.9))" }}
        strokeDasharray="0.18 1"
        initial={{ strokeDashoffset: 1.18 }}
        animate={{ strokeDashoffset: -0.18 }}
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
