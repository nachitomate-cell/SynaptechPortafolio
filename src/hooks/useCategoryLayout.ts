import { useMemo } from "react";
import type { PositionedCategory, SynapseProject } from "../types";
import { accentForCategory } from "../data/categories";

interface CategoryLayoutOptions {
  width: number;
  height: number;
}

/**
 * Two-level radial layout for the "por categorías" view.
 *
 * Categories become hubs spread evenly around the SynapTech core; each hub's
 * member projects orbit it on a smaller radius. Empty categories are omitted so
 * the graph stays clean. The hub radius adapts to the canvas and the local
 * project radius adapts to how many projects share the hub.
 */
export function useCategoryLayout(
  projects: SynapseProject[],
  { width, height }: CategoryLayoutOptions,
): { center: { x: number; y: number }; categories: PositionedCategory[] } {
  return useMemo(() => {
    const center = { x: width / 2, y: height / 2 };
    const minDimension = Math.min(width, height);
    const isCompact = minDimension < 520;

    // Group projects by category name, preserving first-seen order.
    const groups = new Map<string, SynapseProject[]>();
    for (const project of projects) {
      const key = project.category || "Sin categoría";
      const list = groups.get(key);
      if (list) list.push(project);
      else groups.set(key, [project]);
    }

    const entries = [...groups.entries()];
    const hubCount = entries.length;
    const hubRadius = Math.max(
      isCompact ? 96 : 150,
      minDimension / 2 - (isCompact ? 90 : 150),
    );

    const categories = entries.map(([name, members], index) => {
      const angle = (index / Math.max(hubCount, 1)) * Math.PI * 2 - Math.PI / 2;
      const hubX = center.x + Math.cos(angle) * hubRadius;
      const hubY = center.y + Math.sin(angle) * hubRadius;

      // Local orbit for this category's projects; grows a little with count.
      const projectRadius = Math.min(
        isCompact ? 78 : 110,
        Math.max(isCompact ? 52 : 64, 38 + members.length * 12),
      );

      const positionedProjects = members.map((project, i) => {
        const childAngle =
          (i / Math.max(members.length, 1)) * Math.PI * 2 + angle;
        return {
          ...project,
          angle: childAngle,
          x: hubX + Math.cos(childAngle) * projectRadius,
          y: hubY + Math.sin(childAngle) * projectRadius,
        };
      });

      return {
        id: name.toLowerCase().replace(/\s+/g, "-"),
        name,
        accent: accentForCategory(name),
        x: hubX,
        y: hubY,
        angle,
        projects: positionedProjects,
      } satisfies PositionedCategory;
    });

    return { center, categories };
  }, [projects, width, height]);
}
