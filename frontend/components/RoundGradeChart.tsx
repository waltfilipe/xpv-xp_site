"use client";

import { useId, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import type { XpRoundGrade } from "@/lib/api";
import { passGradeGradientColor, passGradePct } from "@/lib/gradeColors";

const WIDTH = 280;
const HEIGHT = 58;
const PAD_X = 8;
const PAD_Y = 6;
const DOT_R = 1.25;
const HIT_R = 6;

type Props = {
  points: XpRoundGrade[];
  accent?: string;
  embedded?: boolean;
  tier?: string | null;
  onPointClick?: (point: XpRoundGrade) => void;
};

type ChartCoord = {
  x: number;
  y: number;
  grade: number;
  round: number;
  opponent?: string | null;
  point: XpRoundGrade;
};

type ActiveCoord = ChartCoord & {
  tipX: number;
  tipY: number;
};

function formatPct(value?: number | null): string {
  if (value == null || Number.isNaN(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

function RoundGradeTooltip({ point }: { point: XpRoundGrade }) {
  const header = `R${point.round}${point.opponent ? ` vs ${point.opponent}` : ""}`;
  const rows: { label: string; value: string }[] = [
    { label: "Grade", value: point.grade != null ? point.grade.toFixed(1) : "—" },
    { label: "Passes", value: point.passes != null ? String(point.passes) : "—" },
    { label: "% eff pass curto", value: formatPct(point.short_pass_eff_pct) },
    { label: "% eff pass longo", value: formatPct(point.long_pass_eff_pct) },
    { label: "Breakline passes", value: point.breakline_passes != null ? String(point.breakline_passes) : "—" },
    { label: "Impact passes", value: point.impact != null ? String(point.impact) : "—" },
    { label: "Key passes", value: point.key_passes != null ? String(point.key_passes) : "—" },
  ];

  return (
    <div className="round-grade-tooltip">
      <div className="round-grade-tooltip-head tabular">{header}</div>
      <ul className="round-grade-tooltip-list">
        {rows.map((row) => (
          <li key={row.label} className="round-grade-tooltip-row">
            <span className="round-grade-tooltip-label">{row.label}</span>
            <span className="round-grade-tooltip-value tabular">{row.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function RoundGradeChart({ points, accent = "#a78bfa", embedded = false, onPointClick }: Props) {
  const gradId = useId().replace(/:/g, "");
  const [active, setActive] = useState<ActiveCoord | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const data = points.filter((p) => p.grade != null);
  if (data.length < 2) return null;

  const grades = data.map((p) => p.grade as number);
  const minG = Math.max(4, Math.min(...grades) - 0.4);
  const maxG = Math.min(9.5, Math.max(...grades) + 0.4);
  const span = maxG - minG || 1;
  const innerW = WIDTH - PAD_X * 2;
  const innerH = HEIGHT - PAD_Y * 2;

  const setActiveFromEvent = (coord: ChartCoord, target: SVGCircleElement) => {
    const rect = target.getBoundingClientRect();
    setActive({
      ...coord,
      tipX: rect.left + rect.width / 2,
      tipY: rect.top,
    });
  };

  const coords: ChartCoord[] = data.map((point, i) => {
    const x = PAD_X + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
    const grade = point.grade as number;
    const y = PAD_Y + innerH - ((grade - minG) / span) * innerH;
    return { x, y, grade, round: point.round, opponent: point.opponent, point };
  });

  const linePath = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L ${coords[coords.length - 1].x.toFixed(1)} ${(PAD_Y + innerH).toFixed(1)} L ${coords[0].x.toFixed(1)} ${(PAD_Y + innerH).toFixed(1)} Z`;

  const tooltip =
    active && mounted
      ? createPortal(
          <div
            className="round-grade-tooltip-portal"
            style={{ left: active.tipX, top: active.tipY }}
          >
            <RoundGradeTooltip point={active.point} />
          </div>,
          document.body,
        )
      : null;

  return (
    <div className={`round-grade-chart${embedded ? " round-grade-chart-embedded" : ""}`}>
      {!embedded && (
        <div className="round-grade-chart-head">
          <span className="round-grade-chart-title">Grades por rodada</span>
        </div>
      )}

      <div className="round-grade-chart-body">
        <div className="round-grade-chart-wrap">
          <svg
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            className="round-grade-chart-svg"
            role="img"
            aria-label="Grades por rodada"
            onMouseLeave={() => setActive(null)}
          >
          <defs>
            <linearGradient id={`round-grade-fill-${gradId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accent} stopOpacity={embedded ? 0.12 : 0.22} />
              <stop offset="100%" stopColor={accent} stopOpacity="0" />
            </linearGradient>
          </defs>

          {[0.25, 0.5, 0.75].map((level) => {
            const y = PAD_Y + innerH * (1 - level);
            return (
              <line
                key={level}
                x1={PAD_X}
                y1={y}
                x2={WIDTH - PAD_X}
                y2={y}
                stroke="rgba(148, 163, 184, 0.05)"
                strokeWidth="1"
              />
            );
          })}

          <path d={areaPath} fill={`url(#round-grade-fill-${gradId})`} />
          <path
            d={linePath}
            fill="none"
            stroke={accent}
            strokeWidth="1.2"
            strokeLinejoin="round"
            strokeLinecap="round"
            opacity={0.9}
          />

          {coords.map((c) => {
            const color = passGradeGradientColor(passGradePct(c.grade));
            return (
              <g key={c.round}>
                <circle
                  cx={c.x}
                  cy={c.y}
                  r={HIT_R}
                  fill="transparent"
                  className="round-grade-hit"
                  onMouseEnter={(e) => setActiveFromEvent(c, e.currentTarget)}
                  onFocus={(e) => setActiveFromEvent(c, e.currentTarget)}
                  onClick={() => onPointClick?.(c.point)}
                />
                <circle
                  cx={c.x}
                  cy={c.y}
                  r={DOT_R}
                  fill={color}
                  stroke="#0f172a"
                  strokeWidth="0.5"
                  pointerEvents="none"
                />
              </g>
            );
          })}
          </svg>
        </div>
      </div>
      {tooltip}
    </div>
  );
}
