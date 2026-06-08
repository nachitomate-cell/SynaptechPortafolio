import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  sendToAll,
  isAuthorizedCron,
  getStored,
  setStored,
} from "../_lib/push.js";
import { getBilling } from "../_lib/billing-core.js";

/**
 * Cron: spend-spike alert. Runs daily, compares the month-to-date total against
 * yesterday's stored snapshot, and pushes when the day-over-day jump crosses
 * BILLING_SPIKE_THRESHOLD (default 5, in the billing currency). The snapshot is
 * always refreshed so each day compares against the previous one. Comparisons
 * only happen within the same month (the total resets at the month boundary).
 */
interface Snapshot {
  month: string;
  total: number;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (!isAuthorizedCron(req.headers.authorization)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const threshold = Number(process.env.BILLING_SPIKE_THRESHOLD || 5);

  try {
    const b = await getBilling();
    const prev = await getStored<Snapshot>("billing:snapshot");

    let delta = 0;
    let alerted = false;
    if (prev && prev.month === b.month) {
      delta = Math.round((b.total - prev.total) * 100) / 100;
      if (delta >= threshold) {
        await sendToAll({
          title: "📈 Pico de gasto GCP",
          body: `El gasto subió ${delta.toFixed(2)} ${b.currency} desde ayer (total ${b.total.toFixed(2)}).`,
          url: "/",
          tag: "billing-spike",
          requireInteraction: true,
        });
        alerted = true;
      }
    }

    await setStored("billing:snapshot", { month: b.month, total: b.total });
    res.status(200).json({ ok: true, total: b.total, delta, alerted });
  } catch (err) {
    console.error("[cron/billing-spike] failed:", err);
    res.status(500).json({ error: "Failed" });
  }
}
