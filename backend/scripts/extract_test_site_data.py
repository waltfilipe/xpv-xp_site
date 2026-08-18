#!/usr/bin/env python3
"""Extract static API payloads for the 45-player test site."""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path
from typing import Any

import numpy as np

_BACKEND = Path(__file__).resolve().parents[1]
if str(_BACKEND) not in sys.path:
    sys.path.insert(0, str(_BACKEND))

os.environ.setdefault("PASS_SCOUT_MODE", "local")
os.environ.setdefault("HEAVY_MAPS_ENABLED", "1")

from services.compare_service import build_compare_payload  # noqa: E402
from services.data_parts import clear_data_parts_cache, get_data_parts  # noqa: E402
from services.filters import LEAGUE_OPTIONS, filter_options_meta, player_options  # noqa: E402
from services.maps_service import (  # noqa: E402
    REPORT_PASS_MAP_KEYS,
    build_pass_map_images,
    build_report_pass_map_images,
    _grid_map_b64,
)
from services.meta_service import cached_nationalities  # noqa: E402
from services.profile_service import build_profile_payload  # noqa: E402
from services.serialization import sanitize_for_json  # noqa: E402
from position_families import rating_groups_for_family  # noqa: E402
import xp_stats_engine as xstats  # noqa: E402
import xp_engine as xe  # noqa: E402
import xp_study_engine as xpe  # noqa: E402
from xp_study_maps import draw_midfielder_common_passes_map, draw_midfielder_rare_passes_map  # noqa: E402

OUTPUT_DIR = Path("/agent/repos/test-site-xpxpv/data")
POSITION_FAMILY = "midfielders"


def _load_cohort_player_ids() -> tuple[str, ...]:
    cohort_path = OUTPUT_DIR / "profile-cohort-blocks.json"
    if not cohort_path.is_file():
        raise SystemExit(
            f"Missing {cohort_path}. Run: python scripts/build_profile_cohort_blocks.py"
        )
    data = json.loads(cohort_path.read_text(encoding="utf-8"))
    return tuple(str(pid) for pid in data["all_player_ids"])

PLAYER_LIST_FIELDS = (
    "player_id", "player_name", "position", "position_group", "position_family",
    "league", "league_source", "age", "height", "nationality", "dominant_foot",
    "market_value", "market_value_eur", "contract_until", "photo_url",
    "pass_rating", "pass_rating_rank", "pass_rating_total",
    "progression_rating", "progression_rating_rank", "progression_rating_total",
    "total_passes", "total_xt", "xt_per_pass", "midfield_origin_profile",
    "eligible_for_rating", "xp_pass_rating", "team",
    "pass_volume_letter", "pass_efficiency_letter", "pass_buildup_letter",
    "pass_chance_creation_letter", "defense_letter", "defense_display",
)


def _pick_fields(player: dict[str, Any], fields: tuple[str, ...]) -> dict[str, Any]:
    return {k: player.get(k) for k in fields if k in player}


def _build_subset_parts(parts: dict[str, Any], player_ids: set[str]) -> dict[str, Any]:
    return {
        "position_family": parts["position_family"],
        "analysis_players": [p for p in parts["analysis_players"] if str(p["player_id"]) in player_ids],
        "passes_by_player": {pid: df for pid, df in parts["passes_by_player"].items() if pid in player_ids},
        "progression_by_id": {pid: v for pid, v in parts["progression_by_id"].items() if pid in player_ids},
        "players_by_id": {pid: v for pid, v in parts["players_by_id"].items() if pid in player_ids},
        "xp_by_id": {pid: v for pid, v in parts["xp_by_id"].items() if pid in player_ids},
    }


def _write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(sanitize_for_json(payload), ensure_ascii=False), encoding="utf-8")
    print(f"  wrote {path.relative_to(OUTPUT_DIR)}")


def _write_prod_rel_gap_stats(parts: dict[str, Any]) -> None:
    from collections import defaultdict

    xp_by_id = parts["xp_by_id"]
    players_by_id = parts["players_by_id"]
    by_pool: dict[str, list[float]] = defaultdict(list)
    combined: list[float] = []
    badge_ids: list[str] = []

    for pid, xp in xp_by_id.items():
        if not xp.get("xp_profile_bars_eligible"):
            continue
        gap = xp.get("prod_rel_gap")
        if gap is None:
            continue
        gap_f = float(gap)
        combined.append(gap_f)
        player = players_by_id.get(str(pid), {})
        pool_key = xstats._metric_rank_pool_key(player)
        by_pool[pool_key].append(gap_f)
        if xp.get("prod_rel_lift_badge"):
            badge_ids.append(str(pid))

    def _pool_stats(gaps: list[float]) -> dict[str, Any]:
        if not gaps:
            return {"n": 0, "mean_gap": None, "p70_gap": None}
        return {
            "n": len(gaps),
            "mean_gap": round(float(np.mean(gaps)), 3),
            "p70_gap": round(float(np.percentile(gaps, 70)), 3),
        }

    payload = {
        "combined": _pool_stats(combined),
        "by_pool": {key: _pool_stats(gaps) for key, gaps in sorted(by_pool.items())},
        "badge_player_ids": sorted(badge_ids),
    }
    _write_json(OUTPUT_DIR / "prod-rel-gap-stats.json", payload)


def _write_prec_stratum_gap_stats(parts: dict[str, Any]) -> None:
    from collections import defaultdict

    xp_by_id = parts["xp_by_id"]
    players_by_id = parts["players_by_id"]
    by_pool: dict[str, list[float]] = defaultdict(list)
    combined: list[float] = []
    badge_ids: list[str] = []

    for pid, xp in xp_by_id.items():
        if not xp.get("xp_profile_bars_eligible"):
            continue
        gap = xp.get("prec_stratum_gap")
        if gap is None:
            continue
        gap_f = float(gap)
        combined.append(gap_f)
        player = players_by_id.get(str(pid), {})
        pool_key = xstats._metric_rank_pool_key(player)
        by_pool[pool_key].append(gap_f)
        if xp.get("prec_stratum_lift_badge"):
            badge_ids.append(str(pid))

    def _pool_stats(gaps: list[float]) -> dict[str, Any]:
        if not gaps:
            return {"n": 0, "mean_gap": None, "p70_gap": None}
        return {
            "n": len(gaps),
            "mean_gap": round(float(np.mean(gaps)), 3),
            "p70_gap": round(float(np.percentile(gaps, 70)), 3),
        }

    payload = {
        "combined": _pool_stats(combined),
        "by_pool": {key: _pool_stats(gaps) for key, gaps in sorted(by_pool.items())},
        "badge_player_ids": sorted(badge_ids),
    }
    _write_json(OUTPUT_DIR / "prec-stratum-gap-stats.json", payload)


def main() -> None:
    print("Loading full midfielder bundle (local mode)…")
    clear_data_parts_cache()
    parts = get_data_parts(POSITION_FAMILY, require_passes=True)
    _write_prod_rel_gap_stats(parts)
    _write_prec_stratum_gap_stats(parts)

    derived_path = OUTPUT_DIR / "pool-derived-metrics.json"
    if derived_path.is_file():
        derived_players = json.loads(derived_path.read_text(encoding="utf-8")).get("players", {})
        xp_by_id_all = parts["xp_by_id"]
        for pid, xp in xp_by_id_all.items():
            row = derived_players.get(str(pid), {})
            if row.get("chance_creation_xpv_per_game") is not None:
                xp["chance_creation_xpv_per_game"] = row["chance_creation_xpv_per_game"]
            if row.get("chance_creation_xpv") is not None:
                xp["chance_creation_xpv"] = row["chance_creation_xpv"]
        import profile_view_engine as pve

        pve.attach_profile_view_metrics(list(xp_by_id_all.values()))
    cohort_player_ids = _load_cohort_player_ids()
    player_ids = set(cohort_player_ids)
    missing = player_ids - {str(p["player_id"]) for p in parts["analysis_players"]}
    if missing:
        raise SystemExit(f"Players not found in pool: {sorted(missing)}")

    subset = _build_subset_parts(parts, player_ids)
    analysis_players = subset["analysis_players"]
    progression_by_id = subset["progression_by_id"]
    players_by_id = subset["players_by_id"]
    xp_by_id = subset["xp_by_id"]
    passes_by_player = subset["passes_by_player"]

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    rows: list[dict[str, Any]] = []
    for player in analysis_players:
        pid = str(player["player_id"])
        rated = players_by_id.get(pid, player)
        progression = progression_by_id.get(pid, {})
        xp = xp_by_id.get(pid, {})
        row = {**rated, **({"xp_pass_rating": xp.get("xp_pass_rating")} if xp else {})}
        if progression:
            row["progression_rating"] = progression.get("progression_rating")
            row["progression_rating_rank"] = progression.get("progression_rating_rank")
            row["progression_rating_total"] = progression.get("progression_rating_total")
        rows.append(_pick_fields(row, PLAYER_LIST_FIELDS))
    rows.sort(key=lambda r: r.get("pass_rating_rank") or 9999)

    print(f"Extracting data for {len(rows)} players…")

    leagues = sorted({str(r.get("league_source", "")) for r in rows if r.get("league_source")})
    meta = {
        "position_family": POSITION_FAMILY,
        "position_family_label": "Meio-campistas",
        "player_count": len(rows),
        "leagues": leagues,
        "league_options": [{"key": key, "label": label} for key, label in LEAGUE_OPTIONS],
        "position_groups": sorted(rating_groups_for_family(POSITION_FAMILY)),
        "position_families": [{"key": POSITION_FAMILY, "label": "Meio-campistas"}],
        "nationalities": sorted({str(r.get("nationality")) for r in rows if r.get("nationality")}),
        "filter_options": filter_options_meta(POSITION_FAMILY),
        "description": "",
    }
    _write_json(OUTPUT_DIR / "meta.json", meta)
    _write_json(OUTPUT_DIR / "players.json", {
        "position_family": POSITION_FAMILY, "total": len(rows),
        "offset": 0, "limit": len(rows), "players": rows,
    })
    _write_json(OUTPUT_DIR / "players-options.json", {
        "position_family": POSITION_FAMILY,
        "options": player_options(analysis_players, progression_by_id, xp_by_id=xp_by_id, position_family=POSITION_FAMILY),
    })
    _write_json(OUTPUT_DIR / "maps-options.json", {
        "pass_filters": [{"key": k, "label": label} for k, label in xstats.maps_tab_pass_options()],
    })

    profiles: dict[str, Any] = {}
    import services.profile_service as profile_service

    _orig_prepare = profile_service._prepare_passes_for_round_series
    profile_service._prepare_passes_for_round_series = lambda _df: None
    try:
        for pid in cohort_player_ids:
            payload = build_profile_payload(
                pid,
                players_by_id=players_by_id,
                progression_by_id=progression_by_id,
                xp_by_id=xp_by_id,
                passes_by_player=passes_by_player,
            )
            if payload is None:
                print(f"  WARNING: no profile for {pid}")
                continue
            profiles[pid] = payload
            _write_json(OUTPUT_DIR / "profiles" / f"{pid}.json", payload)
    finally:
        profile_service._prepare_passes_for_round_series = _orig_prepare

    pass_filters = [k for k, _ in xstats.maps_tab_pass_options()]
    for pid in cohort_player_ids:
        player = xp_by_id.get(pid) or progression_by_id.get(pid) or players_by_id.get(pid)
        if not player:
            continue
        name = str(player.get("player_name", "—"))
        for pf in pass_filters:
            try:
                payload = build_pass_map_images(pid, name, pass_filter=pf, round_key="all", position_family=POSITION_FAMILY)
                _write_json(OUTPUT_DIR / "pass-maps" / pid / f"{pf}.json", payload)
            except Exception as exc:
                print(f"  WARNING: pass map {pid}/{pf}: {exc}")

    for pid in cohort_player_ids:
        player = xp_by_id.get(pid) or progression_by_id.get(pid) or players_by_id.get(pid)
        if not player:
            continue
        name = str(player.get("player_name", "—"))
        for rk in REPORT_PASS_MAP_KEYS:
            try:
                payload = build_report_pass_map_images(
                    pid, name, report_key=rk, round_key="all", position_family=POSITION_FAMILY,
                )
                _write_json(OUTPUT_DIR / "pass-maps" / pid / f"{rk}.json", payload)
            except Exception as exc:
                print(f"  WARNING: report map {pid}/{rk}: {exc}")

    pool_metrics = []
    for player in analysis_players:
        pid = str(player["player_id"])
        profile = progression_by_id.get(pid, player)
        xp = xp_by_id.get(pid, {})
        pool_metrics.append({**profile, **xp, "player_id": pid})
    _write_json(OUTPUT_DIR / "pool-metrics.json", pool_metrics)

    season = xe.load_european_league_season_passes(position_family=POSITION_FAMILY)
    completed = season[season["is_won"] & season["has_end"]].copy()
    completed = completed[completed["player_id"].astype(str).isin(player_ids)]
    agg = xpe.aggregate_pass_destination_grids(completed)
    _write_json(OUTPUT_DIR / "aggregated.json", {
        "position_family": POSITION_FAMILY,
        "player_count": len(player_ids),
        "total_passes": int(len(completed)),
        "min_passes_cutoff": 0,
        "quadrant_stats": agg.get("quadrant_stats", []),
        "common_map_b64": _grid_map_b64(agg.get("count_grid"), draw_midfielder_common_passes_map, "Passes comuns"),
        "rare_map_b64": _grid_map_b64(agg.get("mean_xp_grid"), draw_midfielder_rare_passes_map, "Passes raros (xP)"),
    })
    _write_json(OUTPUT_DIR / "player-ids.json", list(cohort_player_ids))
    _write_json(OUTPUT_DIR / "index.json", {
        "player_count": len(cohort_player_ids),
        "player_ids": list(cohort_player_ids),
        "profiles": list(profiles.keys()),
    })
    print(f"\nDone — {len(profiles)} profiles in {OUTPUT_DIR}")

    organizer_script = Path("/agent/repos/test-site-xpxpv/scripts/build_organizer_data.py")
    if organizer_script.exists():
        import subprocess
        subprocess.run([sys.executable, str(organizer_script)], check=True)


if __name__ == "__main__":
    main()
