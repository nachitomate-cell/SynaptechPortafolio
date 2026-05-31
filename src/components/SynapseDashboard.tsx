import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { PositionedProject } from "../types";
import { useProjectStore } from "../store/projectStore";
import { accentForCategory } from "../data/categories";
import { useElementSize } from "../hooks/useElementSize";
import {
  useRadialLayout,
  ARRANGEMENTS,
  type Arrangement,
} from "../hooks/useRadialLayout";
import { useCategoryLayout } from "../hooks/useCategoryLayout";
import { useLabelDeclutter, type RawLabel } from "../hooks/useLabelDeclutter";
import { CentralNode } from "./CentralNode";
import { CategoryNode } from "./CategoryNode";
import { SynapseNode } from "./SynapseNode";
import { SynapseLink } from "./SynapseLink";
import { LabelLayer } from "./LabelLayer";
import { AddProjectForm } from "./AddProjectForm";
import { ViewToggle, type ViewMode } from "./ViewToggle";
import { ZoomControls } from "./ZoomControls";
import { ProjectInfoModal } from "./ProjectInfoModal";

const ZOOM_MIN = 0.4;
const ZOOM_MAX = 1.6;
const ZOOM_STEP = 0.15;
const clampZoom = (z: number) =>
  Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(z * 100) / 100));

type Overrides = Record<string, { x: number; y: number }>;

/**
 * Interactive synaptic dashboard for SynapTech SpA. A glowing core sits at the
 * center; every project radiates outward as a node connected by an animated
 * synapse. Supports two views (full network / by category with drill-down),
 * draggable nodes for individual analysis, live add/delete/power-toggle,
 * ordered arrangements, zoom, and a decluttered (non-overlapping) label layer.
 */
export function SynapseDashboard() {
  // Domain state (persisted) lives in the store; view state stays local.
  const projects = useProjectStore((s) => s.projects);
  const addProject = useProjectStore((s) => s.addProject);
  const deleteProject = useProjectStore((s) => s.deleteProject);
  const toggleActive = useProjectStore((s) => s.toggleActive);
  const updateProject = useProjectStore((s) => s.updateProject);
  const resetProjects = useProjectStore((s) => s.resetProjects);

  const [view, setView] = useState<ViewMode>("giant");
  const [arrangement, setArrangement] = useState<Arrangement>("ring");
  const [zoom, setZoom] = useState(1);
  const [focusedCategory, setFocusedCategory] = useState<string | null>(null);
  const [infoId, setInfoId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Manual positions for dragged nodes (canvas-space, override the layout).
  const [overrides, setOverrides] = useState<Overrides>({});
  // While true, the label declutter does cheap placement only (perf during drag).
  const [draggingActive, setDraggingActive] = useState(false);
  const dragTimer = useRef<ReturnType<typeof setTimeout>>();
  const [canvasRef, { width, height }] = useElementSize<HTMLDivElement>();

  const giant = useRadialLayout(projects, { width, height, arrangement });
  const grouped = useCategoryLayout(projects, { width, height });
  const center = giant.center;

  const focusedProjects = useMemo(
    () =>
      focusedCategory
        ? projects.filter((p) => p.category === focusedCategory)
        : [],
    [projects, focusedCategory],
  );
  const focus = useRadialLayout(focusedProjects, {
    width,
    height,
    arrangement: "ring",
  });

  // Apply any manual drag override to a positioned node.
  const withOverride = (n: PositionedProject): PositionedProject => {
    const o = overrides[n.id];
    return o ? { ...n, x: o.x, y: o.y } : n;
  };

  const giantNodes = useMemo(
    () => giant.nodes.map(withOverride),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [giant.nodes, overrides],
  );
  const groupedCats = useMemo(
    () =>
      grouped.categories.map((c) => ({
        ...c,
        projects: c.projects.map(withOverride),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [grouped.categories, overrides],
  );
  const focusNodes = useMemo(
    () => focus.nodes.map(withOverride),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [focus.nodes, overrides],
  );

  // Base (pre-override) positions for the active view, so drag deltas accumulate.
  const basePos = useMemo(() => {
    const m = new Map<string, { x: number; y: number }>();
    if (view === "giant") {
      giant.nodes.forEach((n) => m.set(n.id, { x: n.x, y: n.y }));
    } else if (focusedCategory) {
      focus.nodes.forEach((n) => m.set(n.id, { x: n.x, y: n.y }));
    } else {
      grouped.categories.forEach((c) =>
        c.projects.forEach((p) => m.set(p.id, { x: p.x, y: p.y })),
      );
    }
    return m;
  }, [view, focusedCategory, giant.nodes, grouped.categories, focus.nodes]);

  // Reset manual drags whenever the underlying layout changes.
  useEffect(() => {
    setOverrides({});
  }, [view, arrangement, focusedCategory, width, height]);

  const moveNode = (id: string, dx: number, dy: number) => {
    setOverrides((prev) => {
      const cur = prev[id] ?? basePos.get(id);
      if (!cur) return prev;
      return { ...prev, [id]: { x: cur.x + dx, y: cur.y + dy } };
    });
    // Mark a drag in progress; clears shortly after the last move so the full
    // (expensive) label declutter only runs once the node settles.
    setDraggingActive(true);
    if (dragTimer.current) clearTimeout(dragTimer.current);
    dragTimer.current = setTimeout(() => setDraggingActive(false), 180);
  };

  const changeView = (v: ViewMode) => {
    setView(v);
    if (v !== "categories") setFocusedCategory(null);
  };

  const handleReset = () => {
    resetProjects();
    setSelectedId(null);
    setInfoId(null);
    setFocusedCategory(null);
    setOverrides({});
  };

  const activeCount = projects.filter((p) => p.active !== false).length;

  const zoomIn = () => setZoom((z) => clampZoom(z + ZOOM_STEP));
  const zoomOut = () => setZoom((z) => clampZoom(z - ZOOM_STEP));
  const resetZoom = () => setZoom(1);
  const handleWheel = (e: React.WheelEvent) => {
    setZoom((z) => clampZoom(z - Math.sign(e.deltaY) * ZOOM_STEP));
  };

  const cycleArrangement = () => {
    const i = ARRANGEMENTS.findIndex((a) => a.id === arrangement);
    setArrangement(ARRANGEMENTS[(i + 1) % ARRANGEMENTS.length].id);
  };
  const arrangementLabel =
    ARRANGEMENTS.find((a) => a.id === arrangement)?.label ?? "";

  const focusAccent = accentForCategory(focusedCategory ?? undefined);
  const focusActive = focusedProjects.filter((p) => p.active !== false).length;

  // Build the (non-overlapping) connection titles for the active view.
  const rawLabels = useMemo<RawLabel[]>(() => {
    if (view === "giant") {
      return giantNodes.map((n) => ({
        id: n.id,
        text: n.name,
        x: n.x,
        y: n.y,
        dirX: n.x - center.x,
        dirY: n.y - center.y,
        color: accentForCategory(n.category),
        dim: n.active === false,
      }));
    }
    if (focusedCategory) {
      return focusNodes.map((n) => ({
        id: n.id,
        text: n.name,
        x: n.x,
        y: n.y,
        dirX: n.x - center.x,
        dirY: n.y - center.y,
        color: focusAccent,
        dim: n.active === false,
      }));
    }
    // Overview: only the categories are shown (no associated projects).
    return groupedCats.map((cat) => ({
      id: `cat-${cat.id}`,
      text: cat.name,
      x: cat.x,
      y: cat.y,
      dirX: cat.x - center.x,
      dirY: cat.y - center.y,
      color: cat.accent,
      emphasis: true,
    }));
  }, [
    view,
    focusedCategory,
    giantNodes,
    groupedCats,
    focusNodes,
    focusAccent,
    center.x,
    center.y,
  ]);

  const labels = useLabelDeclutter(
    rawLabels,
    { width, height },
    draggingActive,
  );

  const ready = width > 0 && height > 0;

  const infoProject = infoId
    ? projects.find((p) => p.id === infoId) ?? null
    : null;

  const toggleSelect = (id: string) =>
    setSelectedId((cur) => (cur === id ? null : id));

  // Shared props for every draggable project node.
  const nodeHandlers = {
    onDelete: deleteProject,
    onToggleActive: toggleActive,
    onInfo: setInfoId,
    onDragMove: moveNode,
    onSelect: toggleSelect,
    zoom,
  };

  return (
    <div className="synapse-backdrop relative h-screen w-screen overflow-hidden">
      {/* Header. */}
      <header className="pointer-events-none absolute left-0 right-0 top-0 z-20 flex items-start justify-between gap-4 p-4 sm:p-6">
        <div>
          <h1 className="text-base font-semibold tracking-tight text-zinc-100 sm:text-lg">
            Red Sináptica
          </h1>
          <p className="hidden text-xs font-light text-zinc-500 sm:block">
            Portafolio de conexiones · SynapTech SpA
          </p>
        </div>

        <div className="absolute left-1/2 top-16 flex -translate-x-1/2 flex-col items-center gap-2 sm:top-6">
          <ViewToggle value={view} onChange={changeView} />
          {view === "giant" && (
            <motion.button
              onClick={cycleArrangement}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="pointer-events-auto flex items-center gap-2 rounded-full border border-white/5 bg-zinc-900/60 px-4 py-1.5 text-xs font-medium text-zinc-300 backdrop-blur-md transition-colors hover:border-lime-400/40 hover:text-lime-200"
            >
              <span className="text-lime-300">⤮</span>
              Reordenar ·{" "}
              <span className="font-semibold text-lime-200">
                {arrangementLabel}
              </span>
            </motion.button>
          )}
          {view === "categories" && focusedCategory && (
            <motion.button
              onClick={() => setFocusedCategory(null)}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="pointer-events-auto flex items-center gap-2 rounded-full border border-white/5 bg-zinc-900/60 px-4 py-1.5 text-xs font-medium text-zinc-300 backdrop-blur-md transition-colors hover:border-lime-400/40 hover:text-lime-200"
            >
              <span style={{ color: focusAccent }}>←</span>
              Todas las categorías
            </motion.button>
          )}
          {view === "categories" && !focusedCategory && (
            <span className="pointer-events-none text-[11px] font-light text-zinc-600">
              Clic en una categoría para analizarla
            </span>
          )}
        </div>

        <div className="text-right">
          <div className="text-xl font-semibold text-lime-300 sm:text-2xl">
            {projects.length}
          </div>
          <div className="text-[10px] font-light uppercase tracking-widest text-zinc-500 sm:text-[11px]">
            Proyectos
          </div>
        </div>
      </header>

      {/* Canvas. */}
      <div
        ref={canvasRef}
        className="absolute inset-0"
        onWheel={handleWheel}
        onClick={() => setSelectedId(null)}
      >
        {/* Scalable network wrapper: zoom scales nodes, links and labels as one
            so a dense portfolio can be shrunk to declutter the screen. */}
        <motion.div
          className="absolute inset-0 origin-center"
          animate={{ scale: zoom }}
          transition={{ type: "spring", stiffness: 200, damping: 26 }}
        >
          {/* ── Vista: Sinapsis gigante ── */}
          {ready && view === "giant" && (
            <>
              <svg className="absolute inset-0 h-full w-full" aria-hidden>
                {giantNodes.map((node, i) => (
                  <SynapseLink
                    key={node.id}
                    id={node.id}
                    index={i}
                    from={center}
                    to={{ x: node.x, y: node.y }}
                    color={accentForCategory(node.category)}
                    inactive={node.active === false}
                  />
                ))}
              </svg>

              <AnimatePresence>
                {giantNodes.map((node, i) => (
                  <SynapseNode
                    key={node.id}
                    node={node}
                    index={i}
                    accent={accentForCategory(node.category)}
                    selected={selectedId === node.id}
                    {...nodeHandlers}
                  />
                ))}
              </AnimatePresence>

              <CentralNode x={center.x} y={center.y} connections={activeCount} />
            </>
          )}

          {/* ── Vista: Por categorías (resumen) ── */}
          {ready && view === "categories" && !focusedCategory && (
            <>
              {/* Only core → category hubs; projects appear on drill-down. */}
              <svg className="absolute inset-0 h-full w-full" aria-hidden>
                {groupedCats.map((cat, i) => (
                  <SynapseLink
                    key={cat.id}
                    id={`hub-${cat.id}`}
                    index={i}
                    from={center}
                    to={{ x: cat.x, y: cat.y }}
                    color={cat.accent}
                    strength={1.8}
                  />
                ))}
              </svg>

              <AnimatePresence>
                {groupedCats.map((cat, i) => (
                  <CategoryNode
                    key={cat.id}
                    index={i}
                    x={cat.x}
                    y={cat.y}
                    accent={cat.accent}
                    count={cat.projects.filter((p) => p.active !== false).length}
                    onFocus={() => setFocusedCategory(cat.name)}
                  />
                ))}
              </AnimatePresence>

              <CentralNode x={center.x} y={center.y} connections={activeCount} />
            </>
          )}

          {/* ── Vista: Categoría enfocada (drill-down) ── */}
          {ready && view === "categories" && focusedCategory && (
            <>
              <svg className="absolute inset-0 h-full w-full" aria-hidden>
                {focusNodes.map((node, i) => (
                  <SynapseLink
                    key={node.id}
                    id={`focus-${node.id}`}
                    index={i}
                    from={center}
                    to={{ x: node.x, y: node.y }}
                    color={focusAccent}
                    inactive={node.active === false}
                  />
                ))}
              </svg>

              <AnimatePresence>
                {focusNodes.map((node, i) => (
                  <SynapseNode
                    key={node.id}
                    node={node}
                    index={i}
                    accent={focusAccent}
                    selected={selectedId === node.id}
                    {...nodeHandlers}
                  />
                ))}
              </AnimatePresence>

              <CentralNode
                x={center.x}
                y={center.y}
                connections={focusActive}
                label={focusedCategory}
                sublabel="Categoría"
                accent={focusAccent}
                caption={`${focusActive} de ${focusedProjects.length} activos`}
              />
            </>
          )}

          {/* Decluttered connection titles (never overlapping). */}
          {ready && <LabelLayer labels={labels} />}
        </motion.div>

        {/* Empty state. */}
        {ready && projects.length === 0 && (
          <div className="pointer-events-none absolute left-1/2 top-[58%] -translate-x-1/2 text-center text-sm font-light text-zinc-600">
            No hay sinapsis activas. Conecta un proyecto para empezar.
          </div>
        )}
      </div>

      {/* Zoom controls — right edge on phones, bottom-center on desktop. */}
      <div className="absolute right-3 top-1/2 z-20 -translate-y-1/2 sm:bottom-6 sm:left-1/2 sm:right-auto sm:top-auto sm:-translate-x-1/2 sm:translate-y-0">
        <ZoomControls
          zoom={zoom}
          min={ZOOM_MIN}
          max={ZOOM_MAX}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onReset={resetZoom}
        />
      </div>

      {/* Control panel. */}
      <div className="absolute bottom-4 left-4 z-20 sm:bottom-6 sm:left-6">
        <AddProjectForm onAdd={addProject} onReset={handleReset} />
      </div>

      {/* Project info module. */}
      <ProjectInfoModal
        project={infoProject}
        accent={accentForCategory(infoProject?.category)}
        onClose={() => setInfoId(null)}
        onRepoChange={(id, url) => updateProject(id, { repoUrl: url })}
        onDescriptionChange={(id, text) =>
          updateProject(id, { description: text })
        }
      />
    </div>
  );
}
