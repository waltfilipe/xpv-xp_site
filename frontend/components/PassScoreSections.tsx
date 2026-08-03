import type { PassScoreSection } from "@/lib/api";
import { gradeColor } from "@/lib/gradeColors";

const COMPONENT_LABELS: Record<string, string> = {
  passes_total: "Passes / game",
  long_balls: "Long passes / game",
  xpass_coe_pct: "COE",
  xpass_long_coe_pct: "COE long passes",
  progressive_passes: "Progressive passes / game",
  final_third_passes: "Passes into final third / game",
  key_passes: "Key passes / game",
  passes_to_box: "Passes into box / game",
  special_line_break_p90: "Line breaking passes / game",
  test_impact_v2_start_final_third_p90: "Impact from final third / game",
};

function fmtVal(v: unknown): string {
  if (v == null) return "—";
  if (typeof v === "number") return v.toFixed(2);
  return String(v);
}

export function PassScoreSections({ sections }: { sections: PassScoreSection[] }) {
  return (
    <div className="pass-scores-panel">
      {sections.map((s, i) => {
        const score = s.display_score ?? 0;
        const color = gradeColor(score);
        return (
          <details key={s.title} className="grade-accordion" open={i === 0}>
            <summary>
              <i className="fa-solid fa-chevron-right grade-arrow" aria-hidden="true" />
              <div className="grade-summary-main">
                <div className="grade-summary-top">
                  <span className="grade-card-title">{s.title}</span>
                  <span className="grade-letter" style={{ color }}>{s.letter ?? "—"}</span>
                  <span className="grade-card-score" style={{ color }}>{s.display_score != null ? s.display_score.toFixed(1) : "—"}</span>
                </div>
              </div>
            </summary>
            <div className="grade-accordion-body">
              {s.components.map((c) => (
                <div key={c.key} className="metric-line">
                  <span>{COMPONENT_LABELS[c.key] ?? c.key.replace(/_/g, " ")}</span>
                  <span className="stat-val">{fmtVal(c.value)}</span>
                </div>
              ))}
            </div>
          </details>
        );
      })}
    </div>
  );
}
