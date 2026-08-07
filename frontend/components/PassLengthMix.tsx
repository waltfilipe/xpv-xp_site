"use client";

import { Tooltip } from "@/components/ui/Tooltip";
import { useI18n } from "@/lib/i18n/context";

const REF_CENTER_PCT = 11.4;

export type PassLengthData = {
  long_pass_share_pct?: number | null;
  long_pass_share_ref_avg_pct?: number | null;
  long_pass_share_pctile?: number | null;
};

export function PassLengthMix({ data }: { data: PassLengthData }) {
  const { t } = useI18n();
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
        <span className="pass-mix-title">{t.passLength.title}</span>
      </div>

      <div className="pass-mix-track">
        <span
          className="pass-mix-center"
          style={{ left: `${refPos}%` }}
          title={t.passLength.leagueRef(REF_CENTER_PCT)}
        />
        <span
          className="pass-mix-marker"
          style={{ left: `${playerPos}%` }}
          title={t.passLength.playerRef(share.toFixed(1))}
        />
      </div>

      <div className="pass-mix-axis">
        <span className="axis-short">{t.passLength.short}</span>
        <span className="axis-long">{t.passLength.long}</span>
      </div>

      <div className="pass-mix-legend">
        <span className="legend-short"><strong>{shortShare.toFixed(1)}%</strong> {t.passLength.short.toLowerCase()}</span>
        <span className="legend-long"><strong>{share.toFixed(1)}%</strong> {t.passLength.long.toLowerCase()}</span>
      </div>
    </div>
  );

  return <Tooltip content={t.passLength.tooltip} block>{card}</Tooltip>;
}
