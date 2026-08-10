"""Prefetch Transfermarkt ages/profile fields for players missing cached age.

Uses Transfermarkt search + alpha API when accessible, with HTML profile
fallback when player detail endpoints return 403.

Examples:
    python scripts/prefetch_transfermarkt_ages.py --source nontop-cm --only-missing --limit 50
    python scripts/prefetch_transfermarkt_ages.py --only-missing
"""

from __future__ import annotations

import argparse
import csv
import sys
import time
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

import passes_engine as pe
import player_profiles as pp
import transfermarkt_profiles as tm

NONTOP_ROOT = Path("/agent/repos/nontop-midfielders")


def _load_nontop_players(*, position: str | None = None) -> list[dict]:
    players: dict[str, dict] = {}
    for csv_path in sorted(NONTOP_ROOT.glob("*_passes.csv")):
        with open(csv_path, newline="", encoding="utf-8") as handle:
            for row in csv.DictReader(handle):
                pos = str(row.get("position", "")).upper()
                if position and pos != position.upper():
                    continue
                pid = str(row["player_id"])
                team = row["home_team"] if row.get("isHome") == "True" else row["away_team"]
                if pid not in players:
                    players[pid] = {
                        "player_id": pid,
                        "player_name": row["player_name"],
                        "position": pos,
                        "team": team,
                        "team_counts": Counter(),
                    }
                players[pid]["team_counts"][team] += 1
    out = []
    for player in players.values():
        team = player["team_counts"].most_common(1)[0][0] if player["team_counts"] else player["team"]
        out.append(
            {
                "player_id": player["player_id"],
                "player_name": player["player_name"],
                "team": team,
                "position": player.get("position"),
            }
        )
    return sorted(out, key=lambda row: row["player_name"].lower())


def _load_nontop_cm_players() -> list[dict]:
    return _load_nontop_players(position="CM")


def _needs_fetch(player: dict, *, only_missing: bool, force: bool) -> bool:
    if force:
        return True
    if not only_missing:
        return True
    pid = str(player.get("player_id", ""))
    return pp.read_cached_age(pid) is None


def main() -> None:
    parser = argparse.ArgumentParser(description="Prefetch Transfermarkt ages/profile fields.")
    parser.add_argument(
        "--source",
        choices=("european-midfielders", "nontop-cm", "nontop-all"),
        default="european-midfielders",
        help="Player pool to prefetch (default: european-midfielders).",
    )
    parser.add_argument(
        "--only-missing",
        action="store_true",
        help="Fetch only players without a cached age.",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Re-fetch every player, even when the cache already has an age.",
    )
    parser.add_argument(
        "--sleep",
        type=float,
        default=0.35,
        help="Delay between network requests in seconds (default: 0.35).",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=0,
        help="Optional cap on number of players to fetch (0 = all targets).",
    )
    parser.add_argument(
        "--fallback-profiles",
        action="store_true",
        help="After Transfermarkt, retry remaining players via get_player_profile.",
    )
    parser.add_argument(
        "--concurrency",
        type=int,
        default=12,
        help="Parallel Transfermarkt fetches (default: 12).",
    )
    args = parser.parse_args()

    if args.source == "nontop-cm":
        players = _load_nontop_cm_players()
    elif args.source == "nontop-all":
        players = _load_nontop_players()
    else:
        players = pe.build_european_league_midfielders()

    targets = [
        player
        for player in players
        if _needs_fetch(player, only_missing=args.only_missing, force=args.force)
    ]
    if args.limit > 0:
        targets = targets[: args.limit]

    total = len(targets)
    print(
        f"Prefetching Transfermarkt ages for {total}/{len(players)} players "
        f"(source={args.source}, only_missing={args.only_missing}, force={args.force})…",
        flush=True,
    )

    resolved = 0
    not_found = 0
    errors = 0

    if args.concurrency > 1:
        stats = tm.prefetch_transfermarkt_ages_batch(
            targets,
            concurrency=args.concurrency,
            only_missing=False,
        )
        resolved = stats["resolved"]
        not_found = stats["not_found"]
        errors = stats["errors"]
    else:
        for i, player in enumerate(targets, start=1):
            pid = str(player.get("player_id", ""))
            name = str(player.get("player_name", ""))
            team = str(player.get("team", ""))
            try:
                profile = tm.prefetch_transfermarkt_age_for_player(
                    pid,
                    name,
                    team,
                    force=args.force,
                )
            except Exception as exc:  # noqa: BLE001 - keep batch prefetch running
                errors += 1
                print(f"  ERROR {i}/{total} · {name} ({team}): {exc}", flush=True)
                if args.sleep > 0:
                    time.sleep(args.sleep)
                continue
            if pp.read_cached_age(pid) is not None:
                resolved += 1
            elif profile.get(tm.TRANSFERMARKT_PROFILE_FETCH_STATUS_KEY) == "not_found":
                not_found += 1
            if i % 10 == 0 or i == total:
                print(
                    f"  {i}/{total} · ages: {resolved} · not found: {not_found} · errors: {errors}",
                    flush=True,
                )
            if args.sleep > 0:
                time.sleep(args.sleep)

    if args.fallback_profiles:
        remaining = [
            player for player in players
            if pp.read_cached_age(str(player["player_id"])) is None
        ]
        print(
            f"Fallback profile fetch for {len(remaining)} players still missing age…",
            flush=True,
        )
        for i, player in enumerate(remaining, start=1):
            pid = str(player.get("player_id", ""))
            name = str(player.get("player_name", ""))
            team = str(player.get("team", ""))
            try:
                pp.get_player_profile(pid, name, team, force=True)
            except Exception as exc:  # noqa: BLE001
                errors += 1
                print(f"  FALLBACK ERROR {i}/{len(remaining)} · {name}: {exc}", flush=True)
            if i % 25 == 0 or i == len(remaining):
                resolved_now = sum(
                    1 for p in players if pp.read_cached_age(str(p["player_id"])) is not None
                )
                print(f"  fallback {i}/{len(remaining)} · total with age: {resolved_now}", flush=True)
            if args.sleep > 0:
                time.sleep(max(args.sleep * 0.5, 0.05))

    all_with_age = sum(
        1 for player in players if pp.read_cached_age(str(player["player_id"])) is not None
    )
    print(
        f"Done. Ages cached for {all_with_age}/{len(players)} players.",
        flush=True,
    )


if __name__ == "__main__":
    main()
