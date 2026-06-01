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
import { useIdle } from "../hooks/useIdle";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { AmbientBackground } from "./AmbientBackground";
import { CentralNode } from "./CentralNode";
import { CategoryNode } from "./CategoryNode";
import { SynapseNode } from "./SynapseNode";
import { SynapseLink } from "./SynapseLink";
import { ProjectConnections } from "./ProjectConnections";
import { LabelLayer } from "./LabelLayer";
import { AddProjectForm } from "./AddProjectForm";
import { ViewToggle, type ViewMode } from "./ViewToggle";
import { ZoomControls } from "./ZoomControls";
import { ProjectInfoModal } from "./ProjectInfoModal";
import { GitHubImportModal } from "./GitHubImportModal";
import { ControlDrawer } from "./ControlDrawer";
import type { ProjectStatus } from "../data/statuses";
import type { SynapseProject } from "../types";
import { encodeProjects, decodeProjects } from "../lib/share";
import { parseRepoUrl, fetchRepoMeta } from "../lib/github";

const ZOOM_MIN = 0.4;
const ZOOM_MAX = 1.6;
const ZOOM_STEP = 0.15;
/** Inactivity before the ambient "screensaver" mode kicks in. */
const IDLE_MS = 45_000;
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
  const storeProjects = useProjectStore((s) => s.projects);
  const addProject = useProjectStore((s) => s.addProject);
  const deleteProject = useProjectStore((s) => s.deleteProject);
  const toggleActive = useProjectStore((s) => s.toggleActive);
  const updateProject = useProjectStore((s) => s.updateProject);
  const toggleConnection = useProjectStore((s) => s.toggleConnection);
  const importProjects = useProjectStore((s) => s.importProjects);
  const replaceProjects = useProjectStore((s) => s.replaceProjects);
  const resetProjects = useProjectStore((s) => s.resetProjects);

  // View preferences, remembered across reloads.
  const [view, setView] = useLocalStorage<ViewMode>("synaptech-view", "giant");
  const [arrangement, setArrangement] = useLocalStorage<Arrangement>(
    "synaptech-arrangement",
    "ring",
  );
  const [zoom, setZoom] = useLocalStorage("synaptech-zoom", 1);
  const [focusedCategory, setFocusedCategory] = useState<string | null>(null);
  const [infoId, setInfoId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [presentation, setPresentation] = useLocalStorage(
    "synaptech-presentation",
    false,
  );
  // Search & filters.
  const [search, setSearch] = useState("");
  const [filterCategories, setFilterCategories] = useState<Set<string>>(new Set());
  const [filterStatuses, setFilterStatuses] = useState<Set<ProjectStatus>>(new Set());
  const [onlyActive, setOnlyActive] = useState(false);
  // Read-only shared portfolio (from a ?s= link); overrides the store when set.
  const [sharedProjects, setSharedProjects] = useState<SynapseProject[] | null>(
    null,
  );
  const [toast, setToast] = useState<string | null>(null);
  const [ghBusy, setGhBusy] = useState(false);
  // Interaction & ambient (screensaver) state.
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [spotlightId, setSpotlightId] = useState<string | null>(null);
  const [manualAmbient, setManualAmbient] = useState(false);
  // Experience preferences, remembered across reloads.
  const [screensaverEnabled, setScreensaverEnabled] = useLocalStorage(
    "synaptech-screensaver",
    true,
  );
  // Master switch for looping eye-candy (off = calmer + smoother on weak GPUs).
  const [effectsOn, setEffectsOn] = useLocalStorage("synaptech-effects", true);
  // Manual positions for dragged nodes (canvas-space, override the layout).
  const [overrides, setOverrides] = useState<Overrides>({});
  // While true, the label declutter does cheap placement only (perf during drag).
  const [draggingActive, setDraggingActive] = useState(false);
  const dragTimer = useRef<ReturnType<typeof setTimeout>>();
  const [canvasRef, { width, height }] = useElementSize<HTMLDivElement>();

  // A shared link shows a read-only snapshot without touching the user's data.
  const shared = sharedProjects !== null;
  const projects = sharedProjects ?? storeProjects;

  // On first load, hydrate a shared portfolio from the URL (?s=…).
  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("s");
    if (!token) return;
    const decoded = decodeProjects(token);
    if (decoded) {
      setSharedProjects(decoded);
      setPresentation(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-dismiss transient toasts.
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const reducedMotion = usePrefersReducedMotion();
  // Effective "calm" flag: OS preference or the manual effects switch.
  const lowMotion = reducedMotion || !effectsOn;
  // Pause idle detection while a modal/picker is open so it doesn't interrupt.
  const idle = useIdle(IDLE_MS, screensaverEnabled && !infoId && !showImport);
  // Ambient ("screensaver") mode: auto on idle, or started manually.
  const ambient = manualAmbient || idle;

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

  // ── Search & filters ──
  const toggleInSet = <T,>(setter: React.Dispatch<React.SetStateAction<Set<T>>>) =>
    (value: T) =>
      setter((prev) => {
        const next = new Set(prev);
        next.has(value) ? next.delete(value) : next.add(value);
        return next;
      });
  const toggleCategory = toggleInSet(setFilterCategories);
  const toggleStatus = toggleInSet(setFilterStatuses);
  const clearFilters = () => {
    setSearch("");
    setFilterCategories(new Set());
    setFilterStatuses(new Set());
    setOnlyActive(false);
  };

  const anyFilter =
    search.trim() !== "" ||
    filterCategories.size > 0 ||
    filterStatuses.size > 0 ||
    onlyActive;

  const matches = (p: { name: string; category?: string; status?: ProjectStatus; active?: boolean }) => {
    const q = search.trim().toLowerCase();
    const textOk =
      !q ||
      p.name.toLowerCase().includes(q) ||
      (p.category ?? "").toLowerCase().includes(q);
    const catOk =
      filterCategories.size === 0 || filterCategories.has(p.category ?? "");
    const stOk =
      filterStatuses.size === 0 ||
      filterStatuses.has((p.status ?? "en-curso") as ProjectStatus);
    const actOk = !onlyActive || p.active !== false;
    return textOk && catOk && stOk && actOk;
  };
  const isDimmed = (p: { name: string; category?: string; status?: ProjectStatus; active?: boolean }) =>
    anyFilter && !matches(p);

  const setStatus = (id: string, status: ProjectStatus) =>
    updateProject(id, { status });

  // ── Export / Import ──
  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(projects, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "synaptech-portafolio.json";
    a.click();
    URL.revokeObjectURL(url);
  };
  const importJSON = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        if (Array.isArray(data) && data.every((d) => d && d.id && d.name)) {
          replaceProjects(data);
          setSelectedId(null);
          setInfoId(null);
          setFocusedCategory(null);
          setOverrides({});
        } else {
          alert("El archivo no tiene el formato esperado.");
        }
      } catch {
        alert("No se pudo leer el JSON.");
      }
    };
    reader.readAsText(file);
  };

  // ── Share by URL ──
  const shareLink = async () => {
    const url = `${window.location.origin}${window.location.pathname}?s=${encodeProjects(projects)}`;
    try {
      await navigator.clipboard.writeText(url);
      setToast("Enlace copiado al portapapeles");
    } catch {
      // Clipboard blocked (e.g. insecure context): drop it in the URL bar.
      window.history.replaceState(null, "", url);
      setToast("Enlace listo en la barra de direcciones");
    }
  };
  const exitShared = () => {
    setSharedProjects(null);
    setPresentation(false);
    window.history.replaceState(
      null,
      "",
      window.location.origin + window.location.pathname,
    );
  };

  // ── Refresh live GitHub metadata ──
  const refreshGitHub = async () => {
    if (ghBusy) return;
    const targets = storeProjects
      .map((p) => ({ p, ref: parseRepoUrl(p.repoUrl) }))
      .filter((t) => t.ref);
    if (targets.length === 0) {
      setToast("No hay proyectos con repo de GitHub");
      return;
    }
    setGhBusy(true);
    let ok = 0;
    for (const { p, ref } of targets) {
      try {
        const meta = await fetchRepoMeta(ref!.owner, ref!.repo);
        updateProject(p.id, {
          stars: meta.stars,
          language: meta.language ?? undefined,
          pushedAt: meta.pushedAt,
        });
        ok++;
      } catch {
        /* skip rate-limited / missing repos */
      }
    }
    setGhBusy(false);
    setToast(`GitHub actualizado · ${ok}/${targets.length} repos`);
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

  // ── Hover / spotlight highlight ──
  const highlightId = hoverId ?? spotlightId;
  const highlightNode = highlightId
    ? projects.find((p) => p.id === highlightId)
    : null;
  const highlightNeighbors = new Set(highlightNode?.connections ?? []);
  const inHighlight = (id: string) =>
    !highlightId || id === highlightId || highlightNeighbors.has(id);
  const nodeDimmed = (n: { id: string } & Parameters<typeof isDimmed>[0]) =>
    isDimmed(n) || (highlightId != null && !inHighlight(n.id));

  // Cycle the spotlight across active nodes while in ambient mode.
  useEffect(() => {
    if (!ambient) {
      setSpotlightId(null);
      return;
    }
    const ids = giantNodes.filter((n) => n.active !== false).map((n) => n.id);
    if (ids.length === 0) return;
    let i = 0;
    setSpotlightId(ids[0]);
    const t = setInterval(() => {
      i = (i + 1) % ids.length;
      setSpotlightId(ids[i]);
    }, 2800);
    return () => clearInterval(t);
  }, [ambient, giantNodes]);

  // Ambient mode reads best in the giant view; remember & restore the previous.
  const prevViewRef = useRef<ViewMode | null>(null);
  useEffect(() => {
    if (ambient) {
      setDrawerOpen(false);
      if (view !== "giant") {
        prevViewRef.current = view;
        setFocusedCategory(null);
        setView("giant");
      }
    } else if (prevViewRef.current) {
      setView(prevViewRef.current);
      prevViewRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ambient]);

  // A manually-started ambient session exits on the next user input.
  useEffect(() => {
    if (!manualAmbient) return;
    const clear = () => setManualAmbient(false);
    const evs = ["mousemove", "mousedown", "keydown", "wheel", "touchstart"];
    // Delay so the click that started it doesn't immediately dismiss it.
    const id = setTimeout(() => {
      evs.forEach((e) =>
        window.addEventListener(e, clear, { passive: true, once: true }),
      );
    }, 400);
    return () => {
      clearTimeout(id);
      evs.forEach((e) => window.removeEventListener(e, clear));
    };
  }, [manualAmbient]);

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
        dim: n.active === false || isDimmed(n),
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
        dim: n.active === false || isDimmed(n),
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
    // re-run when filters change so dimming stays in sync
    search,
    filterCategories,
    filterStatuses,
    onlyActive,
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      {/* Living backdrop of drifting neurons (skipped when effects are off). */}
      {effectsOn && (
        <AmbientBackground intense={ambient} reducedMotion={reducedMotion} />
      )}

      {/* Header (hidden in ambient mode). */}
      {!ambient && (
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

        <div className="flex items-center gap-3">
          {presentation && (
            <span className="pointer-events-none hidden rounded-full bg-lime-400/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-lime-300 sm:inline">
              Presentación
            </span>
          )}
          <div className="text-right">
            <div className="text-xl font-semibold text-lime-300 sm:text-2xl">
              {projects.length}
            </div>
            <div className="text-[10px] font-light uppercase tracking-widest text-zinc-500 sm:text-[11px]">
              Proyectos
            </div>
          </div>
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Abrir panel de control"
            title="Buscar, filtrar y gestionar"
            className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-zinc-900/60 text-zinc-300 backdrop-blur-md transition-colors hover:border-lime-400/40 hover:text-lime-200"
          >
            {/* Sliders icon. */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <line x1="4" y1="8" x2="20" y2="8" />
              <line x1="4" y1="16" x2="20" y2="16" />
              <circle cx="9" cy="8" r="2" fill="#18181b" />
              <circle cx="15" cy="16" r="2" fill="#18181b" />
            </svg>
          </button>
        </div>
      </header>
      )}

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
          animate={
            ambient && !lowMotion
              ? {
                  scale: [zoom, zoom * 1.04, zoom],
                  x: [0, 18, 0, -18, 0],
                  y: [0, -12, 0, 12, 0],
                }
              : { scale: zoom, x: 0, y: 0 }
          }
          transition={
            ambient && !lowMotion
              ? { duration: 26, repeat: Infinity, ease: "easeInOut" }
              : { type: "spring", stiffness: 200, damping: 26 }
          }
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
                    faded={highlightId != null && !inHighlight(node.id)}
                    animated={!lowMotion}
                  />
                ))}
                <ProjectConnections
                  nodes={giantNodes}
                  isDimmed={isDimmed}
                  highlightId={highlightId}
                  reducedMotion={lowMotion}
                />
              </svg>

              <AnimatePresence>
                {giantNodes.map((node, i) => (
                  <SynapseNode
                    key={node.id}
                    node={node}
                    index={i}
                    accent={accentForCategory(node.category)}
                    selected={selectedId === node.id}
                    dimmed={nodeDimmed(node)}
                    highlighted={highlightId != null && inHighlight(node.id)}
                    spotlight={ambient && spotlightId === node.id}
                    onHover={setHoverId}
                    reducedMotion={lowMotion}
                    readOnly={presentation}
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
                    animated={!lowMotion}
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
                    faded={highlightId != null && !inHighlight(node.id)}
                    animated={!lowMotion}
                  />
                ))}
                <ProjectConnections
                  nodes={focusNodes}
                  isDimmed={isDimmed}
                  highlightId={highlightId}
                  reducedMotion={lowMotion}
                />
              </svg>

              <AnimatePresence>
                {focusNodes.map((node, i) => (
                  <SynapseNode
                    key={node.id}
                    node={node}
                    index={i}
                    accent={focusAccent}
                    selected={selectedId === node.id}
                    dimmed={nodeDimmed(node)}
                    highlighted={highlightId != null && inHighlight(node.id)}
                    spotlight={ambient && spotlightId === node.id}
                    onHover={setHoverId}
                    reducedMotion={lowMotion}
                    readOnly={presentation}
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
      {!ambient && (
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
      )}

      {/* Ambient (screensaver) hint. */}
      <AnimatePresence>
        {ambient && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, delay: 0.6 }}
            className="pointer-events-none absolute bottom-6 left-1/2 z-20 -translate-x-1/2 text-center"
          >
            <p className="text-[11px] font-light uppercase tracking-[0.25em] text-zinc-500">
              Modo ambiente
            </p>
            <p className="mt-1 text-[10px] font-light text-zinc-600">
              Mueve el cursor para volver
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Control panel (hidden in presentation / ambient mode). */}
      {!presentation && !ambient && (
        <div className="absolute bottom-4 left-4 z-20 sm:bottom-6 sm:left-6">
          <AddProjectForm
            onAdd={addProject}
            onReset={handleReset}
            onOpenImport={() => setShowImport(true)}
          />
        </div>
      )}

      {/* Control drawer: search, filters, summary, actions. */}
      <ControlDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        projects={projects}
        search={search}
        onSearch={setSearch}
        selectedCategories={filterCategories}
        onToggleCategory={toggleCategory}
        selectedStatuses={filterStatuses}
        onToggleStatus={toggleStatus}
        onlyActive={onlyActive}
        onToggleOnlyActive={() => setOnlyActive((v) => !v)}
        onClearFilters={clearFilters}
        presentation={presentation}
        onTogglePresentation={() => setPresentation((v) => !v)}
        onExport={exportJSON}
        onImport={importJSON}
        onShare={shareLink}
        onRefreshGitHub={refreshGitHub}
        ghBusy={ghBusy}
        shared={shared}
        screensaverEnabled={screensaverEnabled}
        onToggleScreensaver={() => setScreensaverEnabled((v) => !v)}
        onStartAmbient={() => {
          setDrawerOpen(false);
          setManualAmbient(true);
        }}
        effectsOn={effectsOn}
        onToggleEffects={() => setEffectsOn((v) => !v)}
      />

      {/* GitHub import module. */}
      <GitHubImportModal
        open={showImport}
        existingRepoUrls={
          new Set(projects.map((p) => p.repoUrl).filter(Boolean) as string[])
        }
        onClose={() => setShowImport(false)}
        onImport={importProjects}
      />

      {/* Project info module. */}
      <ProjectInfoModal
        project={infoProject}
        accent={accentForCategory(infoProject?.category)}
        allProjects={projects}
        readOnly={presentation}
        onClose={() => setInfoId(null)}
        onRepoChange={(id, url) => updateProject(id, { repoUrl: url })}
        onDescriptionChange={(id, text) =>
          updateProject(id, { description: text })
        }
        onStatusChange={setStatus}
        onPatch={updateProject}
        onToggleConnection={toggleConnection}
      />

      {/* Shared-view banner (read-only snapshot from a link). */}
      {shared && !ambient && (
        <div className="pointer-events-auto absolute bottom-4 left-4 z-30 flex items-center gap-3 rounded-full border border-lime-400/30 bg-zinc-900/80 px-4 py-2 text-xs text-zinc-300 backdrop-blur-md sm:bottom-6 sm:left-6">
          <span className="flex items-center gap-1.5">
            <span className="text-lime-300">👁</span> Vista compartida · solo
            lectura
          </span>
          <button
            onClick={exitShared}
            className="font-semibold text-lime-300 transition-colors hover:text-lime-200"
          >
            Salir
          </button>
        </div>
      )}

      {/* Transient toast. */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="pointer-events-none absolute bottom-24 left-1/2 z-40 -translate-x-1/2 rounded-full border border-white/10 bg-zinc-900/90 px-4 py-2 text-xs font-medium text-zinc-100 backdrop-blur-md"
            style={{ boxShadow: "0 0 24px rgba(146,200,58,0.25)" }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
