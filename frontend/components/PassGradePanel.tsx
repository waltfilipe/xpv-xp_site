import { gradeColor, gradeTier } from "@/lib/gradeColors";

type Props = { rating: number | null | undefined };

export function PassGradePanel({ rating }: Props) {
  if (rating == null) {
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

  const color = gradeColor(rating, 1);
  const tier = gradeTier(rating, 1);
  const pct = Math.max(1.5, Math.min(98.5, rating * 100));

  return (
    <div className="player-card pass-grade-card">
      <div className="pass-grade-head">
        <span className="pass-grade-icon"><i className="fa-solid fa-award" /></span>
        <span className="pass-grade-title">Overall Pass Grade</span>
        <span className="pass-grade-tier" style={{ color, borderColor: `${color}55`, background: `${color}1a` }}>
          {tier}
        </span>
      </div>
      <div className="pass-grade-body">
        <div className="pass-grade-value">
          <span className="pass-grade-score" style={{ color }}>{rating.toFixed(1)}</span>
          <span className="pass-grade-scale">/ 10 · xP pass rating</span>
        </div>
        <div className="pass-grade-meter">
          <div className="pass-grade-track">
            <span className="pass-grade-marker" style={{ left: `${pct}%`, background: color }} />
          </div>
        </div>
      </div>
    </div>
  );
}
