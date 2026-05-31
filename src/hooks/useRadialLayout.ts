import { useMemo } from "react";
import type { PositionedProject, SynapseProject } from "../types";

/** Available ordered arrangements for the "sinapsis gigante" view. */
export type Arrangement = "ring" | "spiral" | "orbits" | "fan";

export const ARRANGEMENTS: { id: Arrangement; label: string }[] = [
  { id: "ring", label: "Anillo" },
  { id: "spiral", label: "Espiral" },
  { id: "orbits", label: "Órbitas" },
  { id: "fan", label: "Abanico" },
];

interface RadialLayoutOptions {
  width: number;
  height: number;
  arrangement?: Arrangement;
}

/**
 * Positions every project around the central core using one of several ordered
 * arrangements. All arrangements keep a minimum radius (so nodes never collide
 * with the core) and place nodes in index order, so the network always stays
 * tidy — only the overall shape changes.
 */
export function useRadialLayout(
  projects: SynapseProject[],
  { width, height, arrangement = "ring" }: RadialLayoutOptions,
): { center: { x: number; y: number }; nodes: PositionedProject[] } {
  return useMemo(() => {
    const center = { x: width / 2, y: height / 2 };
    const minDimension = Math.min(width, height);
    const maxRadius = Math.max(130, minDimension / 2 - 120);
    const minRadius = Math.min(150, maxRadius * 0.55);
    const count = projects.length;
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));

    // Pre-assign nodes to concentric rings for the "orbits" arrangement so each
    // node knows its ring, its position within it, and the total ring count.
    const orbit: { ring: number; within: number; ringSize: number }[] = [];
    let totalRings = 0;
    {
      let index = 0;
      let ring = 0;
      while (index < count) {
        const capacity = 6 + ring * 4;
        const size = Math.min(capacity, count - index);
        for (let k = 0; k < size; k++) orbit.push({ ring, within: k, ringSize: size });
        index += size;
        ring += 1;
      }
      totalRings = ring;
    }

    const place = (index: number): { x: number; y: number; angle: number } => {
      switch (arrangement) {
        case "spiral": {
          // Phyllotaxis: ordered outward, evenly packed, never overlapping.
          const t = count > 1 ? index / (count - 1) : 0;
          const r = minRadius + (maxRadius - minRadius) * Math.sqrt(t);
          const angle = index * goldenAngle - Math.PI / 2;
          return { x: center.x + Math.cos(angle) * r, y: center.y + Math.sin(angle) * r, angle };
        }
        case "orbits": {
          // Concentric rings that fill in order; each outer ring holds more.
          const { ring, within, ringSize } = orbit[index];
          const r =
            totalRings <= 1
              ? maxRadius
              : minRadius +
                ((maxRadius - minRadius) * ring) / (totalRings - 1);
          const angle =
            (within / Math.max(ringSize, 1)) * Math.PI * 2 -
            Math.PI / 2 +
            ring * 0.4;
          return { x: center.x + Math.cos(angle) * r, y: center.y + Math.sin(angle) * r, angle };
        }
        case "fan": {
          // Wide arc opening downward, leaving a gap at the top (under header).
          const span = Math.PI * 1.6;
          const start = Math.PI / 2 - span / 2;
          const angle = start + (index / Math.max(count - 1, 1)) * span;
          return {
            x: center.x + Math.cos(angle) * maxRadius,
            y: center.y + Math.sin(angle) * maxRadius,
            angle,
          };
        }
        case "ring":
        default: {
          // Evenly spaced full circle, in order.
          const angle = (index / Math.max(count, 1)) * Math.PI * 2 - Math.PI / 2;
          return {
            x: center.x + Math.cos(angle) * maxRadius,
            y: center.y + Math.sin(angle) * maxRadius,
            angle,
          };
        }
      }
    };

    const nodes = projects.map((project, index) => ({
      ...project,
      ...place(index),
    })) satisfies PositionedProject[];

    return { center, nodes };
  }, [projects, width, height, arrangement]);
}
