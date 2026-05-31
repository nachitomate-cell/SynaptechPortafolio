import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import type { SynapseProject } from "../types";
import { INITIAL_PROJECTS } from "../data/mockData";
import { useElementSize } from "../hooks/useElementSize";
import { useRadialLayout } from "../hooks/useRadialLayout";
import { CentralNode } from "./CentralNode";
import { SynapseNode } from "./SynapseNode";
import { SynapseLink } from "./SynapseLink";
import { AddProjectForm } from "./AddProjectForm";

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
 * synapse. New connections can be added live and the layout reflows responsively.
 */
export function SynapseDashboard() {
  const [projects, setProjects] = useState<SynapseProject[]>(INITIAL_PROJECTS);
  const [canvasRef, { width, height }] = useElementSize<HTMLDivElement>();

  const { center, nodes } = useRadialLayout(projects, { width, height });

  const addProject = (name: string, category: string) => {
    setProjects((prev) => [...prev, { id: makeId(name), name, category }]);
  };

  const ready = width > 0 && height > 0;

  return (
    <div className="synapse-backdrop relative h-screen w-screen overflow-hidden">
      {/* Header. */}
      <header className="pointer-events-none absolute left-0 right-0 top-0 z-20 flex items-start justify-between p-6">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-zinc-100">
            Red Sináptica
          </h1>
          <p className="text-xs font-light text-zinc-500">
            Portafolio de conexiones · SynapTech SpA
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-semibold text-cyan-300">
            {projects.length}
          </div>
          <div className="text-[11px] font-light uppercase tracking-widest text-zinc-500">
            Proyectos
          </div>
        </div>
      </header>

      {/* Canvas. */}
      <div ref={canvasRef} className="absolute inset-0">
        {ready && (
          <>
            {/* Synapses live in one SVG layer behind the DOM nodes. */}
            <svg className="absolute inset-0 h-full w-full" aria-hidden>
              {nodes.map((node, i) => (
                <SynapseLink
                  key={node.id}
                  id={node.id}
                  index={i}
                  from={center}
                  to={{ x: node.x, y: node.y }}
                />
              ))}
            </svg>

            {/* Peripheral project nodes. */}
            <AnimatePresence>
              {nodes.map((node, i) => (
                <SynapseNode key={node.id} node={node} index={i} />
              ))}
            </AnimatePresence>

            {/* Core hub. */}
            <CentralNode
              x={center.x}
              y={center.y}
              connections={projects.length}
            />
          </>
        )}
      </div>

      {/* Control panel. */}
      <div className="absolute bottom-6 left-6 z-20">
        <AddProjectForm onAdd={addProject} />
      </div>
    </div>
  );
}
