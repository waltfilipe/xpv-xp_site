"""Unified player pool access — JSON cache (cloud) or full bundle (local)."""

from __future__ import annotations

from functools import lru_cache
from typing import Any

from fastapi import HTTPException
from position_families import DEFAULT_POSITION_FAMILY, normalize_position_family
from services.player_bundle import load_player_analysis_bundle
from services.player_pool_service import get_pool_parts, pool_cache_available
from services.runtime_mode import family_parquet_available, is_local_mode


def _bundle_parts(position_family: str) -> dict[str, Any]:
    family = normalize_position_family(position_family)
    if not family_parquet_available(family):
        raise HTTPException(
            status_code=503,
            detail=f"No parquet data for position family {family!r}.",
        )
    (
        analysis_players,
        passes_by_player,
        progression_by_id,
        players_by_id,
        _carries_by_id,
        _progression_pool,
        _pool_by_position,
        _carries_pool,
        xp_by_id,
    ) = load_player_analysis_bundle(family)
    return {
        "position_family": family,
        "analysis_players": list(analysis_players),
        "passes_by_player": passes_by_player,
        "progression_by_id": progression_by_id,
        "players_by_id": players_by_id,
        "xp_by_id": xp_by_id,
    }


@lru_cache(maxsize=1)
def _cached_local_parts(position_family: str) -> dict[str, Any]:
    """Keep one local family in memory at a time."""
    return _bundle_parts(position_family)


def clear_data_parts_cache() -> None:
    _cached_local_parts.cache_clear()
    from services.player_pool_service import clear_pool_cache

    clear_pool_cache()
    load_player_analysis_bundle.cache_clear()


def get_data_parts(position_family: str = DEFAULT_POSITION_FAMILY) -> dict[str, Any]:
    family = normalize_position_family(position_family)

    if is_local_mode():
        return _cached_local_parts(family)

    if not pool_cache_available(family):
        raise HTTPException(
            status_code=503,
            detail=(
                f"Player pool for {family!r} is not available on this deployment. "
                "Run scripts/build_api_pool_cache.py and redeploy the JSON cache."
            ),
        )
    try:
        return get_pool_parts(family)
    except (FileNotFoundError, ValueError, OSError) as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
