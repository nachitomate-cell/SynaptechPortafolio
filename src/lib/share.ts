import type { SynapseProject } from "../types";

// Encode/decode the portfolio into a URL-safe string so it can travel in a
// shareable link (?s=…). Unicode-safe base64 (handles accents/emoji).

function bytesToBase64(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** Serialize projects to a compact, URL-safe token. */
export function encodeProjects(projects: SynapseProject[]): string {
  const json = JSON.stringify(projects);
  const b64 = bytesToBase64(new TextEncoder().encode(json));
  // URL-safe base64.
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Parse a share token back into projects, or null if invalid. */
export function decodeProjects(token: string): SynapseProject[] | null {
  try {
    const b64 = token.replace(/-/g, "+").replace(/_/g, "/");
    const json = new TextDecoder().decode(base64ToBytes(b64));
    const data = JSON.parse(json);
    if (Array.isArray(data) && data.every((d) => d && d.id && d.name)) {
      return data as SynapseProject[];
    }
  } catch {
    /* fall through */
  }
  return null;
}
