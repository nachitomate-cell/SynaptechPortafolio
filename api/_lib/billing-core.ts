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

/** Build a BigQuery client + the validated list of export tables from env. */
function bqClientAndTables(): { bigquery: BigQuery; tables: string[] } {
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
  return { bigquery, tables };
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
  const { bigquery, tables } = bqClientAndTables();

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

export interface BillingTrend {
  month: string;
  currency: string;
  /** Month-to-date total. */
  total: number;
  daysElapsed: number;
  daysInMonth: number;
  /** Linear extrapolation of the month-end total at the current daily rate. */
  projectedTotal: number;
  /** Cumulative spend per day-of-month so far (for the sparkline). */
  series: { day: number; cumulative: number }[];
}

interface DailyRow {
  day: { value: string } | string | null;
  net: number | null;
  currency: string | null;
}

/**
 * Daily spend for the current month plus a simple end-of-month projection.
 * Powers the dashboard trend sparkline. One BigQuery job, grouped by day.
 */
export async function getBillingTrend(): Promise<BillingTrend> {
  const { bigquery, tables } = bqClientAndTables();

  const now = new Date();
  const start = startOfMonthUTC(now);

  const unioned = tables
    .map(
      (t) => `
      SELECT
        DATE(usage_start_time) AS day,
        cost + IFNULL((SELECT SUM(c.amount) FROM UNNEST(credits) AS c), 0) AS net,
        currency
      FROM \`${t}\`
      WHERE usage_start_time >= @start AND usage_start_time < @end`,
    )
    .join("\n      UNION ALL");

  const query = `
    WITH usage AS (${unioned}
    )
    SELECT day, SUM(net) AS net, ANY_VALUE(currency) AS currency
    FROM usage
    GROUP BY day
    ORDER BY day
  `;

  const [rows] = await bigquery.query({
    query,
    params: { start: start.toISOString(), end: now.toISOString() },
    types: { start: "TIMESTAMP", end: "TIMESTAMP" },
  });

  // Cumulative series by day-of-month.
  let currency = "USD";
  let running = 0;
  const series: { day: number; cumulative: number }[] = [];
  for (const raw of rows as DailyRow[]) {
    const dayStr =
      typeof raw.day === "string" ? raw.day : (raw.day?.value ?? "");
    const day = Number(dayStr.slice(-2)); // "2026-06-07" → 7
    running += Math.max(0, raw.net ?? 0);
    if (raw.currency) currency = raw.currency;
    series.push({ day, cumulative: Math.round(running * 100) / 100 });
  }

  const total = Math.round(running * 100) / 100;
  const daysInMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0),
  ).getUTCDate();
  const daysElapsed = now.getUTCDate();
  const projectedTotal =
    daysElapsed > 0
      ? Math.round((total / daysElapsed) * daysInMonth * 100) / 100
      : total;

  return {
    month: `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, "0")}`,
    currency,
    total,
    daysElapsed,
    daysInMonth,
    projectedTotal,
    series,
  };
}
