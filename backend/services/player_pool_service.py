"""Lightweight per-family player pool — precomputed JSON for Render free tier."""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

from position_families import DEFAULT_POSITION_FAMILY, normalize_position_family
from services.serialization import sanitize_for_json

DATA_DIR = Path(__file__).resolve().parents[1] / "data"
POOL_CACHE_VERSION = 5


def api_pool_path(position_family: str) -> Path:
    family = normalize_position_family(position_family)
    return DATA_DIR / f"api_pool_{family}.json"


def pool_cache_available(position_family: str) -> bool:
    return api_pool_path(position_family).is_file()


@lru_cache(maxsize=1)
def _load_pool_file(position_family: str) -> dict[str, Any]:
    """Load one family JSON; LRU maxsize=1 evicts the previous family from memory."""
    path = api_pool_path(position_family)
    if not path.is_file():
        raise FileNotFoundError(f"No API pool cache for {position_family!r}: {path}")
    with path.open(encoding="utf-8") as handle:
        payload = json.load(handle)
    if not isinstance(payload, dict) or not isinstance(payload.get("players"), list):
        raise ValueError(f"Invalid API pool cache: {path}")
    return payload


def clear_pool_cache() -> None:
    _load_pool_file.cache_clear()


def get_pool_parts(position_family: str = DEFAULT_POSITION_FAMILY) -> dict[str, Any]:
    """Return pool dicts compatible with legacy _bundle_parts (no pass DataFrames)."""
    family = normalize_position_family(position_family)
    payload = _load_pool_file(family)
    players: list[dict[str, Any]] = payload["players"]

    players_by_id: dict[str, dict[str, Any]] = {}
    progression_by_id: dict[str, dict[str, Any]] = {}
    xp_by_id: dict[str, dict[str, Any]] = {}

    for raw in players:
        if not isinstance(raw, dict):
            continue
        player = dict(raw)
        pid = str(player.get("player_id", ""))
        if not pid:
            continue
        players_by_id[pid] = player
        progression_by_id[pid] = player
        xp_by_id[pid] = player

    return {
        "position_family": family,
        "analysis_players": players,
        "passes_by_player": {},
        "progression_by_id": progression_by_id,
        "players_by_id": players_by_id,
        "xp_by_id": xp_by_id,
    }


def build_pool_record(
    *,
    rated: dict[str, Any],
    progression: dict[str, Any],
    xp: dict[str, Any],
    position_family: str,
) -> dict[str, Any]:
    """Merge rated + progression + xP into one JSON-safe player record."""
    pid = str(rated.get("player_id") or progression.get("player_id") or xp.get("player_id"))
    merged: dict[str, Any] = {}
    for source in (rated, progression, xp):
        if source:
            merged.update(source)
    for key in ("league", "league_source"):
        if not str(merged.get(key) or "").strip():
            for source in (rated, progression):
                if not source:
                    continue
                val = source.get(key)
                if val and str(val).strip():
                    merged[key] = val
                    break
    merged["player_id"] = pid
    merged["position_family"] = position_family
    return sanitize_for_json(merged)
