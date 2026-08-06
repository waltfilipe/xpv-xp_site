#!/usr/bin/env python3
"""Build static assets for Pass Scout option B (no runtime backend).

Outputs to frontend/public/static/:
  data/site.json
  data/{family}/pool.json
  data/{family}/meta.json
  data/nationality_regions.json
  assets/heatmaps/{family}/{player_id}.png
  assets/maps/{family}/{player_id}/{filter}_pass.png
  assets/maps/{family}/{player_id}/{filter}_dest.png
  assets/maps/{family}/{player_id}/{filter}.json
  assets/aggregated/{family}.json + PNGs

Requires parquet + api_pool cache. Run on a machine with ~8 GB RAM for full builds.

    cd backend
    python scripts/build_api_pool_cache.py --family midfielders   # if needed
    python scripts/build_static_site.py --family midfielders
    python scripts/build_static_site.py --family midfielders --players 915812,12345
    python scripts/build_static_site.py --family midfielders --limit 20 --skip-maps
"""

from __future__ import annotations

import argparse
import base64
import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = ROOT.parent
OUT_ROOT = REPO_ROOT / "frontend" / "public" / "static"

if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

# Local bundle needs parquet on disk.
os.environ.setdefault("PASS_SCOUT_MODE", "local")

import matplotlib

matplotlib.use("Agg")

import nationality_groups as ng
import xp_stats_engine as xstats
from position_families import EUROPEAN_POSITION_FAMILY_KEYS, normalize_position_family, position_family_label
from services.maps_service import build_pass_map_images, load_aggregated_maps
from services.meta_service import build_meta_payload
from services.player_bundle import load_player_analysis_bundle
from services.player_pool_service import api_pool_path, pool_cache_available
from services.profile_service import origin_heatmap_b64
from services.runtime_mode import family_parquet_available


def _static_url(*parts: str) -> str:
    return "/static/" + "/".join(parts)


def fig_b64_to_png(b64: str | None, path: Path) -> bool:
    if not b64:
        return False
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(base64.b64decode(b64))
    return True


def copy_pool_json(family: str, out_dir: Path) -> int:
    src = api_pool_path(family)
    if not src.is_file():
        raise FileNotFoundError(f"Missing pool cache: {src}. Run build_api_pool_cache.py first.")
    payload = json.loads(src.read_text(encoding="utf-8"))
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "pool.json").write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
    return int(payload.get("player_count") or len(payload.get("players", [])))


def write_meta(family: str, out_dir: Path) -> None:
    meta = build_meta_payload(family)
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "meta.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")


def write_nationality_regions(out_root: Path) -> None:
  payload = {
      "regions": list(ng.NATIONALITY_REGION_OPTIONS),
      "countries_by_region": {
          region: sorted(countries)
          for region, countries in ng.NATIONALITY_REGION_COUNTRIES.items()
      },
      "aliases": ng.NATIONALITY_ALIASES,
  }
  out_dir = out_root / "data"
  out_dir.mkdir(parents=True, exist_ok=True)
  (out_dir / "nationality_regions.json").write_text(
      json.dumps(payload, ensure_ascii=False, indent=2),
      encoding="utf-8",
  )


def write_maps_options(out_root: Path) -> None:
    payload = {
        "scatter_metrics": [{"key": k, "label": l} for k, l in xstats.maps_tab_scatter_metric_options()],
        "pass_filters": [{"key": k, "label": l} for k, l in xstats.maps_tab_pass_options()],
        "views": [{"key": k, "label": l} for k, l in xstats.maps_tab_view_options()],
        "scatter_metric_labels": dict(xstats.MAPS_TAB_SCATTER_METRIC_LABELS),
    }
    out_dir = out_root / "data"
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "maps_options.json").write_text(
        json.dumps(payload, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def select_player_ids(
    family: str,
    *,
    players_arg: list[str] | None,
    limit: int | None,
) -> list[str]:
    if players_arg:
        return [str(pid).strip() for pid in players_arg if str(pid).strip()]
    path = api_pool_path(family)
    payload = json.loads(path.read_text(encoding="utf-8"))
    ids = [str(p["player_id"]) for p in payload.get("players", []) if p.get("player_id")]
    if limit is not None:
        return ids[: int(limit)]
    return ids


def build_family_assets(
    family: str,
    *,
    player_ids: list[str],
    skip_maps: bool,
    skip_heatmaps: bool,
    skip_aggregated: bool,
) -> dict[str, int]:
    family = normalize_position_family(family)
    stats = {"heatmaps": 0, "pass_maps": 0, "aggregated": 0}

    if skip_maps and skip_heatmaps and skip_aggregated:
        return stats

    if not family_parquet_available(family):
        print(f"  Skipping visual assets for {family}: no parquet data.", flush=True)
        return stats

    print(f"  Loading analysis bundle for {family} (may take 1–3 min)…", flush=True)
    load_player_analysis_bundle.cache_clear()
    (
        _analysis_players,
        passes_by_player,
        _progression_by_id,
        players_by_id,
        _carries,
        _prog_pool,
        _pool,
        _carry_pool,
        xp_by_id,
    ) = load_player_analysis_bundle(family)

    id_set = set(player_ids)

    if not skip_heatmaps:
        heat_dir = OUT_ROOT / "assets" / "heatmaps" / family
        for pid in player_ids:
            player = (
                players_by_id.get(pid)
                or xp_by_id.get(pid)
                or {}
            )
            name = str(player.get("player_name") or pid)
            b64 = origin_heatmap_b64(pid, passes_by_player, name)
            out = heat_dir / f"{pid}.png"
            if fig_b64_to_png(b64, out):
                stats["heatmaps"] += 1
            elif pid in id_set:
                print(f"    No origin heatmap for {pid}", flush=True)

    if not skip_maps:
        filters = [k for k, _ in xstats.maps_tab_pass_options()]
        maps_root = OUT_ROOT / "assets" / "maps" / family
        for pid in player_ids:
            player = xp_by_id.get(pid) or players_by_id.get(pid) or {}
            name = str(player.get("player_name") or pid)
            for pass_filter in filters:
                result = build_pass_map_images(
                    pid,
                    name,
                    pass_filter=pass_filter,
                    round_key="all",
                    position_family=family,
                )
                pass_png = maps_root / pid / f"{pass_filter}_pass.png"
                dest_png = maps_root / pid / f"{pass_filter}_dest.png"
                has_pass = fig_b64_to_png(result.get("pass_map_b64"), pass_png)
                has_dest = fig_b64_to_png(result.get("dest_map_b64"), dest_png)
                if not has_pass and not has_dest:
                    continue
                meta = {
                    "pass_count": result.get("pass_count", 0),
                    "caption": result.get("caption", ""),
                    "pass_map_url": _static_url("assets", "maps", family, pid, f"{pass_filter}_pass.png") if has_pass else None,
                    "dest_map_url": _static_url("assets", "maps", family, pid, f"{pass_filter}_dest.png") if has_dest else None,
                    "round_options": result.get("round_options", []),
                    "pass_filter_options": result.get("pass_filter_options", []),
                    "scatter_metric_options": result.get("scatter_metric_options", []),
                }
                meta_path = maps_root / pid / f"{pass_filter}.json"
                meta_path.parent.mkdir(parents=True, exist_ok=True)
                meta_path.write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")
                stats["pass_maps"] += 1

    if not skip_aggregated:
        agg = load_aggregated_maps(250, family)
        agg_dir = OUT_ROOT / "assets" / "aggregated"
        common_png = agg_dir / f"{family}_common.png"
        rare_png = agg_dir / f"{family}_rare.png"
        has_common = fig_b64_to_png(agg.get("common_map_b64"), common_png)
        has_rare = fig_b64_to_png(agg.get("rare_map_b64"), rare_png)
        payload = {
            "position_family": family,
            "player_count": agg.get("player_count", 0),
            "total_passes": agg.get("total_passes", 0),
            "quadrant_stats": agg.get("quadrant_stats", []),
            "common_map_url": _static_url("assets", "aggregated", f"{family}_common.png") if has_common else None,
            "rare_map_url": _static_url("assets", "aggregated", f"{family}_rare.png") if has_rare else None,
        }
        agg_dir.mkdir(parents=True, exist_ok=True)
        (agg_dir / f"{family}.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
        if has_common or has_rare:
            stats["aggregated"] = 1

    return stats


def build_family(
    family: str,
    *,
    players_arg: list[str] | None,
    limit: int | None,
    skip_maps: bool,
    skip_heatmaps: bool,
    skip_aggregated: bool,
) -> dict[str, object]:
    family = normalize_position_family(family)
    if not pool_cache_available(family):
        raise FileNotFoundError(f"No api_pool cache for {family}")

    out_data = OUT_ROOT / "data" / family
    player_count = copy_pool_json(family, out_data)
    write_meta(family, out_data)
    player_ids = select_player_ids(family, players_arg=players_arg, limit=limit)
    print(f"Building {family}: {len(player_ids)} players (pool has {player_count})", flush=True)

    asset_stats = build_family_assets(
        family,
        player_ids=player_ids,
        skip_maps=skip_maps,
        skip_heatmaps=skip_heatmaps,
        skip_aggregated=skip_aggregated,
    )
    return {
        "family": family,
        "label": position_family_label(family),
        "player_count": player_count,
        "built_players": len(player_ids),
        "has_parquet": family_parquet_available(family),
        **asset_stats,
    }


def write_site_manifest(families: list[dict[str, object]]) -> None:
    payload = {
        "version": 1,
        "mode": "static",
        "families": families,
    }
    out = OUT_ROOT / "data" / "site.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description="Build static Pass Scout site assets.")
    parser.add_argument("--family", action="append", dest="families", help="Position family (repeatable)")
    parser.add_argument("--players", help="Comma-separated player IDs (subset)")
    parser.add_argument("--limit", type=int, help="Only first N players from pool")
    parser.add_argument("--skip-maps", action="store_true", help="Skip pass map PNGs")
    parser.add_argument("--skip-heatmaps", action="store_true", help="Skip origin heatmap PNGs")
    parser.add_argument("--skip-aggregated", action="store_true", help="Skip aggregated maps")
    parser.add_argument("--json-only", action="store_true", help="Only copy pool + meta JSON (no images)")
    args = parser.parse_args()

    players_arg = [p.strip() for p in args.players.split(",")] if args.players else None
    skip_maps = args.skip_maps or args.json_only
    skip_heatmaps = args.skip_heatmaps or args.json_only
    skip_aggregated = args.skip_aggregated or args.json_only

    if args.families:
        families = [normalize_position_family(f) for f in args.families]
    else:
        families = [f for f in EUROPEAN_POSITION_FAMILY_KEYS if pool_cache_available(f)]

    if not families:
        print("No families with api_pool cache found.", file=sys.stderr)
        return 1

    OUT_ROOT.mkdir(parents=True, exist_ok=True)
    write_nationality_regions(OUT_ROOT)
    write_maps_options(OUT_ROOT)

    built: list[dict[str, object]] = []
    for family in families:
        try:
            built.append(
                build_family(
                    family,
                    players_arg=players_arg,
                    limit=args.limit,
                    skip_maps=skip_maps,
                    skip_heatmaps=skip_heatmaps,
                    skip_aggregated=skip_aggregated,
                )
            )
        except FileNotFoundError as exc:
            print(f"Skipping {family}: {exc}", flush=True)

    write_site_manifest(built)
    print(f"\nDone. Static site root: {OUT_ROOT}", flush=True)
    print("Set NEXT_PUBLIC_STATIC_MODE=1 in frontend/.env.local and run: cd frontend && npm run dev", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
