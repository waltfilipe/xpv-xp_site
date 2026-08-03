import type { PassScoreSection } from "@/lib/api";
import { GradeBadge } from "@/components/ui/GradeBadge";
import { MetricGradientBar } from "@/components/ui/MetricGradientBar";
import { Tooltip } from "@/components/ui/Tooltip";
import { formatMetric } from "@/lib/formatters";
import { rankToBarScore } from "@/lib/gradeColors";
import { COMPONENT_LABELS, COMPONENT_TOOLTIPS, PASS_SCORE_TOOLTIPS } from "@/lib/tooltips";

export function PassScoreSections({ sections }: { sections: PassScoreSection[] }) {
  return (
    <div className="pass-scores-panel">
      {sections.map((s) => (
        <section key={s.title} className="pass-score-section">
          <div className="pass-score-section-head">
            <Tooltip content={PASS_SCORE_TOOLTIPS[s.title] ?? ""}>
              <h4 className="pass-score-section-title">{s.title}</h4>
            </Tooltip>
            <GradeBadge letter={s.letter} displayScore={s.display_score} size="sm" />
          </div>

          <div className="pass-score-metrics">
            {s.components.map((c) => {
              const barScore = rankToBarScore(c.rank, c.rank_pool);
              return (
                <Tooltip key={c.key} content={COMPONENT_TOOLTIPS[c.key] ?? ""} block>
                  <div className="pass-metric-block">
                    <div className="pass-metric-head">
                      <span className="pass-metric-label">
                        {COMPONENT_LABELS[c.key] ?? c.key.replace(/_/g, " ")}
                      </span>
                      <span className="pass-metric-value tabular">
                        {formatMetric(c.value, c.key)}
                      </span>
                    </div>
                    <MetricGradientBar score={barScore} />
                  </div>
                </Tooltip>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
