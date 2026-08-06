"""Defensive contribution scores from per-match CSV exports (PL + Serie A)."""

from __future__ import annotations

from pathlib import Path

import numpy as np
import pandas as pd

import passes_engine as pe
from xp_stats_engine import rank_percentile_letter_grade

BACKEND_ROOT = Path(__file__).resolve().parent
PREMIER_DEFENSIVE_CSV = BACKEND_ROOT / "Premier_defensive.csv"
SERIEA_DEFENSIVE_CSV = BACKEND_ROOT / "SerieA_defensive.csv"

DEFENSIVE_LEAGUE_SOURCES: tuple[tuple[str, Path], ...] = (
    ("premier_league", PREMIER_DEFENSIVE_CSV),
    ("italia_seriea", SERIEA_DEFENSIVE_CSV),
)

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
    for league_source, path in DEFENSIVE_LEAGUE_SOURCES:
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
