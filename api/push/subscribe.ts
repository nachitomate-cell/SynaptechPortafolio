import type { VercelRequest, VercelResponse } from "@vercel/node";
import { saveSubscription } from "../_lib/push";

/**
 * POST /api/push/subscribe
 * Body: { subscription: PushSubscription }
 * Stores the browser's push subscription so the cron jobs can reach this device.
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
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const subscription = body?.subscription ?? body;
    if (!subscription?.endpoint) {
      res.status(400).json({ error: "Missing subscription" });
      return;
    }
    await saveSubscription(subscription);
    res.status(201).json({ ok: true });
  } catch (err) {
    const detail = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/push/subscribe] failed:", err);
    res.status(500).json({ error: "Failed to save subscription", detail });
  }
}
