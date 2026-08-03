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

from services.player_bundle import load_player_analysis_bundle  # noqa: E402
from services.serialization import sanitize_for_json  # noqa: E402

app = FastAPI(
    title="Pass Scout API",
    description="European midfielder pass analysis — xT, xP, progression ratings",
    version="0.1.0",
)

_cors_origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000,https://pass-scout.vercel.app",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in _cors_origins if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PLAYER_LIST_FIELDS = (
    "player_id",
    "player_name",
    "position",
    "position_group",
    "league",
    "league_source",
    "age",
    "height",
    "nationality",
    "dominant_foot",
    "market_value",
    "market_value_eur",
    "contract_until",
    "photo_url",
    "pass_rating",
    "pass_rating_rank",
    "pass_rating_total",
    "progression_rating",
    "progression_rating_rank",
    "progression_rating_total",
    "total_passes",
    "total_xt",
    "xt_per_pass",
    "midfield_origin_profile",
    "eligible_for_rating",
)


def _pick_fields(player: dict[str, Any], fields: tuple[str, ...]) -> dict[str, Any]:
    return {k: player.get(k) for k in fields if k in player}


def _get_bundle() -> tuple[Any, ...]:
    return load_player_analysis_bundle()


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/players")
def list_players(
    league: str | None = Query(None, description="Filter by league source"),
    position_group: str | None = Query(None, description="Filter by position group"),
    search: str | None = Query(None, description="Search player name"),
    limit: int = Query(200, ge=1, le=2000),
    offset: int = Query(0, ge=0),
) -> dict[str, Any]:
    """List European midfielders with pass and progression ratings."""
    (
        analysis_players,
        _passes_by_player,
        progression_by_id,
        players_by_id,
        *_rest,
    ) = _get_bundle()

    rows: list[dict[str, Any]] = []
    for player in analysis_players:
        pid = str(player["player_id"])
        rated = players_by_id.get(pid, player)
        progression = progression_by_id.get(pid, {})
        row = {**rated}
        if progression:
            row["progression_rating"] = progression.get("progression_rating")
            row["progression_rating_rank"] = progression.get("progression_rating_rank")
            row["progression_rating_total"] = progression.get("progression_rating_total")
        rows.append(_pick_fields(row, PLAYER_LIST_FIELDS))

    if league:
        league_lower = league.lower()
        rows = [r for r in rows if str(r.get("league_source", "")).lower() == league_lower]
    if position_group:
        pg_lower = position_group.lower()
        rows = [r for r in rows if str(r.get("position_group", "")).lower() == pg_lower]
    if search:
        q = search.lower()
        rows = [r for r in rows if q in str(r.get("player_name", "")).lower()]

    total = len(rows)
    page = rows[offset : offset + limit]
    leagues = sorted({str(r.get("league_source") or "") for r in rows if r.get("league_source")})
    position_groups = sorted(
        {str(r.get("position_group") or "") for r in rows if r.get("position_group")}
    )

    return sanitize_for_json(
        {
            "total": total,
            "offset": offset,
            "limit": limit,
            "filters": {"leagues": leagues, "position_groups": position_groups},
            "players": page,
        }
    )


@app.get("/api/players/{player_id}")
def get_player(player_id: str) -> dict[str, Any]:
    """Full player profile with pass, progression, and xP analytics."""
    (
        _analysis_players,
        passes_by_player,
        progression_by_id,
        players_by_id,
        _carries_by_id,
        _progression_pool,
        _pool_by_position,
        _carries_pool,
        xp_by_id,
    ) = _get_bundle()

    rated = players_by_id.get(player_id)
    if rated is None:
        raise HTTPException(status_code=404, detail="Player not found")

    progression = progression_by_id.get(player_id, {})
    xp = xp_by_id.get(player_id, {})
    passes_df = passes_by_player.get(player_id)

    pass_count = int(len(passes_df)) if passes_df is not None else 0

    return sanitize_for_json(
        {
            "player": dict(rated),
            "progression": progression,
            "xp": xp,
            "pass_count": pass_count,
        }
    )


@app.get("/api/meta")
def meta() -> dict[str, Any]:
    """Dataset metadata and available filter values."""
    (
        analysis_players,
        _passes,
        _progression_by_id,
        _players_by_id,
        *_rest,
    ) = _get_bundle()

    leagues = sorted({str(p.get("league_source") or "") for p in analysis_players if p.get("league_source")})
    position_groups = sorted(
        {str(p.get("position_group") or "") for p in analysis_players if p.get("position_group")}
    )

    return {
        "player_count": len(analysis_players),
        "leagues": leagues,
        "position_groups": position_groups,
        "description": (
            "Premier League, Serie A, La Liga, Bundesliga and Ligue 1 midfielders. "
            "Pass ratings (xT v4), progression ratings, and xP analytics."
        ),
    }
