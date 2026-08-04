"use client";

import type { CompareMetric } from "@/lib/api";

const COLOR_A = "#a78bfa";
const COLOR_B = "#86efac";
const MAX_SCORE = 10;
const SIZE = 340;
const CENTER = SIZE / 2;
const RADIUS = 108;
const LABEL_RADIUS = 132;

type Props = {
  metrics: CompareMetric[];
  nameA: string;
  nameB: string;
};

function angleFor(index: number, count: number) {
  return (-Math.PI / 2) + (index * 2 * Math.PI) / count;
}

function pointAt(angle: number, value: number, maxValue: number) {
  const ratio = Math.max(0, Math.min(1, value / maxValue));
  const r = RADIUS * ratio;
  return {
    x: CENTER + r * Math.cos(angle),
    y: CENTER + r * Math.sin(angle),
  };
}

function polygonPoints(metrics: CompareMetric[], side: "a" | "b", maxValue: number) {
  return metrics
    .map((metric, index) => {
      const value = side === "a" ? (metric.value_a ?? 0) : (metric.value_b ?? 0);
      const { x, y } = pointAt(angleFor(index, metrics.length), value, maxValue);
      return `${x},${y}`;
    })
    .join(" ");
}

function formatValue(value: number | null | undefined) {
  return value != null ? value.toFixed(1) : "—";
}

export function CompareRadarChart({ metrics, nameA, nameB }: Props) {
  if (!metrics.length) return null;

  const count = metrics.length;
  const maxValue = Math.max(
    MAX_SCORE,
    ...metrics.flatMap((m) => [m.value_a ?? 0, m.value_b ?? 0]),
  );
  const gridLevels = [0.33, 0.66, 1];

  return (
    <div className="compare-radar compare-radar-pro">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="compare-radar-svg"
        role="img"
        aria-label="Pass profile radar comparison"
      >
        <defs>
          <radialGradient id="compare-radar-bg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(30, 41, 59, 0.35)" />
            <stop offset="100%" stopColor="rgba(15, 23, 42, 0)" />
          </radialGradient>
          <linearGradient id="compare-radar-fill-a" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={COLOR_A} stopOpacity="0.34" />
            <stop offset="100%" stopColor={COLOR_A} stopOpacity="0.08" />
          </linearGradient>
          <linearGradient id="compare-radar-fill-b" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={COLOR_B} stopOpacity="0.3" />
            <stop offset="100%" stopColor={COLOR_B} stopOpacity="0.06" />
          </linearGradient>
          <filter id="compare-radar-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <circle cx={CENTER} cy={CENTER} r={RADIUS + 18} fill="url(#compare-radar-bg)" />

        {gridLevels.map((level) => (
          <polygon
            key={level}
            points={metrics
              .map((_, index) => {
                const { x, y } = pointAt(angleFor(index, count), maxValue * level, maxValue);
                return `${x},${y}`;
              })
              .join(" ")}
            fill="none"
            stroke="rgba(148, 163, 184, 0.1)"
            strokeWidth={level === 1 ? 1.2 : 0.8}
          />
        ))}

        {metrics.map((metric, index) => {
          const angle = angleFor(index, count);
          const outer = pointAt(angle, maxValue, maxValue);
          return (
            <line
              key={`axis-${metric.key}`}
              x1={CENTER}
              y1={CENTER}
              x2={outer.x}
              y2={outer.y}
              stroke="rgba(148, 163, 184, 0.12)"
              strokeWidth="1"
            />
          );
        })}

        <polygon
          points={polygonPoints(metrics, "b", maxValue)}
          fill="url(#compare-radar-fill-b)"
          stroke={COLOR_B}
          strokeWidth="1.5"
          strokeLinejoin="round"
          opacity="0.95"
        />
        <polygon
          points={polygonPoints(metrics, "a", maxValue)}
          fill="url(#compare-radar-fill-a)"
          stroke={COLOR_A}
          strokeWidth="1.5"
          strokeLinejoin="round"
          opacity="0.95"
          filter="url(#compare-radar-glow)"
        />

        {metrics.flatMap((metric, index) => {
          const angle = angleFor(index, count);
          const valA = metric.value_a ?? 0;
          const valB = metric.value_b ?? 0;
          const ptA = pointAt(angle, valA, maxValue);
          const ptB = pointAt(angle, valB, maxValue);
          return [
            <circle key={`${metric.key}-b`} cx={ptB.x} cy={ptB.y} r="3.2" fill={COLOR_B} stroke="#0f172a" strokeWidth="1.2" />,
            <circle key={`${metric.key}-a`} cx={ptA.x} cy={ptA.y} r="3.2" fill={COLOR_A} stroke="#0f172a" strokeWidth="1.2" />,
          ];
        })}

        {metrics.map((metric, index) => {
          const angle = angleFor(index, count);
          const x = CENTER + LABEL_RADIUS * Math.cos(angle);
          const y = CENTER + LABEL_RADIUS * Math.sin(angle);
          const anchor = Math.abs(Math.cos(angle)) < 0.25 ? "middle" : x < CENTER ? "end" : "start";
          const dy = Math.sin(angle) > 0.6 ? 10 : Math.sin(angle) < -0.6 ? -2 : 4;
          return (
            <g key={`${metric.key}-label`}>
              <text
                x={x}
                y={y - 5}
                textAnchor={anchor}
                dominantBaseline="middle"
                className="compare-radar-label"
              >
                {metric.label}
              </text>
              <text
                x={x}
                y={y + dy}
                textAnchor={anchor}
                dominantBaseline="middle"
                className="compare-radar-scores"
              >
                <tspan fill={COLOR_A}>{formatValue(metric.value_a)}</tspan>
                <tspan fill="rgba(148, 163, 184, 0.7)"> · </tspan>
                <tspan fill={COLOR_B}>{formatValue(metric.value_b)}</tspan>
              </text>
            </g>
          );
        })}
      </svg>

      <div className="compare-radar-legend compare-radar-legend-pro">
        <span className="compare-legend-item compare-legend-a">
          <span className="compare-legend-dot" />
          <span className="compare-legend-name">{nameA}</span>
        </span>
        <span className="compare-legend-item compare-legend-b">
          <span className="compare-legend-dot" />
          <span className="compare-legend-name">{nameB}</span>
        </span>
      </div>
    </div>
  );
}
