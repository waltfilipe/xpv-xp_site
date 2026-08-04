"use client";

import { useState } from "react";
import type { PassScoreSection } from "@/lib/api";
import { GradeBadge } from "@/components/ui/GradeBadge";
import { MetricGradientBar } from "@/components/ui/MetricGradientBar";
import { Tooltip } from "@/components/ui/Tooltip";
import { formatMetric } from "@/lib/formatters";
import { rankToBarScore } from "@/lib/gradeColors";
import { COMPONENT_LABELS, COMPONENT_TOOLTIPS, PASS_SCORE_TOOLTIPS } from "@/lib/tooltips";

type Props = {
  sections: PassScoreSection[];
  accent?: string;
};

export function ReportPassScoreTabs({ sections, accent = "#a78bfa" }: Props) {
  const [active, setActive] = useState(0);
  if (!sections.length) return null;

  const section = sections[active] ?? sections[0];

  return (
    <div className="report-pass-tabs">
      <div className="report-pass-tablist" role="tablist" aria-label="Pass scores">
        {sections.map((s, index) => (
          <button
            key={s.title}
            type="button"
            role="tab"
            aria-selected={index === active}
            className={`report-pass-tab${index === active ? " active" : ""}`}
            style={
              index === active
                ? { borderColor: `${accent}55`, color: accent, background: `${accent}12` }
                : undefined
            }
            onClick={() => setActive(index)}
          >
            <span className="report-pass-tab-label">{s.title}</span>
            <GradeBadge letter={s.letter} displayScore={s.display_score} size="sm" />
          </button>
        ))}
      </div>

      <div className="report-pass-tabpanel" role="tabpanel">
        <div className="pass-score-section-head">
          <Tooltip content={PASS_SCORE_TOOLTIPS[section.title] ?? ""}>
            <h4 className="pass-score-section-title">{section.title}</h4>
          </Tooltip>
          {section.display_score != null && (
            <span className="report-pass-tab-score tabular" style={{ color: accent }}>
              {(section.display_score * 1).toFixed(1)}
            </span>
          )}
        </div>

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
    </div>
  );
}
