import type { CompareMetric, ComparePayload } from "@/lib/api";
import type { PoolPlayer } from "@/lib/static/pool";
import { heatmapUrl } from "@/lib/static/pool";

const COMPARE_PILLAR_SPECS: [string, string][] = [
  ["xp_activity_display", "Productivity"],
  ["xp_efficiency_display", "Precision"],
  ["xp_edge_display", "Lethality"],
];

const COMPARE_PASS_GRID_SPECS: [string, string][] = [
  ["pass_volume_display", "Volume"],
  ["pass_efficiency_display", "Efficiency"],
  ["pass_buildup_display", "Build-up"],
  ["pass_chance_creation_display", "Chance creation"],
];

function metricValue(source: PoolPlayer, key: string): number | null {
  const val = source[key];
  if (val === null || val === undefined) return null;
  const n = parseFloat(String(val));
  return Number.isFinite(n) ? n : null;
}

function compareWinner(a: number | null, b: number | null): "a" | "b" | "tie" {
  const av = a ?? 0;
  const bv = b ?? 0;
  if (av > bv) return "a";
  if (bv > av) return "b";
  return "tie";
}

function buildXpBars(xp: PoolPlayer) {
  return [
    { key: "xp_activity_display", label: "Productivity", value: xp.xp_activity_display as number | null },
    { key: "xp_efficiency_display", label: "Precision", value: xp.xp_efficiency_display as number | null },
    { key: "xp_edge_display", label: "Lethality", value: xp.xp_edge_display as number | null },
  ];
}

function playerCard(pid: string, source: PoolPlayer, xp: PoolPlayer) {
  return {
    player_id: pid,
    player_name: source.player_name,
    team: source.team,
    position: source.position,
    position_group: source.position_group,
    photo_url: source.photo_url,
    market_value: source.market_value,
    contract_until: source.contract_until,
    dominant_foot: source.dominant_foot,
    age: source.age,
    height: source.height,
    nationality: source.nationality,
    minutes: source.minutes,
    minutes_pct: source.minutes_pct,
    long_pass_share_pct: xp.long_pass_share_pct,
    long_pass_share_ref_avg_pct: xp.long_pass_share_ref_avg_pct,
    long_pass_share_pctile: xp.long_pass_share_pctile,
    xp_bars: buildXpBars(xp),
    xp_game_consistency_score: xp.xp_game_consistency_score,
    test_impact_v2_p90: xp.test_impact_v2_p90,
  };
}

export function buildComparePayload(
  playerAId: string,
  playerBId: string,
  playersById: Record<string, PoolPlayer>,
  positionFamily: string,
): ComparePayload | null {
  const xpA = playersById[playerAId];
  const xpB = playersById[playerBId];
  if (!xpA || !xpB) return null;

  const sourceA = { ...xpA };
  const sourceB = { ...xpB };

  const pillars: CompareMetric[] = COMPARE_PILLAR_SPECS.map(([key, label]) => {
    const valA = metricValue(sourceA, key);
    const valB = metricValue(sourceB, key);
    return { key, label, value_a: valA, value_b: valB, winner: compareWinner(valA, valB) };
  });

  const passGrid: CompareMetric[] = COMPARE_PASS_GRID_SPECS.map(([key, label]) => {
    const valA = metricValue(sourceA, key);
    const valB = metricValue(sourceB, key);
    const letterKey = key.replace("_display", "_letter");
    return {
      key,
      label,
      value_a: valA,
      value_b: valB,
      letter_a: sourceA[letterKey] as string | null | undefined,
      letter_b: sourceB[letterKey] as string | null | undefined,
      winner: compareWinner(valA, valB),
    };
  });

  return {
    player_a: playerCard(playerAId, sourceA, xpA),
    player_b: playerCard(playerBId, sourceB, xpB),
    heatmap_a_url: heatmapUrl(positionFamily, playerAId),
    heatmap_b_url: heatmapUrl(positionFamily, playerBId),
    pillars,
    pass_grid: passGrid,
  };
}
