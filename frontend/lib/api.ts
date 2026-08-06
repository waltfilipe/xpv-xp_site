/**
 * Browser → same origin (/api/...) proxied by Next.js rewrites.
 * Server  → backend directly (BACKEND_URL / 127.0.0.1:8000).
 * Static  → NEXT_PUBLIC_STATIC_MODE=1 reads from /static/data (no backend).
 */
import type { ProfileFilterState } from "@/lib/profileParams";
import { filtersToApiParams } from "@/lib/profileParams";
import * as staticApi from "@/lib/staticApi";

function isStaticMode(): boolean {
  return process.env.NEXT_PUBLIC_STATIC_MODE === "1";
}

function getApiBase(): string {
  if (typeof window !== "undefined") return "";
  return process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";
}

async function fetchApi<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${getApiBase()}${path}`, {
    ...init,
    headers: { Accept: "application/json", ...init?.headers },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

export type PlayerSummary = {
  player_id: string;
  player_name: string;
  team?: string;
  position?: string;
  position_group?: string;
  league?: string;
  league_source?: string;
  age?: number | null;
  nationality?: string | null;
  photo_url?: string | null;
  pass_rating?: number | null;
  pass_rating_rank?: number | null;
  progression_rating?: number | null;
  xp_pass_rating?: number | null;
  total_passes?: number | null;
  xt_per_pass?: number | null;
};

export type PlayerOption = {
  player_id: string;
  player_name: string;
  team: string;
  label: string;
};

export type PassScoreSection = {
  title: string;
  display_score?: number | null;
  letter?: string | null;
  rank?: number | null;
  rank_pool?: number | null;
  components: { key: string; value: unknown; rank?: number | null; rank_pool?: number | null }[];
};

export type XpBar = { key: string; label: string; value?: number | null; rank?: number | null };

export type XpIndexItem = {
  key: string;
  label: string;
  tier?: string | null;
  tier_key?: string | null;
  value?: number | null;
  icon?: string;
};

export type PlayerProfile = {
  player: Record<string, unknown>;
  xp: Record<string, unknown>;
  pass_scores: PassScoreSection[];
  xp_bars: XpBar[];
  origin_heatmap_b64?: string | null;
  origin_heatmap_url?: string | null;
  long_pass_share_pct?: number | null;
  long_pass_share_ref_avg_pct?: number | null;
  long_pass_share_pctile?: number | null;
  xp_pass_rating?: number | null;
  xp_game_consistency_score?: number | null;
  test_impact_v2_p90?: number | null;
  xp_indices?: XpIndexItem[];
};

export type CompareMetric = {
  key: string;
  label: string;
  value_a?: number | null;
  value_b?: number | null;
  letter_a?: string | null;
  letter_b?: string | null;
  winner: "a" | "b" | "tie";
};

export type ComparePayload = {
  player_a: Record<string, unknown>;
  player_b: Record<string, unknown>;
  heatmap_a_b64?: string | null;
  heatmap_b_b64?: string | null;
  heatmap_a_url?: string | null;
  heatmap_b_url?: string | null;
  pillars: CompareMetric[];
  pass_grid: CompareMetric[];
};

export type ScatterPoint = {
  player_id: string;
  player_name?: string;
  team?: string;
  x: number;
  y: number;
  mean_dist: number;
  highlight: boolean;
};

export type ScatterData = {
  points: ScatterPoint[];
  x_label: string;
  y_label: string;
  means: { x: number; y: number };
  count: number;
};

export function getMeta(positionFamily = "midfielders") {
  if (isStaticMode()) return staticApi.staticGetMeta(positionFamily);
  return fetchApi<{
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
  }>(`/api/meta?position_family=${encodeURIComponent(positionFamily)}`);
}

export function getPlayers(params?: {
  league?: string;
  position_group?: string;
  position_family?: string;
  search?: string;
  limit?: number;
}) {
  if (isStaticMode()) {
    return staticApi.staticGetPlayers(params);
  }
  const qs = new URLSearchParams();
  if (params?.league) qs.set("league", params.league);
  if (params?.position_group) qs.set("position_group", params.position_group);
  if (params?.position_family) qs.set("position_family", params.position_family);
  if (params?.search) qs.set("search", params.search);
  if (params?.limit) qs.set("limit", String(params.limit));
  const q = qs.toString();
  return fetchApi<{ total: number; players: PlayerSummary[] }>(`/api/players${q ? `?${q}` : ""}`);
}

export function getPlayerOptions(filters: ProfileFilterState = {}) {
  if (isStaticMode()) return staticApi.staticGetPlayerOptions(filters);
  const qs = new URLSearchParams(filtersToApiParams(filters));
  if (filters.search) qs.set("search", filters.search);
  const q = qs.toString();
  return fetchApi<{ options: PlayerOption[] }>(`/api/players/options${q ? `?${q}` : ""}`);
}

export function getPlayerOptionsLegacy(params?: {
  league?: string;
  exclude?: string;
  search?: string;
  position_family?: string;
}) {
  if (isStaticMode()) return staticApi.staticGetPlayerOptionsLegacy(params);
  const qs = new URLSearchParams();
  if (params?.league) qs.set("league", params.league);
  if (params?.exclude) qs.set("exclude", params.exclude);
  if (params?.search) qs.set("search", params.search);
  if (params?.position_family) qs.set("position_family", params.position_family);
  const q = qs.toString();
  return fetchApi<{ options: PlayerOption[] }>(`/api/players/options${q ? `?${q}` : ""}`);
}

export function getPlayerProfile(id: string, positionFamily = "midfielders") {
  if (isStaticMode()) return staticApi.staticGetPlayerProfile(id, positionFamily);
  const qs = new URLSearchParams({ position_family: positionFamily });
  return fetchApi<PlayerProfile>(`/api/players/${id}?${qs}`);
}

export function getCompare(playerA: string, playerB: string, positionFamily = "midfielders") {
  if (isStaticMode()) return staticApi.staticGetCompare(playerA, playerB, positionFamily);
  const qs = new URLSearchParams({
    player_a: playerA,
    player_b: playerB,
    position_family: positionFamily,
  });
  return fetchApi<ComparePayload>(`/api/compare?${qs}`);
}

export function getScatter(x: string, y: string, highlight?: string, positionFamily = "midfielders") {
  if (isStaticMode()) return staticApi.staticGetScatter(x, y, highlight, positionFamily);
  const qs = new URLSearchParams({ x, y, position_family: positionFamily });
  if (highlight) qs.set("highlight", highlight);
  return fetchApi<ScatterData>(`/api/maps/scatter?${qs}`);
}

export function getPassMap(
  playerId: string,
  passFilter: string,
  roundKey: string,
  positionFamily = "midfielders",
) {
  if (isStaticMode()) {
    return staticApi.staticGetPassMap(playerId, passFilter, roundKey, positionFamily);
  }
  const qs = new URLSearchParams({
    pass_filter: passFilter,
    round_key: roundKey,
    position_family: positionFamily,
  });
  return fetchApi<{
    pass_count: number;
    pass_map_b64?: string | null;
    dest_map_b64?: string | null;
    pass_map_url?: string | null;
    dest_map_url?: string | null;
    caption: string;
    pass_filter_options: { key: string; label: string }[];
    scatter_metric_options: { key: string; label: string }[];
  }>(`/api/maps/players/${playerId}/pass-map?${qs}`);
}

export function getMapsOptions() {
  if (isStaticMode()) return staticApi.staticGetMapsOptions();
  return fetchApi<{
    scatter_metrics: { key: string; label: string }[];
    pass_filters: { key: string; label: string }[];
    views: { key: string; label: string }[];
  }>("/api/maps/options");
}

export function getAggregatedMaps(positionFamily = "midfielders") {
  if (isStaticMode()) return staticApi.staticGetAggregatedMaps(positionFamily);
  const qs = new URLSearchParams({ position_family: positionFamily });
  return fetchApi<{
    player_count: number;
    total_passes: number;
    quadrant_stats: { quadrant: string; passes: number; share_pct: number }[];
    common_map_b64?: string | null;
    rare_map_b64?: string | null;
    common_map_url?: string | null;
    rare_map_url?: string | null;
  }>(`/api/maps/aggregated?${qs}`);
}
