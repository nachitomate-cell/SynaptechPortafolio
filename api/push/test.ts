import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sendToAll, countSubscriptions } from "../_lib/push";

/**
 * POST /api/push/test
 * Sends a sample push to every stored subscription, so the user can confirm the
 * whole pipeline works without waiting for a cron.
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  try {
    const count = await countSubscriptions();
    const sent = await sendToAll({
      title: "🔔 Notificación de prueba",
      body: "Web Push está funcionando en SynapTech.",
      url: "/",
      tag: "synaptech-test",
    });
    res.status(200).json({ ok: true, subscriptions: count, sent });
  } catch (err) {
    console.error("[/api/push/test] failed:", err);
    res.status(500).json({ error: "Failed to send test push" });
  }
}
