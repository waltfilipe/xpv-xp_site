"use client";

import { Tooltip } from "@/components/ui/Tooltip";
import { XP_INDEX_TIER_LABELS, xpIndexTierClass } from "@/lib/gradeColors";
import { INDEX_TOOLTIPS } from "@/lib/tooltips";

export type XpIndexItem = {
  key: string;
  label: string;
  tier?: string | null;
  value?: number | null;
  icon?: string;
};

function formatValue(key: string, value: number | null | undefined): string {
  if (value == null) return "—";
  if (key === "consistency") return value.toFixed(1);
  return value.toFixed(2);
}

export function XpIndicesPanel({ indices }: { indices: XpIndexItem[] }) {
  const rows = indices.filter((i) => i.tier);
  if (!rows.length) return null;

  return (
    <div className="xp-indices-panel">
      <h4 className="section-label-sm">xP Indices</h4>
      <div className="xp-indices-grid">
        {rows.map((item) => {
          const tier = item.tier ?? "mid";
          const tierLabel = XP_INDEX_TIER_LABELS[tier] ?? tier;
          const tip = INDEX_TOOLTIPS[item.label as keyof typeof INDEX_TOOLTIPS] ?? "";
          return (
            <Tooltip key={item.key} content={tip} block>
              <div className={`xp-index-card ${xpIndexTierClass(tier)}`}>
                <div className="xp-index-card-head">
                  <span className="xp-index-icon">
                    <i className={`fa-solid ${item.icon ?? "fa-circle"}`} />
                  </span>
                  <span className="xp-index-name">{item.label}</span>
                </div>
                <div className="xp-index-card-body">
                  <span className="xp-index-tier">{tierLabel}</span>
                  <span className="xp-index-value tabular">{formatValue(item.key, item.value)}</span>
                </div>
                <div className="xp-index-tier-bar">
                  <span className={`xp-index-tier-dot tier-${tier}`} />
                </div>
              </div>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}
