#!/usr/bin/env python3
"""Offline study: productivity models for 45 test-site midfielders.

Models:
  - current: xp_per_90 (xp_m4_total * 90 / minutes)
  - R-A: share of team pass xP (player xp / team xp, all positions)
  - R-D: xp_per_90 / team_xp_per_90 (team clock minutes = team_games * 90)

Team denominator: sum xp_m4 on completed passes for entire squad (liga/temporada).
"""

from __future__ import annotations

import json
import pathlib
import sys

import numpy as np
import pandas as pd

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

import passes_engine as pe  # noqa: E402
import xp_engine as xe  # noqa: E402
import xp_study_engine as xse  # noqa: E402

TEST_SITE = ROOT.parent.parent / "test-site-xpxpv"
PLAYER_IDS = json.loads((TEST_SITE / "data" / "player-ids.json").read_text(encoding="utf-8"))
OUTPUT_CSV = ROOT / "data" / "productivity_models_45.csv"
FULL_SEASON_CACHE = ROOT / "data" / "productivity_full_scored_season.parquet"


def _team_key(league_source: str, team: str) -> str:
    return f"{league_source}|{team}"


def _attach_league_source(season: pd.DataFrame, frame: pd.DataFrame) -> pd.DataFrame:
    """Scored season parquet may omit league_source; recover from raw pass frame."""
    if "league_source" in season.columns:
        return season
    work = frame.copy()
    work["player_id"] = work["player_id"].astype(str)
    if "league_source" not in work.columns:
        raise RuntimeError("Raw pass frame missing league_source.")
    league_by_player = (
        work.groupby("player_id", sort=False)["league_source"]
        .agg(lambda s: s.mode().iloc[0] if not s.mode().empty else s.iloc[0])
    )
    out = season.copy()
    out["player_id"] = out["player_id"].astype(str)
    out["league_source"] = out["player_id"].map(league_by_player)
    return out


def _build_full_scored_season() -> tuple[pd.DataFrame, pd.DataFrame]:
    frame = pe._load_european_league_pass_frame()
    if frame.empty:
        raise RuntimeError("European pass frame is empty.")

    if FULL_SEASON_CACHE.is_file():
        print(f"Loading cached scored season from {FULL_SEASON_CACHE.name}...")
        season = pd.read_parquet(FULL_SEASON_CACHE)
        if "league_source" not in season.columns:
            season = _attach_league_source(season, frame)
        return season, frame

    print(
        f"Scoring xP on full league frame "
        f"({frame['event_id'].nunique()} matches, {frame['player_id'].nunique()} players)..."
    )
    season = xe._build_season_passes_from_frame(
        frame,
        blend_league_reference=True,
        refit_artifacts=False,
    )
    if season.empty:
        raise RuntimeError("Scored season is empty.")
    season = _attach_league_source(season, frame)
    FULL_SEASON_CACHE.parent.mkdir(parents=True, exist_ok=True)
    season.to_parquet(FULL_SEASON_CACHE, index=False)
    print(f"Cached scored season → {FULL_SEASON_CACHE.name}")
    return season, frame


def _team_aggregates(season: pd.DataFrame) -> pd.DataFrame:
    work = season.copy()
    work["league_source"] = work["league_source"].astype(str)
    work["team"] = work["team"].astype(str)
    scored = work.loc[work["is_won"].fillna(False) & work["has_end"].fillna(False)]
    if scored.empty or "xp_m4" not in scored.columns:
        raise RuntimeError("No scored completed passes for team aggregates.")

    team_xp = scored.groupby(["league_source", "team"], sort=False)["xp_m4"].sum()
    team_games = work.groupby(["league_source", "team"], sort=False)["event_id"].nunique()
    rows = []
    for (league, team), xp_total in team_xp.items():
        games = int(team_games.get((league, team), 0))
        team_minutes = float(games) * 90.0
        xp_per_90 = (float(xp_total) / team_minutes * 90.0) if team_minutes > 0 else np.nan
        rows.append(
            {
                "league_source": league,
                "team": team,
                "team_key": _team_key(league, team),
                "team_xp_total": round(float(xp_total), 3),
                "team_games": games,
                "team_minutes": team_minutes,
                "team_xp_per_90": round(float(xp_per_90), 4) if np.isfinite(xp_per_90) else None,
            }
        )
    return pd.DataFrame(rows)


def _player_league_map(frame: pd.DataFrame) -> dict[str, str]:
    work = frame.copy()
    work["player_id"] = work["player_id"].astype(str)
    if "league_source" not in work.columns:
        return {}
    return (
        work.groupby("player_id", sort=False)["league_source"]
        .agg(lambda s: str(s.mode().iloc[0] if not s.mode().empty else s.iloc[0]))
        .to_dict()
    )


def _enrich_player_league(players: list[dict], league_by_player: dict[str, str]) -> None:
    for player in players:
        pid = str(player.get("player_id") or "")
        src = league_by_player.get(pid, "")
        if src:
            player["league_source"] = src
            player["league"] = pe._european_league_label(src)


def main() -> int:
    _, players = xe.build_european_league_xp_analytics(position_family="midfielders")
    by_id = {str(p["player_id"]): p for p in players}

    season, frame = _build_full_scored_season()
    league_by_player = _player_league_map(frame)
    _enrich_player_league(players, league_by_player)
    team_df = _team_aggregates(season)
    team_by_key = team_df.set_index("team_key")

    missing_ids = [pid for pid in PLAYER_IDS if pid not in by_id]
    if missing_ids:
        print(f"Warning: {len(missing_ids)} player ids not in analytics pool: {missing_ids[:5]}...")

    records: list[dict] = []
    for pid in PLAYER_IDS:
        p = by_id.get(str(pid))
        if not p:
            records.append(
                {
                    "player_id": pid,
                    "player_name": None,
                    "team": None,
                    "league": None,
                    "model_current_xp_per_90": None,
                    "model_R_A_share_xp_pct": None,
                    "model_R_D_ratio": None,
                    "note": "not_in_pool",
                }
            )
            continue

        league_source = str(p.get("league_source") or "")
        team = str(p.get("team") or "")
        team_key = _team_key(league_source, team)
        team_row = team_by_key.loc[team_key] if team_key in team_by_key.index else None

        xp_total = float(p.get("xp_m4_total") or 0.0)
        minutes = float(p.get("minutes") or 0.0)
        xp_per_90 = float(p.get("xp_per_90") or 0.0)

        share_pct = None
        r_d = None
        team_xp_total = None
        team_xp_per_90 = None
        if team_row is not None:
            team_xp_total = float(team_row["team_xp_total"])
            team_xp_per_90 = float(team_row["team_xp_per_90"])
            if team_xp_total > 0:
                share_pct = round(xp_total / team_xp_total * 100.0, 3)
            if team_xp_per_90 and team_xp_per_90 > 0:
                r_d = round(xp_per_90 / team_xp_per_90, 4)

        records.append(
            {
                "player_id": pid,
                "player_name": p.get("player_name"),
                "team": team,
                "league": p.get("league"),
                "league_source": league_source,
                "minutes": round(minutes, 1),
                "xp_m4_total": round(xp_total, 3),
                "team_xp_total": team_xp_total,
                "team_xp_per_90": team_xp_per_90,
                "model_current_xp_per_90": round(xp_per_90, 4),
                "model_R_A_share_xp_pct": share_pct,
                "model_R_D_ratio": r_d,
            }
        )

    df = pd.DataFrame(records)
    df = df.sort_values("model_current_xp_per_90", ascending=False, na_position="last")
    OUTPUT_CSV.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(OUTPUT_CSV, index=False)

    # --- Blend simulation: 0.65 z(xp_per_90) + 0.35 z(relative) ---
    blend_csv = ROOT / "data" / "productivity_blend_65_35_45.csv"
    z_current = (df["model_current_xp_per_90"] - df["model_current_xp_per_90"].mean()) / df[
        "model_current_xp_per_90"
    ].std()
    z_ra = (df["model_R_A_share_xp_pct"] - df["model_R_A_share_xp_pct"].mean()) / df[
        "model_R_A_share_xp_pct"
    ].std()
    z_rd = (df["model_R_D_ratio"] - df["model_R_D_ratio"].mean()) / df["model_R_D_ratio"].std()
    blend_ra = 0.65 * z_current + 0.35 * z_ra
    blend_rd = 0.65 * z_current + 0.35 * z_rd
    merit = lambda z: 6.0 + 2.45 * np.tanh(z)
    blend_out = df.copy()
    blend_out["z_current"] = z_current.round(4)
    blend_out["z_R_A"] = z_ra.round(4)
    blend_out["z_R_D"] = z_rd.round(4)
    blend_out["blend_65_35_R_A"] = blend_ra.round(4)
    blend_out["blend_65_35_R_D"] = blend_rd.round(4)
    blend_out["display_current"] = merit(z_current).round(3)
    blend_out["display_blend_R_A"] = merit(blend_ra).round(3)
    blend_out["display_blend_R_D"] = merit(blend_rd).round(3)
    blend_out.to_csv(blend_csv, index=False)
    print(f"Wrote {blend_csv}")

    print(f"\nWrote {OUTPUT_CSV} ({len(df)} rows)")
    show_cols = [
        "player_name",
        "team",
        "league",
        "model_current_xp_per_90",
        "model_R_A_share_xp_pct",
        "model_R_D_ratio",
    ]
    print(df[show_cols].to_string(index=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
