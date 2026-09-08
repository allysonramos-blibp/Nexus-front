export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

export function DonutChart({
  data,
  size = 160,
  thickness = 22,
  centerLabel,
  centerValue,
}: {
  data: DonutSlice[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string;
}) {
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = data.reduce((s, d) => s + d.value, 0);

  let offset = 0;
  const segments = data
    .filter((d) => d.value > 0)
    .map((d) => {
      const fraction = total > 0 ? d.value / total : 0;
      const length = fraction * circumference;
      const dasharray = `${length} ${circumference - length}`;
      const dashoffset = -offset;
      offset += length;
      return { ...d, dasharray, dashoffset };
    });

  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--surface-raised)"
          strokeWidth={thickness}
        />
        {segments.map((s, i) => (
          <circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={s.color}
            strokeWidth={thickness}
            strokeDasharray={s.dasharray}
            strokeDashoffset={s.dashoffset}
            strokeLinecap="butt"
          />
        ))}
        {centerValue && (
          <g className="rotate-90" style={{ transformOrigin: "center" }}>
            <text
              x={size / 2}
              y={size / 2 - 4}
              textAnchor="middle"
              className="fill-foreground"
              style={{ fontSize: 15, fontWeight: 700 }}
            >
              {centerValue}
            </text>
            {centerLabel && (
              <text
                x={size / 2}
                y={size / 2 + 14}
                textAnchor="middle"
                className="fill-muted-foreground"
                style={{ fontSize: 10 }}
              >
                {centerLabel}
              </text>
            )}
          </g>
        )}
      </svg>
      <ul className="flex flex-col gap-1.5">
        {data.map((d, i) => (
          <li key={i} className="flex items-center gap-2 text-xs">
            <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: d.color }} />
            <span className="text-muted-foreground">{d.label}</span>
            <span className="ml-auto font-medium text-foreground">
              {total > 0 ? `${Math.round((d.value / total) * 100)}%` : "0%"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
