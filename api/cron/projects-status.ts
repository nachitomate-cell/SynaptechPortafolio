import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sendToAll, isAuthorizedCron } from "../_lib/push.js";
import { INITIAL_PROJECTS } from "../../src/data/mockData.js";

/**
 * Cron: weekly "don't forget these" nudge. Counts projects sitting in passive
 * states (paused / planning / maintenance) so they don't fall off the radar.
 *
 * Note: counts come from the seed portfolio (mockData); live edits live in each
 * browser's localStorage and aren't visible server-side.
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
    const count = (status: string) =>
      INITIAL_PROJECTS.filter((p) => p.status === status).length;
    const paused = count("pausado");
    const planning = count("planificacion");
    const maintenance = count("mantenimiento");

    if (paused + planning + maintenance === 0) {
      res.status(200).json({ ok: true, sent: 0, reason: "nothing pending" });
      return;
    }

    const parts: string[] = [];
    if (paused) parts.push(`${paused} pausado${paused > 1 ? "s" : ""}`);
    if (planning) parts.push(`${planning} en planificación`);
    if (maintenance) parts.push(`${maintenance} en mantenimiento`);

    const sent = await sendToAll({
      title: "🗂️ Estado de proyectos",
      body: `${parts.join(" · ")}. Revisa si alguno necesita avanzar.`,
      url: "/",
      tag: "projects-status",
    });
    res.status(200).json({ ok: true, sent });
  } catch (err) {
    console.error("[cron/projects-status] failed:", err);
    res.status(500).json({ error: "Failed" });
  }
}
