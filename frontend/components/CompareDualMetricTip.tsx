import { formatMetric } from "@/lib/formatters";
import { COMPONENT_LABELS } from "@/lib/tooltips";

export type CompareComponentMetric = {
  key: string;
  label?: string;
  value_a?: number | null;
  value_b?: number | null;
  winner?: "a" | "b" | "tie";
};

type Props = {
  nameA: string;
  nameB: string;
  components: CompareComponentMetric[];
};

function WinnerArrow({ winner, side }: { winner?: "a" | "b" | "tie"; side: "a" | "b" }) {
  if (!winner || winner === "tie") return null;
  if (winner === side) {
    return <i className="fa-solid fa-arrow-up compare-dual-tip-arrow compare-dual-tip-arrow-win" aria-hidden="true" />;
  }
  return <i className="fa-solid fa-arrow-down compare-dual-tip-arrow compare-dual-tip-arrow-lose" aria-hidden="true" />;
}

export function CompareDualMetricTip({ nameA, nameB, components }: Props) {
  if (!components.length) return null;

  return (
    <div className="compare-dual-tip">
      <div className="compare-dual-tip-head">
        <span className="compare-dual-tip-player compare-dual-tip-player-a">{nameA}</span>
        <span className="compare-dual-tip-player compare-dual-tip-player-b">{nameB}</span>
      </div>
      {components.map((comp) => (
        <div key={comp.key} className="compare-dual-tip-row">
          <span className="compare-dual-tip-label">{comp.label ?? COMPONENT_LABELS[comp.key] ?? comp.key}</span>
          <span className={`compare-dual-tip-val compare-dual-tip-val-a${comp.winner === "a" ? " is-winner" : ""}`}>
            <WinnerArrow winner={comp.winner} side="a" />
            <span className="tabular">{formatMetric(comp.value_a, comp.key)}</span>
          </span>
          <span className={`compare-dual-tip-val compare-dual-tip-val-b${comp.winner === "b" ? " is-winner" : ""}`}>
            <WinnerArrow winner={comp.winner} side="b" />
            <span className="tabular">{formatMetric(comp.value_b, comp.key)}</span>
          </span>
        </div>
      ))}
    </div>
  );
}
