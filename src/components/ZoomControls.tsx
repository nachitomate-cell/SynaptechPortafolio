import { motion } from "framer-motion";

interface ZoomControlsProps {
  zoom: number;
  min: number;
  max: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

/**
 * Compact zoom control. Scales the whole network so a dense portfolio can be
 * shrunk to declutter the screen, or enlarged to inspect a cluster. Clicking the
 * percentage resets to 100%.
 */
export function ZoomControls({
  zoom,
  min,
  max,
  onZoomIn,
  onZoomOut,
  onReset,
}: ZoomControlsProps) {
  const pct = Math.round(zoom * 100);

  return (
    <div className="pointer-events-auto flex flex-col items-center gap-1 rounded-full border border-white/5 bg-zinc-900/60 p-1 backdrop-blur-md sm:flex-row">
      <motion.button
        onClick={onZoomOut}
        disabled={zoom <= min + 0.001}
        whileTap={{ scale: 0.9 }}
        title="Alejar"
        aria-label="Alejar"
        className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-zinc-300 transition-colors hover:bg-white/5 hover:text-lime-200 disabled:opacity-30"
      >
        −
      </motion.button>

      <button
        onClick={onReset}
        title="Restablecer zoom"
        className="min-w-[3rem] rounded-full px-2 py-1 text-xs font-medium tabular-nums text-zinc-300 transition-colors hover:text-lime-200"
      >
        {pct}%
      </button>

      <motion.button
        onClick={onZoomIn}
        disabled={zoom >= max - 0.001}
        whileTap={{ scale: 0.9 }}
        title="Acercar"
        aria-label="Acercar"
        className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-zinc-300 transition-colors hover:bg-white/5 hover:text-lime-200 disabled:opacity-30"
      >
        +
      </motion.button>
    </div>
  );
}
