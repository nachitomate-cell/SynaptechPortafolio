import { useCallback, useEffect, useState } from "react";

/**
 * Web Push (server-initiated) subscription manager. Unlike the local Instagram
 * reminders, these notifications are sent by the Vercel cron jobs and reach the
 * device even when the app is closed — including iOS 16.4+ when the PWA is
 * installed (Add to Home Screen).
 *
 * The VAPID public key is injected at build time via VITE_VAPID_PUBLIC_KEY.
 */

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as
  | string
  | undefined;

export interface PushState {
  supported: boolean;
  /** True only once a VAPID key is configured (otherwise enabling is impossible). */
  configured: boolean;
  permission: NotificationPermission | "unsupported";
  subscribed: boolean;
  busy: boolean;
  /** True on iOS Safari when the PWA isn't installed (push won't work there). */
  needsInstall: boolean;
  enable: () => Promise<{ ok: boolean; reason?: string }>;
  disable: () => Promise<void>;
  test: () => Promise<boolean>;
}

function pushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/** iOS only allows Web Push from an installed (standalone) PWA. */
function iosNeedsInstall(): boolean {
  if (typeof navigator === "undefined") return false;
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const standalone =
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // iOS-specific flag.
    (navigator as unknown as { standalone?: boolean }).standalone === true;
  return isIOS && !standalone;
}

/** Convert a base64url VAPID key to the Uint8Array the Push API expects. */
function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(normalized);
  // Back the array with a concrete ArrayBuffer so the type matches BufferSource
  // (the Push API's applicationServerKey) under newer TS lib definitions.
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export function usePush(): PushState {
  const supported = pushSupported();
  const configured = !!VAPID_PUBLIC_KEY;
  const [permission, setPermission] = useState<
    NotificationPermission | "unsupported"
  >(supported ? Notification.permission : "unsupported");
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const needsInstall = iosNeedsInstall();

  // Reflect any existing subscription on mount.
  useEffect(() => {
    if (!supported) return;
    let alive = true;
    (async () => {
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (alive) setSubscribed(!!sub);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      alive = false;
    };
  }, [supported]);

  const enable = useCallback(async (): Promise<{ ok: boolean; reason?: string }> => {
    if (!supported) return { ok: false, reason: "unsupported" };
    if (!configured) return { ok: false, reason: "no-vapid" };
    setBusy(true);
    try {
      let perm = Notification.permission;
      if (perm === "default") perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") return { ok: false, reason: "denied" };

      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            VAPID_PUBLIC_KEY!,
          ) as BufferSource,
        });
      }
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub }),
      });
      if (!res.ok) throw new Error(`subscribe HTTP ${res.status}`);
      setSubscribed(true);
      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        reason: err instanceof Error ? err.message : "error",
      };
    } finally {
      setBusy(false);
    }
  }, [supported, configured]);

  const disable = useCallback(async (): Promise<void> => {
    if (!supported) return;
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        }).catch(() => {});
        await sub.unsubscribe().catch(() => {});
      }
      setSubscribed(false);
    } finally {
      setBusy(false);
    }
  }, [supported]);

  const test = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch("/api/push/test", { method: "POST" });
      return res.ok;
    } catch {
      return false;
    }
  }, []);

  return {
    supported,
    configured,
    permission,
    subscribed,
    busy,
    needsInstall,
    enable,
    disable,
    test,
  };
}
