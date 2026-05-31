import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { SynapseProject } from "../types";
import { INITIAL_PROJECTS } from "../data/mockData";
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

/**
 * Generates a URL-safe, collision-resistant id from a project name.
 */
function makeId(name: string): string {
  const slug = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `${slug || "proyecto"}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Interactive synaptic dashboard for SynapTech SpA. A glowing core sits at the
 * center; every project radiates outward as a node connected by an animated
 * synapse. Supports two views (full network / by category), live add & delete,
 * several ordered arrangements, and a decluttered label layer so connection
 * titles never overlap.
 */
export function SynapseDashboard() {
  const [projects, setProjects] = useState<SynapseProject[]>(INITIAL_PROJECTS);
  const [view, setView] = useState<ViewMode>("giant");
  const [arrangement, setArrangement] = useState<Arrangement>("ring");
  const [canvasRef, { width, height }] = useElementSize<HTMLDivElement>();

  const giant = useRadialLayout(projects, { width, height, arrangement });
  const grouped = useCategoryLayout(projects, { width, height });
  const center = giant.center;

  const addProject = (name: string, category: string) => {
    setProjects((prev) => [...prev, { id: makeId(name), name, category }]);
  };

  const deleteProject = (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  const toggleActive = (id: string) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, active: p.active === false } : p,
      ),
    );
  };

  const activeCount = projects.filter((p) => p.active !== false).length;

  const cycleArrangement = () => {
    const i = ARRANGEMENTS.findIndex((a) => a.id === arrangement);
    setArrangement(ARRANGEMENTS[(i + 1) % ARRANGEMENTS.length].id);
  };

  const arrangementLabel =
    ARRANGEMENTS.find((a) => a.id === arrangement)?.label ?? "";

  // Build the (non-overlapping) connection titles for the active view.
  const rawLabels = useMemo<RawLabel[]>(() => {
    if (view === "giant") {
      return giant.nodes.map((n) => ({
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
    return grouped.categories.flatMap((cat) => [
      {
        id: `cat-${cat.id}`,
        text: cat.name,
        x: cat.x,
        y: cat.y,
        dirX: cat.x - center.x,
        dirY: cat.y - center.y,
        color: cat.accent,
        emphasis: true,
      },
      ...cat.projects.map((p) => ({
        id: p.id,
        text: p.name,
        x: p.x,
        y: p.y,
        dirX: p.x - cat.x,
        dirY: p.y - cat.y,
        color: cat.accent,
        dim: p.active === false,
      })),
    ]);
  }, [view, giant.nodes, grouped.categories, center.x, center.y]);

  const labels = useLabelDeclutter(rawLabels, { width, height });

  const ready = width > 0 && height > 0;

  return (
    <div className="synapse-backdrop relative h-screen w-screen overflow-hidden">
      {/* Header. */}
      <header className="pointer-events-none absolute left-0 right-0 top-0 z-20 flex items-start justify-between gap-4 p-6">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-zinc-100">
            Red Sináptica
          </h1>
          <p className="text-xs font-light text-zinc-500">
            Portafolio de conexiones · SynapTech SpA
          </p>
        </div>

        <div className="absolute left-1/2 top-6 flex -translate-x-1/2 flex-col items-center gap-2">
          <ViewToggle value={view} onChange={setView} />
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
        </div>

        <div className="text-right">
          <div className="text-2xl font-semibold text-lime-300">
            {projects.length}
          </div>
          <div className="text-[11px] font-light uppercase tracking-widest text-zinc-500">
            Proyectos
          </div>
        </div>
      </header>

      {/* Canvas. */}
      <div ref={canvasRef} className="absolute inset-0">
        {ready && view === "giant" && (
          <>
            {/* Synapses behind the DOM nodes. */}
            <svg className="absolute inset-0 h-full w-full" aria-hidden>
              {giant.nodes.map((node, i) => (
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
              {giant.nodes.map((node, i) => (
                <SynapseNode
                  key={node.id}
                  node={node}
                  index={i}
                  accent={accentForCategory(node.category)}
                  onDelete={deleteProject}
                  onToggleActive={toggleActive}
                />
              ))}
            </AnimatePresence>

            <CentralNode x={center.x} y={center.y} connections={activeCount} />
          </>
        )}

        {ready && view === "categories" && (
          <>
            <svg className="absolute inset-0 h-full w-full" aria-hidden>
              {grouped.categories.map((cat, i) => (
                <g key={cat.id}>
                  {/* Core → category hub (primary, thicker link). */}
                  <SynapseLink
                    id={`hub-${cat.id}`}
                    index={i}
                    from={center}
                    to={{ x: cat.x, y: cat.y }}
                    color={cat.accent}
                    strength={1.8}
                  />
                  {/* Category hub → its projects. */}
                  {cat.projects.map((p, j) => (
                    <SynapseLink
                      key={p.id}
                      id={`leaf-${p.id}`}
                      index={j}
                      from={{ x: cat.x, y: cat.y }}
                      to={{ x: p.x, y: p.y }}
                      color={cat.accent}
                      inactive={p.active === false}
                    />
                  ))}
                </g>
              ))}
            </svg>

            <AnimatePresence>
              {grouped.categories.map((cat, i) => (
                <CategoryNode
                  key={cat.id}
                  index={i}
                  x={cat.x}
                  y={cat.y}
                  accent={cat.accent}
                  count={cat.projects.filter((p) => p.active !== false).length}
                />
              ))}
              {grouped.categories.flatMap((cat) =>
                cat.projects.map((p, j) => (
                  <SynapseNode
                    key={p.id}
                    node={p}
                    index={j}
                    accent={cat.accent}
                    onDelete={deleteProject}
                    onToggleActive={toggleActive}
                  />
                )),
              )}
            </AnimatePresence>

            <CentralNode x={center.x} y={center.y} connections={activeCount} />
          </>
        )}

        {/* Decluttered connection titles (never overlapping). */}
        {ready && <LabelLayer labels={labels} />}

        {/* Empty state. */}
        {ready && projects.length === 0 && (
          <div className="pointer-events-none absolute left-1/2 top-[58%] -translate-x-1/2 text-center text-sm font-light text-zinc-600">
            No hay sinapsis activas. Conecta un proyecto para empezar.
          </div>
        )}
      </div>

      {/* Control panel. */}
      <div className="absolute bottom-6 left-6 z-20">
        <AddProjectForm onAdd={addProject} />
      </div>
    </div>
  );
}
