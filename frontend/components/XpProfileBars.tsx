import type { XpBar } from "@/lib/api";
import { XpGradientBar } from "@/components/XpGradientBar";
import { XP_PROFILE_BAR_TOOLTIPS } from "@/lib/tooltips";

const ICONS: Record<string, string> = {
  xp_activity_display: "fa-chart-simple",
  xp_efficiency_display: "fa-gauge-high",
  xp_edge_display: "fa-bolt",
};

export function XpProfileBars({ bars }: { bars: XpBar[] }) {
  return (
    <div className="xp-profile-bars">
      {bars.map((bar) => (
        <XpGradientBar
          key={bar.key}
          label={bar.label}
          value={bar.value}
          icon={ICONS[bar.key] ?? "fa-circle"}
          tooltip={XP_PROFILE_BAR_TOOLTIPS[bar.key]}
        />
      ))}
    </div>
  );
}
