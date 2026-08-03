"use client";

import { barPosition, gradeColor, gradientBarTier } from "@/lib/gradeColors";
import { Tooltip } from "@/components/ui/Tooltip";

type Props = {
  label: string;
  value: number | null | undefined;
  icon?: string;
  tooltip?: string;
};

export function XpGradientBar({ label, value, icon, tooltip }: Props) {
  const pos = barPosition(value);
  const tier = value != null ? gradientBarTier(value) : "cool";
  const display = value != null ? value.toFixed(1) : "—";
  const glowColor = gradeColor(value ?? 0, 10);

  const bar = (
    <div className={`xp-gradient-bar-shell xp-gradient-bar-tier-${tier}`}>
      <div className="xp-gradient-bar-head">
        {icon && (
          <span className="xp-gradient-bar-icon">
            <i className={`fa-solid ${icon}`} />
          </span>
        )}
        <span className="xp-gradient-bar-label">{label}</span>
        <span className="xp-gradient-bar-value tabular">{display}</span>
      </div>
      <div className={`xp-gradient-bar-track${value == null ? " xp-gradient-bar-empty" : ""}`}>
        <div className="xp-gradient-bar-clip">
          {value != null && (
            <span
              className="xp-gradient-bar-glow"
              style={{ left: `${pos}%`, background: glowColor }}
            />
          )}
        </div>
        {value != null && (
          <span className="xp-gradient-bar-marker" style={{ left: `${pos}%` }} />
        )}
      </div>
    </div>
  );

  return tooltip ? <Tooltip content={tooltip} block>{bar}</Tooltip> : bar;
}
