import { STATIC_ROOT } from "@/lib/static/constants";

export type PoolPlayer = Record<string, unknown>;

export type PoolPayload = {
  cache_version?: number;
  position_family: string;
  player_count: number;
  players: PoolPlayer[];
};

type SiteFamily = {
  family: string;
  label: string;
  player_count: number;
  built_players?: number;
  has_parquet?: boolean;
  heatmaps?: number;
  pass_maps?: number;
};

type SiteManifest = {
  version: number;
  mode: string;
  families: SiteFamily[];
};

const poolCache = new Map<string, PoolPayload>();
const metaCache = new Map<string, Record<string, unknown>>();
let siteManifest: SiteManifest | null = null;
let mapsOptions: Record<string, unknown> | null = null;
let nationalityRegions: Record<string, unknown> | null = null;

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(path, { cache: "force-cache" });
  if (!res.ok) throw new Error(`Static data ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

export function isStaticMode(): boolean {
  return process.env.NEXT_PUBLIC_STATIC_MODE === "1";
}

export async function loadSiteManifest(): Promise<SiteManifest> {
  if (!siteManifest) {
    siteManifest = await fetchJson<SiteManifest>(`${STATIC_ROOT}/site.json`);
  }
  return siteManifest;
}

export async function loadPool(positionFamily: string): Promise<PoolPayload> {
  const cached = poolCache.get(positionFamily);
  if (cached) return cached;
  const payload = await fetchJson<PoolPayload>(`${STATIC_ROOT}/${positionFamily}/pool.json`);
  poolCache.set(positionFamily, payload);
  return payload;
}

export async function loadMeta(positionFamily: string): Promise<Record<string, unknown>> {
  const cached = metaCache.get(positionFamily);
  if (cached) return cached;
  const payload = await fetchJson<Record<string, unknown>>(`${STATIC_ROOT}/${positionFamily}/meta.json`);
  metaCache.set(positionFamily, payload);
  return payload;
}

export async function loadMapsOptions(): Promise<Record<string, unknown>> {
  if (!mapsOptions) {
    mapsOptions = await fetchJson<Record<string, unknown>>(`${STATIC_ROOT}/maps_options.json`);
  }
  return mapsOptions;
}

export async function loadNationalityRegions(): Promise<Record<string, unknown>> {
  if (!nationalityRegions) {
    nationalityRegions = await fetchJson<Record<string, unknown>>(`${STATIC_ROOT}/nationality_regions.json`);
  }
  return nationalityRegions;
}

export function poolParts(players: PoolPlayer[], positionFamily: string) {
  const playersById: Record<string, PoolPlayer> = {};
  const progressionById: Record<string, PoolPlayer> = {};
  const xpById: Record<string, PoolPlayer> = {};

  for (const raw of players) {
    const player = { ...raw };
    const pid = String(player.player_id ?? "");
    if (!pid) continue;
    playersById[pid] = player;
    progressionById[pid] = player;
    xpById[pid] = player;
  }

  return {
    position_family: positionFamily,
    analysis_players: players,
    players_by_id: playersById,
    progression_by_id: progressionById,
    xp_by_id: xpById,
  };
}

export function heatmapUrl(positionFamily: string, playerId: string): string {
  return `/static/assets/heatmaps/${positionFamily}/${playerId}.png`;
}
