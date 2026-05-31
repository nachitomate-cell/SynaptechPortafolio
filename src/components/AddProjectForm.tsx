import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { DEFAULT_CATEGORIES } from "../data/categories";

interface AddProjectFormProps {
  onAdd: (name: string, category: string) => void;
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
export function AddProjectForm({ onAdd }: AddProjectFormProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState(DEFAULT_CATEGORIES[0].name);
  const [open, setOpen] = useState(isDesktop);

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
                  className="flex-1 rounded-lg bg-lime-400 px-3 py-2 text-sm font-semibold text-zinc-950 transition-opacity disabled:opacity-30"
                  style={{ boxShadow: "0 0 18px rgba(146,200,58,0.4)" }}
                >
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
                  ⚡
                </motion.button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
