import type { ScatterData } from "@/lib/api";
import { SCATTER_METRIC_LABELS } from "@/lib/static/constants";
import type { PoolPlayer } from "@/lib/static/pool";

function metricRankPoolKey(player: PoolPlayer): string {
  return String(player.position_group || player.position || "CM");
}

function p30PassThresholds(players: PoolPlayer[], passesCol: string): Record<string, number> {
  const pools: Record<string, number[]> = {};
  for (const player of players) {
    const group = metricRankPoolKey(player);
    if (!pools[group]) pools[group] = [];
    pools[group].push(parseFloat(String(player[passesCol] ?? 0)));
  }
  const out: Record<string, number> = {};
  for (const [group, counts] of Object.entries(pools)) {
    if (counts.length === 0) {
      out[group] = 0;
      continue;
    }
    const sorted = [...counts].sort((a, b) => a - b);
    const idx = Math.floor(0.3 * (sorted.length - 1));
    out[group] = sorted[idx];
  }
  return out;
}

function scatterMeanPassDistance(row: PoolPlayer): number {
  const meanDist = row.pass_mean_distance;
  const val = parseFloat(String(meanDist ?? ""));
  if (Number.isFinite(val) && val > 0) return val;
  const short = parseFloat(String(row.passes_short ?? 0));
  const long = parseFloat(String(row.passes_long ?? 0));
  const total = short + long;
  if (total <= 0) return 0;
  return (short * 15 + long * 35) / total;
}

export function buildScatterData(
  players: PoolPlayer[],
  xKey: string,
  yKey: string,
  highlightPlayerId?: string,
  positionFamily = "midfielders",
): ScatterData {
  const passesCol = "passes_completed";
  const thresholds = p30PassThresholds(players, passesCol);
  const points: ScatterData["points"] = [];

  for (const player of players) {
    const pid = String(player.player_id ?? "");
    const group = metricRankPoolKey(player);
    const minPasses = thresholds[group] ?? 0;
    if (parseFloat(String(player[passesCol] ?? 0)) < minPasses) continue;

    const xVal = parseFloat(String(player[xKey] ?? ""));
    const yVal = parseFloat(String(player[yKey] ?? ""));
    if (!Number.isFinite(xVal) || !Number.isFinite(yVal)) continue;

    points.push({
      player_id: pid,
      player_name: String(player.player_name ?? ""),
      team: String(player.team ?? ""),
      x: xVal,
      y: yVal,
      mean_dist: scatterMeanPassDistance(player),
      highlight: pid === String(highlightPlayerId ?? ""),
    });
  }

  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);

  return {
    points,
    x_label: SCATTER_METRIC_LABELS[xKey] ?? xKey,
    y_label: SCATTER_METRIC_LABELS[yKey] ?? yKey,
    means: {
      x: xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0,
      y: ys.length ? ys.reduce((a, b) => a + b, 0) / ys.length : 0,
    },
    count: points.length,
  };
}

export type { ScatterData };
