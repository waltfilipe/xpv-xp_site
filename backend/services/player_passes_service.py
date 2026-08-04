"""On-demand player pass frames for profile/compare heatmaps."""

from __future__ import annotations

from functools import lru_cache

import pandas as pd
import xp_engine as xe
from position_families import DEFAULT_POSITION_FAMILY, normalize_position_family
from services.runtime_mode import family_parquet_available


@lru_cache(maxsize=2)
def _season_passes(position_family: str) -> pd.DataFrame:
    family = normalize_position_family(position_family)
    if not family_parquet_available(family):
        return pd.DataFrame()
    return xe.load_european_league_season_passes(
        position_family=family,
        cache_version=xe.XP_DATA_CACHE_VERSION,
    )


def player_passes_frame(position_family: str, player_id: str) -> pd.DataFrame | None:
    season = _season_passes(normalize_position_family(position_family))
    if season.empty:
        return None
    pid = str(player_id)
    frame = season[season["player_id"].astype(str) == pid]
    if frame.empty:
        return None
    return frame.copy()


def passes_by_player_for_ids(
    position_family: str,
    player_ids: list[str],
) -> dict[str, pd.DataFrame]:
    """Minimal passes_by_player dict for heatmap rendering (one family, few players)."""
    family = normalize_position_family(position_family)
    if not family_parquet_available(family):
        return {}
    season = _season_passes(family)
    if season.empty:
        return {}
    ids = {str(pid) for pid in player_ids if pid}
    if not ids:
        return {}
    work = season[season["player_id"].astype(str).isin(ids)]
    if work.empty:
        return {}
    return {
        str(pid): grp.copy()
        for pid, grp in work.groupby("player_id", sort=False)
    }


def clear_player_passes_cache() -> None:
    _season_passes.cache_clear()
