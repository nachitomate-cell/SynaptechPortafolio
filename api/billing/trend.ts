import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getBillingTrend } from "../_lib/billing-core.js";

/**
 * GET /api/billing/trend
 * Daily GCP spend for the current month + an end-of-month projection. Powers the
 * dashboard trend sparkline. Cached for an hour like /api/billing.
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  try {
    const trend = await getBillingTrend();
    res.setHeader(
      "Cache-Control",
      "public, s-maxage=3600, stale-while-revalidate=86400",
    );
    res.status(200).json(trend);
  } catch (err) {
    const detail = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/billing/trend] failed:", err);
    res.status(500).json({ error: "Failed to fetch billing trend", detail });
  }
}
