"use client";

import { xpIndexTierClass } from "@/lib/gradeColors";
import { translateIndexLabel, translateTier, useI18n } from "@/lib/i18n/context";

type IndexItem = {
  key: string;
  label: string;
  tier?: string | null;
  icon?: string;
};

export function CompareXpIndicesStrip({ indices }: { indices: IndexItem[] }) {
  const { t } = useI18n();
  const rows = indices.filter((item) => item.tier);
  if (!rows.length) return null;

  return (
    <div className="compare-xp-indices-strip">
      <h4 className="section-label-sm">{t.xpProfile.indices}</h4>
      <div className="compare-xp-indices-list">
        {rows.map((item) => {
          const tierLabel = translateTier(item.tier, t);
          const tierClass = xpIndexTierClass(item.tier);
          return (
            <div key={item.key} className={`compare-xp-index-row ${tierClass}`}>
              <span className="xp-index-row-icon">
                <i className={`fa-solid ${item.icon ?? "fa-circle"}`} />
              </span>
              <span className="compare-xp-index-name">{translateIndexLabel(item.label, t)}</span>
              <span className="compare-xp-index-val">{tierLabel}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
