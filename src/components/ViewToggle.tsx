import { motion } from "framer-motion";

export type ViewMode = "giant" | "categories";

interface ViewToggleProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
}

const OPTIONS: { id: ViewMode; label: string }[] = [
  { id: "giant", label: "Sinapsis gigante" },
  { id: "categories", label: "Por categorías" },
];

/**
 * Segmented control to switch between the full network ("sinapsis gigante") and
 * the category-clustered view. The active pill slides via a shared layoutId.
 */
export function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <div className="pointer-events-auto flex rounded-full border border-white/5 bg-zinc-900/60 p-1 backdrop-blur-md">
      {OPTIONS.map((opt) => {
        const active = opt.id === value;
        return (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className={`relative rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
              active ? "text-zinc-950" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {active && (
              <motion.span
                layoutId="view-toggle-pill"
                className="absolute inset-0 rounded-full bg-lime-400"
                style={{ boxShadow: "0 0 16px rgba(146,200,58,0.45)" }}
                transition={{ type: "spring", stiffness: 360, damping: 30 }}
              />
            )}
            <span className="relative z-10">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
