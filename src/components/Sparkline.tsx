interface SparklineProps {
  /** Series of values (e.g. cumulative spend per day). */
  values: number[];
  width?: number;
  height?: number;
  color?: string;
  /** Optional projected end value, drawn as a faint dashed continuation. */
  projected?: number;
}

/**
 * Tiny inline area+line sparkline (no deps). Scales the series to the box and
 * fills a subtle gradient under the line — matches the neon-on-dark aesthetic.
 */
export function Sparkline({
  values,
  width = 220,
  height = 44,
  color = "#a3d94a",
  projected,
}: SparklineProps) {
  if (values.length === 0) return null;

  const pad = 3;
  const allValues = projected != null ? [...values, projected] : values;
  const max = Math.max(...allValues, 1);
  const min = Math.min(...allValues, 0);
  const span = max - min || 1;

  const n = values.length;
  const x = (i: number, total = n) =>
    total <= 1 ? width / 2 : pad + (i / (total - 1)) * (width - pad * 2);
  const y = (v: number) =>
    height - pad - ((v - min) / span) * (height - pad * 2);

  const pts = values.map((v, i) => `${x(i)},${y(v)}`);
  const line = `M ${pts.join(" L ")}`;
  const area = `${line} L ${x(n - 1)},${height - pad} L ${x(0)},${height - pad} Z`;

  // Dashed continuation from the last real point to the projected month-end.
  const projLine =
    projected != null && n >= 1
      ? `M ${x(n - 1)},${y(values[n - 1])} L ${width - pad},${y(projected)}`
      : null;

  const gid = "spark-fill";

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible"
      aria-hidden
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.28} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
      {projLine && (
        <path
          d={projLine}
          fill="none"
          stroke={color}
          strokeWidth={1.2}
          strokeOpacity={0.5}
          strokeDasharray="3 3"
        />
      )}
      {/* Highlight the latest real point. */}
      <circle cx={x(n - 1)} cy={y(values[n - 1])} r={2.2} fill={color} />
    </svg>
  );
}
