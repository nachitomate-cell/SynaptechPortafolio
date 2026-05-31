import { AnimatePresence, motion } from "framer-motion";
import { useRegisterSW } from "virtual:pwa-register/react";

/**
 * Service-worker lifecycle UI. Surfaces two states with a minimalist neon
 * toast that matches the dashboard:
 *  - "offline ready": the app shell has been cached and works offline.
 *  - "update available": a new version is waiting; tapping reloads into it.
 */
export function PWAReloadPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  const visible = offlineReady || needRefresh;

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
          className="pointer-events-auto fixed bottom-6 right-4 z-30 w-72 max-w-[calc(100vw-2rem)] rounded-2xl border border-white/5 bg-zinc-900/70 p-4 backdrop-blur-md sm:right-6"
          style={{ boxShadow: "0 0 24px rgba(146,200,58,0.18)" }}
        >
          <div className="flex items-start gap-3">
            <span
              className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-lime-300"
              style={{ boxShadow: "0 0 10px rgba(146,200,58,0.9)" }}
            />
            <div className="flex-1">
              <p className="text-sm font-medium text-zinc-100">
                {needRefresh
                  ? "Nueva versión disponible"
                  : "Lista para usar sin conexión"}
              </p>
              <p className="mt-0.5 text-[11px] font-light text-zinc-500">
                {needRefresh
                  ? "Actualiza para obtener las últimas mejoras."
                  : "SynapTech ahora funciona offline."}
              </p>

              <div className="mt-3 flex gap-2">
                {needRefresh && (
                  <button
                    onClick={() => updateServiceWorker(true)}
                    className="rounded-lg bg-lime-400 px-3 py-1.5 text-xs font-semibold text-zinc-950"
                    style={{ boxShadow: "0 0 14px rgba(146,200,58,0.4)" }}
                  >
                    Actualizar
                  </button>
                )}
                <button
                  onClick={close}
                  className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:border-lime-400/40 hover:text-lime-200"
                >
                  {needRefresh ? "Después" : "Entendido"}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
