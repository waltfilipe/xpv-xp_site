#!/usr/bin/env python3
"""Recompute pass_grade_overall (40/40/20) and patch static site profiles."""

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
    parts = get_data_parts(POSITION_FAMILY, require_passes=True)
    xp_by_id = parts["xp_by_id"]

    derived_path = OUTPUT_DIR / "pool-derived-metrics.json"
    if derived_path.is_file():
        derived_players = json.loads(derived_path.read_text(encoding="utf-8")).get("players", {})
        for pid, xp in xp_by_id.items():
            row = derived_players.get(str(pid), {})
            if row.get("chance_creation_xpv_per_game") is not None:
                xp["chance_creation_xpv_per_game"] = row["chance_creation_xpv_per_game"]
            if row.get("chance_creation_xpv") is not None:
                xp["chance_creation_xpv"] = row["chance_creation_xpv"]

    print("Recomputing profile view metrics…")
    pve.attach_profile_view_metrics(list(xp_by_id.values()))

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

    sample = xp_by_id.get("795222")
    if sample:
        prod = sample.get("prod_grade_geral")
        prec = sample.get("prec_grade_geral")
        leth = sample.get("leth_grade_blend")
        overall = sample.get("pass_grade_overall")
        manual = round(0.4 * prod + 0.4 * prec + 0.2 * leth, 2)
        print(f"Frenkie de Jong: prod={prod} prec={prec} leth={leth} overall={overall} manual={manual}")

    print(f"Done — patched {patched_profiles} profiles")


if __name__ == "__main__":
    main()
