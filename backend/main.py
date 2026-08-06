"""Pass Scout API — FastAPI backend wrapping the Python analytics engines."""

from __future__ import annotations

import os
import sys
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

_BACKEND_ROOT = Path(__file__).resolve().parent
if str(_BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(_BACKEND_ROOT))

from position_families import (  # noqa: E402
    DEFAULT_POSITION_FAMILY,
    normalize_position_family,
)
from services.compare_service import build_compare_payload  # noqa: E402
from services.filters import (  # noqa: E402
    filter_player_pool,
    filter_players_by_pass_letters,
    normalize_league_filter_key,
    parse_age_band,
    player_options,
)
from services.data_parts import get_data_parts  # noqa: E402
from services.meta_service import build_meta_payload  # noqa: E402
from services.maps_service import (  # noqa: E402
    build_pass_map_images,
    build_scatter_data,
    get_round_options,
    load_aggregated_maps,
)
from services.player_passes_service import passes_by_player_for_ids  # noqa: E402
from services.profile_service import build_profile_payload  # noqa: E402
from services.runtime_mode import heavy_maps_enabled, pass_scout_mode  # noqa: E402
from services.serialization import sanitize_for_json  # noqa: E402

HEAVY_MAPS_ENABLED = heavy_maps_enabled()

app = FastAPI(
    title="Pass Scout API",
    description="European outfield pass analysis — xT, xP, progression ratings",
    version="0.5.0",
)

_cors_origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000,https://pass-scout.vercel.app,https://*.vercel.app",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in _cors_origins if o.strip() and "*" not in o.strip()],
    allow_origin_regex=r"https://(.*\.)?(vercel\.app|trycloudflare\.com)",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PLAYER_LIST_FIELDS = (
    "player_id", "player_name", "position", "position_group", "position_family",
    "league", "league_source",
    "age", "height", "nationality", "dominant_foot", "market_value", "market_value_eur",
    "contract_until", "photo_url", "pass_rating", "pass_rating_rank", "pass_rating_total",
    "progression_rating", "progression_rating_rank", "progression_rating_total",
    "total_passes", "total_xt", "xt_per_pass", "midfield_origin_profile", "eligible_for_rating",
    "xp_pass_rating", "team",
  "pass_volume_letter", "pass_efficiency_letter",
  "pass_buildup_letter", "pass_chance_creation_letter",
  "defense_letter", "defense_display",
)


def _pick_fields(player: dict[str, Any], fields: tuple[str, ...]) -> dict[str, Any]:
    return {k: player.get(k) for k in fields if k in player}


def _resolve_position_family(position_family: str | None) -> str:
    try:
        return normalize_position_family(position_family or DEFAULT_POSITION_FAMILY)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


def _pool_parts(
    position_family: str = DEFAULT_POSITION_FAMILY,
    *,
    require_passes: bool = False,
) -> dict[str, Any]:
    return get_data_parts(position_family, require_passes=require_passes)


def _require_heavy_maps(feature: str) -> None:
    if HEAVY_MAPS_ENABLED:
        return
    raise HTTPException(
        status_code=503,
        detail=(
            f"{feature} is disabled on this deployment to stay within memory limits. "
            "Set HEAVY_MAPS_ENABLED=1 or PASS_SCOUT_MODE=local to enable it."
        ),
    )


@app.get("/health")
def health() -> dict[str, str]:
    return {
        "status": "ok",
        "mode": pass_scout_mode(),
        "heavy_maps": str(HEAVY_MAPS_ENABLED).lower(),
    }


@app.get("/api/meta")
def meta(position_family: str = Query(DEFAULT_POSITION_FAMILY)) -> dict[str, Any]:
    family = _resolve_position_family(position_family)
    return sanitize_for_json(build_meta_payload(family))


@app.get("/api/players")
def list_players(
    league: str | None = Query(None),
    position_group: str | None = Query(None),
    search: str | None = Query(None),
    position_family: str = Query(DEFAULT_POSITION_FAMILY),
    limit: int = Query(200, ge=1, le=2000),
    offset: int = Query(0, ge=0),
) -> dict[str, Any]:
    family = _resolve_position_family(position_family)
    parts = _pool_parts(family)
    analysis_players = parts["analysis_players"]
    progression_by_id = parts["progression_by_id"]
    players_by_id = parts["players_by_id"]
    xp_by_id = parts["xp_by_id"]

    rows: list[dict[str, Any]] = []
    for player in analysis_players:
        pid = str(player["player_id"])
        rated = players_by_id.get(pid, player)
        progression = progression_by_id.get(pid, {})
        xp = xp_by_id.get(pid, {}) if isinstance(xp_by_id, dict) else {}
        row = {**rated, **({"xp_pass_rating": xp.get("xp_pass_rating")} if xp else {})}
        if xp:
            for key in (
                "pass_volume_letter", "pass_efficiency_letter", "pass_buildup_letter",
                "pass_chance_creation_letter", "defense_letter", "defense_display",
            ):
                if row.get(key) is None:
                    row[key] = xp.get(key)
        if progression:
            row["progression_rating"] = progression.get("progression_rating")
            row["progression_rating_rank"] = progression.get("progression_rating_rank")
            row["progression_rating_total"] = progression.get("progression_rating_total")
        rows.append(_pick_fields(row, PLAYER_LIST_FIELDS))

    if league and league != "all":
        rows = [r for r in rows if normalize_league_filter_key(r) == league.lower()]
    if position_group:
        rows = [r for r in rows if str(r.get("position_group", "")).lower() == position_group.lower()]
    if search:
        q = search.lower()
        rows = [r for r in rows if q in str(r.get("player_name", "")).lower()]

    total = len(rows)
    page = rows[offset : offset + limit]
    return sanitize_for_json({
        "position_family": family,
        "total": total,
        "offset": offset,
        "limit": limit,
        "players": page,
    })


@app.get("/api/players/options")
def players_options(
    league: str = Query("all"),
    foot: str = Query("all"),
    search: str | None = Query(None),
    exclude: str | None = Query(None),
    age_band: str = Query("all"),
    age_slider_min: int | None = Query(None, ge=16, le=42),
    age_slider_max: int | None = Query(None, ge=16, le=42),
    value_min_m: int = Query(0, ge=0),
    value_max_m: int = Query(150, ge=0),
    contract_year_min: int = Query(2026),
    contract_year_max: int = Query(2033),
    minutes_min: int = Query(0, ge=0),
    minutes_max: int = Query(3600, ge=0),
    height_min_m: float = Query(1.60, ge=1.4, le=2.2),
    height_max_m: float = Query(2.05, ge=1.4, le=2.2),
    nationality_regions: str | None = Query(None),
    nationality_countries: str | None = Query(None),
    volume_grade: str = Query("all"),
    efficiency_grade: str = Query("all"),
    buildup_grade: str = Query("all"),
    chance_grade: str = Query("all"),
    position_block: str = Query("all"),
    position_family: str = Query(DEFAULT_POSITION_FAMILY),
) -> dict[str, Any]:
    import nationality_groups as ng

    family = _resolve_position_family(position_family)
    parts = _pool_parts(family)
    analysis_players = parts["analysis_players"]
    progression_by_id = parts["progression_by_id"]
    xp_by_id = parts["xp_by_id"]

    age_min, age_max = parse_age_band(age_band)
    regions = [r.strip() for r in (nationality_regions or "").split(",") if r.strip()]
    countries = [c.strip() for c in (nationality_countries or "").split(",") if c.strip()]
    if not regions:
        regions = [ng.NATIONALITY_REGION_WORLD]
    allowed_nationalities = ng.resolve_nationality_filter(regions, countries)

    pool = filter_player_pool(
        analysis_players,
        progression_by_id,
        league=league,
        age_min=age_min,
        age_max=age_max,
        age_slider_min=age_slider_min,
        age_slider_max=age_slider_max,
        foot=foot,
        value_min_eur=int(value_min_m) * 1_000_000,
        value_max_eur=int(value_max_m) * 1_000_000,
        contract_year_min=contract_year_min,
        contract_year_max=contract_year_max,
        minutes_min=minutes_min,
        minutes_max=minutes_max,
        height_min_m=height_min_m,
        height_max_m=height_max_m,
        nationalities=list(allowed_nationalities) if allowed_nationalities else None,
    )
    if search:
        q = search.lower()
        pool = [p for p in pool if q in str(p.get("player_name", "")).lower()]

    pool = filter_players_by_pass_letters(
        pool,
        xp_by_id,
        volume_grade=volume_grade,
        efficiency_grade=efficiency_grade,
        buildup_grade=buildup_grade,
        chance_grade=chance_grade,
    )

    options = player_options(
        pool,
        progression_by_id,
        xp_by_id=xp_by_id,
        exclude_player_id=exclude,
        position_block=position_block,
        position_family=family,
    )
    return sanitize_for_json({"position_family": family, "options": options})


@app.get("/api/players/{player_id}")
def get_player(
    player_id: str,
    position_family: str = Query(DEFAULT_POSITION_FAMILY),
) -> dict[str, Any]:
    family = _resolve_position_family(position_family)
    parts = _pool_parts(family)
    passes_by_player = passes_by_player_for_ids(family, [player_id])
    payload = build_profile_payload(
        player_id,
        players_by_id=parts["players_by_id"],
        progression_by_id=parts["progression_by_id"],
        xp_by_id=parts["xp_by_id"],
        passes_by_player=passes_by_player,
    )
    if payload is None:
        raise HTTPException(status_code=404, detail="Player not found in this position pool")
    return sanitize_for_json(payload)


@app.get("/api/compare")
def compare_players(
    player_a: str = Query(...),
    player_b: str = Query(...),
    position_family: str = Query(DEFAULT_POSITION_FAMILY),
) -> dict[str, Any]:
    family = _resolve_position_family(position_family)
    parts = _pool_parts(family)
    passes_by_player = passes_by_player_for_ids(family, [player_a, player_b])
    payload = build_compare_payload(
        player_a, player_b,
        players_by_id=parts["players_by_id"],
        progression_by_id=parts["progression_by_id"],
        xp_by_id=parts["xp_by_id"],
        passes_by_player=passes_by_player,
    )
    if payload is None:
        raise HTTPException(status_code=404, detail="One or both players not found or missing xP data")
    return sanitize_for_json(payload)


@app.get("/api/maps/scatter")
def maps_scatter(
    x: str = Query("xpass_coe_pct"),
    y: str = Query("test_impact_v2_p90"),
    highlight: str | None = Query(None),
    position_family: str = Query(DEFAULT_POSITION_FAMILY),
) -> dict[str, Any]:
    family = _resolve_position_family(position_family)
    parts = _pool_parts(family)
    return sanitize_for_json(build_scatter_data(
        parts["analysis_players"], parts["progression_by_id"], parts["xp_by_id"],
        x_key=x, y_key=y, highlight_player_id=highlight,
        position_family=family,
    ))


@app.get("/api/maps/players/{player_id}/pass-map")
def maps_pass_map(
    player_id: str,
    pass_filter: str = Query("progressive"),
    round_key: str = Query("all"),
    position_family: str = Query(DEFAULT_POSITION_FAMILY),
) -> dict[str, Any]:
    _require_heavy_maps("Pass maps")
    family = _resolve_position_family(position_family)
    parts = _pool_parts(family)
    player = (
        parts["xp_by_id"].get(player_id)
        or parts["progression_by_id"].get(player_id)
        or parts["players_by_id"].get(player_id)
    )
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    return sanitize_for_json(build_pass_map_images(
        player_id, str(player.get("player_name", "—")),
        pass_filter=pass_filter, round_key=round_key,
        position_family=family,
    ))


@app.get("/api/maps/players/{player_id}/rounds")
def maps_rounds(
    player_id: str,
    position_family: str = Query(DEFAULT_POSITION_FAMILY),
) -> dict[str, Any]:
    _require_heavy_maps("Round filters for pass maps")
    family = _resolve_position_family(position_family)
    return sanitize_for_json({"rounds": get_round_options(player_id, position_family=family)})


@app.get("/api/maps/aggregated")
def maps_aggregated(
    top_n: int = Query(250, ge=50, le=500),
    position_family: str = Query(DEFAULT_POSITION_FAMILY),
) -> dict[str, Any]:
    _require_heavy_maps("Aggregated pass maps")
    family = _resolve_position_family(position_family)
    return sanitize_for_json(load_aggregated_maps(top_n, position_family=family))


@app.get("/api/maps/options")
def maps_options() -> dict[str, Any]:
    import xp_stats_engine as xstats
    return sanitize_for_json({
        "scatter_metrics": [{"key": k, "label": l} for k, l in xstats.maps_tab_scatter_metric_options()],
        "pass_filters": [{"key": k, "label": l} for k, l in xstats.maps_tab_pass_options()],
        "views": [{"key": k, "label": l} for k, l in xstats.maps_tab_view_options()],
    })
