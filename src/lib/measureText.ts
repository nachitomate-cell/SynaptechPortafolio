// Lightweight, cached text measurement using an offscreen canvas. Used by the
// label declutter pass to know each label's real width without touching the DOM.

let ctx: CanvasRenderingContext2D | null = null;
const cache = new Map<string, number>();

export function measureLabel(
  text: string,
  font = "500 12px Inter, system-ui, sans-serif",
): number {
  const key = `${font}|${text}`;
  const cached = cache.get(key);
  if (cached !== undefined) return cached;

  if (!ctx && typeof document !== "undefined") {
    ctx = document.createElement("canvas").getContext("2d");
  }
  // Fallback heuristic if canvas is unavailable (e.g. during SSR/tests).
  const width = ctx
    ? ((ctx.font = font), ctx.measureText(text).width)
    : text.length * 7;

  cache.set(key, width);
  return width;
}
