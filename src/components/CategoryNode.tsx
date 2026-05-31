import { motion } from "framer-motion";

interface CategoryNodeProps {
  x: number;
  y: number;
  accent: string;
  /** Number of projects in this category. */
  count: number;
  index: number;
}

/**
 * A category hub in the "por categorías" view: a mid-sized glossy sphere tinted
 * with the category accent showing its project count. The category name is drawn
 * in the decluttered LabelLayer.
 */
export function CategoryNode({ x, y, accent, count, index }: CategoryNodeProps) {
  return (
    <motion.div
      className="pointer-events-none absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
      style={{ left: x, top: y }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{
        type: "spring",
        stiffness: 220,
        damping: 18,
        delay: index * 0.06,
      }}
    >
      <div className="relative flex flex-col items-center">
        {/* Accent halo. */}
        <div
          className="absolute h-16 w-16 rounded-full blur-xl"
          style={{ backgroundColor: accent, opacity: 0.3 }}
        />

        {/* Hub sphere. */}
        <div
          className="relative flex h-12 w-12 items-center justify-center rounded-full"
          style={{
            background:
              "radial-gradient(circle at 35% 30%, #2a2a2e 0%, #131316 58%, #060607 100%)",
            border: `2px solid ${accent}`,
            boxShadow: `0 0 18px ${accent}66`,
          }}
        >
          <span className="pointer-events-none absolute left-1/2 top-1 h-2.5 w-5 -translate-x-1/2 rounded-full bg-white/10 blur-[3px]" />
          <span
            className="text-sm font-semibold"
            style={{ color: accent }}
          >
            {count}
          </span>
        </div>
        {/* The category name is drawn in the decluttered LabelLayer. */}
      </div>
    </motion.div>
  );
}
