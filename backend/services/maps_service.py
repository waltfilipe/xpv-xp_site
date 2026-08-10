"""Maps tab: scatter, pass maps, aggregated analysis."""

from __future__ import annotations

import functools
import math
from typing import Any

import pandas as pd
import xp_engine as xe
import xp_stats_engine as xstats
import xp_study_engine as xpe
from passes_maps import (
    draw_action_origin_smooth_heatmap,
    draw_report_impact_passes_map,
    draw_report_progressive_dest_heatmap,
    draw_report_progressive_origin_heatmap,
)
from position_families import DEFAULT_POSITION_FAMILY, normalize_position_family
from xp_study_maps import (
    CMAP_XP_GRAY_RED,
    draw_midfielder_common_passes_map,
    draw_midfielder_rare_passes_map,
    draw_passes_destination_heatmap,
    draw_special_passes_season_map,
    draw_top_residual_passes_map,
)

from services.figures import fig_to_b64
from services.filters import all_position_filters, player_matches_position_filter

APP_LEAGUE = "European leagues"

REPORT_PASS_MAP_KEYS: tuple[str, ...] = (
    "report_progressive_origin",
    "report_progressive_dest",
    "report_impact_passes",
)


@functools.lru_cache(maxsize=8)
def load_xp_passes_grouped(
    position_family: str = DEFAULT_POSITION_FAMILY,
    cache_version: int = 0,
) -> dict[str, pd.DataFrame]:
    _ = cache_version
    family = normalize_position_family(position_family)
    return xe.load_european_league_xp_passes_grouped(
        position_family=family,
        cache_version=xe.XP_DATA_CACHE_VERSION,
    )


def _top_position_pass_pool(completed: pd.DataFrame, top_n: int) -> dict:
    pass_counts = completed.groupby("player_id", sort=False).size().sort_values(ascending=False)
    head = pass_counts.head(int(top_n))
    top_ids = {str(pid) for pid in head.index}
    return {
        "passes": completed[completed["player_id"].astype(str).isin(top_ids)],
        "player_count": len(top_ids),
        "min_passes_cutoff": int(head.min()) if len(head) else 0,
    }


@functools.lru_cache(maxsize=8)
def load_aggregated_maps(
    top_n: int = 250,
    position_family: str = DEFAULT_POSITION_FAMILY,
) -> dict[str, Any]:
    family = normalize_position_family(position_family)
    season = xe.load_european_league_season_passes(
        position_family=family,
        cache_version=xe.XP_DATA_CACHE_VERSION,
    )
    if season is None or season.empty:
        return {"player_count": 0, "total_passes": 0, "quadrant_stats": []}

    completed = season[season["is_won"] & season["has_end"]].copy()
    if completed.empty:
        return {"player_count": 0, "total_passes": 0, "quadrant_stats": []}

    pool = _top_position_pass_pool(completed, top_n)
    agg = xpe.aggregate_pass_destination_grids(pool["passes"])
    return {
        "position_family": family,
        "player_count": pool["player_count"],
        "total_passes": int(len(pool["passes"])),
        "min_passes_cutoff": pool["min_passes_cutoff"],
        "quadrant_stats": agg.get("quadrant_stats", []),
        "common_map_b64": _grid_map_b64(agg.get("count_grid"), draw_midfielder_common_passes_map, "Passes comuns"),
        "rare_map_b64": _grid_map_b64(agg.get("mean_xp_grid"), draw_midfielder_rare_passes_map, "Passes raros (xP)"),
    }


def _grid_map_b64(grid, draw_fn, title: str) -> str | None:
    if grid is None:
        return None
    fig = draw_fn(grid, title=title)
    return fig_to_b64(fig)


def scatter_mean_pass_distance(row: dict) -> float:
    mean_dist = row.get("pass_mean_distance")
    try:
        val = float(mean_dist)
    except (TypeError, ValueError):
        val = 0.0
    if val > 0:
        return val
    try:
        short = float(row.get("passes_short") or 0.0)
        long_ = float(row.get("passes_long") or 0.0)
    except (TypeError, ValueError):
        return 0.0
    total = short + long_
    if total <= 0:
        return 0.0
    return (short * 15.0 + long_ * 35.0) / total


def build_scatter_data(
    all_players: list[dict],
    progression_by_id: dict[str, dict],
    xp_by_id: dict[str, dict],
    *,
    x_key: str = "xpass_coe_pct",
    y_key: str = "test_impact_v2_p90",
    highlight_player_id: str | None = None,
    position_family: str = DEFAULT_POSITION_FAMILY,
) -> dict[str, Any]:
    position_codes, position_groups = all_position_filters(position_family)
    passes_col = "passes_completed"
    thresholds = xstats.p20_pass_thresholds_by_group(list(xp_by_id.values()), passes_col)

    points: list[dict[str, Any]] = []
    for player in all_players:
        pid = str(player["player_id"])
        profile = progression_by_id.get(pid, player)
        if not player_matches_position_filter(profile, position_codes=position_codes, position_groups=position_groups):
            continue
        xp_profile = xp_by_id.get(pid)
        if not xp_profile:
            continue
        group = str(xp_profile.get("position_group") or profile.get("position_group") or "CM")
        min_passes = float(thresholds.get(group, 0.0))
        if float(xp_profile.get(passes_col) or 0.0) < min_passes:
            continue
        row = {**profile, **xp_profile, "player_id": pid}
        try:
            x_val = float(row.get(x_key))
            y_val = float(row.get(y_key))
        except (TypeError, ValueError):
            continue
        if not (math.isfinite(x_val) and math.isfinite(y_val)):
            continue
        points.append({
            "player_id": pid,
            "player_name": row.get("player_name"),
            "team": row.get("team"),
            "position": row.get("position"),
            "x": x_val,
            "y": y_val,
            "mean_dist": scatter_mean_pass_distance(row),
            "highlight": pid == str(highlight_player_id or ""),
        })

    xs = [p["x"] for p in points]
    ys = [p["y"] for p in points]
    return {
        "position_family": normalize_position_family(position_family),
        "points": points,
        "x_key": x_key,
        "y_key": y_key,
        "x_label": xstats.maps_tab_scatter_metric_label(x_key),
        "y_label": xstats.maps_tab_scatter_metric_label(y_key),
        "means": {
            "x": sum(xs) / len(xs) if xs else 0,
            "y": sum(ys) / len(ys) if ys else 0,
        },
        "count": len(points),
    }


def build_pass_map_images(
    player_id: str,
    player_name: str,
    *,
    pass_filter: str = "progressive",
    round_key: str = "all",
    position_family: str = DEFAULT_POSITION_FAMILY,
) -> dict[str, Any]:
    xp_passes = load_xp_passes_grouped(position_family)
    raw_passes = xp_passes.get(str(player_id))
    if raw_passes is None or raw_passes.empty:
        return {"pass_count": 0, "pass_map_b64": None, "dest_map_b64": None, "caption": ""}

    scoped = xstats.filter_passes_by_map_round(raw_passes, round_key)
    passes_df = xstats.filter_passes_for_map(scoped, pass_filter)
    if passes_df is None or passes_df.empty:
        return {"pass_count": 0, "pass_map_b64": None, "dest_map_b64": None, "caption": ""}

    work = passes_df.copy()
    if xstats.is_maps_top_residual_pass(pass_filter):
        work = work.nlargest(min(50, len(work)), "xp_residual")
        fig_passes = draw_top_residual_passes_map(work, player_name=player_name, season_label=APP_LEAGUE, show_labels=True)
        caption = f"Top {len(work)} passes por resíduo"
    else:
        fig_passes = draw_special_passes_season_map(
            work,
            player_name=player_name,
            season_label=APP_LEAGUE,
            category_label=xstats.maps_tab_pass_label(pass_filter),
            xp_col="xp_m4",
            highlight_index=None,
            show_labels=False,
            cmap=CMAP_XP_GRAY_RED,
        )
        caption = f"{len(work)} passes · cor = xP"

    fig_dest = draw_passes_destination_heatmap(
        work,
        player_name=player_name,
        season_label=APP_LEAGUE,
        category_label=xstats.maps_tab_pass_label(pass_filter),
        cmap=CMAP_XP_GRAY_RED,
    )

    round_options = xstats.map_round_options(raw_passes)
    round_labels = dict(round_options[1]) if round_options else {"all": "Todas"}

    return {
        "pass_count": len(work),
        "pass_map_b64": fig_to_b64(fig_passes),
        "dest_map_b64": fig_to_b64(fig_dest),
        "caption": caption,
        "round_options": [{"key": k, "label": round_labels.get(k, k)} for k in round_options[0]],
        "pass_filter_options": [{"key": k, "label": l} for k, l in xstats.maps_tab_pass_options()],
        "scatter_metric_options": [{"key": k, "label": l} for k, l in xstats.maps_tab_scatter_metric_options()],
    }


def build_report_pass_map_images(
    player_id: str,
    player_name: str,
    *,
    report_key: str,
    round_key: str = "all",
    position_family: str = DEFAULT_POSITION_FAMILY,
) -> dict[str, Any]:
    """Portrait report maps for the test-site Reports view."""
    xp_passes = load_xp_passes_grouped(position_family)
    raw_passes = xp_passes.get(str(player_id))
    if raw_passes is None or raw_passes.empty:
        return {"pass_count": 0, "pass_map_b64": None, "dest_map_b64": None, "caption": ""}

    scoped = xstats.filter_passes_by_map_round(raw_passes, round_key)
    key = str(report_key or "").strip()

    if key == "report_progressive_origin":
        passes_df = xstats.filter_passes_for_map(scoped, "progressive")
        draw_fn = draw_report_progressive_origin_heatmap
        caption = f"{len(passes_df)} progressive · origin"
    elif key == "report_progressive_dest":
        passes_df = xstats.filter_passes_for_map(scoped, "progressive")
        draw_fn = draw_report_progressive_dest_heatmap
        caption = f"{len(passes_df)} progressive · destination"
    elif key == "report_impact_passes":
        passes_df = xstats.filter_passes_for_map(scoped, "test_impact_v2")
        draw_fn = draw_report_impact_passes_map
        caption = f"{len(passes_df)} impact passes"
    else:
        return {"pass_count": 0, "pass_map_b64": None, "dest_map_b64": None, "caption": ""}

    if passes_df is None or passes_df.empty:
        return {"pass_count": 0, "pass_map_b64": None, "dest_map_b64": None, "caption": ""}

    fig = draw_fn(passes_df)
    return {
        "pass_count": len(passes_df),
        "pass_map_b64": fig_to_b64(fig),
        "dest_map_b64": None,
        "caption": caption,
    }


def get_round_options(
    player_id: str,
    *,
    position_family: str = DEFAULT_POSITION_FAMILY,
) -> list[dict[str, str]]:
    xp_passes = load_xp_passes_grouped(position_family)
    raw = xp_passes.get(str(player_id))
    if raw is None or raw.empty:
        return [{"key": "all", "label": "Todas"}]
    keys, labels = xstats.map_round_options(raw)
    return [{"key": k, "label": labels.get(k, k)} for k in keys]
