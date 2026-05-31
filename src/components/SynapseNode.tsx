import { useRef, useState } from "react";
import { motion } from "framer-motion";
import type { PositionedProject } from "../types";

interface SynapseNodeProps {
  node: PositionedProject;
  /** Stagger index for entrance + idle animation. */
  index: number;
  /** Remove this synapse from the network. */
  onDelete: (id: string) => void;
  /** Toggle the project's active (connected) state. */
  onToggleActive: (id: string) => void;
  /** Open the project info module. */
  onInfo: (id: string) => void;
  /** Drag the node by a canvas-space delta (already zoom-corrected upstream). */
  onDragMove: (id: string, dx: number, dy: number) => void;
  /** Tapping the node toggles its controls (needed on touch where no hover). */
  onSelect: (id: string) => void;
  /** Whether this node is currently selected (controls pinned open). */
  selected: boolean;
  /** Current zoom, so drag deltas map 1:1 to the cursor. */
  zoom: number;
  /** Accent color for the rim/glow (defaults to brand green). */
  accent?: string;
}

const INACTIVE_COLOR = "#52525b";

/**
 * A peripheral project node: a glossy dark sphere ringed in the accent color —
 * echoing the SynapTech "data synapse" nodes. The node can be dragged out of the
 * network to inspect it individually; its controls (power / delete / info) show
 * on hover (desktop) or when tapped/selected (touch). Title lives in LabelLayer.
 */
export function SynapseNode({
  node,
  index,
  onDelete,
  onToggleActive,
  onInfo,
  onDragMove,
  onSelect,
  selected,
  zoom,
  accent = "#a3d94a",
}: SynapseNodeProps) {
  const [hovered, setHovered] = useState(false);
  const [dragging, setDragging] = useState(false);
  const movedRef = useRef(false);
  // Last pointer position, so deltas work on touch (where movementX may be 0).
  const lastRef = useRef({ x: 0, y: 0 });

  const active = node.active !== false;
  const color = active ? accent : INACTIVE_COLOR;
  const showControls = hovered || selected;

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    movedRef.current = false;
    lastRef.current = { x: e.clientX, y: e.clientY };
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const dx = e.clientX - lastRef.current.x;
    const dy = e.clientY - lastRef.current.y;
    lastRef.current = { x: e.clientX, y: e.clientY };
    // Ignore micro-jitter so a tap isn't mistaken for a drag.
    if (Math.abs(dx) + Math.abs(dy) > 1) movedRef.current = true;
    onDragMove(node.id, dx / zoom, dy / zoom);
  };
  const handlePointerUp = (e: React.PointerEvent) => {
    setDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
    if (!movedRef.current) onSelect(node.id);
  };

  const controlAnim = {
    opacity: showControls ? 1 : 0,
    scale: showControls ? 1 : 0.6,
  };

  return (
    <motion.div
      className="group absolute left-0 top-0 flex flex-col items-center"
      // Position via transform (x/y) instead of left/top so updates never
      // trigger layout reflow; the prepended translate keeps the node centered
      // on its coordinate.
      transformTemplate={(_, generated) => `translate(-50%, -50%) ${generated}`}
      onClick={(e) => e.stopPropagation()}
      initial={{ scale: 0, opacity: 0, x: node.x, y: node.y }}
      animate={{
        scale: 1,
        opacity: active ? 1 : 0.55,
        x: node.x,
        y: node.y,
      }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{
        scale: { type: "spring", stiffness: 260, damping: 18, delay: index * 0.04 },
        opacity: { duration: 0.3 },
        x: dragging ? { duration: 0 } : { type: "spring", stiffness: 120, damping: 20 },
        y: dragging ? { duration: 0 } : { type: "spring", stiffness: 120, damping: 20 },
      }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
    >
      {/* Idle floating so the network feels organic (paused while dragging). */}
      <motion.div
        className="relative flex flex-col items-center"
        animate={active && !dragging ? { y: [0, -4, 0] } : { y: 0 }}
        transition={{
          duration: 3 + (index % 4) * 0.4,
          repeat: active && !dragging ? Infinity : 0,
          ease: "easeInOut",
        }}
      >
        {/* Drag/tap handle with an enlarged hit area (touch-friendly). The
            buttons sit outside so they stay independently tappable. */}
        <div
          className={`relative flex h-7 w-7 touch-none items-center justify-center ${
            dragging ? "cursor-grabbing" : "cursor-grab"
          }`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          {/* Accent glow aura, intensifies when active/selected. */}
          <motion.div
            className="absolute h-10 w-10 rounded-full blur-md"
            style={{ backgroundColor: color }}
            animate={{
              scale: showControls ? 1.6 : 1,
              opacity: active ? (showControls ? 0.55 : 0.28) : 0.12,
            }}
            transition={{ duration: 0.3 }}
          />

          {/* The node — glossy dark sphere with an accent rim. */}
          <motion.div
            className="relative h-4 w-4 rounded-full"
            style={{
              background:
                "radial-gradient(circle at 35% 30%, #2c2c30 0%, #141417 60%, #070708 100%)",
              boxShadow: active ? `0 0 10px ${color}` : "none",
              border: `2px solid ${color}`,
            }}
            animate={{ scale: showControls || dragging ? 1.4 : 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
          >
            <span className="pointer-events-none absolute left-1/2 top-0.5 h-1 w-1.5 -translate-x-1/2 rounded-full bg-white/40 blur-[1px]" />
          </motion.div>
        </div>

        {/* Power toggle — top-left. */}
        <motion.button
          type="button"
          aria-label={`${active ? "Desactivar" : "Activar"} sinapsis ${node.name}`}
          title={active ? "Desactivar (desconectar)" : "Activar (conectar)"}
          onClick={(e) => {
            e.stopPropagation();
            onToggleActive(node.id);
          }}
          initial={false}
          animate={controlAnim}
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          transition={{ duration: 0.15 }}
          style={{
            pointerEvents: showControls ? "auto" : "none",
            color: active ? accent : "#a1a1aa",
            borderColor: active ? `${accent}66` : "#3f3f46",
          }}
          className="absolute -left-4 -top-4 flex h-6 w-6 items-center justify-center rounded-full border bg-zinc-900/90 text-[11px] leading-none backdrop-blur-sm"
        >
          ⏻
        </motion.button>

        {/* Delete control — top-right. */}
        <motion.button
          type="button"
          aria-label={`Borrar sinapsis ${node.name}`}
          title="Borrar"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(node.id);
          }}
          initial={false}
          animate={controlAnim}
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          transition={{ duration: 0.15 }}
          style={{ pointerEvents: showControls ? "auto" : "none" }}
          className="absolute -right-4 -top-4 flex h-6 w-6 items-center justify-center rounded-full border border-red-400/40 bg-zinc-900/90 text-xs leading-none text-red-300 backdrop-blur-sm hover:border-red-400 hover:text-red-200"
        >
          ✕
        </motion.button>

        {/* Info control — bottom-right. */}
        <motion.button
          type="button"
          aria-label={`Información de ${node.name}`}
          title="Ver información"
          onClick={(e) => {
            e.stopPropagation();
            onInfo(node.id);
          }}
          initial={false}
          animate={controlAnim}
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          transition={{ duration: 0.15 }}
          style={{
            pointerEvents: showControls ? "auto" : "none",
            color: accent,
            borderColor: `${accent}66`,
          }}
          className="absolute -bottom-4 -right-4 flex h-6 w-6 items-center justify-center rounded-full border bg-zinc-900/90 text-[11px] font-semibold leading-none backdrop-blur-sm"
        >
          i
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
