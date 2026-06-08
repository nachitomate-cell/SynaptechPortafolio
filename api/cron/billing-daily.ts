import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sendToAll, isAuthorizedCron } from "../_lib/push.js";
import { getBilling } from "../_lib/billing-core.js";

/**
 * Cron: daily GCP spend digest. Every morning, pushes the month-to-date total
 * (informational — unlike billing-alert it has no threshold). Skips the push if
 * the total is 0 so quiet days stay quiet.
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
    const b = await getBilling();
    if (b.total <= 0) {
      res.status(200).json({ ok: true, total: 0, sent: 0 });
      return;
    }
    const sent = await sendToAll({
      title: "💸 Gasto GCP del día",
      body: `Llevas ${b.total.toFixed(2)} ${b.currency} este mes.`,
      url: "/",
      tag: "billing-daily",
    });
    res.status(200).json({ ok: true, total: b.total, sent });
  } catch (err) {
    console.error("[cron/billing-daily] failed:", err);
    res.status(500).json({ error: "Failed" });
  }
}
