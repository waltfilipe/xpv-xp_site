"use client";

import type { CSSProperties } from "react";
import type { XpRoundGrade } from "@/lib/api";
import { passGradeGradientColor, passGradePct } from "@/lib/gradeColors";

type Props = {
  point: XpRoundGrade;
  accent?: string;
  layout?: "tooltip" | "modal";
};

type RowTone = "grade" | "eff" | "count" | "neutral";

type StatRow = {
  key: string;
  label: string;
  value: string;
  tone: RowTone;
  grade?: number | null;
  effPct?: number | null;
};

function formatPct(value?: number | null): string {
  if (value == null || Number.isNaN(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

function coeToPseudoGrade(coePct: number): number {
  return Math.max(4.5, Math.min(9, 6.5 + coePct * 0.35));
}

function qualityRowStyle(tone: RowTone, grade?: number | null, effPct?: number | null): CSSProperties {
  let pct: number | null = null;
  if (tone === "grade" && grade != null) {
    pct = passGradePct(grade);
  } else if (tone === "eff" && effPct != null) {
    pct = passGradePct(coeToPseudoGrade(effPct));
  }
  if (pct == null) {
    return {
      background: "linear-gradient(135deg, rgba(30, 41, 59, 0.42) 0%, rgba(15, 23, 42, 0.55) 100%)",
      borderColor: "rgba(148, 163, 184, 0.12)",
    };
  }
  const color = passGradeGradientColor(pct);
  return {
    background: `linear-gradient(135deg, ${color}24 0%, rgba(15, 23, 42, 0.52) 100%)`,
    borderColor: `${color}40`,
  };
}

function valueStyle(tone: RowTone, grade?: number | null, effPct?: number | null): CSSProperties | undefined {
  if (tone === "grade" && grade != null) {
    const color = passGradeGradientColor(passGradePct(grade));
    return { color, textShadow: `0 0 10px ${color}44` };
  }
  if (tone === "eff" && effPct != null) {
    const color = passGradeGradientColor(passGradePct(coeToPseudoGrade(effPct)));
    return { color };
  }
  return undefined;
}

function buildRows(point: XpRoundGrade): StatRow[] {
  return [
    {
      key: "grade",
      label: "Grade",
      value: point.grade != null ? point.grade.toFixed(1) : "—",
      tone: "grade",
      grade: point.grade,
    },
    {
      key: "passes",
      label: "Passes",
      value: point.passes != null ? String(point.passes) : "—",
      tone: "count",
    },
    {
      key: "short",
      label: "% eff pass curto",
      value: formatPct(point.short_pass_eff_pct),
      tone: "eff",
      effPct: point.short_pass_eff_pct,
    },
    {
      key: "long",
      label: "% eff pass longo",
      value: formatPct(point.long_pass_eff_pct),
      tone: "eff",
      effPct: point.long_pass_eff_pct,
    },
    {
      key: "breakline",
      label: "Breakline passes",
      value: point.breakline_passes != null ? String(point.breakline_passes) : "—",
      tone: "count",
    },
    {
      key: "impact",
      label: "Impact passes",
      value: point.impact != null ? String(point.impact) : "—",
      tone: "count",
    },
    {
      key: "key",
      label: "Key passes",
      value: point.key_passes != null ? String(point.key_passes) : "—",
      tone: "count",
    },
  ];
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
            className="round-grade-stats-row"
            style={qualityRowStyle(row.tone, row.grade, row.effPct)}
          >
            <span className="round-grade-stats-label">{row.label}</span>
            <span
              className="round-grade-stats-value tabular"
              style={valueStyle(row.tone, row.grade, row.effPct)}
            >
              {row.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
