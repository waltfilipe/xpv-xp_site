"use client";

import { ConsistencyAccordion } from "@/components/ConsistencyAccordion";
import { ImpactAccordion, type ImpactIndexComponent } from "@/components/ImpactAccordion";
import type { XpRoundGrade } from "@/lib/api";
import { Tooltip } from "@/components/ui/Tooltip";
import { xpIndexTierClass } from "@/lib/gradeColors";
import {
  translateIndexLabel,
  translateIndexTip,
  translateTier,
  useI18n,
} from "@/lib/i18n/context";

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
  const { t } = useI18n();
  const tierLabel = translateTier(tier, t);
  const tip = translateIndexTip(tierKey, label, t);

  return (
    <Tooltip content={tip} block>
      <div className={`xp-index-row ${xpIndexTierClass(tier)}`} title={tip}>
        <span className="xp-index-row-icon">
          <i className={`fa-solid ${icon}`} />
        </span>
        <span className="xp-index-row-name">{translateIndexLabel(label, t)}</span>
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
  const { t } = useI18n();
  const rows = indices.filter((i) => i.tier);
  if (!rows.length) return null;

  const consistency = rows.find((i) => i.key === "consistency");
  const impact = rows.find((i) => i.key === "impact");
  const defense = rows.find((i) => i.key === "defense");
  const other = rows.filter(
    (i) => i.key !== "consistency" && i.key !== "impact" && i.key !== "defense",
  );

  return (
    <div className="xp-indices-panel">
      <h4 className="section-label-sm">{t.xpProfile.indices}</h4>
      <div className="xp-indices-list">
        {consistency && (
          <ConsistencyAccordion
            label={translateIndexLabel(consistency.label, t)}
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
            label={translateIndexLabel(impact.label, t)}
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
        {defense && defense.components && defense.components.length > 0 && (
          <ImpactAccordion
            label={translateIndexLabel(defense.label, t)}
            tier={defense.tier}
            tierKey={defense.tier_key ?? defense.label}
            icon={defense.icon ?? "fa-shield-halved"}
            components={defense.components}
            expandAll={expandAll}
          />
        )}
        {defense && (!defense.components || defense.components.length === 0) && (
          <IndexRow
            label={defense.label}
            tier={defense.tier}
            tierKey={defense.tier_key ?? defense.label}
            icon={defense.icon ?? "fa-shield-halved"}
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
