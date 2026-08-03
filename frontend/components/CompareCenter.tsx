import type { CompareMetric } from "@/lib/api";

function DualBar({ metric, colorA, colorB }: { metric: CompareMetric; colorA: string; colorB: string }) {
  const max = Math.max(metric.value_a ?? 0, metric.value_b ?? 0, 0.01);
  const pctA = ((metric.value_a ?? 0) / max) * 100;
  const pctB = ((metric.value_b ?? 0) / max) * 100;
  return (
    <div className="compare-metric">
      <div className="compare-metric-label">{metric.label}</div>
      <div className="compare-bars">
        <div className="compare-bar-row">
          <div className="compare-bar-fill" style={{ width: `${pctA}%`, background: colorA }} />
          <span>{metric.value_a != null ? metric.value_a.toFixed(1) : "—"}</span>
        </div>
        <div className="compare-bar-row">
          <div className="compare-bar-fill" style={{ width: `${pctB}%`, background: colorB }} />
          <span>{metric.value_b != null ? metric.value_b.toFixed(1) : "—"}</span>
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
      <h3>xP Pillars</h3>
      {pillars.map((m) => <DualBar key={m.key} metric={m} colorA={colorA} colorB={colorB} />)}
      <h3 style={{ marginTop: "1.5rem" }}>Pass Profile</h3>
      <div className="compare-pass-grid">
        {passGrid.map((m) => (
          <div key={m.key} className="compare-pass-cell">
            <div className="compare-metric-label">{m.label}</div>
            <div className="compare-letters">
              <span className="grade-a">{m.letter_a ?? "—"} <small>{m.value_a?.toFixed(1) ?? "—"}</small></span>
              <span className="grade-b">{m.letter_b ?? "—"} <small>{m.value_b?.toFixed(1) ?? "—"}</small></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
