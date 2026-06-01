import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { SynapseProject } from "../types";
import { PROJECT_STATUSES, statusMeta } from "../data/statuses";
import type { ProjectStatus } from "../data/statuses";

interface ProjectInfoModalProps {
  project: SynapseProject | null;
  accent: string;
  /** Other projects, for the connection picker. */
  allProjects: SynapseProject[];
  /** Read-only (presentation) mode hides the editing inputs. */
  readOnly?: boolean;
  onClose: () => void;
  onRepoChange: (id: string, url: string) => void;
  onDescriptionChange: (id: string, text: string) => void;
  onStatusChange: (id: string, status: ProjectStatus) => void;
  /** Generic patch for enriched fields (imageUrl, demoUrl, highlights). */
  onPatch: (id: string, patch: Partial<SynapseProject>) => void;
  onToggleConnection: (a: string, b: string) => void;
}

/** Compact "hace 3 días / 2 meses" from an ISO timestamp. */
function timeAgo(iso: string | undefined): string | null {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return null;
  const days = Math.floor((Date.now() - then) / 86_400_000);
  if (days <= 0) return "hoy";
  if (days === 1) return "ayer";
  if (days < 30) return `hace ${days} días`;
  const months = Math.floor(days / 30);
  if (months < 12) return `hace ${months} ${months === 1 ? "mes" : "meses"}`;
  const years = Math.floor(months / 12);
  return `hace ${years} ${years === 1 ? "año" : "años"}`;
}

/** Normalizes a user-entered repo value into an absolute https URL, or null. */
function toHref(raw: string | undefined): string | null {
  const v = (raw ?? "").trim();
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) return v;
  // Allow pasting "github.com/user/repo" or "user/repo".
  if (/^github\.com\//i.test(v)) return `https://${v}`;
  if (/^[\w.-]+\/[\w.-]+$/.test(v)) return `https://github.com/${v}`;
  return null;
}

/**
 * Detail module for a single project. Shows its metadata and the related GitHub
 * repository link (editable), opening it in a new tab. Closes on backdrop click
 * or Escape.
 */
export function ProjectInfoModal({
  project,
  accent,
  allProjects,
  readOnly = false,
  onClose,
  onRepoChange,
  onDescriptionChange,
  onStatusChange,
  onPatch,
  onToggleConnection,
}: ProjectInfoModalProps) {
  useEffect(() => {
    if (!project) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [project, onClose]);

  const href = toHref(project?.repoUrl);
  const demoHref = (project?.demoUrl ?? "").trim()
    ? /^https?:\/\//i.test(project!.demoUrl!.trim())
      ? project!.demoUrl!.trim()
      : `https://${project!.demoUrl!.trim()}`
    : null;
  const active = project ? project.active !== false : false;
  const st = statusMeta(project?.status);
  const pushed = timeAgo(project?.pushedAt);
  const others = project
    ? allProjects.filter((p) => p.id !== project.id)
    : [];
  const connected = new Set(project?.connections ?? []);

  return (
    <AnimatePresence>
      {project && (
        <motion.div
          className="fixed inset-0 z-40 flex items-center justify-center p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          {/* Backdrop. */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Card. */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`Información de ${project.name}`}
            className="relative max-h-[88vh] w-full max-w-md overflow-y-auto rounded-2xl border border-white/10 bg-zinc-900/90 p-6 backdrop-blur-xl"
            style={{ boxShadow: `0 0 40px ${accent}22` }}
            initial={{ scale: 0.94, y: 16, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.94, y: 16, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              aria-label="Cerrar"
              className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-100"
            >
              ✕
            </button>

            {/* Header: status dot + name. */}
            <div className="flex items-center gap-3 pr-8">
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{
                  backgroundColor: active ? accent : "#52525b",
                  boxShadow: active ? `0 0 10px ${accent}` : "none",
                }}
              />
              <h2 className="text-lg font-semibold tracking-tight text-zinc-50">
                {project.name}
              </h2>
            </div>

            {/* Meta chips. */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {project.category && (
                <span
                  className="rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider"
                  style={{ color: accent, backgroundColor: `${accent}1a` }}
                >
                  {project.category}
                </span>
              )}
              <span
                className="rounded-full px-2.5 py-1 text-[11px] font-medium"
                style={{ color: st.color, backgroundColor: `${st.color}1a` }}
              >
                {st.label}
              </span>
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                  active
                    ? "bg-lime-400/10 text-lime-300"
                    : "bg-zinc-700/40 text-zinc-400"
                }`}
              >
                {active ? "Sinapsis activa" : "Desconectada"}
              </span>
            </div>

            {/* Live GitHub metadata. */}
            {(project.stars != null || project.language || pushed) && (
              <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-zinc-400">
                {project.stars != null && (
                  <span className="flex items-center gap-1 text-amber-300/90">
                    ★ {project.stars}
                  </span>
                )}
                {project.language && (
                  <span className="flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: accent }}
                    />
                    {project.language}
                  </span>
                )}
                {pushed && <span>Actualizado {pushed}</span>}
              </div>
            )}

            {/* Preview image. */}
            {project.imageUrl && (
              <div className="mt-4 overflow-hidden rounded-xl border border-white/5">
                <img
                  src={project.imageUrl}
                  alt={`Vista previa de ${project.name}`}
                  className="max-h-48 w-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    (e.currentTarget.parentElement as HTMLElement).style.display =
                      "none";
                  }}
                />
              </div>
            )}

            {/* Status selector. */}
            {!readOnly && (
              <div className="mt-5">
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                  Estado
                </label>
                <select
                  value={project.status ?? "en-curso"}
                  onChange={(e) =>
                    onStatusChange(project.id, e.target.value as ProjectStatus)
                  }
                  className="w-full cursor-pointer rounded-lg border border-white/5 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-200 outline-none transition-colors focus:border-lime-400/50"
                >
                  {PROJECT_STATUSES.map((s) => (
                    <option key={s.id} value={s.id} className="bg-zinc-900">
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Description. */}
            <div className="mt-4">
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                Descripción
              </label>
              {readOnly ? (
                <p className="text-sm font-light leading-relaxed text-zinc-300">
                  {project.description || "Sin descripción."}
                </p>
              ) : (
                <textarea
                  value={project.description ?? ""}
                  onChange={(e) =>
                    onDescriptionChange(project.id, e.target.value)
                  }
                  rows={2}
                  placeholder="Añade una breve descripción del proyecto…"
                  className="w-full resize-none rounded-lg border border-white/5 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-200 outline-none transition-colors placeholder:text-zinc-600 focus:border-lime-400/50"
                />
              )}
            </div>

            {/* Highlights. */}
            {(readOnly
              ? (project.highlights?.length ?? 0) > 0
              : true) && (
              <div className="mt-4">
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                  Highlights
                </label>
                {readOnly ? (
                  <ul className="flex flex-col gap-1">
                    {project.highlights!.map((h, i) => (
                      <li
                        key={i}
                        className="flex gap-2 text-sm font-light text-zinc-300"
                      >
                        <span style={{ color: accent }}>▹</span>
                        {h}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <textarea
                    value={(project.highlights ?? []).join("\n")}
                    onChange={(e) =>
                      onPatch(project.id, {
                        highlights: e.target.value
                          .split("\n")
                          .map((l) => l.trim())
                          .filter(Boolean),
                      })
                    }
                    rows={3}
                    placeholder={"Un logro por línea…\nEj: +30% de conversión"}
                    className="w-full resize-none rounded-lg border border-white/5 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-200 outline-none transition-colors placeholder:text-zinc-600 focus:border-lime-400/50"
                  />
                )}
              </div>
            )}

            {/* Live demo. */}
            {!readOnly && (
              <div className="mt-4">
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                  Demo en vivo
                </label>
                <input
                  value={project.demoUrl ?? ""}
                  onChange={(e) =>
                    onPatch(project.id, { demoUrl: e.target.value })
                  }
                  placeholder="https://mi-demo.com"
                  className="w-full rounded-lg border border-white/5 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-200 outline-none transition-colors placeholder:text-zinc-600 focus:border-lime-400/50"
                />
              </div>
            )}
            {demoHref && (
              <a
                href={demoHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors"
                style={{ borderColor: `${accent}66`, color: accent }}
              >
                ↗ Ver demo en vivo
              </a>
            )}

            {/* Preview image URL (edit). */}
            {!readOnly && (
              <div className="mt-4">
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                  Imagen de portada (URL)
                </label>
                <input
                  value={project.imageUrl ?? ""}
                  onChange={(e) =>
                    onPatch(project.id, { imageUrl: e.target.value })
                  }
                  placeholder="https://…/preview.png"
                  className="w-full rounded-lg border border-white/5 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-200 outline-none transition-colors placeholder:text-zinc-600 focus:border-lime-400/50"
                />
              </div>
            )}

            {/* Connections to other projects. */}
            {(readOnly ? connected.size > 0 : others.length > 0) && (
              <div className="mt-4">
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                  Conexiones
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {others
                    .filter((p) => (readOnly ? connected.has(p.id) : true))
                    .map((p) => {
                      const on = connected.has(p.id);
                      return (
                        <button
                          key={p.id}
                          disabled={readOnly}
                          onClick={() => onToggleConnection(project.id, p.id)}
                          className="rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors disabled:cursor-default"
                          style={{
                            color: on ? "#09090b" : "#a1a1aa",
                            backgroundColor: on ? accent : "transparent",
                            borderColor: on ? accent : "#3f3f46",
                          }}
                        >
                          {p.name}
                        </button>
                      );
                    })}
                </div>
              </div>
            )}

            {/* GitHub repository. */}
            <div className="mt-4">
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                Repositorio de GitHub
              </label>
              {!readOnly && (
                <input
                  value={project.repoUrl ?? ""}
                  onChange={(e) => onRepoChange(project.id, e.target.value)}
                  placeholder="github.com/usuario/repositorio"
                  className="w-full rounded-lg border border-white/5 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-200 outline-none transition-colors placeholder:text-zinc-600 focus:border-lime-400/50"
                />
              )}

              <a
                href={href ?? undefined}
                target="_blank"
                rel="noopener noreferrer"
                aria-disabled={!href}
                onClick={(e) => {
                  if (!href) e.preventDefault();
                }}
                className={`mt-3 flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-opacity ${
                  href
                    ? "bg-lime-400 text-zinc-950"
                    : "pointer-events-none cursor-not-allowed bg-zinc-800 text-zinc-500"
                }`}
                style={href ? { boxShadow: "0 0 18px rgba(146,200,58,0.4)" } : undefined}
              >
                {/* GitHub mark. */}
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
                </svg>
                {href ? "Abrir repositorio" : "Sin repositorio vinculado"}
              </a>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
