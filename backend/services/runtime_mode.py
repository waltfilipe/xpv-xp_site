"""Deployment mode: cloud (lightweight) vs local (full analytics bundle)."""

from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parents[1] / "data"


@lru_cache(maxsize=1)
def _load_repo_env_file() -> None:
    """Load pass-scout.env from repo root when present (no extra dependency)."""
    env_path = Path(__file__).resolve().parents[2] / "pass-scout.env"
    if not env_path.is_file():
        return
    for line in env_path.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in stripped:
            continue
        key, value = stripped.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value


@lru_cache(maxsize=1)
def pass_scout_mode() -> str:
    """Return ``cloud`` or ``local``."""
    _load_repo_env_file()
    raw = os.getenv("PASS_SCOUT_MODE", "").strip().lower()
    if raw in {"local", "desktop", "full"}:
        return "local"
    if raw in {"cloud", "prod", "production"}:
        return "cloud"
    # Default to local when full analytics parquet ships with the repo.
    try:
        from position_families import DEFAULT_POSITION_FAMILY
        from xp_engine import european_passes_parquet_path

        if european_passes_parquet_path(DEFAULT_POSITION_FAMILY).is_file():
            return "local"
    except Exception:
        pass
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
