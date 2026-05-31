import { useMemo } from "react";
import { measureLabel } from "../lib/measureText";

/** A label request before collision resolution. */
export interface RawLabel {
  id: string;
  text: string;
  /** Node anchor (where the connection ends). */
  x: number;
  y: number;
  /** Outward direction from the node's parent (unnormalized). */
  dirX: number;
  dirY: number;
  color: string;
  /** Category hubs render bolder/uppercase and sit a touch further out. */
  emphasis?: boolean;
  /** Inactive projects render dimmed. */
  dim?: boolean;
}

/** A label after placement + overlap resolution. */
export interface PlacedLabel {
  id: string;
  text: string;
  color: string;
  emphasis: boolean;
  dim: boolean;
  /** The node the label belongs to (leader-line origin). */
  nodeX: number;
  nodeY: number;
  /** Resolved label anchor position. */
  lx: number;
  ly: number;
  anchor: "start" | "end";
  /** True when the label was nudged off its node — draw a leader line. */
  displaced: boolean;
}

const LABEL_HEIGHT = 16;
const MIN_GAP = LABEL_HEIGHT + 2;
const PASSES = 90;

/**
 * Places labels radially outward from their nodes and resolves overlaps so two
 * connection titles can never sit on top of each other.
 *
 * Horizontal position is fixed at the node's outward "slot"; overlaps are
 * resolved by nudging labels along Y (the axis where text collides), which keeps
 * each label close to its node while guaranteeing vertical separation between
 * any pair whose horizontal extents overlap.
 */
export function useLabelDeclutter(
  labels: RawLabel[],
  size: { width: number; height: number },
  /**
   * Skip the O(n²) separation pass (e.g. while dragging): labels still follow
   * their nodes via cheap radial placement, but transient overlaps are allowed.
   */
  skipSeparation = false,
): PlacedLabel[] {
  return useMemo(() => {
    if (size.width === 0 || size.height === 0 || labels.length === 0) return [];

    // Initial placement: anchor each label just outside its node along the
    // outward radial direction, choosing the text side by horizontal direction.
    const placed = labels.map((l) => {
      const len = Math.hypot(l.dirX, l.dirY) || 1;
      const ux = l.dirX / len;
      const uy = l.dirY / len;
      const gap = l.emphasis ? 18 : 13;

      const ax = l.x + ux * gap;
      const ay = l.y + uy * gap;
      const anchor: "start" | "end" = ux >= 0 ? "start" : "end";

      const font = l.emphasis
        ? "600 11px Inter, system-ui, sans-serif"
        : "500 12px Inter, system-ui, sans-serif";
      const width = measureLabel(l.text, font) + 4;

      // Fixed horizontal extents (we only move along Y).
      const x0 = anchor === "start" ? ax : ax - width;
      const x1 = anchor === "start" ? ax + width : ax;

      return {
        raw: l,
        ax,
        cy: ay,
        x0,
        x1,
        anchor,
        baseY: ay,
      };
    });

    // Iterative vertical separation between labels whose X extents overlap.
    for (let pass = 0; !skipSeparation && pass < PASSES; pass++) {
      for (let i = 0; i < placed.length; i++) {
        for (let j = i + 1; j < placed.length; j++) {
          const a = placed[i];
          const b = placed[j];
          // Skip pairs that don't overlap horizontally — no collision possible.
          if (a.x1 <= b.x0 || b.x1 <= a.x0) continue;

          const sep = b.cy - a.cy;
          const dist = Math.abs(sep) || 0.01;
          if (dist < MIN_GAP) {
            const push = (MIN_GAP - dist) / 2;
            const dir = sep >= 0 ? 1 : -1;
            a.cy -= push * dir;
            b.cy += push * dir;
          }
        }
      }
    }

    return placed.map((p) => {
      const cy = Math.max(10, Math.min(size.height - 10, p.cy));
      return {
        id: p.raw.id,
        text: p.raw.text,
        color: p.raw.color,
        emphasis: !!p.raw.emphasis,
        dim: !!p.raw.dim,
        nodeX: p.raw.x,
        nodeY: p.raw.y,
        lx: p.ax,
        ly: cy,
        anchor: p.anchor,
        displaced: Math.abs(cy - p.baseY) > 5,
      } satisfies PlacedLabel;
    });
  }, [labels, size.width, size.height, skipSeparation]);
}
