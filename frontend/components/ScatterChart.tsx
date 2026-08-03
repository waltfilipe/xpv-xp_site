"use client";

import type { ScatterPoint } from "@/lib/api";

type Props = {
  points: ScatterPoint[];
  xLabel: string;
  yLabel: string;
  means: { x: number; y: number };
};

const W = 640;
const H = 420;
const PAD = 48;

export function ScatterChart({ points, xLabel, yLabel, means }: Props) {
  if (!points.length) return <p className="muted">Sem dados para scatter.</p>;

  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yMin = Math.min(...ys);
  const yMax = Math.max(...ys);
  const xSpan = xMax - xMin || 1;
  const ySpan = yMax - yMin || 1;

  const sx = (x: number) => PAD + ((x - xMin) / xSpan) * (W - PAD * 2);
  const sy = (y: number) => H - PAD - ((y - yMin) / ySpan) * (H - PAD * 2);

  return (
    <div className="scatter-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} className="scatter-svg" role="img" aria-label={`Scatter ${xLabel} vs ${yLabel}`}>
        <line x1={PAD} y1={sy(means.y)} x2={W - PAD} y2={sy(means.y)} stroke="rgba(251,191,36,0.3)" />
        <line x1={sx(means.x)} y1={PAD} x2={sx(means.x)} y2={H - PAD} stroke="rgba(251,191,36,0.3)" />
        {points.map((p) => (
          <circle
            key={p.player_id}
            cx={sx(p.x)}
            cy={sy(p.y)}
            r={p.highlight ? 7 : 4}
            fill={p.highlight ? "#fbbf24" : "rgba(168,85,247,0.85)"}
            stroke={p.highlight ? "#f59e0b" : "#581c87"}
            strokeWidth={p.highlight ? 2 : 0.8}
          >
            <title>{`${p.player_name} (${p.team})\n${xLabel}: ${p.x.toFixed(2)}\n${yLabel}: ${p.y.toFixed(2)}`}</title>
          </circle>
        ))}
        <text x={W / 2} y={H - 8} textAnchor="middle" className="scatter-axis-label">{xLabel}</text>
        <text x={14} y={H / 2} textAnchor="middle" transform={`rotate(-90 14 ${H / 2})`} className="scatter-axis-label">{yLabel}</text>
      </svg>
      <p className="muted scatter-caption">{points.length} jogadores · linhas douradas = média</p>
    </div>
  );
}
