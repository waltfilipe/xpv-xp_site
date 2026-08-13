"use client";

import type { CompareMetric } from "@/lib/api";
import { CompareDualMetricTip } from "@/components/CompareDualMetricTip";
import { GradeBadge } from "@/components/ui/GradeBadge";
import { Tooltip } from "@/components/ui/Tooltip";
import {
  translatePassScoreTitle,
  translatePassScoreTooltip,
  useI18n,
} from "@/lib/i18n/context";

const COLOR_A = "#a78bfa";
const COLOR_B = "#34d399";
const MAX_SCORE = 10;
const SIZE = 420;
const CENTER = SIZE / 2;
const RADIUS = 98;
const LABEL_RADIUS = 142;

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

function labelLines(label: string): string[] {
  const words = label.split(" ");
  if (words.length >= 2 && label.length > 11) {
    const mid = Math.ceil(words.length / 2);
    return [words.slice(0, mid).join(" "), words.slice(mid).join(" ")];
  }
  return [label];
}

function labelAnchor(angle: number): "start" | "middle" | "end" {
  const cos = Math.cos(angle);
  if (Math.abs(cos) < 0.2) return "middle";
  return cos > 0 ? "start" : "end";
}

function labelOffset(angle: number): { dx: number; dy: number } {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const dx = Math.abs(cos) < 0.2 ? 0 : cos > 0 ? 6 : -6;
  const dy = sin > 0.35 ? 12 : sin < -0.35 ? -6 : 4;
  return { dx, dy };
}

export function CompareRadarChart({ metrics, nameA, nameB }: Props) {
  const { t } = useI18n();

  if (!metrics.length) return null;

  const count = metrics.length;
  const maxValue = Math.max(
    MAX_SCORE,
    ...metrics.flatMap((m) => [m.value_a ?? 0, m.value_b ?? 0]),
  );
  const gridLevels = [0.25, 0.5, 0.75, 1];

  return (
    <div className="compare-radar compare-radar-pro">
      <div className="compare-radar-frame">
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="compare-radar-svg"
          role="img"
          aria-label={t.compare.radarAria}
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

          <circle cx={CENTER} cy={CENTER} r={RADIUS + 20} fill="url(#compare-radar-bg)" />
          <circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS + 20}
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

          {metrics.map((metric, index) => {
            const angle = angleFor(index, count);
            const lx = CENTER + LABEL_RADIUS * Math.cos(angle);
            const ly = CENTER + LABEL_RADIUS * Math.sin(angle);
            const { dx, dy } = labelOffset(angle);
            const label = translatePassScoreTitle(metric.label, t);
            const lines = labelLines(label);
            const lineHeight = 11;
            const startDy = lines.length > 1 ? -(lineHeight * (lines.length - 1)) / 2 : 0;
            return (
              <text
                key={`label-${metric.key}`}
                x={lx + dx}
                y={ly + dy}
                textAnchor={labelAnchor(angle)}
                className="compare-radar-svg-label"
              >
                {lines.map((line, lineIndex) => (
                  <tspan
                    key={line}
                    x={lx + dx}
                    dy={lineIndex === 0 ? startDy : lineHeight}
                  >
                    {line}
                  </tspan>
                ))}
              </text>
            );
          })}
        </svg>
      </div>

      <table className="compare-radar-table">
        <thead>
          <tr>
            <th scope="col">{t.compare.metric}</th>
            <th scope="col" className="compare-radar-th-a">{nameA}</th>
            <th scope="col" className="compare-radar-th-b">{nameB}</th>
          </tr>
        </thead>
        <tbody>
          {metrics.map((metric) => {
            const label = translatePassScoreTitle(metric.label, t);
            const tip = metric.components?.length ? (
              <CompareDualMetricTip
                nameA={nameA}
                nameB={nameB}
                components={metric.components}
              />
            ) : (
              translatePassScoreTooltip(metric.label, t)
            );
            return (
              <tr key={metric.key} className="compare-radar-table-row">
                <td>
                  <Tooltip content={tip} block>
                    <span className="compare-radar-metric-label">{label}</span>
                  </Tooltip>
                </td>
                <td className="compare-radar-val-a">
                  <GradeBadge
                    letter={metric.letter_a}
                    displayScore={metric.score_a}
                    size="sm"
                  />
                </td>
                <td className="compare-radar-val-b">
                  <GradeBadge
                    letter={metric.letter_b}
                    displayScore={metric.score_b}
                    size="sm"
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

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
