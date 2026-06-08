import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getBilling } from "./_lib/billing-core";

/**
 * GET /api/billing
 *
 * Returns the month-to-date GCP spend broken down by project id, read from the
 * Cloud Billing → BigQuery export. The actual query lives in _lib/billing-core
 * so the billing-alert cron can reuse it verbatim.
 *
 * Why BigQuery and not `@google-cloud/billing`? The Cloud Billing API only
 * manages billing *accounts* and *budgets* — it does NOT expose accumulated
 * cost. The supported way to read actual spend per project is the billing
 * export landed in BigQuery, which we sum for the current calendar month.
 *
 * Required environment variables (set them in the Vercel dashboard):
 *   GCP_PROJECT_ID     – project that runs the BigQuery jobs
 *   GCP_CLIENT_EMAIL   – service-account email (needs BigQuery Data Viewer + Job User)
 *   GCP_PRIVATE_KEY    – service-account private key (with literal \n escapes)
 *   GCP_BILLING_TABLE  – one or more `dataset.table` (comma-separated, `*` wildcard ok),
 *                        e.g. "proj.billing.gcp_billing_export_v1_*,other.billing.gcp_billing_export_v1_*"
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
    const payload = await getBilling();

    // Billing data changes slowly and BigQuery queries cost money — let the
    // Vercel edge cache serve it for an hour and refresh in the background.
    res.setHeader(
      "Cache-Control",
      "public, s-maxage=3600, stale-while-revalidate=86400",
    );
    res.status(200).json(payload);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/billing] failed:", err);
    res.status(500).json({ error: "Failed to fetch billing data", detail: message });
  }
}
