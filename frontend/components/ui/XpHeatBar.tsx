"use client";

import { barPosition, heatBarColor } from "@/lib/gradeColors";

type Props = {
  value: number | null | undefined;
};

export function XpHeatBar({ value }: Props) {
  const pos = barPosition(value);
  const endColor = value != null ? heatBarColor(pos) : "#64748b";

  return (
    <div className={`xp-heat-bar metric-gradient-bar${value == null ? " xp-heat-bar-empty" : ""}`}>
      <div className="xp-heat-bar-track metric-gradient-bar-track">
        <div className="xp-heat-bar-spectrum metric-gradient-bar-spectrum" aria-hidden="true" />
        {value != null && (
          <div
            className="xp-heat-bar-fill metric-gradient-bar-fill"
            style={{
              width: `${pos}%`,
              background: `linear-gradient(90deg, rgba(100, 116, 139, 0.45) 0%, rgba(250, 204, 21, 0.55) 52%, ${endColor}99 100%)`,
            }}
          />
        )}
        {value != null && (
          <span
            className="xp-heat-bar-marker metric-gradient-bar-marker"
            style={{ left: `${pos}%` }}
          />
        )}
      </div>
    </div>
  );
}
