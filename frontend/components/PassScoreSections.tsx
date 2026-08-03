import type { PassScoreSection } from "@/lib/api";
import { GradeBadge } from "@/components/ui/GradeBadge";
import { Tooltip } from "@/components/ui/Tooltip";
import { gradeColor, formatStat } from "@/lib/gradeColors";
import { COMPONENT_LABELS, COMPONENT_TOOLTIPS, PASS_SCORE_TOOLTIPS } from "@/lib/tooltips";

export function PassScoreSections({ sections }: { sections: PassScoreSection[] }) {
  return (
    <div className="pass-scores-panel">
      {sections.map((s, i) => {
        const score = s.display_score ?? 0;
        const color = gradeColor(score);
        return (
          <details key={s.title} className="grade-accordion" open={i === 0}>
            <summary>
              <i className="fa-solid fa-chevron-right grade-arrow" aria-hidden="true" />
              <div className="grade-summary-main">
                <div className="grade-summary-top">
                  <Tooltip content={PASS_SCORE_TOOLTIPS[s.title] ?? ""}>
                    <span className="grade-card-title">{s.title}</span>
                  </Tooltip>
                  <GradeBadge letter={s.letter} displayScore={s.display_score} size="sm" />
                  <span className="grade-card-score tabular" style={{ color }}>
                    {s.display_score != null ? s.display_score.toFixed(1) : "—"}
                  </span>
                </div>
                <div className="grade-meter-track">
                  <div
                    className="grade-meter-fill"
                    style={{ width: `${Math.min(100, (score / 10) * 100)}%`, background: color }}
                  />
                </div>
              </div>
            </summary>
            <div className="grade-accordion-body">
              {s.components.map((c) => (
                <Tooltip key={c.key} content={COMPONENT_TOOLTIPS[c.key] ?? ""} block>
                  <div className="metric-line metric-line-tip">
                    <span>{COMPONENT_LABELS[c.key] ?? c.key.replace(/_/g, " ")}</span>
                    <span className="stat-val tabular">{formatStat(c.value, c.key)}</span>
                  </div>
                </Tooltip>
              ))}
            </div>
          </details>
        );
      })}
    </div>
  );
}
