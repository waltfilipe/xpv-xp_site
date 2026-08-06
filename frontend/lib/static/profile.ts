import type { PassScoreSection, PlayerProfile, XpBar, XpIndexItem } from "@/lib/api";
import type { PoolPlayer } from "@/lib/static/pool";
import { heatmapUrl } from "@/lib/static/pool";

const XP_PA_REGULAR_SCORE_SPECS: {
  display: string;
  index: string;
  letter: string;
  title: string;
  components: string[];
}[] = [
  {
    display: "pass_volume_display",
    index: "pass_volume_index",
    letter: "pass_volume_letter",
    title: "Volume",
    components: ["passes_total", "long_balls"],
  },
  {
    display: "pass_efficiency_display",
    index: "pass_efficiency_index",
    letter: "pass_efficiency_letter",
    title: "Efficiency",
    components: ["xpass_coe_pct", "xpass_long_coe_pct"],
  },
  {
    display: "pass_buildup_display",
    index: "pass_buildup_index",
    letter: "pass_buildup_letter",
    title: "Build-up",
    components: ["progressive_passes", "final_third_passes", "special_line_break_p90"],
  },
  {
    display: "pass_chance_creation_display",
    index: "pass_chance_creation_index",
    letter: "pass_chance_creation_letter",
    title: "Chance creation",
    components: ["key_passes", "passes_to_box", "test_impact_v2_start_final_third_p90"],
  },
];

const XP_PROFILE_BAR_KEYS = ["xp_activity_display", "xp_efficiency_display", "xp_edge_display"] as const;
const XP_PROFILE_BAR_LABELS: Record<string, string> = {
  xp_activity_display: "Productivity",
  xp_efficiency_display: "Precision",
  xp_edge_display: "Lethality",
};

function buildPassScoreSections(xp: PoolPlayer): PassScoreSection[] {
  return XP_PA_REGULAR_SCORE_SPECS.map((spec) => ({
    title: spec.title,
    display_score: xp[spec.display] as number | null | undefined,
    letter: xp[spec.letter] as string | null | undefined,
    rank: xp[`${spec.index}_rank_in_group`] as number | null | undefined,
    rank_pool: xp[`${spec.index}_rank_pool_in_group`] as number | null | undefined,
    components: spec.components.map((ck) => ({
      key: ck,
      value: xp[ck],
      rank: xp[`${ck}_rank_in_group`] as number | null | undefined,
      rank_pool: xp[`${ck}_rank_pool_in_group`] as number | null | undefined,
    })),
  }));
}

function buildXpProfileBars(xp: PoolPlayer): XpBar[] {
  return XP_PROFILE_BAR_KEYS.map((key) => ({
    key,
    label: XP_PROFILE_BAR_LABELS[key] ?? key,
    value: xp[key] as number | null | undefined,
    rank: xp[`${key}_rank_in_group`] as number | null | undefined,
    rank_pool: xp[`${key}_rank_pool_in_group`] as number | null | undefined,
  }));
}

function buildXpIndices(xp: PoolPlayer): XpIndexItem[] {
  return [
    {
      key: "consistency",
      label: "Consistency",
      tier: xp.xp_idx_consistency_tier as string | null | undefined,
      tier_key: "xp_idx_consistency",
      value: xp.xp_game_consistency_score as number | null | undefined,
      icon: "fa-wave-square",
    },
    {
      key: "impact",
      label: "Impact",
      tier: xp.xp_idx_impact_tier as string | null | undefined,
      tier_key: "xp_idx_impact",
      value: xp.test_impact_v2_p90 as number | null | undefined,
      icon: "fa-crosshairs",
    },
  ];
}

export function buildProfilePayload(
  playerId: string,
  playersById: Record<string, PoolPlayer>,
  positionFamily: string,
): PlayerProfile | null {
  const rated = playersById[playerId];
  if (!rated) return null;

  const xp = { ...rated };
  const merged = { ...rated };

  return {
    player: merged,
    xp,
    pass_scores: buildPassScoreSections(xp),
    xp_bars: buildXpProfileBars(xp),
    origin_heatmap_url: heatmapUrl(positionFamily, playerId),
    long_pass_share_pct: xp.long_pass_share_pct as number | null | undefined,
    long_pass_share_ref_avg_pct: xp.long_pass_share_ref_avg_pct as number | null | undefined,
    long_pass_share_pctile: xp.long_pass_share_pctile as number | null | undefined,
    xp_pass_rating: xp.xp_pass_rating as number | null | undefined,
    xp_game_consistency_score: xp.xp_game_consistency_score as number | null | undefined,
    test_impact_v2_p90: xp.test_impact_v2_p90 as number | null | undefined,
    xp_indices: buildXpIndices(xp),
  };
}
