import { Fragment } from "react";
import type { PositionedProject } from "../types";

interface ProjectConnectionsProps {
  /** Positioned nodes currently on screen (giant view or a focused category). */
  nodes: PositionedProject[];
  /** True when a node is filtered out, so its edges fade too. */
  isDimmed?: (n: PositionedProject) => boolean;
}

/**
 * Draws the project-to-project links (the "lateral synapses") as soft curved
 * traces between connected nodes. Only edges whose both endpoints are present in
 * the current view are rendered; each undirected pair is drawn once.
 */
export function ProjectConnections({
  nodes,
  isDimmed,
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
        const dim =
          isDimmed?.(a) && isDimmed?.(b) ? true : false;
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
        return (
          <Fragment key={key}>
            <path
              d={d}
              fill="none"
              stroke="#a3d94a"
              strokeWidth={1.1}
              strokeOpacity={dim ? 0.06 : 0.28}
              strokeDasharray="2 5"
              strokeLinecap="round"
            />
          </Fragment>
        );
      })}
    </g>
  );
}
