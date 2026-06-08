import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sendToAll, isAuthorizedCron, claimOnce } from "../_lib/push.js";
import { getBilling, previousMonthRange } from "../_lib/billing-core.js";

/**
 * Cron: monthly close. On the 1st of each month, pushes the previous month's
 * final GCP total. A Redis latch keyed by that month makes it fire only once,
 * even if the cron is retried.
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
    const range = previousMonthRange();
    const b = await getBilling(range);

    const fresh = await claimOnce(`billing:closed:${b.month}`);
    if (!fresh) {
      res.status(200).json({ ok: true, month: b.month, sent: "already" });
      return;
    }

    const sent = await sendToAll({
      title: "📅 Cierre mensual GCP",
      body: `${b.month} cerró en ${b.total.toFixed(2)} ${b.currency} de gasto en la nube.`,
      url: "/",
      tag: "monthly-close",
      requireInteraction: true,
    });
    res.status(200).json({ ok: true, month: b.month, total: b.total, sent });
  } catch (err) {
    console.error("[cron/monthly-close] failed:", err);
    res.status(500).json({ error: "Failed" });
  }
}
