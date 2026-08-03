"""Lightweight /api/meta payload — avoids loading the analysis bundle."""

from __future__ import annotations

import json
from functools import lru_cache
from typing import Any

import nationality_groups as ng
from player_profiles import CACHE_PATH
from position_families import (
    EUROPEAN_POSITION_FAMILIES,
    normalize_position_family,
    position_family_label,
    rating_groups_for_family,
)
from services.filters import LEAGUE_OPTIONS, filter_options_meta
from services.player_pool_service import pool_cache_available
from xp_engine import european_passes_meta_path

LEAGUE_SOURCE_KEYS = sorted(key for key, _label in LEAGUE_OPTIONS if key != "all")


@lru_cache(maxsize=8)
def load_european_family_meta(position_family: str) -> dict[str, Any]:
    family = normalize_position_family(position_family)
    path = european_passes_meta_path(family)
    with path.open(encoding="utf-8") as handle:
        data = json.load(handle)
    if not isinstance(data, dict):
        raise ValueError(f"Invalid meta file: {path}")
    return data


@lru_cache(maxsize=1)
def cached_nationalities() -> tuple[str, ...]:
    if not CACHE_PATH.exists():
        return ()
    try:
        raw = json.loads(CACHE_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return ()
    if not isinstance(raw, dict):
        return ()
    nationalities: set[str] = set()
    for profile in raw.values():
        if not isinstance(profile, dict):
            continue
        normalized = ng.normalize_nationality(profile.get("nationality"))
        if normalized:
            nationalities.add(normalized)
    return tuple(sorted(nationalities))


def build_meta_payload(position_family: str) -> dict[str, Any]:
    family = normalize_position_family(position_family)
    meta_file = load_european_family_meta(family)
    family_label = position_family_label(family)
    return {
        "position_family": family,
        "position_family_label": family_label,
        "player_count": int(meta_file.get("players") or 0),
        "leagues": LEAGUE_SOURCE_KEYS,
        "league_options": [{"key": key, "label": label} for key, label in LEAGUE_OPTIONS],
        "position_groups": sorted(rating_groups_for_family(family)),
        "position_families": [
            {"key": key, "label": label}
            for key, label in EUROPEAN_POSITION_FAMILIES
            if pool_cache_available(key)
        ],
        "nationalities": list(cached_nationalities()),
        "filter_options": filter_options_meta(family),
        "description": (
            f"Premier League, Serie A, La Liga, Bundesliga and Ligue 1 {family_label.lower()} — "
            "pass ratings (xT v4), progression ratings, and xP analytics. "
            "All scores and ranks are computed within the selected position pool."
        ),
    }
