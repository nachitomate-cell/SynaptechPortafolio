import { useMemo } from "react";
import type { PositionedProject, SynapseProject } from "../types";

interface RadialLayoutOptions {
  /** Canvas width in pixels. */
  width: number;
  /** Canvas height in pixels. */
  height: number;
}

/**
 * Distributes projects evenly around the central node on a responsive radius.
 *
 * The radius adapts to the smaller canvas dimension so the network always fits,
 * and a golden-angle offset keeps newly added nodes from stacking on top of the
 * existing ones as the graph grows.
 */
export function useRadialLayout(
  projects: SynapseProject[],
  { width, height }: RadialLayoutOptions,
): { center: { x: number; y: number }; nodes: PositionedProject[] } {
  return useMemo(() => {
    const center = { x: width / 2, y: height / 2 };

    // Leave breathing room for labels near the edges.
    const minDimension = Math.min(width, height);
    const radius = Math.max(120, minDimension / 2 - 110);

    const count = projects.length;
    // Golden angle keeps distribution organic even at odd counts.
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));

    const nodes = projects.map((project, index) => {
      // Evenly spaced base angle, nudged by the golden angle for a livelier feel.
      const angle =
        (index / Math.max(count, 1)) * Math.PI * 2 +
        index * goldenAngle * 0.12 -
        Math.PI / 2;

      return {
        ...project,
        angle,
        x: center.x + Math.cos(angle) * radius,
        y: center.y + Math.sin(angle) * radius,
      } satisfies PositionedProject;
    });

    return { center, nodes };
  }, [projects, width, height]);
}
