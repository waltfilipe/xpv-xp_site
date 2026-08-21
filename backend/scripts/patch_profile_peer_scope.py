#!/usr/bin/env python3
"""Recompute dual peer-scope profile views and patch static site profiles."""

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
from services.profile_service import build_profile_payload  # noqa: E402
import profile_view_engine as pve  # noqa: E402

OUTPUT_DIR = Path("/agent/repos/test-site-xpxpv/data")
POSITION_FAMILY = "midfielders"


def main() -> None:
    print("Loading pool…")
    clear_data_parts_cache()
    parts = get_data_parts(POSITION_FAMILY, require_passes=True)
    xp_by_id = parts["xp_by_id"]
    players_by_id = parts["players_by_id"]
    progression_by_id = parts["progression_by_id"]
    passes_by_player = parts["passes_by_player"]

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

    import midfielder_profile_clusters as mpc

    cluster_cache = mpc.build_cluster_assignments(list(xp_by_id.values()))
    cluster_path = OUTPUT_DIR / "profile-clusters.json"
    cluster_path.write_text(
        json.dumps(cluster_cache, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    for pid, xp in xp_by_id.items():
        cluster = cluster_cache.get("by_player_id", {}).get(str(pid))
        if cluster:
            xp["profile_cluster"] = cluster

    import services.profile_service as profile_service

    _orig_prepare = profile_service._prepare_passes_for_round_series
    profile_service._prepare_passes_for_round_series = lambda _df: None
    try:
        profiles_dir = OUTPUT_DIR / "profiles"
        patched = 0
        for path in sorted(profiles_dir.glob("*.json")):
            pid = path.stem
            payload = build_profile_payload(
                pid,
                players_by_id=players_by_id,
                progression_by_id=progression_by_id,
                xp_by_id=xp_by_id,
                passes_by_player=passes_by_player,
            )
            if payload is None:
                continue
            existing = json.loads(path.read_text(encoding="utf-8"))
            keep_heatmap = existing.get("origin_heatmap_b64")
            if keep_heatmap and not payload.get("origin_heatmap_b64"):
                payload["origin_heatmap_b64"] = keep_heatmap
            path.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
            patched += 1
    finally:
        profile_service._prepare_passes_for_round_series = _orig_prepare

    print(f"Done — patched {patched} profiles")


if __name__ == "__main__":
    main()
