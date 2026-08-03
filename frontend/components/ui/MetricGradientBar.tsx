"use client";

import { barPosition, gradeColor, gradientBarTier } from "@/lib/gradeColors";

type Props = {
  score: number | null | undefined;
};

export function MetricGradientBar({ score }: Props) {
  const pos = barPosition(score);
  const tier = score != null ? gradientBarTier(score) : "cool";
  const glowColor = gradeColor(score ?? 0, 10);

  return (
    <div className={`metric-gradient-bar metric-gradient-bar-tier-${tier}${score == null ? " metric-gradient-bar-empty" : ""}`}>
      <div className="metric-gradient-bar-track">
        <div className="metric-gradient-bar-clip">
          {score != null && (
            <span
              className="metric-gradient-bar-glow"
              style={{ left: `${pos}%`, background: glowColor }}
            />
          )}
        </div>
        {score != null && (
          <span className="metric-gradient-bar-marker" style={{ left: `${pos}%` }} />
        )}
      </div>
    </div>
  );
}
