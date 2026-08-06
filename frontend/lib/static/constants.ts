export const STATIC_ROOT = "/static/data";

export const LETTER_GRADE_SCORES: Record<string, number> = {
  "A+": 8.9,
  A: 8.4,
  "A-": 7.9,
  "B+": 7.4,
  B: 6.9,
  "B-": 6.4,
  "C+": 5.9,
  C: 5.4,
  "C-": 4.9,
  D: 4.2,
};

export const PASS_SCORE_LETTER_FIELDS: Record<string, string> = {
  volume_grade: "pass_volume_letter",
  efficiency_grade: "pass_efficiency_letter",
  buildup_grade: "pass_buildup_letter",
  chance_grade: "pass_chance_creation_letter",
};

export const SCATTER_METRIC_LABELS: Record<string, string> = {
  xpass_coe_pct: "COE",
  test_impact_v2_p90: "Impact Passes",
  xpv_per_pass_p90: "xPV/Game",
  xpv_per_pass: "xPV/Pass",
  xp_per_90: "xP",
};

export const PLAYER_LIST_FIELDS = [
  "player_id",
  "player_name",
  "position",
  "position_group",
  "position_family",
  "league",
  "league_source",
  "age",
  "height",
  "nationality",
  "dominant_foot",
  "market_value",
  "market_value_eur",
  "contract_until",
  "photo_url",
  "pass_rating",
  "pass_rating_rank",
  "pass_rating_total",
  "progression_rating",
  "progression_rating_rank",
  "progression_rating_total",
  "total_passes",
  "total_xt",
  "xt_per_pass",
  "midfield_origin_profile",
  "eligible_for_rating",
  "xp_pass_rating",
  "team",
] as const;
