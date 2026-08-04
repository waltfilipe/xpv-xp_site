import type { XpRoundGrade } from "@/lib/api";
import { passGradeGradientColor, passGradePct } from "@/lib/gradeColors";

const WIDTH = 280;
const HEIGHT = 72;
const PAD_X = 8;
const PAD_Y = 10;

type Props = {
  points: XpRoundGrade[];
  accent?: string;
};

export function RoundGradeChart({ points, accent = "#a78bfa" }: Props) {
  const data = points.filter((p) => p.grade != null);
  if (data.length < 2) return null;

  const grades = data.map((p) => p.grade as number);
  const minG = Math.max(4, Math.min(...grades) - 0.4);
  const maxG = Math.min(9.5, Math.max(...grades) + 0.4);
  const span = maxG - minG || 1;
  const innerW = WIDTH - PAD_X * 2;
  const innerH = HEIGHT - PAD_Y * 2;

  const coords = data.map((point, i) => {
    const x = PAD_X + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
    const grade = point.grade as number;
    const y = PAD_Y + innerH - ((grade - minG) / span) * innerH;
    return { x, y, grade, round: point.round };
  });

  const linePath = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L ${coords[coords.length - 1].x.toFixed(1)} ${(PAD_Y + innerH).toFixed(1)} L ${coords[0].x.toFixed(1)} ${(PAD_Y + innerH).toFixed(1)} Z`;

  return (
    <div className="round-grade-chart">
      <div className="round-grade-chart-head">
        <span className="round-grade-chart-title">Grades por rodada</span>
        <span className="round-grade-chart-range tabular muted">
          {minG.toFixed(1)}–{maxG.toFixed(1)}
        </span>
      </div>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="round-grade-chart-svg" role="img" aria-label="Grades por rodada">
        <defs>
          <linearGradient id="round-grade-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accent} stopOpacity="0.22" />
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
              stroke="rgba(148, 163, 184, 0.08)"
              strokeWidth="1"
            />
          );
        })}
        <path d={areaPath} fill="url(#round-grade-fill)" />
        <path
          d={linePath}
          fill="none"
          stroke={accent}
          strokeWidth="1.6"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {coords.map((c) => {
          const color = passGradeGradientColor(passGradePct(c.grade));
          return (
            <circle
              key={c.round}
              cx={c.x}
              cy={c.y}
              r="2.6"
              fill={color}
              stroke="#0f172a"
              strokeWidth="1"
            />
          );
        })}
      </svg>
    </div>
  );
}
