import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { DEFAULT_CATEGORIES } from "../data/categories";
import { fetchUserRepos, type RepoInfo } from "../lib/github";

interface GitHubImportModalProps {
  open: boolean;
  /** Repo URLs already in the network, so they show as imported. */
  existingRepoUrls: Set<string>;
  onClose: () => void;
  onImport: (
    items: { name: string; category: string; repoUrl: string }[],
  ) => void;
}

interface Row {
  checked: boolean;
  category: string;
}

/**
 * Connects a GitHub account by username and lists its public repositories so the
 * user can pick which ones become active synapses and assign each a category.
 * Pure client-side via the public GitHub API (no backend / no auth).
 */
export function GitHubImportModal({
  open,
  existingRepoUrls,
  onClose,
  onImport,
}: GitHubImportModalProps) {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [repos, setRepos] = useState<RepoInfo[]>([]);
  const [rows, setRows] = useState<Record<number, Row>>({});

  const reset = () => {
    setRepos([]);
    setRows({});
    setError(null);
  };

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchUserRepos(username);
      setRepos(result);
      const next: Record<number, Row> = {};
      for (const r of result) {
        next[r.id] = { checked: false, category: DEFAULT_CATEGORIES[0].name };
      }
      setRows(next);
      if (result.length === 0) setError("Este usuario no tiene repos públicos.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado.");
      setRepos([]);
    } finally {
      setLoading(false);
    }
  };

  const importable = repos.filter((r) => !existingRepoUrls.has(r.htmlUrl));
  const selected = importable.filter((r) => rows[r.id]?.checked);
  const allChecked = importable.length > 0 && selected.length === importable.length;

  const toggleAll = () => {
    setRows((prev) => {
      const next = { ...prev };
      for (const r of importable) {
        next[r.id] = { ...next[r.id], checked: !allChecked };
      }
      return next;
    });
  };

  const setAllCategories = (category: string) => {
    setRows((prev) => {
      const next = { ...prev };
      for (const r of importable) next[r.id] = { ...next[r.id], category };
      return next;
    });
  };

  const doImport = () => {
    onImport(
      selected.map((r) => ({
        name: r.name,
        category: rows[r.id].category,
        repoUrl: r.htmlUrl,
      })),
    );
    close();
  };

  const close = () => {
    reset();
    setUsername("");
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-40 flex items-center justify-center p-4 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Importar repositorios de GitHub"
            className="relative flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/90 backdrop-blur-xl"
            style={{ boxShadow: "0 0 40px rgba(146,200,58,0.18)" }}
            initial={{ scale: 0.94, y: 16, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.94, y: 16, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header. */}
            <div className="flex items-center gap-3 border-b border-white/5 p-5 pr-4">
              <svg width="20" height="20" viewBox="0 0 16 16" fill="#a3d94a" aria-hidden>
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
              </svg>
              <div className="flex-1">
                <h2 className="text-base font-semibold text-zinc-50">
                  Conectar GitHub
                </h2>
                <p className="text-[11px] font-light text-zinc-500">
                  Elige qué repos públicos son sinapsis y su categoría.
                </p>
              </div>
              <button
                onClick={close}
                aria-label="Cerrar"
                className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-100"
              >
                ✕
              </button>
            </div>

            {/* Search. */}
            <form onSubmit={search} className="flex gap-2 p-4">
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Tu usuario de GitHub"
                className="flex-1 rounded-lg border border-white/5 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-lime-400/50"
              />
              <button
                type="submit"
                disabled={!username.trim() || loading}
                className="rounded-lg bg-lime-400 px-4 py-2 text-sm font-semibold text-zinc-950 transition-opacity disabled:opacity-40"
              >
                {loading ? "Buscando…" : "Buscar"}
              </button>
            </form>

            {error && (
              <p className="px-4 pb-2 text-xs text-red-300">{error}</p>
            )}

            {/* Bulk controls. */}
            {importable.length > 0 && (
              <div className="flex items-center justify-between gap-2 border-y border-white/5 px-4 py-2 text-[11px]">
                <label className="flex cursor-pointer items-center gap-2 text-zinc-300">
                  <input
                    type="checkbox"
                    checked={allChecked}
                    onChange={toggleAll}
                    className="accent-lime-400"
                  />
                  Seleccionar todos ({importable.length})
                </label>
                <label className="flex items-center gap-2 text-zinc-500">
                  Categoría para todos
                  <select
                    onChange={(e) => setAllCategories(e.target.value)}
                    defaultValue=""
                    className="cursor-pointer rounded-md border border-white/5 bg-zinc-950/60 px-2 py-1 text-zinc-200 outline-none focus:border-lime-400/50"
                  >
                    <option value="" disabled>
                      Aplicar…
                    </option>
                    {DEFAULT_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.name} className="bg-zinc-900">
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}

            {/* Repo list. */}
            <div className="min-h-0 flex-1 overflow-y-auto px-2 py-1">
              {repos.map((r) => {
                const already = existingRepoUrls.has(r.htmlUrl);
                const row = rows[r.id];
                return (
                  <div
                    key={r.id}
                    className={`flex items-start gap-3 rounded-lg px-2 py-2 ${
                      already ? "opacity-40" : "hover:bg-white/5"
                    }`}
                  >
                    <input
                      type="checkbox"
                      disabled={already}
                      checked={!already && !!row?.checked}
                      onChange={(e) =>
                        setRows((prev) => ({
                          ...prev,
                          [r.id]: { ...prev[r.id], checked: e.target.checked },
                        }))
                      }
                      className="mt-1 accent-lime-400"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-zinc-100">
                          {r.name}
                        </span>
                        {r.language && (
                          <span className="shrink-0 text-[10px] text-zinc-500">
                            {r.language}
                          </span>
                        )}
                        {already && (
                          <span className="shrink-0 text-[10px] text-lime-400/70">
                            ya importado
                          </span>
                        )}
                      </div>
                      {r.description && (
                        <p className="truncate text-[11px] font-light text-zinc-500">
                          {r.description}
                        </p>
                      )}
                    </div>
                    {!already && (
                      <select
                        value={row?.category}
                        onChange={(e) =>
                          setRows((prev) => ({
                            ...prev,
                            [r.id]: { ...prev[r.id], category: e.target.value },
                          }))
                        }
                        className="shrink-0 cursor-pointer rounded-md border border-white/5 bg-zinc-950/60 px-2 py-1 text-[11px] text-zinc-200 outline-none focus:border-lime-400/50"
                      >
                        {DEFAULT_CATEGORIES.map((c) => (
                          <option key={c.id} value={c.name} className="bg-zinc-900">
                            {c.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer. */}
            <div className="flex items-center justify-between gap-2 border-t border-white/5 p-4">
              <span className="text-[11px] text-zinc-500">
                {selected.length} seleccionado
                {selected.length === 1 ? "" : "s"}
              </span>
              <button
                onClick={doImport}
                disabled={selected.length === 0}
                className="flex items-center gap-1.5 rounded-lg bg-lime-400 px-4 py-2 text-sm font-semibold text-zinc-950 transition-opacity disabled:opacity-40"
                style={{ boxShadow: "0 0 18px rgba(146,200,58,0.4)" }}
              >
                Importar como sinapsis
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
