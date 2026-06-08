import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sendToAll, isAuthorizedCron, claimOnce } from "../_lib/push";
import { getBilling } from "../_lib/billing-core";

/**
 * Cron: GCP spend alert. Runs daily; when the month-to-date total crosses
 * BILLING_ALERT_THRESHOLD it pushes once for that month (a Redis latch keyed by
 * month prevents repeats). Set BILLING_ALERT_THRESHOLD (e.g. "50") to enable.
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (!isAuthorizedCron(req.headers.authorization)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const threshold = Number(process.env.BILLING_ALERT_THRESHOLD);
  if (!Number.isFinite(threshold) || threshold <= 0) {
    res.status(200).json({ ok: true, skipped: "no threshold configured" });
    return;
  }

  try {
    const billing = await getBilling();
    if (billing.total < threshold) {
      res.status(200).json({ ok: true, total: billing.total, alerted: false });
      return;
    }

    // Only the first crossing each month notifies.
    const fresh = await claimOnce(`billing:alerted:${billing.month}`);
    if (!fresh) {
      res.status(200).json({ ok: true, total: billing.total, alerted: "already" });
      return;
    }

    const money = `${billing.total.toFixed(2)} ${billing.currency}`;
    const sent = await sendToAll({
      title: "💸 Gasto GCP elevado",
      body: `El gasto del mes (${money}) superó tu límite de ${threshold} ${billing.currency}.`,
      url: "/",
      tag: "billing-alert",
      requireInteraction: true,
    });
    res.status(200).json({ ok: true, total: billing.total, alerted: true, sent });
  } catch (err) {
    console.error("[cron/billing-alert] failed:", err);
    res.status(500).json({ error: "Failed" });
  }
}
