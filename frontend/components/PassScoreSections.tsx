import type { PassScoreSection } from "@/lib/api";
import { GradeBadge } from "@/components/ui/GradeBadge";
import { TopRankBadge } from "@/components/ui/TopRankBadge";
import { Tooltip } from "@/components/ui/Tooltip";
import { formatMetric } from "@/lib/formatters";
import { COMPONENT_LABELS, COMPONENT_TOOLTIPS, PASS_SCORE_TOOLTIPS } from "@/lib/tooltips";

export function PassScoreSections({ sections }: { sections: PassScoreSection[] }) {
  return (
    <div className="pass-scores-panel">
      {sections.map((s, i) => (
        <details key={s.title} className="grade-accordion" open={i === 0}>
          <summary>
            <i className="fa-solid fa-chevron-right grade-arrow" aria-hidden="true" />
            <div className="grade-summary-main">
              <div className="grade-summary-top">
                <Tooltip content={PASS_SCORE_TOOLTIPS[s.title] ?? ""}>
                  <span className="grade-card-title">{s.title}</span>
                </Tooltip>
                <TopRankBadge rank={s.rank} />
                <GradeBadge letter={s.letter} displayScore={s.display_score} size="sm" />
              </div>
            </div>
          </summary>
          <div className="grade-accordion-body">
            {s.components.map((c) => (
              <Tooltip key={c.key} content={COMPONENT_TOOLTIPS[c.key] ?? ""} block>
                <div className="metric-line metric-line-tip">
                  <span>{COMPONENT_LABELS[c.key] ?? c.key.replace(/_/g, " ")}</span>
                  <span className="stat-val-wrap">
                    <TopRankBadge rank={c.rank} />
                    <span className="stat-val tabular">{formatMetric(c.value, c.key)}</span>
                  </span>
                </div>
              </Tooltip>
            ))}
          </div>
        </details>
      ))}
    </div>
  );
}
