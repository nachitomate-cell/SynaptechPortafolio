import type { PlacedLabel } from "../hooks/useLabelDeclutter";

interface LabelLayerProps {
  labels: PlacedLabel[];
}

/**
 * Renders connection titles in a single decluttered layer. Each label sits at
 * its resolved (non-overlapping) position; when a label was nudged away from
 * its node, a thin leader line keeps the association clear.
 *
 * Labels are non-interactive so they never intercept node hover / delete.
 */
export function LabelLayer({ labels }: LabelLayerProps) {
  return (
    <div className="pointer-events-none absolute inset-0">
      {/* Leader lines for displaced labels. */}
      <svg className="absolute inset-0 h-full w-full" aria-hidden>
        {labels.map((l) =>
          l.displaced ? (
            <line
              key={`leader-${l.id}`}
              x1={l.nodeX}
              y1={l.nodeY}
              x2={l.lx}
              y2={l.ly}
              stroke={l.color}
              strokeOpacity={0.35}
              strokeWidth={1}
            />
          ) : null,
        )}
      </svg>

      {/* Label text. */}
      {labels.map((l) => (
        <div
          key={l.id}
          className="absolute transition-[left,top] duration-500 ease-out"
          style={{
            left: l.lx,
            top: l.ly,
            transform: `translateY(-50%) ${
              l.anchor === "end" ? "translateX(-100%)" : ""
            }`,
            whiteSpace: "nowrap",
          }}
        >
          {l.emphasis ? (
            <span
              className="text-[11px] font-semibold uppercase tracking-wider"
              style={{ color: l.color, opacity: l.dim ? 0.5 : 1 }}
            >
              {l.text}
            </span>
          ) : (
            <span
              className={`text-xs font-medium ${
                l.dim ? "text-zinc-500" : "text-zinc-200"
              }`}
            >
              {l.text}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
