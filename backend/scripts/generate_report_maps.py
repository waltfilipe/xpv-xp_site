#!/usr/bin/env python3
"""Generate portrait report pass maps for the 45-player test site."""

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

from extract_test_site_data import PLAYER_IDS, _write_json  # noqa: E402
from services.data_parts import clear_data_parts_cache, get_data_parts  # noqa: E402
from services.maps_service import REPORT_PASS_MAP_KEYS, build_report_pass_map_images  # noqa: E402
from services.serialization import sanitize_for_json  # noqa: E402

OUTPUT_DIR = Path("/agent/repos/test-site-xpxpv/data")
POSITION_FAMILY = "midfielders"


def main() -> None:
    print("Loading midfielder pass data…")
    clear_data_parts_cache()
    parts = get_data_parts(POSITION_FAMILY, require_passes=True)
    players_by_id = parts["players_by_id"]
    xp_by_id = parts["xp_by_id"]
    progression_by_id = parts["progression_by_id"]

    for pid in PLAYER_IDS:
        player = xp_by_id.get(pid) or progression_by_id.get(pid) or players_by_id.get(pid)
        if not player:
            print(f"  SKIP {pid}: player not found")
            continue
        name = str(player.get("player_name", "—"))
        for rk in REPORT_PASS_MAP_KEYS:
            try:
                payload = build_report_pass_map_images(
                    pid, name, report_key=rk, round_key="all", position_family=POSITION_FAMILY,
                )
                path = OUTPUT_DIR / "pass-maps" / pid / f"{rk}.json"
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text(
                    json.dumps(sanitize_for_json(payload), ensure_ascii=False),
                    encoding="utf-8",
                )
                print(f"  {pid}/{rk}: {payload.get('pass_count', 0)} passes")
            except Exception as exc:
                print(f"  ERROR {pid}/{rk}: {exc}")

    print("Done.")


if __name__ == "__main__":
    main()
