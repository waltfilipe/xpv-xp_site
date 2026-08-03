#!/usr/bin/env python3
"""Build xP artifacts and European position-family parquets (run offline, not in Streamlit)."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

import xp_engine as xe
from position_families import EUROPEAN_POSITION_FAMILY_KEYS


def main() -> None:
    print(f"Building global xP artifacts ({xe.XP_MODEL_VERSION})...")
    meta = xe.fit_and_save_artifacts(force=True)
    print("Ridge / threat meta version:", meta.get("version"))

    for family in EUROPEAN_POSITION_FAMILY_KEYS:
        print(f"Building European season parquet for {family}...")
        season = xe.build_european_league_season_passes(
            position_family=family,
            refit_artifacts=False,
        )
        print(f"  {family}: {len(season):,} passes")
        print(f"  Completed: {int((season['is_won'] & season['has_end']).sum()):,}")
        print(f"  Players: {season['player_id'].nunique():,}")
        print(f"  Parquet: {xe.european_passes_parquet_path(family)}")
    print("Done.")


if __name__ == "__main__":
    main()
