#!/usr/bin/env python3
"""Recompute pass_grade_overall (pool-normal 40/40/20) and patch static site profiles."""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

_BACKEND = Path(__file__).resolve().parents[1]
if str(_BACKEND) not in sys.path:
    sys.path.insert(0, str(_BACKEND))

os.environ.setdefault("PASS_SCOUT_MODE", "local")

from services.data_parts import clear_data_parts_cache, get_data_parts  # noqa: E402
import profile_view_engine as pve  # noqa: E402
from xp_stats_engine import EUROPEAN_TOP_FIVE_LEAGUES  # noqa: E402

OUTPUT_DIR = Path("/agent/repos/test-site-xpxpv/data")
POSITION_FAMILY = "midfielders"
GRADE_KEYS = (
    "pass_grade_overall",
    "pass_grade_overall_rank_in_league",
    "pass_grade_overall_rank_pool_in_league",
    "pass_grade_overall_rank_in_pool",
    "pass_grade_overall_rank_pool_size",
)


def main() -> None:
    print("Loading pool…")
    clear_data_parts_cache()
    parts = get_data_parts(POSITION_FAMILY, require_passes=False)
    xp_by_id = parts["xp_by_id"]
    players = list(xp_by_id.values())

    eligible = [
        p
        for p in players
        if p.get("xp_profile_bars_eligible")
        and str(p.get("league_source") or "").strip() in EUROPEAN_TOP_FIVE_LEAGUES
    ]

    print(f"Recomputing pass_grade_overall for {len(eligible)} eligible players…")
    pve._attach_pool_pass_grade_overall(eligible)

    profiles_dir = OUTPUT_DIR / "profiles"
    patched_profiles = 0
    for path in sorted(profiles_dir.glob("*.json")):
        pid = path.stem
        xp = xp_by_id.get(pid)
        if not xp:
            continue
        payload = json.loads(path.read_text(encoding="utf-8"))
        changed = False
        for key in GRADE_KEYS:
            new_val = xp.get(key)
            if payload.get(key) != new_val:
                payload[key] = new_val
                changed = True
        if changed:
            path.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
            patched_profiles += 1

    pool_metrics_path = OUTPUT_DIR / "pool-metrics.json"
    if pool_metrics_path.is_file():
        pool_metrics = json.loads(pool_metrics_path.read_text(encoding="utf-8"))
        patched_pool = 0
        for row in pool_metrics:
            pid = str(row.get("player_id", ""))
            xp = xp_by_id.get(pid)
            if not xp:
                continue
            for key in GRADE_KEYS:
                row[key] = xp.get(key)
            patched_pool += 1
        pool_metrics_path.write_text(
            json.dumps(pool_metrics, ensure_ascii=False, separators=(",", ":")),
            encoding="utf-8",
        )
        print(f"Patched pool-metrics.json ({patched_pool} rows)")
    else:
        print("pool-metrics.json not found, skipped")

    sample = xp_by_id.get("363860")
    if sample:
        print(
            f"Locatelli: overall={sample.get('pass_grade_overall')} "
            f"rank={sample.get('pass_grade_overall_rank_in_pool')}/"
            f"{sample.get('pass_grade_overall_rank_pool_size')}"
        )

    sample_b = xp_by_id.get("363856")
    if sample_b:
        print(
            f"Barella: overall={sample_b.get('pass_grade_overall')} "
            f"rank={sample_b.get('pass_grade_overall_rank_in_pool')}/"
            f"{sample_b.get('pass_grade_overall_rank_pool_size')}"
        )

    print(f"Done — patched {patched_profiles} profiles")


if __name__ == "__main__":
    main()
