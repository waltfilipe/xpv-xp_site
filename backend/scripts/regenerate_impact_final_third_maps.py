#!/usr/bin/env python3
"""Regenerate report_impact_final_third maps only."""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

_BACKEND = Path(__file__).resolve().parents[1]
if str(_BACKEND) not in sys.path:
    sys.path.insert(0, str(_BACKEND))

os.environ.setdefault("PASS_SCOUT_MODE", "local")
os.environ.setdefault("HEAVY_MAPS_ENABLED", "1")

from services.maps_service import build_report_pass_map_images  # noqa: E402
from services.serialization import sanitize_for_json  # noqa: E402

OUTPUT_DIR = Path("/agent/repos/test-site-xpxpv/data")
PROFILES_DIR = OUTPUT_DIR / "profiles"
POSITION_FAMILY = "midfielders"
REPORT_KEY = "report_impact_final_third"


def _load_player_ids() -> tuple[str, ...]:
    cohort_path = OUTPUT_DIR / "profile-cohort-blocks.json"
    data = json.loads(cohort_path.read_text(encoding="utf-8"))
    return tuple(str(pid) for pid in data["all_player_ids"])


def _player_name(pid: str) -> str:
    profile_path = PROFILES_DIR / f"{pid}.json"
    if profile_path.is_file():
        try:
            profile = json.loads(profile_path.read_text(encoding="utf-8"))
            name = profile.get("player_name") or profile.get("name")
            if name:
                return str(name)
        except json.JSONDecodeError:
            pass
    return "—"


def main() -> None:
    player_ids = _load_player_ids()
    print(f"Regenerating {REPORT_KEY} for {len(player_ids)} players…", flush=True)

    for i, pid in enumerate(player_ids, start=1):
        name = _player_name(pid)
        try:
            payload = build_report_pass_map_images(
                pid, name, report_key=REPORT_KEY, round_key="all", position_family=POSITION_FAMILY,
            )
            path = OUTPUT_DIR / "pass-maps" / pid / f"{REPORT_KEY}.json"
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(json.dumps(sanitize_for_json(payload), ensure_ascii=False), encoding="utf-8")
            print(f"  [{i}/{len(player_ids)}] {pid}: {payload.get('pass_count', 0)} passes", flush=True)
        except Exception as exc:
            print(f"  ERROR {pid}: {exc}", flush=True)

    print("Done.")


if __name__ == "__main__":
    main()
