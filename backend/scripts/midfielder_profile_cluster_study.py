#!/usr/bin/env python3
"""Cluster midfielder profiles on raw absolute metrics (fixed k=4)."""

from __future__ import annotations

import json
import sys
from pathlib import Path

_BACKEND = Path(__file__).resolve().parents[1]
if str(_BACKEND) not in sys.path:
    sys.path.insert(0, str(_BACKEND))

from midfielder_profile_clusters import build_cluster_assignments  # noqa: E402

POOL_PATH = _BACKEND / "data" / "api_pool_midfielders.json"
OUTPUT_PATH = _BACKEND / "data" / "midfielder_profile_clusters.json"
SITE_OUTPUT_PATH = Path("/agent/repos/test-site-xpxpv/data/profile-clusters.json")


def main() -> None:
    pool = json.loads(POOL_PATH.read_text(encoding="utf-8"))
    results = build_cluster_assignments(pool["players"])
    OUTPUT_PATH.write_text(json.dumps(results, indent=2, ensure_ascii=False), encoding="utf-8")
    SITE_OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    SITE_OUTPUT_PATH.write_text(json.dumps(results, indent=2, ensure_ascii=False), encoding="utf-8")
    preview = {k: results[k] for k in results if k != "by_player_id"}
    print(json.dumps(preview, indent=2, ensure_ascii=False))
    print(f"\nWrote {OUTPUT_PATH}")
    print(f"Wrote {SITE_OUTPUT_PATH} ({len(results['by_player_id'])} players)")


if __name__ == "__main__":
    main()
