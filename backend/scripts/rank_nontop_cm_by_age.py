"""Rank nontop midfielders by xp_pass_rating within editorial age bands.

Uses the full xP pipeline (extended stats, per-90, xPass residuals) before
attach_xp_pass_ratings — the same path as build_european_league_xp_analytics.

Eligibility matches xpv-xp_site: all midfielder positions (CM, CDM, CAM, …)
with eligible_for_rating (minutes >= P20 and passes >= P20 per position group).
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

import passes_engine as pe
import xp_engine as xe
import xp_stats_engine as xstats
import xpass_engine as xpass_mod

NONTOP_ROOT = Path("/agent/repos/nontop-midfielders")
AGES_PATH = NONTOP_ROOT / "player_ages.json"

LEAGUE_LABELS = {
    "belgian": "Belgian Pro League",
    "croata": "Croatian League",
    "eredivise": "Eredivisie",
    "greek": "Greek Super League",
    "portugal": "Portuguese Liga",
    "turkey": "Turkish Süper Lig",
}


def load_nontop_pass_frame() -> pd.DataFrame:
    frames: list[pd.DataFrame] = []
    for csv_path in sorted(NONTOP_ROOT.glob("*_passes.csv")):
        league_source = csv_path.stem.replace("_passes", "")
        frame = pd.read_csv(csv_path, low_memory=False)
        frame = frame[frame["category"].astype(str).str.lower() == "passes"]
        if frame.empty:
            continue
        frame = pe.resolve_positions_in_csv_frame(frame)
        work = frame.copy()
        work["league_source"] = league_source
        frames.append(work)
    if not frames:
        return pd.DataFrame()
    combined = pd.concat(frames, ignore_index=True)
    return pe._filter_pass_frame_by_position_family(combined, "midfielders")


def load_ages() -> dict[str, int]:
    with open(AGES_PATH, encoding="utf-8") as handle:
        payload = json.load(handle)
    ages: dict[str, int] = {}
    for pid, row in payload.get("players", {}).items():
        age = row.get("age")
        if age is not None:
            ages[str(pid)] = int(age)
    return ages


def age_band(age: int) -> str | None:
    if age <= 23:
        return "u23"
    if 24 <= age <= 30:
        return "24_30"
    if age >= 31:
        return "over30"
    return None


def build_nontop_midfielder_players(
    frame: pd.DataFrame,
    season: pd.DataFrame,
    *,
    min_passes: int = 100,
) -> list[dict]:
    registry = pe.build_player_registry(frame)
    minutes_info = pe._minutes_from_passes_frame(frame)
    ti_v2_progress_cutoffs = xstats.test_impact_v2_attempt_progress_cutoffs(season)
    registry_by_id = {str(p["code"]): p for p in registry}
    league_by_player: dict[str, str] = {}
    if "league_source" in season.columns:
        league_by_player = (
            season.groupby("player_id", sort=False)["league_source"]
            .agg(lambda s: str(s.mode().iloc[0] if not s.mode().empty else s.iloc[0]))
            .to_dict()
        )

    players: list[dict] = []
    for pid, grp in season.groupby("player_id", sort=False):
        pid = str(pid)
        player = registry_by_id.get(pid)
        if player is None:
            continue
        completed = int((grp["is_won"] & grp["has_end"]).sum())
        if completed < min_passes:
            continue
        mins = minutes_info.get(pid, {})
        metrics = xstats.compute_extended_xp_stats(
            grp,
            test_impact_v2_progress_cutoffs=ti_v2_progress_cutoffs,
        )
        if not metrics:
            continue
        minutes = mins.get("minutes")
        player_raw = frame[frame["player_id"].astype(str) == pid]
        xstats.attach_regular_pass_stats(metrics, player_raw, minutes)
        xstats.apply_per90_metrics(metrics, minutes)
        league_source = str(league_by_player.get(pid, ""))
        players.append({
            "player_id": pid,
            "player_name": player["name"],
            "position": player.get("position", "CM"),
            "position_group": pe.rating_position_group(player.get("position")),
            "position_family": "midfielders",
            "team": mins.get("team", "—"),
            "minutes": mins.get("minutes"),
            "minutes_pct": mins.get("minutes_pct"),
            "league": LEAGUE_LABELS.get(league_source, league_source),
            "league_source": league_source,
            "passes_completed": completed,
            **metrics,
        })

    xpass_mod.attach_xpass_metrics_to_players(players, season=season)
    xstats.attach_distance_indices(players)
    xstats.attach_pass_length_profile(players)
    xstats.attach_regular_pass_scores(players)
    xstats.attach_composite_indices(players)
    xstats.attach_xp_pass_ratings(players)
    return pe.enrich_player_eligibility(players)


def filter_eligible_for_rating(players: list[dict]) -> list[dict]:
    return [player for player in players if player.get("eligible_for_rating")]


def rank_by_age_bands(players: list[dict], ages: dict[str, int], *, top_n: int = 15) -> dict:
    enriched = []
    for player in players:
        age = ages.get(str(player["player_id"]))
        if age is None:
            continue
        band = age_band(age)
        if band is None:
            continue
        enriched.append({**player, "age": age, "age_band": band})

    bands = {
        "u23": {"title": "U23 — Breakout Promises", "players": []},
        "24_30": {"title": "24–30 — Blue Collar Prospects", "players": []},
        "over30": {"title": "30+ — Standout Experience", "players": []},
    }
    for band_key in bands:
        pool = [p for p in enriched if p["age_band"] == band_key]
        pool.sort(
            key=lambda p: (
                float(p.get("xp_pass_rating") or 0.0),
                float(p.get("xp_pass_rating_composite_z") or 0.0),
                int(p.get("passes_completed") or 0),
            ),
            reverse=True,
        )
        bands[band_key]["pool_size"] = len(pool)
        bands[band_key]["players"] = [
            {
                "rank": i,
                "player_id": p["player_id"],
                "player_name": p["player_name"],
                "position": p.get("position"),
                "position_group": p.get("position_group"),
                "age": p["age"],
                "team": p.get("team"),
                "league": p.get("league"),
                "passes_completed": p.get("passes_completed"),
                "minutes_pct": p.get("minutes_pct"),
                "xp_pass_rating": p.get("xp_pass_rating"),
                "xp_pass_rating_composite_z": p.get("xp_pass_rating_composite_z"),
                "xp_per_90": p.get("xp_per_90"),
                "test_impact_v2_p90": p.get("test_impact_v2_p90"),
            }
            for i, p in enumerate(pool[:top_n], start=1)
        ]
    return bands


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Rank nontop midfielders by xp_pass_rating and age band.",
    )
    parser.add_argument("--min-passes", type=int, default=100)
    parser.add_argument("--top-n", type=int, default=15)
    parser.add_argument(
        "--output",
        type=Path,
        default=NONTOP_ROOT / "midfielder_rankings_by_age.json",
    )
    args = parser.parse_args()

    print("Loading nontop midfielder pass frame...")
    frame = load_nontop_pass_frame()
    if frame.empty:
        raise SystemExit("No midfielder pass data found.")

    print(f"Scoring {len(frame):,} pass events across {frame['player_id'].nunique()} players...")
    season = xe._build_season_passes_from_frame(frame, blend_league_reference=True)
    if season.empty:
        raise SystemExit("Season scoring produced no rows.")

    print(f"Building player metrics for {season['player_id'].nunique()} scored players...")
    all_players = build_nontop_midfielder_players(frame, season, min_passes=args.min_passes)
    players = filter_eligible_for_rating(all_players)
    ages = load_ages()

    ratings = [float(p.get("xp_pass_rating") or 0.0) for p in players]
    z_scores = [float(p.get("xp_pass_rating_composite_z") or 0.0) for p in players]
    print(
        f"Players with >= {args.min_passes} passes: {len(all_players)} | "
        f"eligible_for_rating: {len(players)} | "
        f"rating range {min(ratings):.4f}–{max(ratings):.4f} | "
        f"z range {min(z_scores):.4f}–{max(z_scores):.4f}"
    )

    results = rank_by_age_bands(players, ages, top_n=args.top_n)
    payload = {
        "generated_at": pd.Timestamp.utcnow().isoformat(),
        "position_family": "midfielders",
        "min_passes": args.min_passes,
        "eligibility": "eligible_for_rating (minutes >= P20 and passes >= P20 per position group)",
        "top_n": args.top_n,
        "players_scored": len(all_players),
        "players_eligible": len(players),
        "bands": results,
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with open(args.output, "w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2, ensure_ascii=False)
    print(f"Wrote {args.output}")

    for band_key, band in results.items():
        print(f"\n=== {band['title']} (pool {band['pool_size']}) ===")
        for row in band["players"]:
            print(
                f"{row['rank']:2d}. {row['player_name']} ({row['position']}, {row['age']}) — "
                f"{row['team']} | rating {row['xp_pass_rating']:.4f} | "
                f"{row['passes_completed']} passes"
            )


if __name__ == "__main__":
    main()
