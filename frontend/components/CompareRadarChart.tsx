"use client";

import type { CompareMetric } from "@/lib/api";
import { Tooltip } from "@/components/ui/Tooltip";

const COLOR_A = "#a78bfa";
const COLOR_B = "#34d399";
const MAX_SCORE = 10;
const SIZE = 420;
const CENTER = SIZE / 2;
const RADIUS = 108;

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

function labelPosition(index: number, count: number) {
  const angle = angleFor(index, count);
  const pct = 54;
  return {
    left: 50 + pct * Math.cos(angle),
    top: 50 + pct * Math.sin(angle),
    textAlign: (Math.abs(Math.cos(angle)) < 0.15
      ? "center"
      : Math.cos(angle) < 0
        ? "right"
        : "left") as "center" | "right" | "left",
  };
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
    <div className="compare-radar compare-radar-pro">
      <div className="compare-radar-frame compare-radar-frame-labeled">
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="compare-radar-svg"
          role="img"
          aria-label="Pass profile radar comparison"
        >
          <defs>
            <radialGradient id="compare-radar-bg" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(30, 41, 59, 0.55)" />
              <stop offset="72%" stopColor="rgba(15, 23, 42, 0.2)" />
              <stop offset="100%" stopColor="rgba(15, 23, 42, 0)" />
            </radialGradient>
            <linearGradient id="compare-radar-fill-a" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={COLOR_A} stopOpacity="0.38" />
              <stop offset="100%" stopColor={COLOR_A} stopOpacity="0.06" />
            </linearGradient>
            <linearGradient id="compare-radar-fill-b" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={COLOR_B} stopOpacity="0.32" />
              <stop offset="100%" stopColor={COLOR_B} stopOpacity="0.05" />
            </linearGradient>
            <filter id="compare-radar-glow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <circle cx={CENTER} cy={CENTER} r={RADIUS + 22} fill="url(#compare-radar-bg)" />
          <circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS + 22}
            fill="none"
            stroke="rgba(148, 163, 184, 0.1)"
            strokeWidth="1"
          />

          {gridLevels.map((level) => (
            <polygon
              key={level}
              points={metrics
                .map((_, index) => {
                  const { x, y } = pointAt(angleFor(index, count), maxValue * level, maxValue);
                  return `${x},${y}`;
                })
                .join(" ")}
              fill={level === 1 ? "rgba(15, 23, 42, 0.25)" : "none"}
              stroke={level === 1 ? "rgba(148, 163, 184, 0.22)" : "rgba(148, 163, 184, 0.08)"}
              strokeWidth={level === 1 ? 1.2 : 0.7}
              strokeDasharray={level < 1 ? "3 4" : undefined}
            />
          ))}

          {metrics.map((metric, index) => {
            const angle = angleFor(index, count);
            const outer = pointAt(angle, maxValue, maxValue);
            const inner = pointAt(angle, maxValue * 0.08, maxValue);
            return (
              <line
                key={`axis-${metric.key}`}
                x1={inner.x}
                y1={inner.y}
                x2={outer.x}
                y2={outer.y}
                stroke="rgba(148, 163, 184, 0.14)"
                strokeWidth="1"
              />
            );
          })}

          <polygon
            points={polygonPoints(metrics, "b", maxValue)}
            fill="url(#compare-radar-fill-b)"
            stroke={COLOR_B}
            strokeWidth="1.6"
            strokeLinejoin="round"
            opacity="0.92"
          />
          <polygon
            points={polygonPoints(metrics, "a", maxValue)}
            fill="url(#compare-radar-fill-a)"
            stroke={COLOR_A}
            strokeWidth="1.6"
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
              <circle key={`${metric.key}-b`} cx={ptB.x} cy={ptB.y} r="3.5" fill={COLOR_B} stroke="#0f172a" strokeWidth="1.3" />,
              <circle key={`${metric.key}-a`} cx={ptA.x} cy={ptA.y} r="3.5" fill={COLOR_A} stroke="#0f172a" strokeWidth="1.3" />,
            ];
          })}
        </svg>

        <div className="compare-radar-label-layer" aria-hidden="false">
          {metrics.map((metric, index) => {
            const pos = labelPosition(index, count);
            const tip = `${nameA}: ${formatValue(metric.value_a)} · ${nameB}: ${formatValue(metric.value_b)}`;
            return (
              <Tooltip key={metric.key} content={tip}>
                <div
                  className="compare-radar-label-node"
                  style={{
                    left: `${pos.left}%`,
                    top: `${pos.top}%`,
                    textAlign: pos.textAlign,
                  }}
                >
                  <span className="compare-radar-label-text">{metric.label}</span>
                  <span className="compare-radar-score-line">
                    <span className="compare-radar-score-a">{formatValue(metric.value_a)}</span>
                    <span className="compare-radar-score-sep">·</span>
                    <span className="compare-radar-score-b">{formatValue(metric.value_b)}</span>
                  </span>
                </div>
              </Tooltip>
            );
          })}
        </div>
      </div>

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
