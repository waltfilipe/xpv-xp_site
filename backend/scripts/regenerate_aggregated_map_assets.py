#!/usr/bin/env python3
"""Write aggregate pass-map PNGs + JSON under frontend/public/static/assets/aggregated/."""

from __future__ import annotations

import base64
import json
import os
import sys
from pathlib import Path

_BACKEND = Path(__file__).resolve().parents[1]
_REPO = _BACKEND.parent
if str(_BACKEND) not in sys.path:
    sys.path.insert(0, str(_BACKEND))

os.environ.setdefault("PASS_SCOUT_MODE", "local")
os.environ.setdefault("HEAVY_MAPS_ENABLED", "1")

from services.maps_service import AGGREGATED_MAP_RENDER_VERSION, load_aggregated_maps  # noqa: E402

OUT_DIR = _REPO / "frontend" / "public" / "static" / "assets" / "aggregated"
CACHE_BUST = f"v{AGGREGATED_MAP_RENDER_VERSION}"


def _write_png(b64: str | None, path: Path) -> bool:
    if not b64:
        return False
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(base64.b64decode(b64))
    return True


def main() -> None:
    family = "midfielders"
    load_aggregated_maps.cache_clear()
    agg = load_aggregated_maps(250, family, render_version=AGGREGATED_MAP_RENDER_VERSION)

    common_png = OUT_DIR / f"{family}_common.png"
    rare_png = OUT_DIR / f"{family}_rare.png"
    has_common = _write_png(agg.get("common_map_b64"), common_png)
    has_rare = _write_png(agg.get("rare_map_b64"), rare_png)

    payload = {
        "position_family": family,
        "player_count": agg.get("player_count", 0),
        "total_passes": agg.get("total_passes", 0),
        "quadrant_stats": agg.get("quadrant_stats", []),
        "common_map_url": f"/static/assets/aggregated/{family}_common.png?{CACHE_BUST}" if has_common else None,
        "rare_map_url": f"/static/assets/aggregated/{family}_rare.png?{CACHE_BUST}" if has_rare else None,
    }
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUT_DIR / f"{family}.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {OUT_DIR} ({CACHE_BUST})")


if __name__ == "__main__":
    main()
