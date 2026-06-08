import { useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { SynapseProject } from "../types";
import { DEFAULT_CATEGORIES } from "../data/categories";
import { PROJECT_STATUSES } from "../data/statuses";
import type { ProjectStatus } from "../data/statuses";

interface ControlDrawerProps {
  open: boolean;
  onClose: () => void;
  projects: SynapseProject[];

  search: string;
  onSearch: (s: string) => void;
  selectedCategories: Set<string>;
  onToggleCategory: (c: string) => void;
  selectedStatuses: Set<ProjectStatus>;
  onToggleStatus: (s: ProjectStatus) => void;
  onlyActive: boolean;
  onToggleOnlyActive: () => void;
  onClearFilters: () => void;

  presentation: boolean;
  onTogglePresentation: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onShare: () => void;
  onRefreshGitHub: () => void;
  ghBusy: boolean;
  /** When viewing a shared link, editing actions are hidden. */
  shared: boolean;
  screensaverEnabled: boolean;
  onToggleScreensaver: () => void;
  onStartAmbient: () => void;
  effectsOn: boolean;
  onToggleEffects: () => void;
  onResetPreferences: () => void;
  remindersEnabled: boolean;
  remindersSupported: boolean;
  remindersDenied: boolean;
  onEnableReminders: () => void;
  onDisableReminders: () => void;
  onTestReminder: () => void;
  // Web Push (server-initiated; works on iOS installed PWA).
  pushSupported: boolean;
  pushConfigured: boolean;
  pushSubscribed: boolean;
  pushBusy: boolean;
  pushNeedsInstall: boolean;
  pushDenied: boolean;
  onEnablePush: () => void;
  onDisablePush: () => void;
  onTestPush: () => void;
}

/** A labelled count row with a proportional bar. */
function StatRow({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2 text-[11px]">
      <span className="w-28 shrink-0 truncate text-zinc-400">{label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="w-5 shrink-0 text-right tabular-nums text-zinc-300">
        {count}
      </span>
    </div>
  );
}

/**
 * Right-side control panel: search, filters (category / status / active), a live
 * summary of the portfolio, and actions (presentation mode, export/import JSON).
 * Keeps all "explore & manage" controls in one scalable surface.
 */
export function ControlDrawer({
  open,
  onClose,
  projects,
  search,
  onSearch,
  selectedCategories,
  onToggleCategory,
  selectedStatuses,
  onToggleStatus,
  onlyActive,
  onToggleOnlyActive,
  onClearFilters,
  presentation,
  onTogglePresentation,
  onExport,
  onImport,
  onShare,
  onRefreshGitHub,
  ghBusy,
  shared,
  screensaverEnabled,
  onToggleScreensaver,
  onStartAmbient,
  effectsOn,
  onToggleEffects,
  onResetPreferences,
  remindersEnabled,
  remindersSupported,
  remindersDenied,
  onEnableReminders,
  onDisableReminders,
  onTestReminder,
  pushSupported,
  pushConfigured,
  pushSubscribed,
  pushBusy,
  pushNeedsInstall,
  pushDenied,
  onEnablePush,
  onDisablePush,
  onTestPush,
}: ControlDrawerProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  const total = projects.length;
  const active = projects.filter((p) => p.active !== false).length;
  const byCategory = DEFAULT_CATEGORIES.map((c) => ({
    ...c,
    count: projects.filter((p) => p.category === c.name).length,
  })).filter((c) => c.count > 0);
  const byStatus = PROJECT_STATUSES.map((s) => ({
    ...s,
    count: projects.filter((p) => (p.status ?? "en-curso") === s.id).length,
  })).filter((s) => s.count > 0);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Scrim. */}
          <motion.div
            className="fixed inset-0 z-30 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.aside
            className="fixed right-0 top-0 z-40 flex h-full w-80 max-w-[85vw] flex-col overflow-y-auto border-l border-white/10 bg-zinc-900/95 backdrop-blur-xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
          >
            <div className="flex items-center justify-between border-b border-white/5 p-4">
              <h2 className="text-sm font-semibold text-zinc-100">
                Explorar y gestionar
              </h2>
              <button
                onClick={onClose}
                aria-label="Cerrar"
                className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-100"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-5 p-4">
              {/* Search. */}
              <div>
                <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                  Buscar
                </label>
                <input
                  value={search}
                  onChange={(e) => onSearch(e.target.value)}
                  placeholder="Nombre o categoría…"
                  className="w-full rounded-lg border border-white/5 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-lime-400/50"
                />
              </div>

              {/* Category filter. */}
              <div>
                <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                  Categorías
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {DEFAULT_CATEGORIES.map((c) => {
                    const on = selectedCategories.has(c.name);
                    return (
                      <button
                        key={c.id}
                        onClick={() => onToggleCategory(c.name)}
                        className="rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors"
                        style={{
                          color: on ? "#09090b" : c.accent,
                          backgroundColor: on ? c.accent : "transparent",
                          borderColor: `${c.accent}66`,
                        }}
                      >
                        {c.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Status filter. */}
              <div>
                <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                  Estados
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {PROJECT_STATUSES.map((s) => {
                    const on = selectedStatuses.has(s.id);
                    return (
                      <button
                        key={s.id}
                        onClick={() => onToggleStatus(s.id)}
                        className="rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors"
                        style={{
                          color: on ? "#09090b" : s.color,
                          backgroundColor: on ? s.color : "transparent",
                          borderColor: `${s.color}66`,
                        }}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active toggle + clear. */}
              <div className="flex items-center justify-between">
                <label className="flex cursor-pointer items-center gap-2 text-xs text-zinc-300">
                  <input
                    type="checkbox"
                    checked={onlyActive}
                    onChange={onToggleOnlyActive}
                    className="accent-lime-400"
                  />
                  Solo sinapsis activas
                </label>
                <button
                  onClick={onClearFilters}
                  className="text-[11px] text-zinc-500 transition-colors hover:text-zinc-300"
                >
                  Limpiar
                </button>
              </div>

              {/* Summary. */}
              <div className="rounded-xl border border-white/5 bg-zinc-950/40 p-3">
                <div className="mb-2 flex items-baseline justify-between">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                    Resumen
                  </span>
                  <span className="text-xs text-zinc-400">
                    <span className="font-semibold text-lime-300">{active}</span>{" "}
                    / {total} activas
                  </span>
                </div>
                <div className="mb-1 text-[10px] uppercase tracking-wider text-zinc-600">
                  Por categoría
                </div>
                <div className="flex flex-col gap-1.5">
                  {byCategory.map((c) => (
                    <StatRow
                      key={c.id}
                      label={c.name}
                      count={c.count}
                      total={total}
                      color={c.accent}
                    />
                  ))}
                </div>
                <div className="mb-1 mt-3 text-[10px] uppercase tracking-wider text-zinc-600">
                  Por estado
                </div>
                <div className="flex flex-col gap-1.5">
                  {byStatus.map((s) => (
                    <StatRow
                      key={s.id}
                      label={s.label}
                      count={s.count}
                      total={total}
                      color={s.color}
                    />
                  ))}
                </div>
              </div>

              {/* Instagram posting reminders. */}
              <div className="flex flex-col gap-2 border-t border-white/5 pt-4">
                <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                  Recordatorios de Instagram
                </span>
                <p className="px-1 text-[11px] font-light text-zinc-500">
                  Avisa los{" "}
                  <span className="text-zinc-300">lunes, jueves y sábados</span>{" "}
                  para subir 3 publicaciones.
                </p>
                {!remindersSupported ? (
                  <p className="px-1 text-[11px] text-amber-300/80">
                    Tu navegador no soporta notificaciones.
                  </p>
                ) : remindersDenied ? (
                  <p className="px-1 text-[11px] text-amber-300/80">
                    Permiso bloqueado. Actívalo en los ajustes del sitio en tu
                    navegador.
                  </p>
                ) : remindersEnabled ? (
                  <>
                    <button
                      onClick={onDisableReminders}
                      className="flex items-center justify-between rounded-lg border border-lime-400/60 bg-lime-400/10 px-3 py-2 text-sm text-lime-200 transition-colors"
                    >
                      Recordatorios activados
                      <span className="text-[11px]">Desactivar</span>
                    </button>
                    <button
                      onClick={onTestReminder}
                      className="text-[11px] text-zinc-500 transition-colors hover:text-zinc-300"
                    >
                      Enviar notificación de prueba
                    </button>
                  </>
                ) : (
                  <button
                    onClick={onEnableReminders}
                    className="flex items-center justify-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-zinc-300 transition-colors hover:border-lime-400/40 hover:text-lime-200"
                  >
                    🔔 Activar recordatorios
                  </button>
                )}
                <p className="px-1 text-[10px] font-light text-zinc-600">
                  Mejor con la app instalada (PWA) en Chrome/Edge. En segundo
                  plano el navegador decide el momento exacto; en iOS solo avisa
                  con la app abierta.
                </p>
              </div>

              {/* Web Push (notificaciones del servidor). */}
              <div className="flex flex-col gap-2 border-t border-white/5 pt-4">
                <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                  Notificaciones push
                </span>
                <p className="px-1 text-[11px] font-light text-zinc-500">
                  Alertas de{" "}
                  <span className="text-zinc-300">gasto GCP</span>, recordatorios
                  de Instagram y resumen semanal — incluso con la app cerrada y en
                  iPhone.
                </p>
                {!pushSupported ? (
                  <p className="px-1 text-[11px] text-amber-300/80">
                    Tu navegador no soporta Web Push.
                  </p>
                ) : !pushConfigured ? (
                  <p className="px-1 text-[11px] text-amber-300/80">
                    Falta configurar la clave VAPID (VITE_VAPID_PUBLIC_KEY).
                  </p>
                ) : pushNeedsInstall ? (
                  <p className="px-1 text-[11px] text-amber-300/80">
                    En iPhone: añade la app a la pantalla de inicio y ábrela desde
                    ahí para activar las notificaciones.
                  </p>
                ) : pushDenied ? (
                  <p className="px-1 text-[11px] text-amber-300/80">
                    Permiso bloqueado. Actívalo en los ajustes del sitio.
                  </p>
                ) : pushSubscribed ? (
                  <>
                    <button
                      onClick={onDisablePush}
                      disabled={pushBusy}
                      className="flex items-center justify-between rounded-lg border border-lime-400/60 bg-lime-400/10 px-3 py-2 text-sm text-lime-200 transition-colors disabled:opacity-50"
                    >
                      Push activado
                      <span className="text-[11px]">Desactivar</span>
                    </button>
                    <button
                      onClick={onTestPush}
                      disabled={pushBusy}
                      className="text-[11px] text-zinc-500 transition-colors hover:text-zinc-300 disabled:opacity-50"
                    >
                      Enviar push de prueba
                    </button>
                  </>
                ) : (
                  <button
                    onClick={onEnablePush}
                    disabled={pushBusy}
                    className="flex items-center justify-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-zinc-300 transition-colors hover:border-lime-400/40 hover:text-lime-200 disabled:opacity-50"
                  >
                    {pushBusy ? "Activando…" : "📲 Activar notificaciones push"}
                  </button>
                )}
              </div>

              {/* Actions. */}
              <div className="flex flex-col gap-2 border-t border-white/5 pt-4">
                <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                  Acciones
                </span>
                <button
                  onClick={onShare}
                  className="flex items-center justify-center gap-2 rounded-lg bg-lime-400 px-3 py-2 text-sm font-semibold text-zinc-950 transition-opacity hover:opacity-90"
                  style={{ boxShadow: "0 0 18px rgba(146,200,58,0.35)" }}
                >
                  🔗 Compartir enlace
                </button>

                <button
                  onClick={onStartAmbient}
                  className="flex items-center justify-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-zinc-300 transition-colors hover:border-lime-400/40 hover:text-lime-200"
                >
                  ▶ Modo ambiente
                </button>
                <label className="flex cursor-pointer items-center justify-between px-1 text-xs text-zinc-400">
                  <span>Salvapantallas automático</span>
                  <input
                    type="checkbox"
                    checked={screensaverEnabled}
                    onChange={onToggleScreensaver}
                    className="accent-lime-400"
                  />
                </label>
                <label className="flex cursor-pointer items-center justify-between px-1 text-xs text-zinc-400">
                  <span>
                    Efectos visuales
                    <span className="block text-[10px] text-zinc-600">
                      Desactívalos si notas tirones
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    checked={effectsOn}
                    onChange={onToggleEffects}
                    className="accent-lime-400"
                  />
                </label>
                {!shared && (
                  <button
                    onClick={onTogglePresentation}
                    className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors ${
                      presentation
                        ? "border-lime-400/60 bg-lime-400/10 text-lime-200"
                        : "border-white/10 text-zinc-300 hover:border-lime-400/40 hover:text-lime-200"
                    }`}
                  >
                    Modo presentación
                    <span className="text-[11px]">
                      {presentation ? "ON" : "OFF"}
                    </span>
                  </button>
                )}
                {!shared && (
                  <button
                    onClick={onRefreshGitHub}
                    disabled={ghBusy}
                    className="flex items-center justify-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-zinc-300 transition-colors hover:border-lime-400/40 hover:text-lime-200 disabled:opacity-50"
                  >
                    {ghBusy ? "Actualizando…" : "↻ Actualizar GitHub (stars)"}
                  </button>
                )}
                {!shared && (
                  <div className="flex gap-2">
                    <button
                      onClick={onExport}
                      className="flex-1 rounded-lg border border-white/10 px-3 py-2 text-sm text-zinc-300 transition-colors hover:border-lime-400/40 hover:text-lime-200"
                    >
                      Exportar JSON
                    </button>
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="flex-1 rounded-lg border border-white/10 px-3 py-2 text-sm text-zinc-300 transition-colors hover:border-lime-400/40 hover:text-lime-200"
                    >
                      Importar JSON
                    </button>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="application/json,.json"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) onImport(f);
                        e.target.value = "";
                      }}
                    />
                  </div>
                )}
                <button
                  onClick={onResetPreferences}
                  className="mt-1 text-[11px] text-zinc-500 transition-colors hover:text-zinc-300"
                >
                  Restablecer preferencias
                </button>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
