"use client";

import { useState } from "react";
import type { XpRoundGrade } from "@/lib/api";
import { GameStatsModal } from "@/components/GameStatsModal";
import { xpIndexTierClass } from "@/lib/gradeColors";
import { RoundGradeChart } from "@/components/RoundGradeChart";
import { Tooltip } from "@/components/ui/Tooltip";
import { translateIndexTip, translateTier, useI18n } from "@/lib/i18n/context";

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
  elite: "rgba(56, 189, 248, 0.025)",
  above: "rgba(74, 222, 128, 0.03)",
  mid: "rgba(250, 204, 21, 0.02)",
  below: "rgba(251, 146, 60, 0.025)",
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
  const { t } = useI18n();
  const [selectedGame, setSelectedGame] = useState<XpRoundGrade | null>(null);
  const tierLabel = translateTier(tier, t);
  const tip = translateIndexTip(tierKey, label, t);
  const tierClass = xpIndexTierClass(tier);
  const tierKeyNorm = tier ?? "mid";
  const chartAccent = accent ?? TIER_ACCENT[tierKeyNorm] ?? "#a78bfa";
  const bgColor = TIER_BG[tierKeyNorm] ?? TIER_BG.mid;
  const hasChart = points.filter((p) => p.grade != null).length >= 2;
  const chart = hasChart ? (
    <RoundGradeChart
      points={points}
      accent={chartAccent}
      embedded
      tier={tierKeyNorm}
      onPointClick={expandAll ? undefined : setSelectedGame}
    />
  ) : null;

  const head = (
    <>
      <span className="consistency-accordion-left">
        {!expandAll && (
          <i className="fa-solid fa-chevron-right consistency-accordion-chevron" aria-hidden="true" />
        )}
        <span className="xp-index-row-icon">
          <i className={`fa-solid ${icon}`} />
        </span>
        <Tooltip content={tip}>
          <span className="consistency-accordion-title">{label}</span>
        </Tooltip>
      </span>
      <span className="consistency-accordion-val">{tierLabel}</span>
    </>
  );

  if (expandAll) {
    return (
      <div
        className={`consistency-accordion consistency-flat ${tierClass}`}
        style={{
          "--consistency-bg": bgColor,
          "--consistency-accent": chartAccent,
        } as React.CSSProperties}
      >
        <div className="consistency-accordion-trigger">{head}</div>
        {chart && <div className="consistency-accordion-panel">{chart}</div>}
      </div>
    );
  }

  return (
    <>
      <details
        className={`consistency-accordion ${tierClass}`}
        style={{
          "--consistency-bg": bgColor,
          "--consistency-accent": chartAccent,
        } as React.CSSProperties}
      >
        <summary className="consistency-accordion-trigger" title={tip}>
          {head}
        </summary>

        {chart && <div className="consistency-accordion-panel">{chart}</div>}
      </details>
      <GameStatsModal
        game={selectedGame}
        onClose={() => setSelectedGame(null)}
        accent={chartAccent}
      />
    </>
  );
}
