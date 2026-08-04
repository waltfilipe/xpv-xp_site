import { PassLengthMix } from "@/components/PassLengthMix";
import { RoundGradeChart } from "@/components/RoundGradeChart";
import { XpProfileBars } from "@/components/XpProfileBars";
import type { PlayerProfile } from "@/lib/api";
import { XP_INDEX_TIER_LABELS, xpIndexTierClass } from "@/lib/gradeColors";
import { INDEX_TOOLTIPS } from "@/lib/tooltips";

type Props = {
  profile: PlayerProfile;
  accent?: string;
};

function IndexRow({
  label,
  tier,
  tierKey,
  icon,
}: {
  label: string;
  tier?: string | null;
  tierKey: string;
  icon: string;
}) {
  const tierLabel = XP_INDEX_TIER_LABELS[tier ?? "mid"] ?? tier ?? "—";
  const tip = INDEX_TOOLTIPS[tierKey] ?? INDEX_TOOLTIPS[label] ?? "";

  return (
    <div className={`xp-index-row ${xpIndexTierClass(tier)}`} title={tip}>
      <span className="xp-index-row-icon">
        <i className={`fa-solid ${icon}`} />
      </span>
      <span className="xp-index-row-name">{label}</span>
      <span className="xp-index-row-sep" aria-hidden="true" />
      <span className="xp-index-row-val">{tierLabel}</span>
    </div>
  );
}

export function ReportXpPanel({ profile, accent = "#a78bfa" }: Props) {
  const indices = profile.xp_indices ?? [];
  const roundGrades = profile.xp_round_grades ?? [];

  return (
    <div className="player-card xp-profile-card report-xp-card">
      <h3 className="section-label">xP Profile</h3>
      <XpProfileBars bars={profile.xp_bars} />

      {indices.length > 0 && (
        <div className="xp-indices-panel report-xp-indices">
          <h4 className="section-label-sm">xP Indices</h4>
          <div className="xp-indices-list">
            {indices.map((item) => (
              <div key={item.key}>
                <IndexRow
                  label={item.label}
                  tier={item.tier}
                  tierKey={item.tier_key ?? item.label}
                  icon={item.icon ?? "fa-circle"}
                />
                {item.key === "consistency" && roundGrades.length > 0 && (
                  <RoundGradeChart points={roundGrades} accent={accent} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <PassLengthMix data={profile} />
    </div>
  );
}
