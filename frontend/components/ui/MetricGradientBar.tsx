"use client";

import { barPosition, letterGradePillColor, passGradeGradientColor, passGradePct } from "@/lib/gradeColors";

type Props = {
  score: number | null | undefined;
  letter?: string | null;
  displayScore?: number | null;
};

export function MetricGradientBar({ score, letter, displayScore }: Props) {
  const pos = barPosition(score);
  const sectionColor = letterGradePillColor(letter, displayScore);
  const metricColor = score != null ? passGradeGradientColor(passGradePct(score)) : sectionColor;

  return (
    <div className={`metric-gradient-bar${score == null ? " metric-gradient-bar-empty" : ""}`}>
      <div className="metric-gradient-bar-track">
        <div
          className="metric-gradient-bar-spectrum"
          aria-hidden="true"
        />
        {score != null && (
          <div
            className="metric-gradient-bar-fill"
            style={{
              width: `${pos}%`,
              background: `linear-gradient(90deg, ${sectionColor}33 0%, ${metricColor}88 100%)`,
            }}
          />
        )}
        {score != null && (
          <span
            className="metric-gradient-bar-marker"
            style={{
              left: `${pos}%`,
              background: metricColor,
              boxShadow: `0 0 10px ${metricColor}66`,
            }}
          />
        )}
      </div>
    </div>
  );
}
