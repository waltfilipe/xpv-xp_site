import type { XpBar } from "@/lib/api";
import { barWidth } from "@/lib/gradeColors";

const ICONS: Record<string, string> = {
  xp_activity_display: "fa-chart-simple",
  xp_efficiency_display: "fa-gauge-high",
  xp_edge_display: "fa-bolt",
};

export function XpProfileBars({ bars }: { bars: XpBar[] }) {
  return (
    <div className="xp-profile-bars">
      {bars.map((bar) => (
        <div key={bar.key} className="xp-pillar">
          <div className="xp-pillar-head">
            <span className="xp-pillar-icon">
              <i className={`fa-solid ${ICONS[bar.key] ?? "fa-circle"}`} />
            </span>
            <span className="xp-pillar-label">{bar.label}</span>
            <span className="xp-pillar-value">{bar.value != null ? bar.value.toFixed(1) : "—"}</span>
          </div>
          <div className="xp-pillar-bar-track">
            <div className="xp-pillar-bar-fill" style={{ width: `${barWidth(bar.value, 10)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
