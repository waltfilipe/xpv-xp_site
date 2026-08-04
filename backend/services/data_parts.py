"""Unified player pool access — JSON cache and optional full bundle (local)."""

from __future__ import annotations

from functools import lru_cache
from typing import Any

from fastapi import HTTPException
from position_families import DEFAULT_POSITION_FAMILY, normalize_position_family
from services.player_bundle import load_player_analysis_bundle
from services.player_pool_service import get_pool_parts, pool_cache_available
from services.runtime_mode import family_parquet_available, is_local_mode


def family_data_available(position_family: str) -> bool:
    family = normalize_position_family(position_family)
    if pool_cache_available(family):
        return True
    return is_local_mode() and family_parquet_available(family)


def _json_pool_parts(position_family: str) -> dict[str, Any]:
    family = normalize_position_family(position_family)
    if not pool_cache_available(family):
        raise HTTPException(
            status_code=503,
            detail=(
                f"Player pool for {family!r} is not available. "
                "Run: cd backend && python scripts/build_api_pool_cache.py --family "
                f"{family}"
            ),
        )
    try:
        return get_pool_parts(family)
    except (FileNotFoundError, ValueError, OSError) as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


def _bundle_parts(position_family: str) -> dict[str, Any]:
    family = normalize_position_family(position_family)
    if not family_parquet_available(family):
        raise HTTPException(
            status_code=503,
            detail=(
                f"No parquet data for {family!r}. "
                "Run: cd backend && python scripts/build_xp_european.py "
                f"(or copy xp_passes_european_{family}.parquet into backend/data/)."
            ),
        )
    try:
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
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail=(
                f"Failed to load analytics for {family!r}: {exc}. "
                "First load can take several minutes and needs ~8 GB RAM."
            ),
        ) from exc
    return {
        "position_family": family,
        "analysis_players": list(analysis_players),
        "passes_by_player": passes_by_player,
        "progression_by_id": progression_by_id,
        "players_by_id": players_by_id,
        "xp_by_id": xp_by_id,
    }


@lru_cache(maxsize=1)
def _cached_bundle_parts(position_family: str) -> dict[str, Any]:
    return _bundle_parts(position_family)


def clear_data_parts_cache() -> None:
    _cached_bundle_parts.cache_clear()
    from services.player_pool_service import clear_pool_cache

    clear_pool_cache()
    load_player_analysis_bundle.cache_clear()


def get_data_parts(
    position_family: str = DEFAULT_POSITION_FAMILY,
    *,
    require_passes: bool = False,
) -> dict[str, Any]:
    """Return player pool dicts.

    Uses precomputed JSON when available (fast). Loads the full in-memory bundle
    only when ``require_passes`` is True and local parquet data exists.
    """
    family = normalize_position_family(position_family)

    if require_passes and is_local_mode() and family_parquet_available(family):
        return _cached_bundle_parts(family)

    if pool_cache_available(family):
        return _json_pool_parts(family)

    if is_local_mode() and family_parquet_available(family):
        return _cached_bundle_parts(family)

    if not family_data_available(family):
        raise HTTPException(
            status_code=503,
            detail=(
                f"Position family {family!r} is not set up yet. "
                "Run: cd backend && python scripts/build_xp_european.py && "
                f"python scripts/build_api_pool_cache.py --family {family}"
            ),
        )

    raise HTTPException(status_code=503, detail=f"Player pool for {family!r} is not available.")
