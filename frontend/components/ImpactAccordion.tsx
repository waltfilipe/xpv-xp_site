"use client";

import { Tooltip } from "@/components/ui/Tooltip";
import { ImpactMetricBar } from "@/components/ui/ImpactMetricBar";
import { xpIndexTierClass } from "@/lib/gradeColors";
import { formatMetric } from "@/lib/formatters";
import {
  translateComponentLabel,
  translateComponentTip,
  translateIndexTip,
  translateTier,
  useI18n,
} from "@/lib/i18n/context";

export type ImpactIndexComponent = {
  key: string;
  label: string;
  value?: number | null;
  rank?: number | null;
  rank_pool?: number | null;
};

type Props = {
  label: string;
  tier?: string | null;
  tierKey?: string;
  icon?: string;
  components: ImpactIndexComponent[];
  expandAll?: boolean;
};

const TIER_BG: Record<string, string> = {
  elite: "rgba(56, 189, 248, 0.025)",
  above: "rgba(74, 222, 128, 0.03)",
  mid: "rgba(250, 204, 21, 0.02)",
  below: "rgba(251, 146, 60, 0.025)",
};

const TIER_ACCENT: Record<string, string> = {
  elite: "#38bdf8",
  above: "#4ade80",
  mid: "#facc15",
  below: "#fb923c",
};

function formatImpactValue(key: string, value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  if (key.startsWith("def_")) return formatMetric(value, key);
  if (key === "threat_pass_pct") {
    return `${value.toFixed(1)}%`;
  }
  return value.toFixed(3);
}

function componentLabel(key: string, fallback: string, t: ReturnType<typeof useI18n>["t"]): string {
  if (key === "xpv_per_pass") return t.xpProfile.impactComponents.xpvPerPass;
  if (key === "threat_pass_pct") return t.xpProfile.impactComponents.impactRate;
  return translateComponentLabel(key, t) || fallback;
}

export function ImpactAccordion({
  label,
  tier,
  tierKey,
  icon = "fa-crosshairs",
  components,
  expandAll = false,
}: Props) {
  const { t } = useI18n();
  const tierLabel = translateTier(tier, t);
  const tip = translateIndexTip(tierKey, label, t);
  const tierClass = xpIndexTierClass(tier);
  const tierKeyNorm = tier ?? "mid";
  const bgColor = TIER_BG[tierKeyNorm] ?? TIER_BG.mid;
  const accentColor = TIER_ACCENT[tierKeyNorm] ?? TIER_ACCENT.mid;
  const tierStyle = {
    "--consistency-bg": bgColor,
    "--consistency-accent": accentColor,
  } as React.CSSProperties;

  const head = (
    <>
      <span className="consistency-accordion-left">
        {!expandAll && (
          <i className="fa-solid fa-chevron-right consistency-accordion-chevron" aria-hidden="true" />
        )}
        <span className="xp-index-row-icon">
          <i className={`fa-solid ${icon}`} />
        </span>
        <Tooltip content={tip}>
          <span className="consistency-accordion-title">{label}</span>
        </Tooltip>
      </span>
      <span className="consistency-accordion-val">{tierLabel}</span>
    </>
  );

  const panel = (
    <div className="impact-accordion-metrics">
      {components.map((item) => {
        const row = (
          <div className="impact-accordion-metric">
            <div className="impact-accordion-metric-head">
              <span className="impact-accordion-metric-label">
                {componentLabel(item.key, item.label, t)}
              </span>
              <span className="impact-accordion-metric-value tabular">
                {formatImpactValue(item.key, item.value)}
              </span>
            </div>
            <ImpactMetricBar rank={item.rank} rankPool={item.rank_pool} />
          </div>
        );
        const rowTip = translateComponentTip(item.key, t);
        return rowTip ? (
          <Tooltip key={item.key} content={rowTip} block>
            {row}
          </Tooltip>
        ) : (
          <div key={item.key}>{row}</div>
        );
      })}
    </div>
  );

  if (expandAll) {
    return (
      <div
        className={`consistency-accordion consistency-flat impact-accordion ${tierClass}`}
        style={tierStyle}
      >
        <div className="consistency-accordion-trigger">{head}</div>
        <div className="consistency-accordion-panel">{panel}</div>
      </div>
    );
  }

  return (
    <details
      className={`consistency-accordion impact-accordion ${tierClass}`}
      style={tierStyle}
    >
      <summary className="consistency-accordion-trigger" title={tip}>
        {head}
      </summary>
      <div className="consistency-accordion-panel">{panel}</div>
    </details>
  );
}
