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
  /** Drag the node by a canvas-space delta (already zoom-corrected upstream). */
  onDragMove: (id: string, dx: number, dy: number) => void;
  /** Current zoom, so drag deltas map 1:1 to the cursor. */
  zoom: number;
  /** Accent color for the rim/glow (defaults to brand green). */
  accent?: string;
}

const INACTIVE_COLOR = "#52525b";

/**
 * A peripheral project node: a glossy dark sphere ringed in the accent color —
 * echoing the SynapTech "data synapse" nodes. The node can be dragged out of the
 * network to inspect it individually; hovering exposes controls to power the
 * synapse on/off and to delete it. Its title lives in the decluttered LabelLayer.
 */
export function SynapseNode({
  node,
  index,
  onDelete,
  onToggleActive,
  onDragMove,
  zoom,
  accent = "#a3d94a",
}: SynapseNodeProps) {
  const [hovered, setHovered] = useState(false);
  const [dragging, setDragging] = useState(false);
  const movedRef = useRef(false);

  const active = node.active !== false;
  const color = active ? accent : INACTIVE_COLOR;

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    movedRef.current = false;
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    movedRef.current = true;
    onDragMove(node.id, e.movementX / zoom, e.movementY / zoom);
  };
  const handlePointerUp = (e: React.PointerEvent) => {
    setDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  return (
    <motion.div
      className="group absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
      initial={{ scale: 0, opacity: 0, left: node.x, top: node.y }}
      animate={{
        scale: 1,
        opacity: active ? 1 : 0.55,
        left: node.x,
        top: node.y,
      }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{
        scale: { type: "spring", stiffness: 260, damping: 18, delay: index * 0.04 },
        opacity: { duration: 0.3 },
        left: dragging ? { duration: 0 } : { type: "spring", stiffness: 120, damping: 20 },
        top: dragging ? { duration: 0 } : { type: "spring", stiffness: 120, damping: 20 },
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
        {/* Drag handle: the glow + dot. Buttons sit outside so they stay clickable. */}
        <div
          className={dragging ? "cursor-grabbing" : "cursor-grab"}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          {/* Accent glow aura, intensifies on hover (dim when inactive). */}
          <motion.div
            className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full blur-md"
            style={{ backgroundColor: color }}
            animate={{
              scale: hovered ? 1.6 : 1,
              opacity: active ? (hovered ? 0.55 : 0.28) : 0.12,
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
            animate={{ scale: hovered || dragging ? 1.4 : 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
          >
            {/* Tiny glossy highlight. */}
            <span className="pointer-events-none absolute left-1/2 top-0.5 h-1 w-1.5 -translate-x-1/2 rounded-full bg-white/40 blur-[1px]" />
          </motion.div>
        </div>

        {/* Power toggle — appears on hover at the top-left. */}
        <motion.button
          type="button"
          aria-label={`${active ? "Desactivar" : "Activar"} sinapsis ${node.name}`}
          title={active ? "Desactivar (desconectar)" : "Activar (conectar)"}
          onClick={(e) => {
            e.stopPropagation();
            onToggleActive(node.id);
          }}
          initial={false}
          animate={{ opacity: hovered ? 1 : 0, scale: hovered ? 1 : 0.6 }}
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          transition={{ duration: 0.15 }}
          style={{
            pointerEvents: hovered ? "auto" : "none",
            color: active ? accent : "#a1a1aa",
            borderColor: active ? `${accent}66` : "#3f3f46",
          }}
          className="absolute -left-3.5 -top-3.5 flex h-5 w-5 items-center justify-center rounded-full border bg-zinc-900/90 text-[10px] leading-none backdrop-blur-sm"
        >
          ⏻
        </motion.button>

        {/* Delete control — appears on hover at the top-right. */}
        <motion.button
          type="button"
          aria-label={`Borrar sinapsis ${node.name}`}
          title="Borrar"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(node.id);
          }}
          initial={false}
          animate={{ opacity: hovered ? 1 : 0, scale: hovered ? 1 : 0.6 }}
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          transition={{ duration: 0.15 }}
          style={{ pointerEvents: hovered ? "auto" : "none" }}
          className="absolute -right-3.5 -top-3.5 flex h-5 w-5 items-center justify-center rounded-full border border-red-400/40 bg-zinc-900/90 text-[11px] leading-none text-red-300 backdrop-blur-sm hover:border-red-400 hover:text-red-200"
        >
          ✕
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
