const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type PlayerSummary = {
  player_id: string;
  player_name: string;
  position?: string;
  position_group?: string;
  league?: string;
  league_source?: string;
  age?: number | null;
  height?: string | null;
  nationality?: string | null;
  dominant_foot?: string | null;
  market_value?: string | null;
  market_value_eur?: number | null;
  contract_until?: string | null;
  photo_url?: string | null;
  pass_rating?: number | null;
  pass_rating_rank?: number | null;
  pass_rating_total?: number | null;
  progression_rating?: number | null;
  progression_rating_rank?: number | null;
  progression_rating_total?: number | null;
  total_passes?: number | null;
  total_xt?: number | null;
  xt_per_pass?: number | null;
  midfield_origin_profile?: string | null;
  eligible_for_rating?: boolean;
};

export type PlayersResponse = {
  total: number;
  offset: number;
  limit: number;
  filters: {
    leagues: string[];
    position_groups: string[];
  };
  players: PlayerSummary[];
};

export type MetaResponse = {
  player_count: number;
  leagues: string[];
  position_groups: string[];
  description: string;
};

async function fetchApi<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { Accept: "application/json", ...init?.headers },
    next: { revalidate: 3600 },
  });
  if (!res.ok) {
    throw new Error(`API ${res.status}: ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

export function getPlayers(params?: {
  league?: string;
  position_group?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<PlayersResponse> {
  const qs = new URLSearchParams();
  if (params?.league) qs.set("league", params.league);
  if (params?.position_group) qs.set("position_group", params.position_group);
  if (params?.search) qs.set("search", params.search);
  if (params?.limit != null) qs.set("limit", String(params.limit));
  if (params?.offset != null) qs.set("offset", String(params.offset));
  const query = qs.toString();
  return fetchApi<PlayersResponse>(`/api/players${query ? `?${query}` : ""}`);
}

export function getMeta(): Promise<MetaResponse> {
  return fetchApi<MetaResponse>("/api/meta");
}

export function getPlayer(playerId: string) {
  return fetchApi<{ player: Record<string, unknown>; progression: Record<string, unknown>; xp: Record<string, unknown>; pass_count: number }>(
    `/api/players/${playerId}`,
  );
}
