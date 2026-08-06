"use client";

import type { XpRoundGrade } from "@/lib/api";
import { passGradeGradientColor, passGradePct } from "@/lib/gradeColors";

type Props = {
  point: XpRoundGrade;
  accent?: string;
  layout?: "tooltip" | "modal";
};

function formatPct(value?: number | null): string {
  if (value == null || Number.isNaN(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

function effTone(value?: number | null): "pos" | "neg" | "neutral" {
  if (value == null || Number.isNaN(value)) return "neutral";
  if (value > 0.05) return "pos";
  if (value < -0.05) return "neg";
  return "neutral";
}

type StatRow = {
  key: string;
  label: string;
  value: string;
  tone?: "grade" | "pos" | "neg" | "neutral" | "accent";
  grade?: number | null;
};

function buildRows(point: XpRoundGrade): StatRow[] {
  return [
    {
      key: "grade",
      label: "Grade",
      value: point.grade != null ? point.grade.toFixed(1) : "—",
      tone: "grade",
      grade: point.grade,
    },
    { key: "passes", label: "Passes", value: point.passes != null ? String(point.passes) : "—", tone: "accent" },
    {
      key: "short",
      label: "% eff pass curto",
      value: formatPct(point.short_pass_eff_pct),
      tone: effTone(point.short_pass_eff_pct),
    },
    {
      key: "long",
      label: "% eff pass longo",
      value: formatPct(point.long_pass_eff_pct),
      tone: effTone(point.long_pass_eff_pct),
    },
    {
      key: "breakline",
      label: "Breakline passes",
      value: point.breakline_passes != null ? String(point.breakline_passes) : "—",
      tone: "neutral",
    },
    {
      key: "impact",
      label: "Impact passes",
      value: point.impact != null ? String(point.impact) : "—",
      tone: "accent",
    },
    {
      key: "key",
      label: "Key passes",
      value: point.key_passes != null ? String(point.key_passes) : "—",
      tone: "neutral",
    },
  ];
}

function rowValueStyle(row: StatRow): React.CSSProperties | undefined {
  if (row.tone === "grade" && row.grade != null) {
    const color = passGradeGradientColor(passGradePct(row.grade));
    return { color, textShadow: `0 0 12px ${color}55` };
  }
  return undefined;
}

export function RoundGradeStatsPanel({ point, accent = "#a78bfa", layout = "tooltip" }: Props) {
  const header = `R${point.round}${point.opponent ? ` vs ${point.opponent}` : ""}`;
  const rows = buildRows(point);
  const listClass = layout === "modal" ? "round-grade-stats-list round-grade-stats-list-modal" : "round-grade-stats-list";

  return (
    <div
      className={`round-grade-stats round-grade-stats--${layout}`}
      style={{ "--stats-accent": accent } as React.CSSProperties}
    >
      <div className="round-grade-stats-head tabular">{header}</div>
      <ul className={listClass}>
        {rows.map((row) => (
          <li
            key={row.key}
            className={`round-grade-stats-row round-grade-stats-row--${row.tone ?? "neutral"}`}
          >
            <span className="round-grade-stats-label">{row.label}</span>
            <span className="round-grade-stats-value tabular" style={rowValueStyle(row)}>
              {row.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
