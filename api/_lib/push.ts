import webpush, { type PushSubscription } from "web-push";
import { Redis } from "@upstash/redis";

/**
 * Shared Web Push core: VAPID config, subscription storage (Upstash Redis) and a
 * fan-out sender that prunes dead subscriptions. Used by the /api/push/* routes
 * and the cron jobs.
 *
 * Required environment variables:
 *   VAPID_PUBLIC_KEY        – VAPID public key  (also exposed to the client as VITE_VAPID_PUBLIC_KEY)
 *   VAPID_PRIVATE_KEY       – VAPID private key  (secret)
 *   VAPID_SUBJECT           – contact, e.g. "mailto:tu@correo.com"
 *   UPSTASH_REDIS_REST_URL  – Upstash REST URL   (the Vercel KV/Upstash integration sets this,
 *                             or KV_REST_API_URL — both names are accepted)
 *   UPSTASH_REDIS_REST_TOKEN – Upstash REST token (or KV_REST_API_TOKEN)
 *   CRON_SECRET (optional)  – if set, cron routes require it (Vercel sends it automatically)
 */

const SUBS_KEY = "push:subscriptions";

export interface PushPayload {
  title: string;
  body: string;
  /** URL opened when the notification is tapped. */
  url?: string;
  tag?: string;
  /** Keep the notification on screen until dismissed. */
  requireInteraction?: boolean;
}

let vapidReady = false;
function ensureVapid(): void {
  if (vapidReady) return;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@synaptechspa.cl";
  if (!publicKey || !privateKey) {
    throw new Error("Missing VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY");
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidReady = true;
}

let redis: Redis | null = null;
function getRedis(): Redis {
  if (redis) return redis;
  const url =
    process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) {
    throw new Error(
      "Missing Upstash Redis env vars (UPSTASH_REDIS_REST_URL / _TOKEN)",
    );
  }
  redis = new Redis({ url, token });
  return redis;
}

/** Store (or refresh) a subscription, keyed by its endpoint. */
export async function saveSubscription(sub: PushSubscription): Promise<void> {
  if (!sub?.endpoint) throw new Error("Invalid subscription");
  await getRedis().hset(SUBS_KEY, { [sub.endpoint]: sub });
}

/** Drop a subscription by endpoint (e.g. on unsubscribe). */
export async function removeSubscription(endpoint: string): Promise<void> {
  if (!endpoint) return;
  await getRedis().hdel(SUBS_KEY, endpoint);
}

async function listSubscriptions(): Promise<PushSubscription[]> {
  const all = await getRedis().hgetall<Record<string, PushSubscription>>(SUBS_KEY);
  return all ? Object.values(all) : [];
}

/**
 * Send a notification to every stored subscription. Subscriptions the push
 * service reports as gone (404/410) are pruned so the store self-heals.
 * Returns how many were delivered.
 */
export async function sendToAll(payload: PushPayload): Promise<number> {
  ensureVapid();
  const subs = await listSubscriptions();
  if (subs.length === 0) return 0;

  const data = JSON.stringify(payload);
  const dead: string[] = [];
  let sent = 0;

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(sub, data);
        sent++;
      } catch (err: unknown) {
        const status = (err as { statusCode?: number })?.statusCode;
        if (status === 404 || status === 410) dead.push(sub.endpoint);
        else console.error("[push] send failed:", status, sub.endpoint);
      }
    }),
  );

  if (dead.length) await getRedis().hdel(SUBS_KEY, ...dead);
  return sent;
}

/** Count stored subscriptions (handy for cron logs). */
export async function countSubscriptions(): Promise<number> {
  return (await listSubscriptions()).length;
}

/**
 * Atomic "do this only once per key" latch (Redis SET NX). Returns true the
 * first time a given key is seen, false afterwards — used so the billing alert
 * fires at most once per month even though its cron runs daily.
 */
export async function claimOnce(
  key: string,
  ttlSeconds = 40 * 24 * 60 * 60,
): Promise<boolean> {
  const ok = await getRedis().set(key, "1", { nx: true, ex: ttlSeconds });
  return ok === "OK";
}

/**
 * Guard cron routes: when CRON_SECRET is set, require it in the Authorization
 * header (Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`). No secret
 * configured → allow (useful while testing).
 */
export function isAuthorizedCron(authHeader?: string | string[]): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const header = Array.isArray(authHeader) ? authHeader[0] : authHeader;
  return header === `Bearer ${secret}`;
}
