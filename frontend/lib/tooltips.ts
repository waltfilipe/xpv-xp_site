export const XP_PROFILE_BAR_TOOLTIPS: Record<string, string> = {
  xp_activity_display:
    "How much xPV the player generates per game — passing volume times destination value.",
  xp_efficiency_display:
    "75% xPass residual per 90 minutes and 25% COE stratum (short + total passes) vs. peers in the same pass-volume quartile.",
  xp_edge_display:
    "Mean z-score of xPV per completed pass, Pass Impact v2 per game, and impact-pass rate (33/33/33) within the position group.",
};

export const PASS_SCORE_TOOLTIPS: Record<string, string> = {
  Volume: "Within-position composite of passes and long passes per game.",
  Efficiency: "Within-position composite of COE (completion over expected) on short passes and long passes.",
  "Build-up": "Within-position composite of progressive passes, final-third entries and line-breaking passes per game.",
  "Chance creation":
    "Within-position composite of key passes, passes into the box, and Test Impact v2 passes originating in the final third per game.",
  Impact:
    "Within-position composite of Test Impact v2 volume, attempt-pool completion and attempt-pool COE.",
  "Defensive Contribution":
    "League-scoped defensive score: 60% volume (tackles, interceptions, clearances, recoveries, aerials, blocks per 90) + 40% quality (tackle and aerial win %), minus error penalties, with a minutes confidence factor.",
};

export const COMPONENT_TOOLTIPS: Record<string, string> = {
  passes_total: "Passes attempted per 90 minutes.",
  long_balls: "Long passes (≥30 m) per 90 minutes.",
  xpass_coe_pct: "Completion over expected on short passes (< 30 m), in percentage points.",
  xpass_total_coe_pct: "Completion over expected on all pass attempts, in percentage points.",
  xpass_long_coe_pct: "Completion over expected on long passes (percentage points).",
  progressive_passes:
    "Progressive passes completed per game — advance ≥ 10 m toward goal, or ≥ 5 m inside the final third.",
  final_third_passes: "Passes completed into the final third (x ≥ 80 m) per game.",
  key_passes: "Passes leading to a shot per 90 minutes.",
  passes_to_box: "Passes completed into the box per 90 minutes.",
  special_line_break_p90: "Line-breaking passes per game — lateral exit bands, forward angle ≤ 50°.",
  test_impact_v2_start_final_third_p90:
    "Impact passes per game originating in the final third (x_start ≥ 72 m).",
  def_won_tackle_p90: "Successful tackles per 90 minutes.",
  def_interception_p90: "Interceptions per 90 minutes.",
  def_clearance_p90: "Clearances per 90 minutes.",
  def_recovery_p90: "Ball recoveries per 90 minutes.",
  def_aerial_won_p90: "Aerial duels won per 90 minutes.",
  def_block_p90: "Blocks per 90 minutes.",
  def_tackle_won_pct: "Share of tackles won (minimum 10 attempts).",
  def_aerial_won_pct: "Share of aerial duels won (minimum 10 attempts).",
};

export const COMPONENT_LABELS: Record<string, string> = {
  passes_total: "Passes / game",
  long_balls: "Long passes / game",
  xpass_coe_pct: "%Efficiency - Short Pass",
  xpass_long_coe_pct: "%Efficiency - Long Pass",
  progressive_passes: "Progressive passes / game",
  final_third_passes: "Passes into final third / game",
  key_passes: "Key passes / game",
  passes_to_box: "Passes into box / game",
  special_line_break_p90: "Line breaking passes / game",
  test_impact_v2_start_final_third_p90: "Impact Passes / game",
  def_won_tackle_p90: "Won tackles / 90",
  def_interception_p90: "Interceptions / 90",
  def_clearance_p90: "Clearances / 90",
  def_recovery_p90: "Recoveries / 90",
  def_aerial_won_p90: "Aerials won / 90",
  def_block_p90: "Blocks / 90",
  def_tackle_won_pct: "Tackle won %",
  def_aerial_won_pct: "Aerial won %",
};

export const INDEX_TOOLTIPS: Record<string, string> = {
  Consistency:
    "Each match gets a 3–9 grade from game xP vs. all peer matches in the position. Badge when dispersion of those grades is low (MAD).",
  Impact:
    "50% xPV per completed pass and 50% mean (xP − xP expected) per pass — destination value plus beating the geometric model.",
  xp_idx_consistency:
    "Each match gets a 3–9 grade from game xP vs. all peer matches in the position. Badge when dispersion of those grades is low (MAD).",
  xp_idx_impact:
    "50% xPV per completed pass and 50% mean (xP − xP expected) per pass — destination value plus beating the geometric model.",
  xp_idx_defense:
    "League-scoped defensive score: volume (tackles, interceptions, clearances, recoveries per 90) plus quality (tackle and aerial win %), minus error penalties.",
};

export const PASS_GRADE_TOOLTIP =
  "Overall pass grade from the xP model — composite of volume, efficiency, build-up and chance creation within the position pool.";

export const PASS_LENGTH_TOOLTIP =
  "Share of passes ≥ 30 m among all attempts. Reference line marks the league midpoint (~11.4% long).";
