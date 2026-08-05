"use client";

import {
  barPosition,
  impactMetricBarColor,
  isImpactEliteRank,
  rankToBarScore,
} from "@/lib/gradeColors";

type Props = {
  rank?: number | null;
  rankPool?: number | null;
};

export function ImpactMetricBar({ rank, rankPool }: Props) {
  const score = rankToBarScore(rank, rankPool);
  const pos = barPosition(score);
  const color = impactMetricBarColor(rank, rankPool);
  const elite = isImpactEliteRank(rank);

  return (
    <div className={`impact-metric-bar${score == null ? " impact-metric-bar-empty" : ""}${elite ? " impact-metric-bar-elite" : ""}`}>
      <div className="impact-metric-bar-track">
        <div className="impact-metric-bar-spectrum" aria-hidden="true" />
        {score != null && (
          <div
            className="impact-metric-bar-fill"
            style={{
              width: `${pos}%`,
              background: elite
                ? `linear-gradient(90deg, ${color}33 0%, ${color}88 100%)`
                : `linear-gradient(90deg, ${color}33 0%, ${color}88 100%)`,
            }}
          />
        )}
        {score != null && (
          <span
            className="impact-metric-bar-marker"
            style={{
              left: `${pos}%`,
              background: color,
              borderColor: color,
              boxShadow: elite
                ? `0 0 0 1.5px rgba(15, 23, 42, 0.9), 0 0 6px ${color}88`
                : `0 0 0 1.5px rgba(15, 23, 42, 0.9), 0 1px 4px rgba(2, 6, 23, 0.45)`,
            }}
          />
        )}
      </div>
    </div>
  );
}
