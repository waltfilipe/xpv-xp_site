import type { CompareMetric } from "@/lib/api";
import { ComparePillarBars } from "@/components/ComparePillarBars";
import { CompareRadarChart } from "@/components/CompareRadarChart";

type Props = {
  pillars: CompareMetric[];
  passGrid: CompareMetric[];
  nameA: string;
  nameB: string;
};

export function CompareCenter({ pillars, passGrid, nameA, nameB }: Props) {
  return (
    <div className="compare-center">
      <section className="compare-chart-section">
        <h3 className="section-label">xP Pillars</h3>
        <ComparePillarBars metrics={pillars} nameA={nameA} nameB={nameB} />
      </section>

      <section className="compare-chart-section">
        <h3 className="section-label">Pass Profile</h3>
        <CompareRadarChart metrics={passGrid} nameA={nameA} nameB={nameB} />
      </section>
    </div>
  );
}
