"use client";

import type { XpRoundGrade } from "@/lib/api";
import { XP_INDEX_TIER_LABELS, xpIndexTierClass } from "@/lib/gradeColors";
import { INDEX_TOOLTIPS } from "@/lib/tooltips";
import { RoundGradeChart } from "@/components/RoundGradeChart";
import { Tooltip } from "@/components/ui/Tooltip";

type Props = {
  label: string;
  tier?: string | null;
  tierKey?: string;
  icon?: string;
  points: XpRoundGrade[];
  accent?: string;
  expandAll?: boolean;
};

const TIER_BG: Record<string, string> = {
  elite: "rgba(56, 189, 248, 0.07)",
  above: "rgba(74, 222, 128, 0.08)",
  mid: "rgba(250, 204, 21, 0.06)",
  below: "rgba(251, 146, 60, 0.07)",
};

const TIER_ACCENT: Record<string, string> = {
  elite: "#38bdf8",
  above: "#4ade80",
  mid: "#facc15",
  below: "#fb923c",
};

export function ConsistencyAccordion({
  label,
  tier,
  tierKey,
  icon = "fa-wave-square",
  points,
  accent,
  expandAll = false,
}: Props) {
  const tierLabel = XP_INDEX_TIER_LABELS[tier ?? "mid"] ?? tier ?? "—";
  const tip = INDEX_TOOLTIPS[tierKey ?? label] ?? INDEX_TOOLTIPS[label] ?? "";
  const tierClass = xpIndexTierClass(tier);
  const tierKeyNorm = tier ?? "mid";
  const chartAccent = accent ?? TIER_ACCENT[tierKeyNorm] ?? "#a78bfa";
  const bgColor = TIER_BG[tierKeyNorm] ?? TIER_BG.mid;
  const hasChart = points.filter((p) => p.grade != null).length >= 2;

  return (
    <details
      className={`consistency-accordion ${tierClass}`}
      open={expandAll}
      style={{
        "--consistency-bg": bgColor,
        "--consistency-accent": chartAccent,
      } as React.CSSProperties}
    >
      <summary className="consistency-accordion-trigger" title={tip}>
        <span className="consistency-accordion-left">
          <i className="fa-solid fa-chevron-right consistency-accordion-chevron" aria-hidden="true" />
          <span className="xp-index-row-icon">
            <i className={`fa-solid ${icon}`} />
          </span>
          <Tooltip content={tip}>
            <span className="consistency-accordion-title">{label}</span>
          </Tooltip>
        </span>
        <span className="consistency-accordion-val">{tierLabel}</span>
      </summary>

      {hasChart && (
        <div className="consistency-accordion-panel">
          <RoundGradeChart points={points} accent={chartAccent} embedded tier={tierKeyNorm} />
        </div>
      )}
    </details>
  );
}
