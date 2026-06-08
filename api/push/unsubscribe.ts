import type { VercelRequest, VercelResponse } from "@vercel/node";
import { removeSubscription } from "../_lib/push";

/**
 * POST /api/push/unsubscribe
 * Body: { endpoint: string }
 * Removes a stored subscription so this device stops receiving pushes.
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
    const endpoint = body?.endpoint;
    if (!endpoint) {
      res.status(400).json({ error: "Missing endpoint" });
      return;
    }
    await removeSubscription(endpoint);
    res.status(200).json({ ok: true });
  } catch (err) {
    const detail = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/push/unsubscribe] failed:", err);
    res.status(500).json({ error: "Failed to remove subscription", detail });
  }
}
