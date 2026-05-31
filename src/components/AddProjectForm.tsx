import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { DEFAULT_CATEGORIES } from "../data/categories";

interface AddProjectFormProps {
  onAdd: (name: string, category: string) => void;
  /** Restore the portfolio to its seeded defaults. */
  onReset: () => void;
  /** Open the GitHub import modal. */
  onOpenImport: () => void;
}

const SAMPLE_NAMES = [
  "Café Aurora",
  "Estudio Norte",
  "Logística Pacífico",
  "Clínica Andes",
  "Taller Volta",
  "Mercado Sur",
];

/** True when rendered on a desktop-width viewport. */
const isDesktop = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(min-width: 640px)").matches;

/**
 * Compact, collapsible control panel to grow the network. Expanded by default on
 * desktop and collapsed on phones (to keep the canvas clear); the header toggles
 * it. Pick a default category, name the project, and fire a new synapse.
 */
export function AddProjectForm({
  onAdd,
  onReset,
  onOpenImport,
}: AddProjectFormProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState(DEFAULT_CATEGORIES[0].name);
  const [open, setOpen] = useState(isDesktop);
  const [confirmingReset, setConfirmingReset] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onAdd(trimmed, category);
    setName("");
  };

  const addRandom = () => {
    const randomName =
      SAMPLE_NAMES[Math.floor(Math.random() * SAMPLE_NAMES.length)];
    const randomCat =
      DEFAULT_CATEGORIES[Math.floor(Math.random() * DEFAULT_CATEGORIES.length)]
        .name;
    onAdd(`${randomName} ${Math.floor(Math.random() * 90 + 10)}`, randomCat);
  };

  return (
    <div className="pointer-events-auto w-72 max-w-[calc(100vw-3rem)] overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/60 backdrop-blur-md">
      {/* Header / toggle. */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
          <span
            className="flex h-5 w-5 items-center justify-center rounded-full bg-lime-400 text-xs font-bold text-zinc-950"
            style={{ boxShadow: "0 0 12px rgba(146,200,58,0.5)" }}
          >
            +
          </span>
          Añadir sinapsis
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-zinc-500"
        >
          ▾
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            <form onSubmit={submit} className="flex flex-col gap-2 px-4 pb-4">
              <p className="text-[11px] font-light leading-relaxed text-zinc-500">
                Conecta un nuevo cliente o proyecto al núcleo de SynapTech.
              </p>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre del proyecto"
                className="w-full rounded-lg border border-white/5 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-lime-400/50"
              />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full cursor-pointer rounded-lg border border-white/5 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none transition-colors focus:border-lime-400/50"
              >
                {DEFAULT_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.name} className="bg-zinc-900">
                    {c.name}
                  </option>
                ))}
              </select>

              <div className="mt-1 flex gap-2">
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  disabled={!name.trim()}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-lime-400 px-3 py-2 text-sm font-semibold text-zinc-950 transition-opacity disabled:opacity-30"
                  style={{ boxShadow: "0 0 18px rgba(146,200,58,0.4)" }}
                >
                  {/* Lightning bolt. */}
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M13 2L4.5 13.5H11l-1 8.5L19.5 10H13l0-8z" />
                  </svg>
                  Conectar
                </motion.button>
                <motion.button
                  type="button"
                  onClick={addRandom}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="Añadir proyecto de prueba"
                  className="rounded-lg border border-white/10 px-3 py-2 text-sm text-zinc-300 transition-colors hover:border-lime-400/40 hover:text-lime-200"
                >
                  🎲
                </motion.button>
              </div>

              {/* Import from GitHub. */}
              <button
                type="button"
                onClick={onOpenImport}
                className="mt-1 flex items-center justify-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-zinc-300 transition-colors hover:border-lime-400/40 hover:text-lime-200"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
                </svg>
                Importar de GitHub
              </button>
            </form>

            {/* Reset to seeded defaults (with inline confirmation). */}
            <div className="border-t border-white/5 px-4 py-2.5">
              {confirmingReset ? (
                <div className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="text-zinc-400">¿Restablecer todo?</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        onReset();
                        setConfirmingReset(false);
                      }}
                      className="rounded-md bg-red-500/80 px-2 py-1 font-medium text-white transition-colors hover:bg-red-500"
                    >
                      Sí, restablecer
                    </button>
                    <button
                      onClick={() => setConfirmingReset(false)}
                      className="rounded-md border border-white/10 px-2 py-1 text-zinc-300 transition-colors hover:text-zinc-100"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmingReset(true)}
                  className="text-[11px] text-zinc-500 transition-colors hover:text-zinc-300"
                  title="Volver a los proyectos iniciales"
                >
                  ↺ Restablecer portafolio
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
