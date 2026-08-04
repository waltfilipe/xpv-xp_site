"use client";

import type { CompareMetric } from "@/lib/api";

const COLOR_A = "#a78bfa";
const COLOR_B = "#86efac";
const MAX_SCORE = 10;
const SIZE = 280;
const CENTER = SIZE / 2;
const RADIUS = 98;
const LABEL_OFFSET = 22;

type Props = {
  metrics: CompareMetric[];
  nameA: string;
  nameB: string;
};

function pointAt(angle: number, value: number, maxValue: number) {
  const ratio = Math.max(0, Math.min(1, value / maxValue));
  const r = RADIUS * ratio;
  const x = CENTER + r * Math.cos(angle);
  const y = CENTER + r * Math.sin(angle);
  return { x, y };
}

function polygonPoints(metrics: CompareMetric[], side: "a" | "b", maxValue: number) {
  const count = metrics.length;
  return metrics
    .map((metric, index) => {
      const angle = (-Math.PI / 2) + (index * 2 * Math.PI) / count;
      const value = side === "a" ? (metric.value_a ?? 0) : (metric.value_b ?? 0);
      const { x, y } = pointAt(angle, value, maxValue);
      return `${x},${y}`;
    })
    .join(" ");
}

export function CompareRadarChart({ metrics, nameA, nameB }: Props) {
  if (!metrics.length) return null;

  const count = metrics.length;
  const maxValue = Math.max(
    MAX_SCORE,
    ...metrics.flatMap((m) => [m.value_a ?? 0, m.value_b ?? 0]),
  );

  const gridLevels = [0.25, 0.5, 0.75, 1];

  return (
    <div className="compare-radar">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="compare-radar-svg" role="img" aria-label="xP pillars radar comparison">
        {gridLevels.map((level) => (
          <polygon
            key={level}
            points={metrics
              .map((_, index) => {
                const angle = (-Math.PI / 2) + (index * 2 * Math.PI) / count;
                const { x, y } = pointAt(angle, maxValue * level, maxValue);
                return `${x},${y}`;
              })
              .join(" ")}
            fill="none"
            stroke="rgba(148, 163, 184, 0.16)"
            strokeWidth="1"
          />
        ))}

        {metrics.map((metric, index) => {
          const angle = (-Math.PI / 2) + (index * 2 * Math.PI) / count;
          const outer = pointAt(angle, maxValue, maxValue);
          return (
            <line
              key={metric.key}
              x1={CENTER}
              y1={CENTER}
              x2={outer.x}
              y2={outer.y}
              stroke="rgba(148, 163, 184, 0.14)"
              strokeWidth="1"
            />
          );
        })}

        <polygon
          points={polygonPoints(metrics, "b", maxValue)}
          fill={`${COLOR_B}22`}
          stroke={COLOR_B}
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <polygon
          points={polygonPoints(metrics, "a", maxValue)}
          fill={`${COLOR_A}22`}
          stroke={COLOR_A}
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {metrics.map((metric, index) => {
          const angle = (-Math.PI / 2) + (index * 2 * Math.PI) / count;
          const labelR = RADIUS + LABEL_OFFSET;
          const x = CENTER + labelR * Math.cos(angle);
          const y = CENTER + labelR * Math.sin(angle);
          const anchor = Math.abs(Math.cos(angle)) < 0.2 ? "middle" : x < CENTER ? "end" : "start";
          return (
            <text
              key={`${metric.key}-label`}
              x={x}
              y={y}
              textAnchor={anchor}
              dominantBaseline="middle"
              className="compare-radar-label"
            >
              {metric.label}
            </text>
          );
        })}
      </svg>

      <div className="compare-radar-legend">
        <span className="compare-legend-item compare-legend-a">
          <span className="compare-legend-dot" /> {nameA}
        </span>
        <span className="compare-legend-item compare-legend-b">
          <span className="compare-legend-dot" /> {nameB}
        </span>
      </div>
    </div>
  );
}
