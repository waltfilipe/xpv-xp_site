#!/usr/bin/env python3
"""Build lightweight api_pool_{family}.json files for production API.

Run offline (needs ~2 GB RAM for midfielders). Commit the generated JSON files.

    python scripts/build_api_pool_cache.py
    python scripts/build_api_pool_cache.py --family midfielders
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from position_families import EUROPEAN_POSITION_FAMILY_KEYS, normalize_position_family
from services.player_bundle import load_player_analysis_bundle
from services.player_pool_service import POOL_CACHE_VERSION, api_pool_path, build_pool_record


def build_family_cache(position_family: str) -> Path:
    family = normalize_position_family(position_family)
    print(f"Building API pool cache for {family}…", flush=True)
    load_player_analysis_bundle.cache_clear()
    (
        analysis_players,
        _passes,
        progression_by_id,
        players_by_id,
        _carries,
        _prog_pool,
        _pass_pool,
        _carry_pool,
        xp_by_id,
    ) = load_player_analysis_bundle(family)

    records: list[dict] = []
    seen: set[str] = set()
    for player in analysis_players:
        pid = str(player["player_id"])
        if pid in seen:
            continue
        seen.add(pid)
        records.append(
            build_pool_record(
                rated=players_by_id.get(pid, player),
                progression=progression_by_id.get(pid, {}),
                xp=xp_by_id.get(pid, {}),
                position_family=family,
            )
        )

    out_path = api_pool_path(family)
    payload = {
        "cache_version": POOL_CACHE_VERSION,
        "position_family": family,
        "player_count": len(records),
        "players": records,
    }
    out_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    size_mb = out_path.stat().st_size / (1024 * 1024)
    print(f"Wrote {out_path} ({len(records)} players, {size_mb:.2f} MB)", flush=True)
    return out_path


def main() -> int:
    parser = argparse.ArgumentParser(description="Build lightweight API player pool JSON caches.")
    parser.add_argument(
        "--family",
        action="append",
        dest="families",
        help="Position family to build (default: all with parquet data)",
    )
    args = parser.parse_args()

    if args.families:
        families = [normalize_position_family(f) for f in args.families]
    else:
        families = []
        for family in EUROPEAN_POSITION_FAMILY_KEYS:
            parquet = (
                ROOT / "data" / "xp_passes_european.parquet"
                if family == "midfielders"
                else ROOT / "data" / f"xp_passes_european_{family}.parquet"
            )
            if parquet.is_file():
                families.append(family)
            else:
                print(f"Skipping {family}: no parquet at {parquet}", flush=True)

    if not families:
        print("No families to build.", file=sys.stderr)
        return 1

    for family in families:
        build_family_cache(family)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
