"use client";

import { PASS_GRADE_TOOLTIP } from "@/lib/tooltips";
import { gradeColor, gradeTier } from "@/lib/gradeColors";
import { Tooltip } from "@/components/ui/Tooltip";

type Props = { rating: number | null | undefined };

function ScoreArc({ rating, color }: { rating: number; color: string }) {
  const pct = Math.min(100, Math.max(0, rating * 100));
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (pct / 100) * circumference * 0.75;

  return (
    <svg className="score-arc" viewBox="0 0 120 120" aria-hidden="true">
      <circle cx="60" cy="60" r="54" className="score-arc-bg" />
      <circle
        cx="60"
        cy="60"
        r="54"
        className="score-arc-fill"
        stroke={color}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
      />
    </svg>
  );
}

export function PassGradePanel({ rating }: Props) {
  const displayScore = rating != null ? rating * 10 : null;

  if (rating == null || displayScore == null) {
    return (
      <div className="player-card pass-grade-card">
        <div className="pass-grade-head">
          <span className="pass-grade-icon"><i className="fa-solid fa-award" /></span>
          <span className="pass-grade-title">Overall Pass Grade</span>
        </div>
        <p className="placeholder-note">Grade unavailable</p>
      </div>
    );
  }

  const color = gradeColor(displayScore);
  const tier = gradeTier(displayScore);

  const panel = (
    <div className="player-card pass-grade-card">
      <div className="pass-grade-head">
        <span className="pass-grade-icon"><i className="fa-solid fa-award" /></span>
        <span className="pass-grade-title">Overall Pass Grade</span>
        <span className="pass-grade-tier" style={{ color, borderColor: `${color}55`, background: `${color}14` }}>
          {tier}
        </span>
      </div>
      <div className="pass-grade-body">
        <div className="pass-grade-visual">
          <ScoreArc rating={rating} color={color} />
          <div className="pass-grade-center">
            <span className="pass-grade-score tabular" style={{ color }}>{displayScore.toFixed(1)}</span>
            <span className="pass-grade-scale">/ 10</span>
          </div>
        </div>
        <p className="pass-grade-caption">xP pass rating · within position pool</p>
      </div>
    </div>
  );

  return <Tooltip content={PASS_GRADE_TOOLTIP} block>{panel}</Tooltip>;
}
