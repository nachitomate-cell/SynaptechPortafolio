import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import type { SynapseProject } from "../types";
import { INITIAL_PROJECTS } from "../data/mockData";
import { accentForCategory } from "../data/categories";
import { useElementSize } from "../hooks/useElementSize";
import { useRadialLayout } from "../hooks/useRadialLayout";
import { useCategoryLayout } from "../hooks/useCategoryLayout";
import { CentralNode } from "./CentralNode";
import { CategoryNode } from "./CategoryNode";
import { SynapseNode } from "./SynapseNode";
import { SynapseLink } from "./SynapseLink";
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
 * synapse. Two views are available — the full "sinapsis gigante" network and a
 * category-clustered view — and synapses can be added or deleted live.
 */
export function SynapseDashboard() {
  const [projects, setProjects] = useState<SynapseProject[]>(INITIAL_PROJECTS);
  const [view, setView] = useState<ViewMode>("giant");
  const [canvasRef, { width, height }] = useElementSize<HTMLDivElement>();

  const giant = useRadialLayout(projects, { width, height });
  const grouped = useCategoryLayout(projects, { width, height });
  const center = giant.center;

  const addProject = (name: string, category: string) => {
    setProjects((prev) => [...prev, { id: makeId(name), name, category }]);
  };

  const deleteProject = (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

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

        <div className="absolute left-1/2 top-6 -translate-x-1/2">
          <ViewToggle value={view} onChange={setView} />
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
                />
              ))}
            </AnimatePresence>

            <CentralNode
              x={center.x}
              y={center.y}
              connections={projects.length}
            />
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
                  name={cat.name}
                  accent={cat.accent}
                  count={cat.projects.length}
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
                  />
                )),
              )}
            </AnimatePresence>

            <CentralNode
              x={center.x}
              y={center.y}
              connections={projects.length}
            />
          </>
        )}

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
