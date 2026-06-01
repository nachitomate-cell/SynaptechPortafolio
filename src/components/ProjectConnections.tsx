import { Fragment } from "react";
import { motion } from "framer-motion";
import type { PositionedProject } from "../types";

interface ProjectConnectionsProps {
  /** Positioned nodes currently on screen (giant view or a focused category). */
  nodes: PositionedProject[];
  /** True when a node is filtered out, so its edges fade too. */
  isDimmed?: (n: PositionedProject) => boolean;
  /** Id of the hovered/spotlit node: its edges glow, the rest dim. */
  highlightId?: string | null;
  /** Disable the travelling pulse (reduced-motion preference). */
  reducedMotion?: boolean;
}

/**
 * Draws the project-to-project links (the "lateral synapses") as soft curved
 * traces between connected nodes, each carrying a faint travelling pulse. Only
 * edges whose both endpoints are present in the current view are rendered; each
 * undirected pair is drawn once. When a node is spotlit, its edges brighten and
 * the others recede.
 */
export function ProjectConnections({
  nodes,
  isDimmed,
  highlightId = null,
  reducedMotion = false,
}: ProjectConnectionsProps) {
  const byId = new Map(nodes.map((n) => [n.id, n]));

  const edges: { a: PositionedProject; b: PositionedProject; key: string }[] = [];
  for (const n of nodes) {
    for (const other of n.connections ?? []) {
      // Draw each undirected pair once, and only if both ends are visible.
      if (n.id < other && byId.has(other)) {
        edges.push({ a: n, b: byId.get(other)!, key: `${n.id}__${other}` });
      }
    }
  }

  if (edges.length === 0) return null;

  return (
    <g aria-hidden>
      {edges.map(({ a, b, key }, i) => {
        const filteredOut = !!isDimmed?.(a) && !!isDimmed?.(b);
        const touched =
          highlightId === a.id || highlightId === b.id;
        const recede = highlightId != null && !touched;

        // Quadratic curve bowed perpendicular to the segment for an organic arc.
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const len = Math.hypot(dx, dy) || 1;
        const mx = (a.x + b.x) / 2;
        const my = (a.y + b.y) / 2;
        const bow = len * 0.12 * (i % 2 === 0 ? 1 : -1);
        const cx = mx + (-dy / len) * bow;
        const cy = my + (dx / len) * bow;
        const d = `M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`;

        const baseOpacity = filteredOut
          ? 0.05
          : recede
            ? 0.07
            : touched
              ? 0.55
              : 0.28;

        return (
          <Fragment key={key}>
            <path
              d={d}
              fill="none"
              stroke="#a3d94a"
              strokeWidth={touched ? 1.4 : 1.1}
              strokeOpacity={baseOpacity}
              strokeDasharray="2 5"
              strokeLinecap="round"
              style={{ transition: "stroke-opacity 0.3s ease" }}
            />
            {/* Travelling pulse sweeping a → b, lit brightest on focused edges. */}
            {!reducedMotion && !filteredOut && (
              <motion.path
                d={d}
                fill="none"
                pathLength={1}
                stroke="#f4ffe0"
                strokeWidth={touched ? 2.2 : 1.6}
                strokeLinecap="round"
                strokeOpacity={recede ? 0.1 : touched ? 0.95 : 0.5}
                strokeDasharray="0.1 1"
                initial={{ strokeDashoffset: 1.1 }}
                animate={{ strokeDashoffset: -0.1 }}
                transition={{
                  duration: touched ? 1.6 : 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: (i % 5) * 0.4,
                }}
                style={{
                  filter: "drop-shadow(0 0 3px rgba(146,200,58,0.8))",
                }}
              />
            )}
          </Fragment>
        );
      })}
    </g>
  );
}
