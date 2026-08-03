import type { XpBar } from "@/lib/api";

export function XpProfileBars({ bars }: { bars: XpBar[] }) {
  return (
    <div className="xp-bars">
      {bars.map((bar) => (
        <div key={bar.key} className="xp-bar-row">
          <div className="xp-bar-label">{bar.label}</div>
          <div className="xp-bar-track">
            <div className="xp-bar-fill" style={{ width: `${Math.min(100, (bar.value ?? 0) * 10)}%` }} />
          </div>
          <div className="xp-bar-value">{bar.value != null ? bar.value.toFixed(1) : "—"}</div>
        </div>
      ))}
    </div>
  );
}
