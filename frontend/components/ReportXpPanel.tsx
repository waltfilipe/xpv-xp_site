import { PassLengthMix } from "@/components/PassLengthMix";
import { ConsistencyAccordion } from "@/components/ConsistencyAccordion";
import { ImpactAccordion } from "@/components/ImpactAccordion";
import { XpProfileBars } from "@/components/XpProfileBars";
import type { PlayerProfile } from "@/lib/api";
import { XpIndicesPanel } from "@/components/XpIndicesPanel";

type Props = {
  profile: PlayerProfile;
  accent?: string;
  expandAll?: boolean;
};

export function ReportXpPanel({ profile, accent = "#a78bfa", expandAll = false }: Props) {
  return (
    <div className="player-card xp-profile-card report-xp-card">
      <h3 className="section-label">xP Profile</h3>
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
