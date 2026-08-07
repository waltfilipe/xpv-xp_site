"use client";

import type { CompareMetric } from "@/lib/api";
import { CompareDualMetricTip } from "@/components/CompareDualMetricTip";
import { XpHeatBar } from "@/components/ui/XpHeatBar";
import { Tooltip } from "@/components/ui/Tooltip";
import { translateXpBarLabel, useI18n } from "@/lib/i18n/context";

const PILLAR_ICONS: Record<string, string> = {
  xp_activity_display: "fa-chart-simple",
  xp_efficiency_display: "fa-gauge-high",
  xp_edge_display: "fa-bolt",
};

type Props = {
  metrics: CompareMetric[];
  nameA: string;
  nameB: string;
};

function BarRow({
  side,
  value,
  winner,
}: {
  side: "a" | "b";
  value: number | null | undefined;
  winner: boolean;
}) {
  return (
    <div className={`compare-pillar-row compare-pillar-row-${side}${winner ? " compare-pillar-winner" : ""}`}>
      <span className={`compare-pillar-dot compare-pillar-dot-${side}`} aria-hidden="true" />
      <XpHeatBar value={value} />
      <span className="compare-pillar-value tabular">
        {value != null ? value.toFixed(1) : "—"}
      </span>
    </div>
  );
}

export function ComparePillarBars({ metrics, nameA, nameB }: Props) {
  const { t } = useI18n();

  return (
    <div className="compare-pillar-bars">
      <div className="compare-pillar-legend">
        <span className="compare-legend-item compare-legend-a">
          <span className="compare-legend-dot" />
          <span className="compare-legend-name">{nameA}</span>
        </span>
        <span className="compare-legend-item compare-legend-b">
          <span className="compare-legend-dot" />
          <span className="compare-legend-name">{nameB}</span>
        </span>
      </div>

      {metrics.map((metric) => {
        const icon = PILLAR_ICONS[metric.key] ?? "fa-circle";
        const label = translateXpBarLabel(metric.key, t);
        const tip = (
          <CompareDualMetricTip
            nameA={nameA}
            nameB={nameB}
            components={[{
              key: metric.key,
              label,
              value_a: metric.value_a,
              value_b: metric.value_b,
              winner: metric.winner,
            }]}
          />
        );
        const block = (
          <div className="compare-pillar-block">
            <div className="compare-pillar-head">
              <span className="compare-pillar-label">
                <i className={`fa-solid ${icon} compare-pillar-icon`} aria-hidden="true" />
                {label}
              </span>
            </div>
            <BarRow
              side="a"
              value={metric.value_a}
              winner={metric.winner === "a"}
            />
            <BarRow
              side="b"
              value={metric.value_b}
              winner={metric.winner === "b"}
            />
          </div>
        );
        return (
          <Tooltip key={metric.key} content={tip} block>{block}</Tooltip>
        );
      })}
    </div>
  );
}
