import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sendToAll, isAuthorizedCron } from "../_lib/push.js";

/**
 * Cron: daily motivational nudge. Sends one short message every morning to
 * kick off the day. Messages rotate deterministically by day-of-year, so a
 * different one lands each day and the cycle is long enough not to feel
 * repetitive.
 */
const MESSAGES: { title: string; body: string }[] = [
  { title: "🚀 A construir", body: "Cada sinapsis que conectas hoy es un cliente que confía en SynapTech. ¡Dale!" },
  { title: "💡 Foco", body: "No tienes que hacerlo todo hoy. Solo el siguiente paso. Empieza por uno." },
  { title: "🔥 Momentum", body: "Los proyectos no se terminan de golpe; se terminan un commit a la vez." },
  { title: "🌱 Constancia", body: "Lo que haces todos los días pesa más que lo que haces de vez en cuando." },
  { title: "🧠 Mente clara", body: "Respira, prioriza una cosa y hazla bien. El resto puede esperar." },
  { title: "⚡ Energía", body: "Tu portafolio crece mientras otros lo posponen. Sigue moviéndote." },
  { title: "🎯 Disciplina", body: "La motivación arranca el día; la disciplina lo termina. Tú tienes ambas." },
  { title: "🛠️ Hazlo simple", body: "Entrega algo hoy, aunque sea pequeño. Lo perfecto viene después." },
  { title: "🌟 Visión", body: "SynapTech es la suma de tus días enfocados. Hoy suma uno más." },
  { title: "💪 Resiliencia", body: "Los bugs y los 'no' también son parte del camino. Sigue adelante." },
  { title: "📈 Progreso", body: "Compara tu hoy con tu ayer, no con nadie más. Vas avanzando." },
  { title: "🤝 Confianza", body: "Cada barbería, cada restaurante, cada nodo: alguien creyó en ti. Hónralo." },
  { title: "☕ Buenos días", body: "Un café, una meta clara y a darle. Hoy es un buen día para crear." },
  { title: "🌙 Cierra fuerte", body: "Lo que empieces con intención hoy, tu yo de mañana lo agradecerá." },
];

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (!isAuthorizedCron(req.headers.authorization)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const now = new Date();
    const startOfYear = Date.UTC(now.getUTCFullYear(), 0, 0);
    const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    const dayOfYear = Math.floor((today - startOfYear) / 86_400_000);
    const msg = MESSAGES[dayOfYear % MESSAGES.length];

    const sent = await sendToAll({
      title: msg.title,
      body: msg.body,
      url: "/",
      tag: "daily-motivation",
    });
    res.status(200).json({ ok: true, index: dayOfYear % MESSAGES.length, sent });
  } catch (err) {
    console.error("[cron/daily-motivation] failed:", err);
    res.status(500).json({ error: "Failed" });
  }
}
