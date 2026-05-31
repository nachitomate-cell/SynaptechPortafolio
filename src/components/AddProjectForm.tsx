import { useState } from "react";
import { motion } from "framer-motion";

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

/**
 * Compact control panel to grow the network: type a project name (with an
 * optional category) and fire a new synapse, or use the dice for a quick demo.
 */
export function AddProjectForm({ onAdd }: AddProjectFormProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onAdd(trimmed, category.trim() || "Proyecto");
    setName("");
    setCategory("");
  };

  const addRandom = () => {
    const random =
      SAMPLE_NAMES[Math.floor(Math.random() * SAMPLE_NAMES.length)];
    onAdd(`${random} ${Math.floor(Math.random() * 90 + 10)}`, "Demo");
  };

  return (
    <div className="pointer-events-auto w-72 rounded-2xl border border-white/5 bg-zinc-900/60 p-4 backdrop-blur-md">
      <h2 className="mb-1 text-sm font-semibold text-zinc-100">
        Añadir nueva sinapsis
      </h2>
      <p className="mb-3 text-[11px] font-light leading-relaxed text-zinc-500">
        Conecta un nuevo cliente o proyecto al núcleo de SynapTech.
      </p>

      <form onSubmit={submit} className="flex flex-col gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre del proyecto"
          className="w-full rounded-lg border border-white/5 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-lime-400/50"
        />
        <input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Categoría (opcional)"
          className="w-full rounded-lg border border-white/5 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-lime-400/50"
        />

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
    </div>
  );
}
