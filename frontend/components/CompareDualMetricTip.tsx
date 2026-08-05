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

type WinSide = "a" | "b" | "tie";
type WinStrength = "tie" | "a" | "b" | "a_strong" | "b_strong";

function compareStrength(
  valueA: number | null | undefined,
  valueB: number | null | undefined,
): WinStrength {
  if (valueA == null || valueB == null) return "tie";
  if (valueA === valueB) return "tie";
  const max = Math.max(Math.abs(valueA), Math.abs(valueB));
  const diff = Math.abs(valueA - valueB);
  const ratio = max > 0 ? diff / max : 0;
  const strong = ratio >= 0.28 || (max > 0 && diff / max >= 0.22 && diff >= 0.35);
  if (valueA > valueB) return strong ? "a_strong" : "a";
  return strong ? "b_strong" : "b";
}

function WinnerArrows({ strength, side }: { strength: WinStrength; side: WinSide }) {
  if (strength === "tie") return null;
  const isWinner = strength === side || strength === `${side}_strong`;
  if (!isWinner) {
    return <i className="fa-solid fa-arrow-down compare-dual-tip-arrow compare-dual-tip-arrow-lose" aria-hidden="true" />;
  }
  if (strength === `${side}_strong`) {
    return (
      <span className="compare-dual-tip-arrow-stack" aria-hidden="true">
        <i className="fa-solid fa-arrow-up compare-dual-tip-arrow compare-dual-tip-arrow-win" />
        <i className="fa-solid fa-arrow-up compare-dual-tip-arrow compare-dual-tip-arrow-win" />
      </span>
    );
  }
  return <i className="fa-solid fa-arrow-up compare-dual-tip-arrow compare-dual-tip-arrow-win" aria-hidden="true" />;
}

export function CompareDualMetricTip({ nameA, nameB, components }: Props) {
  if (!components.length) return null;

  return (
    <div className="compare-dual-tip">
      <div className="compare-dual-tip-cols">
        <div className="compare-dual-tip-col compare-dual-tip-col-a">
          <div className="compare-dual-tip-player">{nameA}</div>
          {components.map((comp) => {
            const strength = compareStrength(comp.value_a, comp.value_b);
            return (
              <div key={`a-${comp.key}`} className="compare-dual-tip-stat">
                <span className="compare-dual-tip-label">
                  {comp.label ?? COMPONENT_LABELS[comp.key] ?? comp.key}
                </span>
                <span className="compare-dual-tip-val">
                  <WinnerArrows strength={strength} side="a" />
                  <span className="tabular">{formatMetric(comp.value_a, comp.key)}</span>
                </span>
              </div>
            );
          })}
        </div>
        <div className="compare-dual-tip-col compare-dual-tip-col-b">
          <div className="compare-dual-tip-player">{nameB}</div>
          {components.map((comp) => {
            const strength = compareStrength(comp.value_a, comp.value_b);
            return (
              <div key={`b-${comp.key}`} className="compare-dual-tip-stat">
                <span className="compare-dual-tip-label">
                  {comp.label ?? COMPONENT_LABELS[comp.key] ?? comp.key}
                </span>
                <span className="compare-dual-tip-val">
                  <WinnerArrows strength={strength} side="b" />
                  <span className="tabular">{formatMetric(comp.value_b, comp.key)}</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
