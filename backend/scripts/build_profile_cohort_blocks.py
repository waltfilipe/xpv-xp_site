#!/usr/bin/env python3
"""Build profile cohort blocks for the test site (overall grade rankings)."""

from __future__ import annotations

import json
import os
import re
import sys
import unicodedata
from pathlib import Path
from typing import Any

_BACKEND = Path(__file__).resolve().parents[1]
if str(_BACKEND) not in sys.path:
    sys.path.insert(0, str(_BACKEND))

os.environ.setdefault("PASS_SCOUT_MODE", "local")

from services.player_bundle import load_player_analysis_bundle  # noqa: E402

OUTPUT_PATH = Path("/agent/repos/test-site-xpxpv/data/profile-cohort-blocks.json")
SITE_POOL_PATH = Path("/agent/repos/test-site-xpxpv/data/pool-metrics.json")


def _site_player_ids() -> set[str] | None:
    if not SITE_POOL_PATH.is_file():
        return None
    rows = json.loads(SITE_POOL_PATH.read_text(encoding="utf-8"))
    if not isinstance(rows, list):
        return None
    ids = {str(row.get("player_id")) for row in rows if row.get("player_id") is not None}
    return ids or None

LEAGUE_ORDER = [
    "Premier League",
    "La Liga",
    "Bundesliga",
    "Serie A",
    "Ligue 1",
]

BLOCK2_EXCLUDED: dict[str, list[str]] = {
    "Premier League": [
        r"manchester city",
        r"manchester united",
        r"liverpool",
        r"arsenal",
        r"chelsea",
        r"tottenham",
    ],
    "La Liga": [
        r"barcelona",
        r"real madrid",
        r"atletico",
    ],
    "Serie A": [
        r"ac milan",
        r"milan",
        r"\binter\b",
        r"inter milan",
        r"juventus",
        r"\broma\b",
        r"as roma",
        r"napoli",
    ],
    "Bundesliga": [
        r"bayern",
        r"leverkusen",
        r"dortmund",
    ],
    "Ligue 1": [
        r"paris saint-germain",
        r"\bpsg\b",
    ],
}


def _norm(text: str) -> str:
    s = unicodedata.normalize("NFD", str(text or ""))
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"\s+", " ", s.lower().strip())


def _overall(player: dict[str, Any]) -> float | None:
    stored = player.get("pass_grade_overall")
    if stored is not None:
        try:
            return round(float(stored), 2)
        except (TypeError, ValueError):
            pass
    general = player.get("pass_grade_general")
    relative = player.get("pass_grade_expected") or player.get("pass_grade_relative")
    if general is None or relative is None:
        return None
    try:
        return round((float(general) + float(relative)) / 2.0, 2)
    except (TypeError, ValueError):
        return None


def _is_excluded_block2(league: str, team: str) -> bool:
    patterns = BLOCK2_EXCLUDED.get(league, [])
    n = _norm(team)
    for pat in patterns:
        if re.search(pat, n):
            return True
    return False


def _eligible_rows(xp_by_id: dict[str, dict]) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for pid, xp in xp_by_id.items():
        if not xp.get("xp_profile_bars_eligible"):
            continue
        league = str(xp.get("league") or "").strip()
        if league not in LEAGUE_ORDER:
            continue
        overall = _overall(xp)
        if overall is None:
            continue
        age = xp.get("age")
        try:
            age_i = int(age) if age is not None else None
        except (TypeError, ValueError):
            age_i = None
        rows.append({
            "player_id": str(pid),
            "player_name": str(xp.get("player_name") or ""),
            "team": str(xp.get("team") or ""),
            "league": league,
            "position": str(xp.get("position") or ""),
            "overall": overall,
            "age": age_i,
        })
    return rows


def _pick_top(
    rows: list[dict[str, Any]],
    league: str,
    n: int,
    *,
    exclude_teams: bool = False,
    u23_only: bool = False,
) -> list[dict[str, Any]]:
    pool = [r for r in rows if r["league"] == league]
    if exclude_teams:
        pool = [r for r in pool if not _is_excluded_block2(league, r["team"])]
    if u23_only:
        pool = [r for r in pool if r["age"] is not None and r["age"] <= 23]
    pool.sort(key=lambda r: (-r["overall"], r["player_name"].lower()))
    return pool[:n]


def _player_refs(players: list[dict[str, Any]]) -> list[dict[str, str]]:
    return [
        {
            "player_id": p["player_id"],
            "note": f"{p['overall']:.1f}",
        }
        for p in players
    ]


def main() -> int:
    print("Loading midfielder bundle…", flush=True)
    load_player_analysis_bundle.cache_clear()
    (
        _analysis,
        _passes,
        _progression,
        _players_by_id,
        *_rest,
        xp_by_id,
    ) = load_player_analysis_bundle("midfielders")

    import profile_view_engine as pve

    pve.attach_profile_view_metrics(list(xp_by_id.values()))

    rows = _eligible_rows(xp_by_id)
    site_ids = _site_player_ids()
    if site_ids is not None:
        rows = [row for row in rows if row["player_id"] in site_ids]
        print(f"Restricted to site pool: {len(rows)} players", flush=True)
    print(f"Eligible rows: {len(rows)}", flush=True)

    categories: list[dict[str, Any]] = []

    block1_groups = []
    for league in LEAGUE_ORDER:
        picked = _pick_top(rows, league, 5)
        block1_groups.append({
            "label": league,
            "players": _player_refs(picked),
        })
    categories.append({
        "id": "top-overall-league",
        "accent": "#38bdf8",
        "groups": block1_groups,
    })

    block2_groups = []
    for league in LEAGUE_ORDER:
        picked = _pick_top(rows, league, 10, exclude_teams=True)
        block2_groups.append({
            "label": league,
            "players": _player_refs(picked),
        })
    categories.append({
        "id": "top-overall-no-giants",
        "accent": "#a78bfa",
        "groups": block2_groups,
    })

    block3_groups = []
    for league in LEAGUE_ORDER:
        picked = _pick_top(rows, league, 5, u23_only=True)
        block3_groups.append({
            "label": league,
            "players": _player_refs(picked),
        })
    categories.append({
        "id": "top-u23-league",
        "accent": "#4ade80",
        "groups": block3_groups,
    })

    all_ids: set[str] = set()
    for cat in categories:
        for group in cat["groups"]:
            for player in group["players"]:
                all_ids.add(player["player_id"])

    payload = {
        "cache_version": 1,
        "position_family": "midfielders",
        "player_count": len(all_ids),
        "all_player_ids": sorted(all_ids),
        "categories": categories,
    }

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {OUTPUT_PATH} ({len(all_ids)} unique players)", flush=True)

    for cat in categories:
        count = sum(len(g["players"]) for g in cat["groups"])
        print(f"  {cat['id']}: {count} slots", flush=True)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
