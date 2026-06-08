import { BigQuery } from "@google-cloud/bigquery";

/**
 * Shared month-to-date GCP billing reader, used by both the public /api/billing
 * endpoint and the billing-alert cron. Keeping the query in one place means the
 * alert and the dashboard can never drift apart.
 *
 * See api/billing.ts for the required environment variables.
 */

export interface BillingResponse {
  updatedAt: string;
  month: string;
  currency: string;
  total: number;
  projects: Record<string, number>;
}

interface BillingRow {
  projectId: string | null;
  gross: number | null;
  credits: number | null;
  currency: string | null;
}

const TABLE_PATTERN = /^[A-Za-z0-9_.\-*]+$/;

function readEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

function startOfMonthUTC(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export interface BillingRange {
  start: Date;
  end: Date;
}

/** [first day of last month, first day of this month) — for the monthly close. */
export function previousMonthRange(now = new Date()): BillingRange {
  return {
    start: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)),
    end: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)),
  };
}

/**
 * Month-to-date spend by default; pass a `range` to query a specific window
 * (e.g. the previous calendar month). The `month` label is derived from the
 * range start.
 */
export async function getBilling(range?: BillingRange): Promise<BillingResponse> {
  const projectId = readEnv("GCP_PROJECT_ID");
  const clientEmail = readEnv("GCP_CLIENT_EMAIL");
  const privateKey = readEnv("GCP_PRIVATE_KEY").replace(/\\n/g, "\n");

  const tables = readEnv("GCP_BILLING_TABLE")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  if (tables.length === 0) throw new Error("GCP_BILLING_TABLE is empty");
  for (const t of tables) {
    if (!TABLE_PATTERN.test(t)) {
      throw new Error(`GCP_BILLING_TABLE has an invalid entry: ${t}`);
    }
  }

  const bigquery = new BigQuery({
    projectId,
    credentials: { client_email: clientEmail, private_key: privateKey },
  });

  const now = new Date();
  const start = range?.start ?? startOfMonthUTC(now);
  const end = range?.end ?? now;

  const unioned = tables
    .map(
      (t) => `
      SELECT project.id AS projectId, cost, credits, currency
      FROM \`${t}\`
      WHERE usage_start_time >= @start AND usage_start_time < @end`,
    )
    .join("\n      UNION ALL");

  const query = `
    WITH usage AS (${unioned}
    )
    SELECT
      projectId,
      SUM(cost) AS gross,
      SUM(IFNULL((SELECT SUM(c.amount) FROM UNNEST(credits) AS c), 0)) AS credits,
      ANY_VALUE(currency) AS currency
    FROM usage
    WHERE projectId IS NOT NULL
    GROUP BY projectId
  `;

  const [rows] = await bigquery.query({
    query,
    params: { start: start.toISOString(), end: end.toISOString() },
    types: { start: "TIMESTAMP", end: "TIMESTAMP" },
  });

  const projects: Record<string, number> = {};
  let total = 0;
  let currency = "USD";

  for (const raw of rows as BillingRow[]) {
    if (!raw.projectId) continue;
    const net = (raw.gross ?? 0) + (raw.credits ?? 0);
    const cost = Math.max(0, Math.round(net * 100) / 100);
    projects[raw.projectId] = cost;
    total += cost;
    if (raw.currency) currency = raw.currency;
  }

  return {
    updatedAt: now.toISOString(),
    month: `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, "0")}`,
    currency,
    total: Math.round(total * 100) / 100,
    projects,
  };
}
