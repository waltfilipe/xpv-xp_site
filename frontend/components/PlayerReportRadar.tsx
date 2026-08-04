import type { PassScoreSection } from "@/lib/api";

const MAX_SCORE = 10;
const SIZE = 300;
const CENTER = SIZE / 2;
const RADIUS = 96;
const LABEL_RADIUS = 118;

type Props = {
  sections: PassScoreSection[];
  accent: string;
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

function polygonPoints(sections: PassScoreSection[], maxValue: number) {
  return sections
    .map((section, index) => {
      const value = section.display_score ?? 0;
      const { x, y } = pointAt(angleFor(index, sections.length), value, maxValue);
      return `${x},${y}`;
    })
    .join(" ");
}

export function PlayerReportRadar({ sections, accent }: Props) {
  const metrics = sections.filter((s) => s.display_score != null);
  if (!metrics.length) return null;

  const count = metrics.length;
  const maxValue = Math.max(MAX_SCORE, ...metrics.map((m) => m.display_score ?? 0));
  const gridLevels = [0.33, 0.66, 1];
  const gradId = `report-radar-fill-${accent.replace("#", "")}`;

  return (
    <div className="report-radar">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="report-radar-svg"
        role="img"
        aria-label="Pass profile radar"
      >
        <defs>
          <radialGradient id="report-radar-bg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(30, 41, 59, 0.35)" />
            <stop offset="100%" stopColor="rgba(15, 23, 42, 0)" />
          </radialGradient>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={accent} stopOpacity="0.34" />
            <stop offset="100%" stopColor={accent} stopOpacity="0.08" />
          </linearGradient>
        </defs>

        <circle cx={CENTER} cy={CENTER} r={RADIUS + 16} fill="url(#report-radar-bg)" />

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
              key={`axis-${metric.title}`}
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
          points={polygonPoints(metrics, maxValue)}
          fill={`url(#${gradId})`}
          stroke={accent}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        {metrics.map((metric, index) => {
          const angle = angleFor(index, count);
          const val = metric.display_score ?? 0;
          const pt = pointAt(angle, val, maxValue);
          return (
            <circle
              key={`dot-${metric.title}`}
              cx={pt.x}
              cy={pt.y}
              r="3.2"
              fill={accent}
              stroke="#0f172a"
              strokeWidth="1.2"
            />
          );
        })}

        {metrics.map((metric, index) => {
          const angle = angleFor(index, count);
          const x = CENTER + LABEL_RADIUS * Math.cos(angle);
          const y = CENTER + LABEL_RADIUS * Math.sin(angle);
          const anchor = Math.abs(Math.cos(angle)) < 0.25 ? "middle" : x < CENTER ? "end" : "start";
          const dy = Math.sin(angle) > 0.6 ? 10 : Math.sin(angle) < -0.6 ? -2 : 4;
          return (
            <g key={`label-${metric.title}`}>
              <text
                x={x}
                y={y - 5}
                textAnchor={anchor}
                dominantBaseline="middle"
                className="report-radar-label"
              >
                {metric.title}
              </text>
              <text
                x={x}
                y={y + dy}
                textAnchor={anchor}
                dominantBaseline="middle"
                className="report-radar-score tabular"
                fill={accent}
              >
                {(metric.display_score ?? 0).toFixed(1)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
