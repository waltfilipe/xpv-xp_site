/**
 * Offline map assets — local /static/assets or external CDN (e.g. Cloudflare R2).
 *
 * Upload the contents of `frontend/public/static/assets/` to the CDN bucket root:
 *   heatmaps/{family}/{id}.png
 *   maps/{family}/{id}/{filter}.json
 *   aggregated/{family}.json
 */

function trimSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

/** Base URL where heatmaps/, maps/, aggregated/ live. Default: same-origin /static/assets */
export function staticAssetsBase(): string {
  const external = process.env.NEXT_PUBLIC_STATIC_ASSETS_URL?.trim();
  if (external) return trimSlash(external);
  return "/static/assets";
}

/** True when map PNGs/JSON are served from CDN or local static assets (not Render API). */
export function offlineMapsEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_STATIC_MODE === "1") return true;
  return Boolean(process.env.NEXT_PUBLIC_STATIC_ASSETS_URL?.trim());
}

export function heatmapAssetUrl(positionFamily: string, playerId: string): string {
  return `${staticAssetsBase()}/heatmaps/${positionFamily}/${playerId}.png`;
}

export function passMapMetaUrl(positionFamily: string, playerId: string, passFilter: string): string {
  return `${staticAssetsBase()}/maps/${positionFamily}/${playerId}/${passFilter}.json`;
}

export function passMapImageUrl(positionFamily: string, playerId: string, passFilter: string, kind: "pass" | "dest"): string {
  return `${staticAssetsBase()}/maps/${positionFamily}/${playerId}/${passFilter}_${kind}.png`;
}

export function aggregatedMapMetaUrl(positionFamily: string): string {
  return `${staticAssetsBase()}/aggregated/${positionFamily}.json`;
}

/** Rewrite /static/assets/... paths from build JSON to the configured CDN base. */
export function rewriteAssetUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const prefix = "/static/assets";
  if (url.startsWith(prefix)) {
    return `${staticAssetsBase()}${url.slice(prefix.length)}`;
  }
  return url;
}

export async function fetchPassMapFromAssets(
  playerId: string,
  passFilter: string,
  positionFamily: string,
) {
  const metaUrl = passMapMetaUrl(positionFamily, playerId, passFilter);
  const res = await fetch(metaUrl, { cache: "force-cache" });
  if (!res.ok) {
    return {
      pass_count: 0,
      pass_map_url: null,
      dest_map_url: null,
      caption: "Mapa não disponível no CDN estático.",
      pass_filter_options: [],
      scatter_metric_options: [],
    };
  }
  const data = (await res.json()) as {
    pass_count?: number;
    caption?: string;
    pass_map_url?: string | null;
    dest_map_url?: string | null;
    pass_filter_options?: { key: string; label: string }[];
    scatter_metric_options?: { key: string; label: string }[];
  };
  return {
    pass_count: data.pass_count ?? 0,
    caption: data.caption ?? "",
    pass_map_url:
      rewriteAssetUrl(data.pass_map_url) ??
      passMapImageUrl(positionFamily, playerId, passFilter, "pass"),
    dest_map_url:
      rewriteAssetUrl(data.dest_map_url) ??
      passMapImageUrl(positionFamily, playerId, passFilter, "dest"),
    pass_filter_options: data.pass_filter_options ?? [],
    scatter_metric_options: data.scatter_metric_options ?? [],
  };
}

export async function fetchAggregatedMapsFromAssets(positionFamily: string) {
  const metaUrl = aggregatedMapMetaUrl(positionFamily);
  const res = await fetch(metaUrl, { cache: "force-cache" });
  if (!res.ok) {
    return { player_count: 0, total_passes: 0, quadrant_stats: [] };
  }
  const data = (await res.json()) as {
    player_count?: number;
    total_passes?: number;
    quadrant_stats?: { quadrant: string; passes: number; share_pct: number }[];
    common_map_url?: string | null;
    rare_map_url?: string | null;
  };
  return {
    player_count: data.player_count ?? 0,
    total_passes: data.total_passes ?? 0,
    quadrant_stats: data.quadrant_stats ?? [],
    common_map_url: rewriteAssetUrl(data.common_map_url) ?? `${staticAssetsBase()}/aggregated/${positionFamily}_common.png`,
    rare_map_url: rewriteAssetUrl(data.rare_map_url) ?? `${staticAssetsBase()}/aggregated/${positionFamily}_rare.png`,
  };
}
