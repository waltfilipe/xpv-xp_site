#!/usr/bin/env python3
"""Run all profile prefetch steps for one position family (offline).

Fetches TheSportsDB/Wikidata profiles, then Transfermarkt values and photos.

Examples:
    python scripts/prefetch_family_metadata.py --family fullbacks
    python scripts/prefetch_family_metadata.py --family wingers --only-missing
"""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from position_families import EUROPEAN_POSITION_FAMILY_LABELS, normalize_position_family


def _run_step(label: str, cmd: list[str]) -> None:
    print(f"\n=== {label} ===", flush=True)
    result = subprocess.run(cmd, cwd=ROOT)
    if result.returncode != 0:
        raise SystemExit(result.returncode)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Prefetch player metadata (profiles + Transfermarkt) for a position family.",
    )
    parser.add_argument(
        "--family",
        required=True,
        help=f"Position family ({', '.join(EUROPEAN_POSITION_FAMILY_LABELS)})",
    )
    parser.add_argument("--only-missing", action="store_true", help="Skip already-cached players.")
    parser.add_argument("--force", action="store_true", help="Re-fetch every player.")
    parser.add_argument("--limit", type=int, default=0, help="Cap TM fetches (0 = all).")
    parser.add_argument("--profile-sleep", type=float, default=0.12)
    parser.add_argument("--value-sleep", type=float, default=0.35)
    parser.add_argument("--photo-sleep", type=float, default=0.25)
    args = parser.parse_args()

    family = normalize_position_family(args.family)
    label = EUROPEAN_POSITION_FAMILY_LABELS[family]
    print(f"Prefetching metadata for {label} ({family})…", flush=True)

    py = sys.executable
    scripts = ROOT / "scripts"
    common = ["--family", family]
    if args.only_missing:
        common.append("--only-missing")
    if args.force:
        common.append("--force")

    _run_step(
        "Player profiles (TheSportsDB / Wikidata)",
        [py, str(scripts / "prefetch_player_profiles.py"), *common, "--sleep", str(args.profile_sleep)],
    )

    value_cmd = [py, str(scripts / "prefetch_transfermarkt_values.py"), *common, "--sleep", str(args.value_sleep)]
    if args.limit > 0:
        value_cmd.extend(["--limit", str(args.limit)])
    _run_step("Transfermarkt market values", value_cmd)

    photo_cmd = [py, str(scripts / "prefetch_transfermarkt_photos.py"), *common, "--sleep", str(args.photo_sleep)]
    if args.limit > 0:
        photo_cmd.extend(["--limit", str(args.limit)])
    _run_step("Transfermarkt photos + contracts", photo_cmd)

    print(f"\nDone prefetch for {label}. Rebuild pool with:", flush=True)
    print(f"  python scripts/build_api_pool_cache.py --family {family}", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
