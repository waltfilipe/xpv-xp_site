"use client";

import type { XpRoundGrade } from "@/lib/api";
import { passGradeGradientColor, passGradePct } from "@/lib/gradeColors";
import { useI18n } from "@/lib/i18n/context";

type Props = {
  point: XpRoundGrade;
  accent?: string;
  layout?: "tooltip" | "modal";
};

type RowTone = "grade" | "eff" | "count";

type StatRow = {
  key: string;
  label: string;
  value: string;
  tone: RowTone;
  grade?: number | null;
  effPct?: number | null;
  countValue?: number | null;
};

const COUNT_GRADE_CAPS: Record<string, { min: number; max: number }> = {
  passes: { min: 12, max: 75 },
  breakline: { min: 0, max: 5 },
  impact: { min: 0, max: 3 },
  key: { min: 0, max: 2 },
};

function formatPct(value?: number | null): string {
  if (value == null || Number.isNaN(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

function coeToPseudoGrade(coePct: number): number {
  return Math.max(4.5, Math.min(9, 6.5 + coePct * 0.35));
}

function countToPseudoGrade(key: string, value: number): number {
  const caps = COUNT_GRADE_CAPS[key];
  if (!caps || caps.max <= caps.min) return 6;
  const t = Math.max(0, Math.min(1, (value - caps.min) / (caps.max - caps.min)));
  return 4.5 + t * 4.5;
}

function rowPseudoGrade(row: StatRow): number | null {
  if (row.tone === "grade" && row.grade != null) return row.grade;
  if (row.tone === "eff" && row.effPct != null) return coeToPseudoGrade(row.effPct);
  if (row.tone === "count" && row.countValue != null) return countToPseudoGrade(row.key, row.countValue);
  return null;
}

function qualityRowStyle(row: StatRow): React.CSSProperties {
  const pseudoGrade = rowPseudoGrade(row);
  if (pseudoGrade == null) {
    return {
      background: "linear-gradient(135deg, rgba(30, 41, 59, 0.42) 0%, rgba(15, 23, 42, 0.55) 100%)",
      borderColor: "rgba(148, 163, 184, 0.12)",
    };
  }
  const color = passGradeGradientColor(passGradePct(pseudoGrade));
  return {
    background: `linear-gradient(135deg, ${color}24 0%, rgba(15, 23, 42, 0.52) 100%)`,
    borderColor: `${color}40`,
  };
}

function valueStyle(row: StatRow): React.CSSProperties | undefined {
  const pseudoGrade = rowPseudoGrade(row);
  if (pseudoGrade == null) return undefined;
  const color = passGradeGradientColor(passGradePct(pseudoGrade));
  if (row.tone === "grade") {
    return { color, textShadow: `0 0 10px ${color}44` };
  }
  return { color };
}

function buildRows(point: XpRoundGrade, t: ReturnType<typeof useI18n>["t"]): StatRow[] {
  return [
    {
      key: "grade",
      label: t.roundGrade.grade,
      value: point.grade != null ? point.grade.toFixed(1) : "—",
      tone: "grade",
      grade: point.grade,
    },
    {
      key: "passes",
      label: t.gameStats.passes,
      value: point.passes != null ? String(point.passes) : "—",
      tone: "count",
      countValue: point.passes,
    },
    {
      key: "short",
      label: t.gameStats.shortEff,
      value: formatPct(point.short_pass_eff_pct),
      tone: "eff",
      effPct: point.short_pass_eff_pct,
    },
    {
      key: "long",
      label: t.gameStats.longEff,
      value: formatPct(point.long_pass_eff_pct),
      tone: "eff",
      effPct: point.long_pass_eff_pct,
    },
    {
      key: "breakline",
      label: t.roundGrade.breakline,
      value: point.breakline_passes != null ? String(point.breakline_passes) : "—",
      tone: "count",
      countValue: point.breakline_passes,
    },
    {
      key: "impact",
      label: t.roundGrade.impactPasses,
      value: point.impact != null ? String(point.impact) : "—",
      tone: "count",
      countValue: point.impact,
    },
    {
      key: "key",
      label: t.roundGrade.keyPasses,
      value: point.key_passes != null ? String(point.key_passes) : "—",
      tone: "count",
      countValue: point.key_passes,
    },
  ];
}

export function RoundGradeStatsPanel({ point, accent = "#a78bfa", layout = "tooltip" }: Props) {
  const { t } = useI18n();
  const header = `R${point.round}${point.opponent ? ` vs ${point.opponent}` : ""}`;
  const rows = buildRows(point, t);
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
            style={qualityRowStyle(row)}
          >
            <span className="round-grade-stats-label">{row.label}</span>
            <span
              className="round-grade-stats-value tabular"
              style={valueStyle(row)}
            >
              {row.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
