import type {
  ComparePayload,
  PlayerOption,
  PlayerProfile,
  PlayerSummary,
  ScatterData,
} from "@/lib/api";
import type { ProfileFilterState } from "@/lib/profileParams";
import { filtersToApiParams } from "@/lib/profileParams";
import { buildComparePayload } from "@/lib/static/compare";
import { buildProfilePayload } from "@/lib/static/profile";
import { buildScatterData } from "@/lib/static/scatter";
import {
  buildPlayerOptions,
  filterPoolPlayers,
  listPlayerSummaries,
} from "@/lib/static/filters";
import {
  fetchAggregatedMapsFromAssets,
  fetchPassMapFromAssets,
} from "@/lib/assets";
import {
  loadMapsOptions,
  loadMeta,
  loadPool,
  loadSiteManifest,
  poolParts,
} from "@/lib/static/pool";

async function getPoolContext(positionFamily: string) {
  const pool = await loadPool(positionFamily);
  const parts = poolParts(pool.players, positionFamily);
  return { pool, ...parts };
}

export async function staticGetMeta(positionFamily = "midfielders") {
  return loadMeta(positionFamily) as Promise<{
    position_family?: string;
    position_family_label?: string;
    player_count: number;
    leagues: string[];
    league_options: { key: string; label: string }[];
    position_groups: string[];
    position_families?: { key: string; label: string }[];
    nationalities: string[];
    filter_options?: Record<string, unknown>;
    description: string;
  }>;
}

export async function staticGetPlayers(params?: {
  league?: string;
  position_group?: string;
  position_family?: string;
  search?: string;
  limit?: number;
}) {
  const family = params?.position_family ?? "midfielders";
  const { analysis_players } = await getPoolContext(family);
  let rows = [...analysis_players];

  if (params?.league && params.league !== "all") {
    rows = rows.filter((r) => String(r.league_source ?? "").toLowerCase() === params.league!.toLowerCase());
  }
  if (params?.position_group) {
    rows = rows.filter(
      (r) => String(r.position_group ?? "").toLowerCase() === params.position_group!.toLowerCase(),
    );
  }
  if (params?.search) {
    const q = params.search.toLowerCase();
    rows = rows.filter((r) => String(r.player_name ?? "").toLowerCase().includes(q));
  }

  const result = listPlayerSummaries(rows, { position_family: family }, params?.limit ?? 200);
  return {
    position_family: family,
    total: result.total,
    offset: 0,
    limit: params?.limit ?? 200,
    players: result.players as PlayerSummary[],
  };
}

export async function staticGetPlayerOptions(filters: ProfileFilterState = {}) {
  const family = filters.position_family ?? "midfielders";
  const { analysis_players } = await getPoolContext(family);
  const filtered = await filterPoolPlayers(analysis_players, filters);
  const api = filtersToApiParams(filters);
  return {
    position_family: family,
    options: buildPlayerOptions(filtered, filters, api.exclude),
  };
}

export async function staticGetPlayerOptionsLegacy(params?: {
  league?: string;
  exclude?: string;
  search?: string;
  position_family?: string;
}) {
  const family = params?.position_family ?? "midfielders";
  const filters: ProfileFilterState = {
    position_family: family,
    league: params?.league,
    search: params?.search,
  };
  const { analysis_players } = await getPoolContext(family);
  const filtered = await filterPoolPlayers(analysis_players, filters);
  return {
    options: buildPlayerOptions(filtered, filters, params?.exclude),
  };
}

export async function staticGetPlayerProfile(id: string, positionFamily = "midfielders"): Promise<PlayerProfile> {
  const { players_by_id } = await getPoolContext(positionFamily);
  const payload = buildProfilePayload(id, players_by_id, positionFamily);
  if (!payload) throw new Error("Player not found in this position pool");
  return payload;
}

export async function staticGetCompare(
  playerA: string,
  playerB: string,
  positionFamily = "midfielders",
): Promise<ComparePayload> {
  const { players_by_id } = await getPoolContext(positionFamily);
  const payload = buildComparePayload(playerA, playerB, players_by_id, positionFamily);
  if (!payload) throw new Error("One or both players not found or missing xP data");
  return payload;
}

export async function staticGetScatter(
  x: string,
  y: string,
  highlight?: string,
  positionFamily = "midfielders",
): Promise<ScatterData> {
  const { analysis_players } = await getPoolContext(positionFamily);
  return buildScatterData(analysis_players, x, y, highlight, positionFamily);
}

export async function staticGetPassMap(
  playerId: string,
  passFilter: string,
  _roundKey: string,
  positionFamily = "midfielders",
) {
  return fetchPassMapFromAssets(playerId, passFilter, positionFamily);
}

export async function staticGetMapsOptions() {
  const opts = await loadMapsOptions();
  return opts as {
    scatter_metrics: { key: string; label: string }[];
    pass_filters: { key: string; label: string }[];
    views: { key: string; label: string }[];
  };
}

export async function staticGetAggregatedMaps(positionFamily = "midfielders") {
  return fetchAggregatedMapsFromAssets(positionFamily);
}

export async function staticSiteReady(): Promise<boolean> {
  try {
    await loadSiteManifest();
    return true;
  } catch {
    return false;
  }
}

export async function staticListFamilies(): Promise<{ key: string; label: string }[]> {
  const site = await loadSiteManifest();
  return site.families.map((f) => ({ key: f.family, label: f.label }));
}
