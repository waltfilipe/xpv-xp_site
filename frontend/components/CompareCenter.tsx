"use client";

import type { CompareMetric } from "@/lib/api";
import { ComparePassGridTable } from "@/components/ComparePassGridTable";
import { ComparePillarBars } from "@/components/ComparePillarBars";
import { useI18n } from "@/lib/i18n/context";

type Props = {
  pillars: CompareMetric[];
  passGrid: CompareMetric[];
  nameA: string;
  nameB: string;
};

export function CompareCenter({ pillars, passGrid, nameA, nameB }: Props) {
  const { t } = useI18n();

  return (
    <div className="compare-center">
      <section className="compare-chart-section">
        <h3 className="section-label">{t.compare.xpPillars}</h3>
        <ComparePillarBars metrics={pillars} nameA={nameA} nameB={nameB} />
      </section>

      <section className="compare-chart-section">
        <h3 className="section-label">{t.compare.passProfile}</h3>
        <ComparePassGridTable metrics={passGrid} nameA={nameA} nameB={nameB} />
      </section>
    </div>
  );
}
