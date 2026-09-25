/**
 * Offline map assets — local /static/assets or external CDN (e.g. Cloudflare R2).
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

/** True when map PNGs/JSON are served from CDN or local static assets (not live API). */
export function offlineMapsEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_STATIC_MODE === "1") return true;
  return Boolean(process.env.NEXT_PUBLIC_STATIC_ASSETS_URL?.trim());
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

export async function fetchAggregatedMapsFromAssets(positionFamily: string) {
  const metaUrl = aggregatedMapMetaUrl(positionFamily);
  const res = await fetch(metaUrl, { cache: "no-store" });
  if (!res.ok) {
    return {
      player_count: 0,
      total_passes: 0,
      quadrant_stats: [] as { quadrant: string; passes: number; share_pct: number }[],
      common_map_url: null as string | null,
      rare_map_url: null as string | null,
    };
  }
  const data = (await res.json()) as {
    player_count?: number;
    total_passes?: number;
    quadrant_stats?: { quadrant: string; passes: number; share_pct: number }[];
    common_map_url?: string | null;
    rare_map_url?: string | null;
  };
  const base = staticAssetsBase();
  return {
    player_count: data.player_count ?? 0,
    total_passes: data.total_passes ?? 0,
    quadrant_stats: data.quadrant_stats ?? [],
    common_map_url:
      rewriteAssetUrl(data.common_map_url) ?? `${base}/aggregated/${positionFamily}_common.png`,
    rare_map_url:
      rewriteAssetUrl(data.rare_map_url) ?? `${base}/aggregated/${positionFamily}_rare.png`,
  };
}
