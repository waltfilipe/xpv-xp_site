"use client";

import { Tooltip } from "@/components/ui/Tooltip";
import { PASS_LENGTH_TOOLTIP } from "@/lib/tooltips";

const REF_CENTER_PCT = 11.4;

export type PassLengthData = {
  long_pass_share_pct?: number | null;
  long_pass_share_ref_avg_pct?: number | null;
  long_pass_share_pctile?: number | null;
};

export function PassLengthMix({ data }: { data: PassLengthData }) {
  const share = data.long_pass_share_pct;
  if (share == null) return null;

  const shortShare = 100 - share;
  const playerPos = Math.max(4, Math.min(96, share));
  const refPos = Math.max(4, Math.min(96, REF_CENTER_PCT));

  const card = (
    <div className="pass-mix-card">
      <div className="pass-mix-head">
        <span className="pass-mix-icon">
          <i className="fa-solid fa-ruler-horizontal" />
        </span>
        <span className="pass-mix-title">Pass Length Mix</span>
      </div>

      <div className="pass-mix-track">
        <span
          className="pass-mix-center"
          style={{ left: `${refPos}%` }}
          title={`League reference: ${REF_CENTER_PCT}% long`}
        />
        <span
          className="pass-mix-marker"
          style={{ left: `${playerPos}%` }}
          title={`Player: ${share.toFixed(1)}% long`}
        />
      </div>

      <div className="pass-mix-axis">
        <span className="axis-short">Short</span>
        <span className="axis-long">Long</span>
      </div>

      <div className="pass-mix-legend">
        <span className="legend-short"><strong>{shortShare.toFixed(1)}%</strong> short</span>
        <span className="legend-long"><strong>{share.toFixed(1)}%</strong> long</span>
      </div>
    </div>
  );

  return <Tooltip content={PASS_LENGTH_TOOLTIP} block>{card}</Tooltip>;
}
