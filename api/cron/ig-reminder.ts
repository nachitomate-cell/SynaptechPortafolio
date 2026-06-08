import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sendToAll, isAuthorizedCron } from "../_lib/push";

/**
 * Cron: Instagram posting reminder. Scheduled in vercel.json for Mon/Thu/Sat;
 * Vercel crons run in UTC, so the schedule fires at the configured UTC hour.
 * Sends a Web Push to every subscribed device — unlike the old local reminder,
 * this also reaches iOS (installed PWA).
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (!isAuthorizedCron(req.headers.authorization)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const sent = await sendToAll({
      title: "📸 Día de publicación",
      body: "Sube tus 3 publicaciones a Instagram hoy (lun · jue · sáb).",
      url: "https://www.instagram.com/",
      tag: "ig-reminder",
      requireInteraction: true,
    });
    res.status(200).json({ ok: true, sent });
  } catch (err) {
    console.error("[cron/ig-reminder] failed:", err);
    res.status(500).json({ error: "Failed" });
  }
}
