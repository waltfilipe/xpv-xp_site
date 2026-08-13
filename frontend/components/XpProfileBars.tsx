"use client";

import type { XpBar } from "@/lib/api";
import { XpHeatBar } from "@/components/ui/XpHeatBar";
import { Tooltip } from "@/components/ui/Tooltip";
import { translateXpBarLabel, useI18n } from "@/lib/i18n/context";

const ICONS: Record<string, string> = {
  xp_activity_display: "fa-chart-simple",
  xp_efficiency_display: "fa-gauge-high",
  xp_edge_display: "fa-bolt",
};

type Props = {
  bars: XpBar[];
  xpvPerGame?: number | null;
};

export function XpProfileBars({ bars, xpvPerGame }: Props) {
  const { t } = useI18n();

  function barTooltip(key: string): string {
    if (key === "xp_activity_display") {
      if (xpvPerGame != null && !Number.isNaN(xpvPerGame)) {
        return t.xpProfile.productivityTip(xpvPerGame.toFixed(2));
      }
      return t.xpProfile.productivityTip("—");
    }
    if (key === "xp_efficiency_display") return t.xpProfile.precisionTip;
    if (key === "xp_edge_display") return t.xpProfile.lethalityTip;
    return "";
  }

  return (
    <div className="xp-profile-bars">
      {bars.map((bar) => (
        <Tooltip key={bar.key} content={barTooltip(bar.key)} block>
          <div className="xp-metric-block">
            <div className="pass-metric-head">
              <span className="pass-metric-label xp-metric-label">
                {ICONS[bar.key] && (
                  <i className={`fa-solid ${ICONS[bar.key]} xp-metric-icon`} aria-hidden="true" />
                )}
                {translateXpBarLabel(bar.key, t)}
              </span>
            </div>
            <XpHeatBar value={bar.value} />
          </div>
        </Tooltip>
      ))}
    </div>
  );
}
