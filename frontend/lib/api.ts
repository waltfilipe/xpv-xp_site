/**
 * Browser → same origin (/api/...) proxied by Next.js rewrites.
 * Server  → backend directly (BACKEND_URL / 127.0.0.1:8000).
 */
import type { ProfileFilterState } from "@/lib/profileParams";
import { filtersToApiParams } from "@/lib/profileParams";

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
  components: { key: string; value: unknown }[];
};

export type XpBar = { key: string; label: string; value?: number | null; rank?: number | null };

export type XpIndexItem = {
  key: string;
  label: string;
  tier?: string | null;
  value?: number | null;
  icon?: string;
};

export type PlayerProfile = {
  player: Record<string, unknown>;
  xp: Record<string, unknown>;
  pass_scores: PassScoreSection[];
  xp_bars: XpBar[];
  origin_heatmap_b64?: string | null;
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

export function getMeta() {
  return fetchApi<{
    player_count: number;
    leagues: string[];
    league_options: { key: string; label: string }[];
    position_groups: string[];
    nationalities: string[];
    filter_options?: Record<string, unknown>;
    description: string;
  }>("/api/meta");
}

export function getPlayers(params?: { league?: string; position_group?: string; search?: string; limit?: number }) {
  const qs = new URLSearchParams();
  if (params?.league) qs.set("league", params.league);
  if (params?.position_group) qs.set("position_group", params.position_group);
  if (params?.search) qs.set("search", params.search);
  if (params?.limit) qs.set("limit", String(params.limit));
  const q = qs.toString();
  return fetchApi<{ total: number; players: PlayerSummary[] }>(`/api/players${q ? `?${q}` : ""}`);
}

export function getPlayerOptions(filters: ProfileFilterState = {}) {
  const qs = new URLSearchParams(filtersToApiParams(filters));
  if (filters.search) qs.set("search", filters.search);
  const q = qs.toString();
  return fetchApi<{ options: PlayerOption[] }>(`/api/players/options${q ? `?${q}` : ""}`);
}

export function getPlayerOptionsLegacy(params?: { league?: string; exclude?: string; search?: string }) {
  const qs = new URLSearchParams();
  if (params?.league) qs.set("league", params.league);
  if (params?.exclude) qs.set("exclude", params.exclude);
  if (params?.search) qs.set("search", params.search);
  const q = qs.toString();
  return fetchApi<{ options: PlayerOption[] }>(`/api/players/options${q ? `?${q}` : ""}`);
}

export function getPlayerProfile(id: string) {
  return fetchApi<PlayerProfile>(`/api/players/${id}`);
}

export function getCompare(playerA: string, playerB: string) {
  return fetchApi<ComparePayload>(`/api/compare?player_a=${playerA}&player_b=${playerB}`);
}

export function getScatter(x: string, y: string, highlight?: string) {
  const qs = new URLSearchParams({ x, y });
  if (highlight) qs.set("highlight", highlight);
  return fetchApi<ScatterData>(`/api/maps/scatter?${qs}`);
}

export function getPassMap(playerId: string, passFilter: string, roundKey: string) {
  const qs = new URLSearchParams({ pass_filter: passFilter, round_key: roundKey });
  return fetchApi<{
    pass_count: number;
    pass_map_b64?: string | null;
    dest_map_b64?: string | null;
    caption: string;
    pass_filter_options: { key: string; label: string }[];
    scatter_metric_options: { key: string; label: string }[];
  }>(`/api/maps/players/${playerId}/pass-map?${qs}`);
}

export function getMapsOptions() {
  return fetchApi<{
    scatter_metrics: { key: string; label: string }[];
    pass_filters: { key: string; label: string }[];
    views: { key: string; label: string }[];
  }>("/api/maps/options");
}

export function getAggregatedMaps() {
  return fetchApi<{
    player_count: number;
    total_passes: number;
    quadrant_stats: { quadrant: string; passes: number; share_pct: number }[];
    common_map_b64?: string | null;
    rare_map_b64?: string | null;
  }>("/api/maps/aggregated");
}
