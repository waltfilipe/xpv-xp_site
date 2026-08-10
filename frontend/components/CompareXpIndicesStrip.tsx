import { XP_INDEX_TIER_LABELS, xpIndexTierClass } from "@/lib/gradeColors";

type IndexItem = {
  key: string;
  label: string;
  tier?: string | null;
  icon?: string;
};

export function CompareXpIndicesStrip({ indices }: { indices: IndexItem[] }) {
  const rows = indices.filter((item) => item.tier);
  if (!rows.length) return null;

  return (
    <div className="compare-xp-indices-strip">
      <h4 className="section-label-sm">xP Indices</h4>
      <div className="compare-xp-indices-list">
        {rows.map((item) => {
          const tierLabel = XP_INDEX_TIER_LABELS[item.tier ?? "mid"] ?? item.tier ?? "—";
          const tierClass = xpIndexTierClass(item.tier);
          return (
            <div key={item.key} className={`compare-xp-index-row ${tierClass}`}>
              <span className="xp-index-row-icon">
                <i className={`fa-solid ${item.icon ?? "fa-circle"}`} />
              </span>
              <span className="compare-xp-index-name">{item.label}</span>
              <span className="compare-xp-index-val">{tierLabel}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
