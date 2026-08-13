"use client";

import { PassMetricStratumStar } from "@/components/PassMetricStratumStar";
import type { PassScoreSection } from "@/lib/api";
import { GradeBadge } from "@/components/ui/GradeBadge";
import { MetricGradientBar } from "@/components/ui/MetricGradientBar";
import { Tooltip } from "@/components/ui/Tooltip";
import { formatMetric } from "@/lib/formatters";
import { rankToBarScore } from "@/lib/gradeColors";
import {
  translateComponentLabel,
  translateComponentTip,
  translatePassScoreTitle,
  translatePassScoreTooltip,
  useI18n,
} from "@/lib/i18n/context";

type Props = {
  sections: PassScoreSection[];
  expandAll?: boolean;
};

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

function SectionHead({ section }: { section: PassScoreSection }) {
  const { t } = useI18n();
  const title = translatePassScoreTitle(section.title, t);

  return (
    <div className="report-pass-accordion-head">
      <Tooltip content={translatePassScoreTooltip(section.title, t)}>
        <span className="report-pass-accordion-title">{title}</span>
      </Tooltip>
      <GradeBadge letter={section.letter} displayScore={section.display_score} size="sm" />
    </div>
  );
}

export function ReportPassScoreAccordion({ sections, expandAll = false }: Props) {
  const { t } = useI18n();

  if (!sections.length) return null;

  if (expandAll) {
    return (
      <div className="report-pass-accordion report-pass-flat">
        {sections.map((section) => (
          <div key={section.title} className="report-pass-accordion-item report-pass-flat-item">
            <SectionHead section={section} />
            <SectionMetrics section={section} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="report-pass-accordion">
      {sections.map((section) => {
        const title = translatePassScoreTitle(section.title, t);
        return (
        <details
          key={section.title}
          className="report-pass-accordion-item"
        >
          <summary className="report-pass-accordion-trigger">
            <span className="report-pass-accordion-left">
              <i className="fa-solid fa-chevron-right report-pass-accordion-chevron" aria-hidden="true" />
              <Tooltip content={translatePassScoreTooltip(section.title, t)}>
                <span className="report-pass-accordion-title">{title}</span>
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
        );
      })}
    </div>
  );
}
