"""Deployment mode: cloud (lightweight) vs local (full analytics bundle)."""

from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parents[1] / "data"


@lru_cache(maxsize=1)
def pass_scout_mode() -> str:
    """Return ``cloud`` (default) or ``local``."""
    raw = os.getenv("PASS_SCOUT_MODE", "cloud").strip().lower()
    if raw in {"local", "desktop", "full"}:
        return "local"
    return "cloud"


def is_local_mode() -> bool:
    return pass_scout_mode() == "local"


def heavy_maps_enabled() -> bool:
    if is_local_mode():
        disabled = os.getenv("HEAVY_MAPS_ENABLED", "").strip().lower() in {"0", "false", "no"}
        return not disabled
    return os.getenv("HEAVY_MAPS_ENABLED", "").strip().lower() in {"1", "true", "yes"}


def family_parquet_available(position_family: str) -> bool:
    from position_families import normalize_position_family
    from xp_engine import european_passes_parquet_path

    family = normalize_position_family(position_family)
    return european_passes_parquet_path(family).is_file()
