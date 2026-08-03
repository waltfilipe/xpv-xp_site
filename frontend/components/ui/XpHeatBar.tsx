"use client";

import { barPosition, heatBarColor } from "@/lib/gradeColors";

type Props = {
  value: number | null | undefined;
};

export function XpHeatBar({ value }: Props) {
  const pos = barPosition(value);
  const markerColor = value != null ? heatBarColor(pos) : "#64748b";

  return (
    <div className={`xp-heat-bar${value == null ? " xp-heat-bar-empty" : ""}`}>
      <div className="xp-heat-bar-track">
        <div className="xp-heat-bar-spectrum" aria-hidden="true" />
        {value != null && (
          <span
            className="xp-heat-bar-marker"
            style={{
              left: `${pos}%`,
              background: markerColor,
              boxShadow: `0 0 10px ${markerColor}55`,
            }}
          />
        )}
      </div>
    </div>
  );
}
