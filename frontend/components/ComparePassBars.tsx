"use client";

import type { CompareMetric } from "@/lib/api";
import { Tooltip } from "@/components/ui/Tooltip";
import { gradeColor } from "@/lib/gradeColors";
import { PASS_SCORE_TOOLTIPS } from "@/lib/tooltips";

const COLOR_A = "#a78bfa";
const COLOR_B = "#86efac";
const MAX_SCORE = 10;

type Props = {
  metrics: CompareMetric[];
  nameA: string;
  nameB: string;
};

function barWidth(value: number | null | undefined) {
  const v = value ?? 0;
  return `${Math.max(4, (v / MAX_SCORE) * 100)}%`;
}

export function ComparePassBars({ metrics, nameA, nameB }: Props) {
  return (
    <div className="compare-pass-bars">
      <div className="compare-pass-bars-head">
        <span className="compare-pass-player compare-pass-player-a">{nameA}</span>
        <span className="compare-pass-player compare-pass-player-b">{nameB}</span>
      </div>

      {metrics.map((metric) => {
        const scoreA = metric.value_a ?? 0;
        const scoreB = metric.value_b ?? 0;
        const row = (
          <div className="compare-pass-row">
            <div className="compare-pass-row-label">{metric.label}</div>
            <div className="compare-pass-row-bars">
              <div className={`compare-pass-track compare-pass-track-a${metric.winner === "a" ? " compare-pass-winner" : ""}`}>
                <div
                  className="compare-pass-fill"
                  style={{ width: barWidth(metric.value_a), background: COLOR_A }}
                />
                <span className="compare-pass-value tabular" style={{ color: gradeColor(scoreA) }}>
                  {metric.value_a != null ? metric.value_a.toFixed(1) : "—"}
                </span>
              </div>
              <div className={`compare-pass-track compare-pass-track-b${metric.winner === "b" ? " compare-pass-winner" : ""}`}>
                <div
                  className="compare-pass-fill"
                  style={{ width: barWidth(metric.value_b), background: COLOR_B }}
                />
                <span className="compare-pass-value tabular" style={{ color: gradeColor(scoreB) }}>
                  {metric.value_b != null ? metric.value_b.toFixed(1) : "—"}
                </span>
              </div>
            </div>
          </div>
        );

        const tip = PASS_SCORE_TOOLTIPS[metric.label] ?? "";
        return tip ? (
          <Tooltip key={metric.key} content={tip} block>{row}</Tooltip>
        ) : (
          <div key={metric.key}>{row}</div>
        );
      })}
    </div>
  );
}
