"use client";

import { ConsistencyAccordion } from "@/components/ConsistencyAccordion";
import { ImpactAccordion, type ImpactIndexComponent } from "@/components/ImpactAccordion";
import type { XpRoundGrade } from "@/lib/api";
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
  components?: ImpactIndexComponent[];
};

type Props = {
  indices: XpIndexItem[];
  roundGrades?: XpRoundGrade[];
  accent?: string;
  expandAll?: boolean;
};

function IndexRow({
  label,
  tier,
  tierKey,
  icon,
}: {
  label: string;
  tier?: string | null;
  tierKey: string;
  icon: string;
}) {
  const tierLabel = XP_INDEX_TIER_LABELS[tier ?? "mid"] ?? tier ?? "—";
  const tip = INDEX_TOOLTIPS[tierKey] ?? INDEX_TOOLTIPS[label] ?? "";

  return (
    <Tooltip content={tip} block>
      <div className={`xp-index-row ${xpIndexTierClass(tier)}`} title={tip}>
        <span className="xp-index-row-icon">
          <i className={`fa-solid ${icon}`} />
        </span>
        <span className="xp-index-row-name">{label}</span>
        <span className="xp-index-row-sep" aria-hidden="true" />
        <span className="xp-index-row-val">{tierLabel}</span>
      </div>
    </Tooltip>
  );
}

export function XpIndicesPanel({
  indices,
  roundGrades = [],
  accent,
  expandAll = false,
}: Props) {
  const rows = indices.filter((i) => i.tier);
  if (!rows.length) return null;

  const consistency = rows.find((i) => i.key === "consistency");
  const impact = rows.find((i) => i.key === "impact");
  const other = rows.filter((i) => i.key !== "consistency" && i.key !== "impact");

  return (
    <div className="xp-indices-panel">
      <h4 className="section-label-sm">xP Indices</h4>
      <div className="xp-indices-list">
        {consistency && (
          <ConsistencyAccordion
            label={consistency.label}
            tier={consistency.tier}
            tierKey={consistency.tier_key ?? consistency.label}
            icon={consistency.icon ?? "fa-wave-square"}
            points={roundGrades}
            accent={accent}
            expandAll={expandAll}
          />
        )}
        {impact && impact.components && impact.components.length > 0 && (
          <ImpactAccordion
            label={impact.label}
            tier={impact.tier}
            tierKey={impact.tier_key ?? impact.label}
            icon={impact.icon ?? "fa-crosshairs"}
            components={impact.components}
            expandAll={expandAll}
          />
        )}
        {impact && (!impact.components || impact.components.length === 0) && (
          <IndexRow
            label={impact.label}
            tier={impact.tier}
            tierKey={impact.tier_key ?? impact.label}
            icon={impact.icon ?? "fa-crosshairs"}
          />
        )}
        {other.map((item) => (
          <IndexRow
            key={item.key}
            label={item.label}
            tier={item.tier}
            tierKey={item.tier_key ?? item.label}
            icon={item.icon ?? "fa-circle"}
          />
        ))}
      </div>
    </div>
  );
}
