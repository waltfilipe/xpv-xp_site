"""Defensive contribution scores from per-match CSV exports (top-five leagues)."""

from __future__ import annotations

import functools
from pathlib import Path

import numpy as np
import pandas as pd

import passes_engine as pe
from xp_stats_engine import rank_percentile_letter_grade

BACKEND_ROOT = Path(__file__).resolve().parent

DEFENSIVE_LEAGUE_FILE_MAP: dict[str, str] = {
    "premier_league": "Premier_defensive.csv",
    "italia_seriea": "SerieA_defensive.csv",
    "laliga": "LaLiga_defensive.csv",
    "bundesliga": "Bundes_defensive.csv",
    "ligue1": "Ligue1_defensive.csv",
}


def _defensive_league_sources() -> tuple[tuple[str, Path], ...]:
    sources: list[tuple[str, Path]] = []
    for league_source, filename in DEFENSIVE_LEAGUE_FILE_MAP.items():
        path = BACKEND_ROOT / filename
        if path.is_file():
            sources.append((league_source, path))
    return tuple(sources)

QTY_P90_METRICS: tuple[str, ...] = (
    "def_won_tackle_p90",
    "def_interception_p90",
    "def_clearance_p90",
    "def_recovery_p90",
    "def_aerial_won_p90",
    "def_block_p90",
)
QUAL_PCT_METRICS: tuple[str, ...] = (
    "def_tackle_won_pct",
    "def_aerial_won_pct",
)
DEFENSE_COMPONENT_KEYS: tuple[str, ...] = QTY_P90_METRICS + QUAL_PCT_METRICS

MINUTES_CONF_CAP = 900.0
MIN_ATTEMPTS_FOR_PCT = 10
QTY_WEIGHT = 0.6
QUAL_WEIGHT = 0.4
ERR_SHOT_WEIGHT = 0.15
ERR_GOAL_WEIGHT = 0.25


def _zscore(series: pd.Series) -> pd.Series:
    vals = pd.to_numeric(series, errors="coerce").astype(float)
    mean = float(vals.mean())
    std = float(vals.std())
    if std == 0.0 or np.isnan(std):
        return pd.Series(0.0, index=series.index)
    return (vals - mean) / std


def _mean_z_columns(df: pd.DataFrame, cols: tuple[str, ...]) -> pd.Series:
    parts = [_zscore(df[col]) for col in cols if col in df.columns]
    if not parts:
        return pd.Series(0.0, index=df.index)
    return pd.concat(parts, axis=1).mean(axis=1, skipna=True)


def _load_defensive_frames() -> pd.DataFrame:
    frames: list[pd.DataFrame] = []
    for league_source, path in _defensive_league_sources():
        if not path.is_file():
            continue
        frame = pd.read_csv(path, low_memory=False)
        if frame.empty:
            continue
        work = frame.copy()
        work["player_id"] = work["player_id"].astype(str)
        work["league_source"] = league_source
        frames.append(work)
    if not frames:
        return pd.DataFrame()
    return pd.concat(frames, ignore_index=True)


def _parse_is_home(series: pd.Series) -> np.ndarray:
    return series.astype(str).str.strip().str.lower().isin({"true", "1", "yes"})


@functools.lru_cache(maxsize=1)
def load_match_minutes_frame() -> pd.DataFrame:
    """Per-match minutes_played rows from top-five league defensive CSV exports."""
    frame = _load_defensive_frames()
    if frame.empty or "minutes_played" not in frame.columns:
        return pd.DataFrame()
    work = frame.copy()
    work["player_id"] = work["player_id"].astype(str)
    work["minutes_played"] = pd.to_numeric(work["minutes_played"], errors="coerce").fillna(0.0)
    if "event_id" in work.columns:
        work["event_id"] = pd.to_numeric(work["event_id"], errors="coerce")
    is_home = _parse_is_home(work["is_home"])
    work["team"] = np.where(is_home, work["home_team"], work["away_team"])
    work["team"] = work["team"].astype(str).str.strip()
    return work


@functools.lru_cache(maxsize=1)
def aggregate_player_minutes_info() -> dict[str, dict]:
    """Season totals and participation % from SofaScore minutes_played in defensive CSVs."""
    frame = load_match_minutes_frame()
    if frame.empty:
        return {}

    team_matches = (
        frame.groupby("team", sort=False)["event_id"].nunique().to_dict()
        if "event_id" in frame.columns
        else {}
    )

    out: dict[str, dict] = {}
    for pid, grp in frame.groupby("player_id", sort=False):
        minutes = float(grp["minutes_played"].sum())
        team = str(grp["team"].mode().iloc[0] if not grp["team"].mode().empty else grp["team"].iloc[0])
        max_minutes = float(team_matches.get(team, 0) * 90)
        pct = (minutes / max_minutes) if max_minutes > 0 else None
        matches = int(grp["event_id"].nunique()) if "event_id" in grp.columns else None
        out[str(pid)] = {
            "team": team,
            "minutes": int(round(minutes)),
            "minutes_pct": round(pct, 4) if pct is not None else None,
            "matches_played": matches,
            "eligible_ranking": pct is not None and pct >= pe.MIN_MINUTES_PCT,
        }
    return out


@functools.lru_cache(maxsize=1)
def player_event_minutes_map() -> dict[tuple[str, int], int]:
    """Lookup (player_id, event_id) -> minutes played in that match."""
    frame = load_match_minutes_frame()
    if frame.empty or "event_id" not in frame.columns:
        return {}
    out: dict[tuple[str, int], int] = {}
    for row in frame.itertuples(index=False):
        event_id = getattr(row, "event_id", None)
        if event_id is None or pd.isna(event_id):
            continue
        pid = str(row.player_id)
        mins = int(round(float(row.minutes_played)))
        out[(pid, int(event_id))] = mins
    return out


def aggregate_defensive_player_stats(frame: pd.DataFrame | None = None) -> dict[str, dict]:
    """Sum match rows per player and derive per-90 / percentage defensive metrics."""
    if frame is None:
        frame = _load_defensive_frames()
    if frame.empty:
        return {}

    numeric_cols = [
        "minutes_played",
        "total_tackle",
        "won_tackle",
        "interception_won",
        "total_clearance",
        "outfielder_block",
        "ball_recovery",
        "aerial_won",
        "aerial_lost",
        "error_lead_to_a_shot",
        "error_lead_to_a_goal",
    ]
    for col in numeric_cols:
        if col in frame.columns:
            frame[col] = pd.to_numeric(frame[col], errors="coerce").fillna(0)

    grouped = frame.groupby(["player_id", "league_source"], sort=False).agg(
        minutes=("minutes_played", "sum"),
        won_tackle=("won_tackle", "sum"),
        total_tackle=("total_tackle", "sum"),
        interception=("interception_won", "sum"),
        clearance=("total_clearance", "sum"),
        block=("outfielder_block", "sum"),
        recovery=("ball_recovery", "sum"),
        aerial_won=("aerial_won", "sum"),
        aerial_lost=("aerial_lost", "sum"),
        err_shot=("error_lead_to_a_shot", "sum"),
        err_goal=("error_lead_to_a_goal", "sum"),
        player_name=("player_name", "first"),
    )

    out: dict[str, dict] = {}
    for (pid, league_source), row in grouped.iterrows():
        minutes = float(row["minutes"])
        if minutes <= 0:
            continue
        per90 = 90.0 / minutes
        total_tackle = float(row["total_tackle"])
        aerial_won = float(row["aerial_won"])
        aerial_lost = float(row["aerial_lost"])
        tackle_won_pct = None
        if total_tackle >= MIN_ATTEMPTS_FOR_PCT:
            tackle_won_pct = round(100.0 * float(row["won_tackle"]) / total_tackle, 2)
        aerial_attempts = aerial_won + aerial_lost
        aerial_won_pct = None
        if aerial_attempts >= MIN_ATTEMPTS_FOR_PCT:
            aerial_won_pct = round(100.0 * aerial_won / aerial_attempts, 2)

        out[str(pid)] = {
            "player_id": str(pid),
            "player_name": row["player_name"],
            "league_source": str(league_source),
            "def_minutes": round(minutes, 1),
            "def_won_tackle_p90": round(float(row["won_tackle"]) * per90, 3),
            "def_interception_p90": round(float(row["interception"]) * per90, 3),
            "def_clearance_p90": round(float(row["clearance"]) * per90, 3),
            "def_recovery_p90": round(float(row["recovery"]) * per90, 3),
            "def_aerial_won_p90": round(aerial_won * per90, 3),
            "def_block_p90": round(float(row["block"]) * per90, 3),
            "def_err_shot_p90": round(float(row["err_shot"]) * per90, 3),
            "def_err_goal_p90": round(float(row["err_goal"]) * per90, 3),
            "def_tackle_won_pct": tackle_won_pct,
            "def_aerial_won_pct": aerial_won_pct,
        }
    return out


def _rank_descending(values: pd.Series) -> pd.Series:
    return values.rank(method="min", ascending=False)


def attach_defensive_contribution(players: list[dict]) -> None:
    """Attach league-scoped defensive contribution scores to player records."""
    if not players:
        return

    defensive_by_id = aggregate_defensive_player_stats()
    if not defensive_by_id:
        return

    eligible: list[dict] = []
    for player in players:
        pid = str(player.get("player_id", ""))
        league_source = str(player.get("league_source") or "")
        stats = defensive_by_id.get(pid)
        if stats is None:
            continue
        if league_source and stats.get("league_source") and league_source != stats["league_source"]:
            continue
        player.update(stats)
        if not player.get("league_source"):
            player["league_source"] = stats["league_source"]
            player["league"] = pe._european_league_label(stats["league_source"])
        eligible.append(player)

    if not eligible:
        return

    pools: dict[str, list[dict]] = {}
    for player in eligible:
        league = str(player.get("league_source") or "unknown")
        pools.setdefault(league, []).append(player)

    for rows in pools.values():
        df = pd.DataFrame(rows)
        qty_cols = [c for c in QTY_P90_METRICS if c in df.columns]
        qual_cols = [c for c in QUAL_PCT_METRICS if c in df.columns]
        qty_z = _mean_z_columns(df, tuple(qty_cols))
        qual_z = _mean_z_columns(df, tuple(qual_cols)) if qual_cols else pd.Series(0.0, index=df.index)
        err_shot_z = _zscore(df["def_err_shot_p90"]) if "def_err_shot_p90" in df.columns else pd.Series(0.0, index=df.index)
        err_goal_z = _zscore(df["def_err_goal_p90"]) if "def_err_goal_p90" in df.columns else pd.Series(0.0, index=df.index)
        merit_raw = (
            QTY_WEIGHT * qty_z
            + QUAL_WEIGHT * qual_z
            - ERR_SHOT_WEIGHT * err_shot_z
            - ERR_GOAL_WEIGHT * err_goal_z
        )
        minutes = pd.to_numeric(df.get("def_minutes", df.get("minutes")), errors="coerce").fillna(0.0)
        conf = (minutes / MINUTES_CONF_CAP).clip(upper=1.0)
        defense_core = merit_raw * conf
        ranks = _rank_descending(defense_core)
        pool_size = len(rows)

        for i, row in enumerate(rows):
            row["defense_index"] = float(defense_core.iloc[i]) if pd.notna(defense_core.iloc[i]) else None
            rank_raw = ranks.iloc[i]
            if pd.isna(rank_raw):
                row["defense_index_rank_in_league"] = None
                row["defense_index_rank_pool_in_league"] = pool_size
                row["defense_display"] = None
                row["defense_letter"] = "—"
                continue
            rank = int(rank_raw)
            row["defense_index_rank_in_league"] = rank
            row["defense_index_rank_pool_in_league"] = pool_size
            display = float(pe.rank_to_display_score(rank, pool_size))
            minute_cap = 4.5 + (float(minutes.iloc[i]) / MINUTES_CONF_CAP) * 4.5
            row["defense_display"] = round(min(display, minute_cap), 2)
            row["defense_letter"] = rank_percentile_letter_grade(rank, pool_size)
            row["defense_idx"] = row["defense_index"]
            from xp_stats_engine import _index_tier_from_rank

            row["defense_idx_tier"] = _index_tier_from_rank(rank, pool_size)

            for comp_key in DEFENSE_COMPONENT_KEYS:
                if comp_key not in row:
                    continue
                comp_vals = pd.to_numeric(df[comp_key], errors="coerce")
                comp_ranks = _rank_descending(comp_vals.fillna(-np.inf))
                comp_rank = comp_ranks.iloc[i]
                if pd.isna(comp_rank) or pd.isna(row.get(comp_key)):
                    row[f"{comp_key}_rank_in_league"] = None
                    row[f"{comp_key}_rank_pool_in_league"] = pool_size
                else:
                    row[f"{comp_key}_rank_in_league"] = int(comp_rank)
                    row[f"{comp_key}_rank_pool_in_league"] = pool_size
