import type { CompareMetric } from "@/lib/api";
import { GradeBadge } from "@/components/ui/GradeBadge";
import { Tooltip } from "@/components/ui/Tooltip";
import { gradeColor } from "@/lib/gradeColors";
import { PASS_SCORE_TOOLTIPS } from "@/lib/tooltips";

function DualBar({ metric, colorA, colorB }: { metric: CompareMetric; colorA: string; colorB: string }) {
  const max = Math.max(metric.value_a ?? 0, metric.value_b ?? 0, 0.01);
  const pctA = ((metric.value_a ?? 0) / max) * 100;
  const pctB = ((metric.value_b ?? 0) / max) * 100;
  const winnerA = metric.winner === "a";
  const winnerB = metric.winner === "b";

  return (
    <div className="compare-metric">
      <div className="compare-metric-label">{metric.label}</div>
      <div className="compare-bars">
        <div className={`compare-bar-row${winnerA ? " compare-bar-winner" : ""}`}>
          <div className="compare-bar-fill" style={{ width: `${pctA}%`, background: colorA }} />
          <span className="tabular">{metric.value_a != null ? metric.value_a.toFixed(1) : "—"}</span>
        </div>
        <div className={`compare-bar-row${winnerB ? " compare-bar-winner" : ""}`}>
          <div className="compare-bar-fill" style={{ width: `${pctB}%`, background: colorB }} />
          <span className="tabular">{metric.value_b != null ? metric.value_b.toFixed(1) : "—"}</span>
        </div>
      </div>
    </div>
  );
}

export function CompareCenter({ pillars, passGrid }: { pillars: CompareMetric[]; passGrid: CompareMetric[] }) {
  const colorA = "#a78bfa";
  const colorB = "#86efac";

  return (
    <div className="compare-center">
      <h3 className="section-label">xP Pillars</h3>
      {pillars.map((m) => <DualBar key={m.key} metric={m} colorA={colorA} colorB={colorB} />)}

      <h3 className="section-label" style={{ marginTop: "1.25rem" }}>Pass Profile</h3>
      <div className="compare-pass-grid">
        {passGrid.map((m) => {
          const scoreA = m.value_a ?? 0;
          const scoreB = m.value_b ?? 0;
          return (
            <Tooltip key={m.key} content={PASS_SCORE_TOOLTIPS[m.label] ?? ""}>
              <div className="compare-pass-cell">
                <div className="compare-metric-label">{m.label}</div>
                <div className="compare-letters">
                  <span className={`compare-grade-side${m.winner === "a" ? " compare-grade-winner" : ""}`}>
                    <GradeBadge letter={m.letter_a} displayScore={m.value_a} size="sm" />
                    <span className="tabular grade-a-score" style={{ color: gradeColor(scoreA) }}>
                      {m.value_a?.toFixed(1) ?? "—"}
                    </span>
                  </span>
                  <span className={`compare-grade-side${m.winner === "b" ? " compare-grade-winner" : ""}`}>
                    <GradeBadge letter={m.letter_b} displayScore={m.value_b} size="sm" />
                    <span className="tabular grade-b-score" style={{ color: gradeColor(scoreB) }}>
                      {m.value_b?.toFixed(1) ?? "—"}
                    </span>
                  </span>
                </div>
              </div>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}
