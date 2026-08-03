"use client";

import { Tooltip } from "@/components/ui/Tooltip";
import { XP_INDEX_TIER_LABELS, xpIndexTierClass } from "@/lib/gradeColors";
import { INDEX_TOOLTIPS } from "@/lib/tooltips";

export type XpIndexItem = {
  key: string;
  label: string;
  tier?: string | null;
  tier_key?: string | null;
  value?: number | null;
  icon?: string;
};

export function XpIndicesPanel({ indices }: { indices: XpIndexItem[] }) {
  const rows = indices.filter((i) => i.tier);
  if (!rows.length) return null;

  return (
    <div className="xp-indices-panel">
      <h4 className="section-label-sm">xP Indices</h4>
      <div className="xp-indices-list">
        {rows.map((item) => {
          const tier = item.tier ?? "mid";
          const tierLabel = XP_INDEX_TIER_LABELS[tier] ?? tier;
          const tipKey = item.tier_key ?? item.label;
          const tip = INDEX_TOOLTIPS[tipKey] ?? INDEX_TOOLTIPS[item.label] ?? "";
          return (
            <Tooltip key={item.key} content={tip} block>
              <div className={`xp-index-row ${xpIndexTierClass(tier)}`}>
                <span className="xp-index-row-icon">
                  <i className={`fa-solid ${item.icon ?? "fa-circle"}`} />
                </span>
                <span className="xp-index-row-name">{item.label}</span>
                <span className="xp-index-row-sep" aria-hidden="true" />
                <span className="xp-index-row-val">{tierLabel}</span>
              </div>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}
