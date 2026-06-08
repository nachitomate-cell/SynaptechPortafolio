import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sendToAll, isAuthorizedCron } from "../_lib/push.js";
import { getBilling } from "../_lib/billing-core.js";
import { INITIAL_PROJECTS } from "../../src/data/mockData.js";

/**
 * Cron: weekly portfolio summary. Pushes a one-line digest combining the static
 * portfolio size with the live month-to-date GCP spend.
 *
 * Note: the project counts come from the seed portfolio (mockData), since the
 * live edits live in each browser's localStorage and aren't visible server-side.
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
    const active = INITIAL_PROJECTS.filter((p) => p.active !== false).length;

    let spend = "";
    try {
      const billing = await getBilling();
      spend = ` · gasto del mes ${billing.total.toFixed(2)} ${billing.currency}`;
    } catch {
      // Billing optional in the summary — skip it if it fails.
    }

    const sent = await sendToAll({
      title: "📊 Resumen SynapTech",
      body: `${active} proyectos activos${spend}.`,
      url: "/",
      tag: "weekly-summary",
    });
    res.status(200).json({ ok: true, sent });
  } catch (err) {
    console.error("[cron/weekly-summary] failed:", err);
    res.status(500).json({ error: "Failed" });
  }
}
