"use client";

import type { PassScoreSection } from "@/lib/api";
import { GradeBadge } from "@/components/ui/GradeBadge";
import { MetricGradientBar } from "@/components/ui/MetricGradientBar";
import { Tooltip } from "@/components/ui/Tooltip";
import { formatMetric } from "@/lib/formatters";
import { rankToBarScore } from "@/lib/gradeColors";
import { COMPONENT_LABELS, COMPONENT_TOOLTIPS, PASS_SCORE_TOOLTIPS } from "@/lib/tooltips";

type Props = {
  sections: PassScoreSection[];
};

export function ReportPassScoreAccordion({ sections }: Props) {
  if (!sections.length) return null;

  return (
    <div className="report-pass-accordion">
      {sections.map((section, index) => (
        <details
          key={section.title}
          className="report-pass-accordion-item"
          open={index === 0}
        >
          <summary className="report-pass-accordion-trigger">
            <span className="report-pass-accordion-left">
              <i className="fa-solid fa-chevron-right report-pass-accordion-chevron" aria-hidden="true" />
              <Tooltip content={PASS_SCORE_TOOLTIPS[section.title] ?? ""}>
                <span className="report-pass-accordion-title">{section.title}</span>
              </Tooltip>
            </span>
            <span className="report-pass-accordion-right">
              <GradeBadge letter={section.letter} displayScore={section.display_score} size="sm" />
            </span>
          </summary>

          <div className="report-pass-accordion-panel">
            <div className="pass-score-metrics">
              {section.components.map((c) => {
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
                      <MetricGradientBar
                        score={barScore}
                        letter={section.letter}
                        displayScore={section.display_score}
                      />
                    </div>
                  </Tooltip>
                );
              })}
            </div>
          </div>
        </details>
      ))}
    </div>
  );
}
