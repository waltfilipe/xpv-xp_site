import type { PassScoreSection } from "@/lib/api";

export function PassScoreSections({ sections }: { sections: PassScoreSection[] }) {
  return (
    <div className="pass-scores">
      {sections.map((s) => (
        <details key={s.title} className="pass-score-card" open={s.title === "Volume"}>
          <summary>
            <span className="pass-score-title">{s.title}</span>
            <span className="pass-score-grade">{s.letter ?? "—"}</span>
            <span className="pass-score-num">{s.display_score != null ? s.display_score.toFixed(1) : "—"}</span>
          </summary>
          <ul className="pass-score-components">
            {s.components.map((c) => (
              <li key={c.key}>
                <span className="muted">{c.key.replace(/_/g, " ")}</span>
                <span>{c.value != null ? String(typeof c.value === "number" ? (c.value as number).toFixed(2) : c.value) : "—"}</span>
              </li>
            ))}
          </ul>
        </details>
      ))}
    </div>
  );
}
