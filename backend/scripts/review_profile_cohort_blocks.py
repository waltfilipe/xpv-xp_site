#!/usr/bin/env python3
"""Review and optionally rebuild profile cohort blocks after grade changes."""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

_BACKEND = Path(__file__).resolve().parents[1]
if str(_BACKEND) not in sys.path:
    sys.path.insert(0, str(_BACKEND))

os.environ.setdefault("PASS_SCOUT_MODE", "local")

import profile_view_engine as pve  # noqa: E402
from services.player_bundle import load_player_analysis_bundle  # noqa: E402
from scripts.build_profile_cohort_blocks import (  # noqa: E402
    LEAGUE_ORDER,
    OUTPUT_PATH,
    _eligible_rows,
    _pick_top,
    _player_refs,
    main as rebuild_main,
)

OLD_PATH = Path("/agent/repos/test-site-xpxpv/data/profile-cohort-blocks.json")


def _load_old_ids() -> dict[str, dict[str, set[str]]]:
    if not OLD_PATH.is_file():
        return {}
    data = json.loads(OLD_PATH.read_text(encoding="utf-8"))
    out: dict[str, dict[str, set[str]]] = {}
    for cat in data.get("categories", []):
        cid = cat["id"]
        out[cid] = {}
        for group in cat.get("groups", []):
            label = group.get("label", "")
            out[cid][label] = {p["player_id"] for p in group.get("players", [])}
    return out


def review() -> None:
    load_player_analysis_bundle.cache_clear()
    bundle = load_player_analysis_bundle("midfielders")
    xp_by_id = bundle[-1]
    pve.attach_profile_view_metrics(list(xp_by_id.values()))
    rows = _eligible_rows(xp_by_id)
    by_id = {r["player_id"]: r for r in rows}
    old = _load_old_ids()

    specs = [
        ("top-overall-league", 5, False, False),
        ("top-overall-no-giants", 10, True, False),
        ("top-u23-league", 5, False, True),
    ]

    for cat_id, n, exclude, u23 in specs:
        print(f"\n{'=' * 60}\n{cat_id}\n{'=' * 60}")
        for league in LEAGUE_ORDER:
            picked = _pick_top(rows, league, n, exclude_teams=exclude, u23_only=u23)
            new_ids = {p["player_id"] for p in picked}
            old_ids = old.get(cat_id, {}).get(league, set())
            added = new_ids - old_ids
            removed = old_ids - new_ids
            print(f"\n{league}:")
            for p in picked:
                age = f", {p['age']}y" if u23 and p.get("age") is not None else ""
                print(f"  {p['overall']:.1f}  {p['player_name']} ({p['team']}){age}")
            if added or removed:
                if removed:
                    print("  OUT:", ", ".join(
                        by_id[i]["player_name"] for i in sorted(removed) if i in by_id
                    ) or ", ".join(sorted(removed)))
                if added:
                    print("  IN:", ", ".join(
                        by_id[i]["player_name"] for i in sorted(added) if i in by_id
                    ) or ", ".join(sorted(added)))


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--rebuild":
        load_player_analysis_bundle.cache_clear()
        bundle = load_player_analysis_bundle("midfielders")
        pve.attach_profile_view_metrics(list(bundle[-1].values()))
        raise SystemExit(rebuild_main())
    review()
