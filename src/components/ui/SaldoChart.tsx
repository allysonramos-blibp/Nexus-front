export interface SaldoPonto {
  dia: number;
  saldo: number;
}

export function SaldoChart({
  pontos,
  indiceHoje,
  height = 96,
  color = "var(--fin)",
}: {
  pontos: SaldoPonto[];
  /** Índice em `pontos` até onde a linha é "realizado" (sólida); depois disso é projeção (tracejada). */
  indiceHoje: number;
  height?: number;
  color?: string;
}) {
  if (pontos.length < 2) return null;

  const width = 100; // viewBox percentual — escala com o container via preserveAspectRatio
  const values = pontos.map((p) => p.saldo);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 0);
  const range = max - min || 1;

  const coords = pontos.map((p, i) => ({
    x: (i / (pontos.length - 1)) * width,
    y: height - ((p.saldo - min) / range) * (height - 16) - 8,
  }));

  const toPath = (pts: typeof coords) => pts.map((c) => `${c.x},${c.y}`).join(" ");
  const clampedIndex = Math.min(indiceHoje, coords.length - 1);
  const realizado = clampedIndex >= 0 ? coords.slice(0, clampedIndex + 1) : [];
  const projecao = clampedIndex >= 0 ? coords.slice(clampedIndex) : coords;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="h-full w-full"
      role="img"
      aria-label="Gráfico de saldo ao longo do mês, realizado e projetado"
    >
      {realizado.length > 1 && (
        <polyline points={toPath(realizado)} fill="none" stroke={color} strokeWidth={2} />
      )}
      {projecao.length > 1 && (
        <polyline
          points={toPath(projecao)}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeDasharray="4 3"
          opacity={0.6}
        />
      )}
      {clampedIndex >= 0 && coords[clampedIndex] && (
        <circle cx={coords[clampedIndex].x} cy={coords[clampedIndex].y} r={2.5} fill={color} />
      )}
    </svg>
  );
}
