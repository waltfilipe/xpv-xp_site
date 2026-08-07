"use client";

import { gradeTier, passGradeGradientColor, passGradePct } from "@/lib/gradeColors";
import { Tooltip } from "@/components/ui/Tooltip";
import { useI18n, translatePassGradeTier } from "@/lib/i18n/context";

type Props = { rating: number | null | undefined };

export function PassGradePanel({ rating }: Props) {
  const { t } = useI18n();
  const displayScore = rating != null ? rating * 10 : null;

  if (rating == null || displayScore == null) {
    return (
      <div className="player-card pass-grade-card">
        <div className="pass-grade-head">
          <span className="pass-grade-title">{t.passGrade.title}</span>
        </div>
        <p className="placeholder-note">{t.passGrade.unavailable}</p>
      </div>
    );
  }

  const pct = passGradePct(displayScore);
  const markerPct = Math.max(1.5, Math.min(98.5, pct));
  const color = passGradeGradientColor(pct);
  const tier = translatePassGradeTier(gradeTier(displayScore), t);
  const tierKey = tier.toLowerCase().replace(/\s+/g, "-");

  const panel = (
    <div className={`player-card pass-grade-card pass-grade-tier-${tierKey}`}>
      <div className="pass-grade-head">
        <span className="pass-grade-title">{t.passGrade.title}</span>
        <span
          className="pass-grade-tier"
          style={{ color, borderColor: `${color}55`, background: `${color}1a` }}
        >
          {tier}
        </span>
      </div>

      <div className="pass-grade-body pass-grade-body-horizontal">
        <div className="pass-grade-value">
          <span className="pass-grade-score tabular" style={{ color }}>
            {displayScore.toFixed(1)}
          </span>
          <span className="pass-grade-scale">/ 10</span>
        </div>

        <div className="pass-grade-meter">
          <div className="pass-grade-track">
            <span className="pass-grade-shade">
              <span className="pass-grade-rest" style={{ left: `${pct}%` }} />
            </span>
            <span className="pass-grade-marker" style={{ left: `${markerPct}%` }} />
          </div>
        </div>
      </div>
    </div>
  );

  return <Tooltip content={t.passGrade.tooltip} block>{panel}</Tooltip>;
}
