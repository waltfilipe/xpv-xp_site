"use client";

import type { CompareMetric } from "@/lib/api";
import { CompareDualMetricTip } from "@/components/CompareDualMetricTip";
import { GradeBadge } from "@/components/ui/GradeBadge";
import { Tooltip } from "@/components/ui/Tooltip";
import { PASS_SCORE_TOOLTIPS } from "@/lib/tooltips";

type Props = {
  metrics: CompareMetric[];
  nameA: string;
  nameB: string;
};

export function ComparePassGridTable({ metrics, nameA, nameB }: Props) {
  if (!metrics.length) return null;

  return (
    <div className="compare-pass-grid-table-wrap">
      <table className="compare-radar-table compare-pass-grid-table">
        <thead>
          <tr>
            <th scope="col">Métrica</th>
            <th scope="col" className="compare-radar-th-a">{nameA}</th>
            <th scope="col" className="compare-radar-th-b">{nameB}</th>
          </tr>
        </thead>
        <tbody>
          {metrics.map((metric) => {
            const tip = metric.components?.length ? (
              <CompareDualMetricTip
                nameA={nameA}
                nameB={nameB}
                components={metric.components}
              />
            ) : (
              PASS_SCORE_TOOLTIPS[metric.label] ?? ""
            );
            return (
              <tr key={metric.key} className="compare-radar-table-row">
                <td>
                  <Tooltip content={tip} block>
                    <span className="compare-radar-metric-label">{metric.label}</span>
                  </Tooltip>
                </td>
                <td className="compare-radar-val-a">
                  <GradeBadge
                    letter={metric.letter_a}
                    displayScore={metric.score_a}
                    size="sm"
                  />
                </td>
                <td className="compare-radar-val-b">
                  <GradeBadge
                    letter={metric.letter_b}
                    displayScore={metric.score_b}
                    size="sm"
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="compare-radar-legend compare-radar-legend-pro">
        <span className="compare-legend-item compare-legend-a">
          <span className="compare-legend-dot" />
          <span className="compare-legend-name">{nameA}</span>
        </span>
        <span className="compare-legend-item compare-legend-b">
          <span className="compare-legend-dot" />
          <span className="compare-legend-name">{nameB}</span>
        </span>
      </div>
    </div>
  );
}
