"use client";

import { PassLengthMix } from "@/components/PassLengthMix";
import { XpProfileBars } from "@/components/XpProfileBars";
import type { PlayerProfile } from "@/lib/api";
import { XpIndicesPanel } from "@/components/XpIndicesPanel";
import { useI18n } from "@/lib/i18n/context";

type Props = {
  profile: PlayerProfile;
  accent?: string;
  expandAll?: boolean;
};

export function ReportXpPanel({ profile, accent = "#a78bfa", expandAll = false }: Props) {
  const { t } = useI18n();

  return (
    <div className="player-card xp-profile-card report-xp-card">
      <h3 className="section-label">{t.profile.xpProfile}</h3>
      <XpProfileBars bars={profile.xp_bars} />

      {(profile.xp_indices?.length ?? 0) > 0 && (
        <XpIndicesPanel
          indices={profile.xp_indices ?? []}
          roundGrades={profile.xp_round_grades ?? []}
          accent={accent}
          expandAll={expandAll}
        />
      )}

      <PassLengthMix data={profile} />
    </div>
  );
}
