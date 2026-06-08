import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  getPortfolio,
  setPortfolio,
  isValidPortfolio,
} from "../_lib/portfolio.js";

/**
 * /api/portfolio
 *   GET  → the stored portfolio ({ projects, updatedAt }) or { projects: null }.
 *   PUT  → replace it. Requires header `x-edit-token` === PORTFOLIO_EDIT_TOKEN.
 *
 * Reads are public (the dashboard is a public portfolio); only the owner, who
 * holds the edit token, can write.
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method === "GET") {
    try {
      const data = await getPortfolio();
      // Short edge cache so devices pick up changes quickly but cheaply.
      res.setHeader("Cache-Control", "public, s-maxage=30, stale-while-revalidate=300");
      res.status(200).json(data ?? { projects: null });
    } catch (err) {
      const detail = err instanceof Error ? err.message : "Unknown error";
      console.error("[/api/portfolio GET] failed:", err);
      res.status(500).json({ error: "Failed to read portfolio", detail });
    }
    return;
  }

  if (req.method === "PUT") {
    const expected = process.env.PORTFOLIO_EDIT_TOKEN;
    if (!expected) {
      res.status(503).json({ error: "Editing not configured" });
      return;
    }
    const token = req.headers["x-edit-token"];
    if (token !== expected) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    try {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const projects = body?.projects;
      if (!isValidPortfolio(projects)) {
        res.status(400).json({ error: "Invalid portfolio payload" });
        return;
      }
      const saved = await setPortfolio(projects);
      res.status(200).json({ ok: true, updatedAt: saved.updatedAt });
    } catch (err) {
      const detail = err instanceof Error ? err.message : "Unknown error";
      console.error("[/api/portfolio PUT] failed:", err);
      res.status(500).json({ error: "Failed to save portfolio", detail });
    }
    return;
  }

  res.setHeader("Allow", "GET, PUT");
  res.status(405).json({ error: "Method not allowed" });
}
