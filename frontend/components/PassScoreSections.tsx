"use client";

import { PassMetricStratumStar } from "@/components/PassMetricStratumStar";
import type { PassScoreSection } from "@/lib/api";
import { GradeBadge } from "@/components/ui/GradeBadge";
import { MetricGradientBar } from "@/components/ui/MetricGradientBar";
import { Tooltip } from "@/components/ui/Tooltip";
import { formatMetric } from "@/lib/formatters";
import {
  translateComponentLabel,
  translateComponentTip,
  translatePassScoreTitle,
  translatePassScoreTooltip,
  useI18n,
} from "@/lib/i18n/context";
import { rankToBarScore } from "@/lib/gradeColors";

function SectionMetrics({ section }: { section: PassScoreSection }) {
  const { t } = useI18n();

  return (
    <div className="pass-score-metrics">
      {section.components.map((c) => {
        const barScore = rankToBarScore(c.rank, c.rank_pool);
        return (
          <Tooltip key={c.key} content={translateComponentTip(c.key, t)} block>
            <div className="pass-metric-block">
              <div className="pass-metric-head">
                <span className="pass-metric-label">
                  {translateComponentLabel(c.key, t)}
                  <PassMetricStratumStar show={c.stratum_star} />
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
  );
}

export function PassScoreSections({ sections }: { sections: PassScoreSection[] }) {
  const { t } = useI18n();

  return (
    <div className="pass-scores-panel">
      <div className="report-pass-accordion">
        {sections.map((section) => (
          <details key={section.title} className="report-pass-accordion-item">
            <summary className="report-pass-accordion-trigger">
              <span className="report-pass-accordion-left">
                <i className="fa-solid fa-chevron-right report-pass-accordion-chevron" aria-hidden="true" />
                <Tooltip content={translatePassScoreTooltip(section.title, t)}>
                  <span className="report-pass-accordion-title">
                    {translatePassScoreTitle(section.title, t)}
                  </span>
                </Tooltip>
              </span>
              <span className="report-pass-accordion-right">
                <GradeBadge letter={section.letter} displayScore={section.display_score} size="sm" />
              </span>
            </summary>
            <div className="report-pass-accordion-panel">
              <SectionMetrics section={section} />
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
