"use client";

import { useId, useState } from "react";
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

type Coord = {
  x: number;
  y: number;
  grade: number;
  round: number;
  opponent?: string | null;
  point: XpRoundGrade;
};

export function RoundGradeChart({ points, accent = "#a78bfa", embedded = false, onPointClick }: Props) {
  const gradId = useId().replace(/:/g, "");
  const [active, setActive] = useState<Coord | null>(null);

  const data = points.filter((p) => p.grade != null);
  if (data.length < 2) return null;

  const grades = data.map((p) => p.grade as number);
  const minG = Math.max(4, Math.min(...grades) - 0.4);
  const maxG = Math.min(9.5, Math.max(...grades) + 0.4);
  const span = maxG - minG || 1;
  const innerW = WIDTH - PAD_X * 2;
  const innerH = HEIGHT - PAD_Y * 2;

  const coords: Coord[] = data.map((point, i) => {
    const x = PAD_X + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
    const grade = point.grade as number;
    const y = PAD_Y + innerH - ((grade - minG) / span) * innerH;
    return { x, y, grade, round: point.round, opponent: point.opponent, point };
  });

  const linePath = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L ${coords[coords.length - 1].x.toFixed(1)} ${(PAD_Y + innerH).toFixed(1)} L ${coords[0].x.toFixed(1)} ${(PAD_Y + innerH).toFixed(1)} Z`;

  const tipLeft = active ? `${(active.x / WIDTH) * 100}%` : "0%";
  const tipLabel = active
    ? `R${active.round} · ${active.grade.toFixed(1)}${active.opponent ? ` vs ${active.opponent}` : ""}`
    : "";

  return (
    <div className={`round-grade-chart${embedded ? " round-grade-chart-embedded" : ""}`}>
      {!embedded && (
        <div className="round-grade-chart-head">
          <span className="round-grade-chart-title">Grades por rodada</span>
        </div>
      )}

      <div className="round-grade-chart-wrap">
        {active && (
          <div className="round-grade-tooltip tabular" style={{ left: tipLeft }}>
            {tipLabel}
          </div>
        )}

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
                  onMouseEnter={() => setActive(c)}
                  onFocus={() => setActive(c)}
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
  );
}
