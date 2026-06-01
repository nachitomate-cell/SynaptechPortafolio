// Client-side controller for the Instagram posting reminders (Mon/Thu/Sat).
//
// There is no backend, so background delivery relies on the Periodic Background
// Sync API: registering a tag asks the browser to wake the service worker every
// so often (it decides exactly when), where `sw-custom.js` checks the weekday
// and notifies. While the app is open we also ping the SW as a fallback. Both
// paths share the SW's de-dup state, so each day fires at most one reminder.

const TAG = "ig-reminder";
const MIN_INTERVAL = 12 * 60 * 60 * 1000; // 12h (browser clamps it anyway)

/** Days the reminder fires (0=Sun … Mon=1, Thu=4, Sat=6). */
export const REMINDER_DAYS = [1, 4, 6];

export function notificationsSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator
  );
}

export function notificationPermission(): NotificationPermission | "unsupported" {
  return notificationsSupported() ? Notification.permission : "unsupported";
}

interface EnableResult {
  ok: boolean;
  /** True if true background delivery (periodic sync) was registered. */
  background: boolean;
  reason?: "unsupported" | "denied";
}

/** Ask for permission (if needed) and register the background reminder. */
export async function enableReminders(): Promise<EnableResult> {
  if (!notificationsSupported())
    return { ok: false, background: false, reason: "unsupported" };

  let perm = Notification.permission;
  if (perm === "default") perm = await Notification.requestPermission();
  if (perm !== "granted")
    return { ok: false, background: false, reason: "denied" };

  const background = await registerPeriodicSync();
  // In case today is already a reminder day, check right away.
  void checkReminderNow();
  return { ok: true, background };
}

/** Re-register on load when the user previously enabled reminders (no prompt). */
export async function syncReminders(): Promise<boolean> {
  if (notificationPermission() !== "granted") return false;
  const background = await registerPeriodicSync();
  void checkReminderNow();
  return background;
}

async function registerPeriodicSync(): Promise<boolean> {
  try {
    const reg = (await navigator.serviceWorker.ready) as ServiceWorkerRegistration &
      { periodicSync?: { register: (t: string, o: { minInterval: number }) => Promise<void> } };
    if (!reg.periodicSync) return false;
    const status = await navigator.permissions.query({
      // Not in the standard PermissionName union yet.
      name: "periodic-background-sync" as PermissionName,
    });
    if (status.state !== "granted") return false;
    await reg.periodicSync.register(TAG, { minInterval: MIN_INTERVAL });
    return true;
  } catch {
    return false;
  }
}

export async function disableReminders(): Promise<void> {
  try {
    const reg = (await navigator.serviceWorker.ready) as ServiceWorkerRegistration &
      { periodicSync?: { unregister: (t: string) => Promise<void> } };
    await reg.periodicSync?.unregister(TAG);
  } catch {
    /* ignore */
  }
}

/** Ask the SW to evaluate "is today a reminder day?" right now (foreground). */
export async function checkReminderNow(): Promise<void> {
  try {
    const reg = await navigator.serviceWorker.ready;
    reg.active?.postMessage("check-ig-reminder");
  } catch {
    /* ignore */
  }
}

/** Fire a one-off sample notification so the user can see how it looks. */
export async function sendTestReminder(): Promise<boolean> {
  if (notificationPermission() !== "granted") return false;
  try {
    const reg = await navigator.serviceWorker.ready;
    reg.active?.postMessage("test-ig-reminder");
    return true;
  } catch {
    return false;
  }
}
