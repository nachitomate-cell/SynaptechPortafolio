/* Custom logic injected into the Workbox-generated service worker (via the
   `importScripts` option in vite.config). Handles Instagram posting reminders
   on Mondays, Thursdays and Saturdays.

   Background delivery uses the Periodic Background Sync API (installed PWA on
   Chromium only); the browser chooses when to wake the SW, so we check the day
   on each wake and de-duplicate so a given day notifies at most once. The app
   also pings us (`check-ig-reminder`) while it is open, as a foreground
   fallback — both paths share the same de-dup state. */

const IG_REMINDER_TAG = "ig-reminder";
const IG_REMINDER_DAYS = [1, 4, 6]; // 0=Sun … Mon=1, Thu=4, Sat=6
const IG_STATE_CACHE = "ig-reminder-state";
const IG_URL = "https://www.instagram.com/";

function igTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

async function igLastNotified() {
  try {
    const c = await caches.open(IG_STATE_CACHE);
    const r = await c.match("/last");
    return r ? await r.text() : "";
  } catch {
    return "";
  }
}

async function igSetNotified(key) {
  try {
    const c = await caches.open(IG_STATE_CACHE);
    await c.put("/last", new Response(key));
  } catch {
    /* ignore */
  }
}

async function igMaybeNotify() {
  const now = new Date();
  if (!IG_REMINDER_DAYS.includes(now.getDay())) return;
  const key = igTodayKey();
  if ((await igLastNotified()) === key) return; // already reminded today
  await igSetNotified(key);
  await self.registration.showNotification("📸 Día de publicación", {
    body: "Sube tus 3 publicaciones a Instagram hoy (lun · jue · sáb).",
    tag: IG_REMINDER_TAG,
    icon: "/pwa-192x192.png",
    badge: "/pwa-192x192.png",
    data: { url: IG_URL },
    requireInteraction: true,
    actions: [{ action: "open-ig", title: "Abrir Instagram" }],
  });
}

self.addEventListener("periodicsync", (event) => {
  if (event.tag === IG_REMINDER_TAG) event.waitUntil(igMaybeNotify());
});

/* ── Web Push (server-initiated) ──────────────────────────────────────────
   Real push: the server (Vercel cron) sends a message that wakes the SW even
   when the app is closed — and, unlike periodic sync, this works on iOS 16.4+
   (installed PWA). Payload shape comes from api/_lib/push.ts (PushPayload). */
self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: "SynapTech", body: event.data ? event.data.text() : "" };
  }
  const title = payload.title || "SynapTech";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: payload.body || "",
      tag: payload.tag,
      icon: "/pwa-192x192.png",
      badge: "/pwa-192x192.png",
      requireInteraction: !!payload.requireInteraction,
      data: { url: payload.url || "/" },
    }),
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "check-ig-reminder") {
    event.waitUntil(igMaybeNotify());
  } else if (event.data === "test-ig-reminder") {
    event.waitUntil(
      self.registration.showNotification("📸 Recordatorio de prueba", {
        body: "Así se verán tus recordatorios para publicar en Instagram.",
        icon: "/pwa-192x192.png",
        badge: "/pwa-192x192.png",
        data: { url: IG_URL },
        actions: [{ action: "open-ig", title: "Abrir Instagram" }],
      }),
    );
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    (async () => {
      // An explicit external action (e.g. "Abrir Instagram") always opens a tab.
      if (event.action === "open-ig") {
        await self.clients.openWindow(url);
        return;
      }
      // For an in-app target, reuse an open window when there is one; otherwise
      // open the target URL (covers external links like Instagram too).
      const wins = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      const sameOrigin = url.startsWith("/") || url.startsWith(self.location.origin);
      const open = sameOrigin ? wins.find((w) => "focus" in w) : null;
      if (open) await open.focus();
      else await self.clients.openWindow(url);
    })(),
  );
});
