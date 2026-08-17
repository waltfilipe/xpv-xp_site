"""Absolute vs relative profile views: xp bars league-scoped, pass scores pool-scoped."""

from __future__ import annotations

from collections import defaultdict
from typing import Any

import numpy as np
import pandas as pd

from xp_stats_engine import (
    EUROPEAN_TOP_FIVE_LEAGUES,
    _league_minmax_display,
    _league_rank_probit_grade,
    _mean_winsorized_z_columns,
    _rank_descending,
    display_score_letter_grade,
)

PASS_SCORE_ABSOLUTE_SPECS: tuple[tuple[str, str, tuple[str, ...]], ...] = (
    ("Volume", "pv_abs_volume", ("passes_total", "long_balls")),
    (
        "Efficiency",
        "pv_abs_efficiency",
        ("xpass_coe_pct", "xpass_long_coe_pct"),
    ),
    (
        "Build-up",
        "pv_abs_buildup",
        ("progressive_passes", "final_third_passes", "special_line_break_p90"),
    ),
    (
        "Chance creation",
        "pv_abs_chance",
        (
            "key_passes",
            "passes_to_box",
            "test_impact_v2_start_final_third_p90",
            "chance_creation_xpv_per_game",
        ),
    ),
)

PASS_SCORE_RELATIVE_SPECS: tuple[tuple[str, str, tuple[str, ...]], ...] = (
    ("Volume", "pv_rel_volume", ("vol_passes_team_share_pct", "vol_long_team_share_pct")),
    (
        "Efficiency",
        "pv_rel_efficiency",
        ("eff_short_stratum_delta_pp", "eff_long_stratum_delta_pp"),
    ),
    (
        "Build-up",
        "pv_rel_buildup",
        (
            "build_prog_share_pct",
            "build_final_third_share_pct",
            "build_line_break_share_pct",
        ),
    ),
    (
        "Chance creation",
        "pv_rel_chance",
        (
            "chance_key_share_pct",
            "chance_box_share_pct",
            "chance_impact_ft_share_pct",
            "chance_xpv_share_pct",
        ),
    ),
)

XP_BAR_LEAGUE_METRICS: tuple[str, ...] = (
    "prod_xpv_per_game",
    "prod_rel_xpv",
    "prec_coe_per_pass",
    "prec_z_coe_stratum",
)

PASS_SCORE_POOL_METRICS: tuple[str, ...] = tuple(
    dict.fromkeys(
        key
        for _title, _prefix, keys in PASS_SCORE_ABSOLUTE_SPECS + PASS_SCORE_RELATIVE_SPECS
        for key in keys
    )
)


def _safe_float(value: Any) -> float | None:
    if value is None:
        return None
    try:
        out = float(value)
    except (TypeError, ValueError):
        return None
    if not np.isfinite(out):
        return None
    return out


def _share_pct(part: Any, total: Any) -> float | None:
    p = _safe_float(part)
    t = _safe_float(total)
    if p is None or t is None or t <= 0:
        return None
    return round(p / t * 100.0, 2)


def _compute_chance_creation_xpv_per_game(player: dict) -> float | None:
    minutes = _safe_float(player.get("minutes"))
    games = minutes / 90.0 if minutes and minutes > 0 else None
    cc_pg = _safe_float(player.get("chance_creation_xpv_per_game"))
    if cc_pg is not None:
        return round(cc_pg, 3)
    cc_xpv = _safe_float(player.get("chance_creation_xpv"))
    if cc_xpv is not None and games:
        count = (
            (_safe_float(player.get("key_passes")) or 0.0)
            + (_safe_float(player.get("passes_to_box")) or 0.0)
            + (_safe_float(player.get("test_impact_v2_start_final_third_p90")) or 0.0)
        )
        if count > 0:
            return round(cc_xpv * count, 3)
    return None


def _compute_profile_derived_metrics(player: dict) -> None:
    passes_pg = _safe_float(player.get("passes_total"))
    team_passes = _safe_float(player.get("team_passes_per_game"))
    team_long = _safe_float(player.get("team_long_balls_per_game"))
    long_pg = _safe_float(player.get("long_balls"))

    if passes_pg is not None and team_passes is not None and team_passes > 0:
        player["vol_passes_team_share_pct"] = round(
            min(100.0, passes_pg / team_passes * 100.0),
            1,
        )
    if long_pg is not None and team_long is not None and team_long > 0:
        player["vol_long_team_share_pct"] = round(
            min(100.0, long_pg / team_long * 100.0),
            1,
        )

    if passes_pg is not None and passes_pg > 0:
        player["build_prog_share_pct"] = _share_pct(player.get("progressive_passes"), passes_pg)
        player["build_final_third_share_pct"] = _share_pct(
            player.get("final_third_passes"), passes_pg,
        )
        player["build_line_break_share_pct"] = _share_pct(
            player.get("special_line_break_p90"), passes_pg,
        )
        player["chance_key_share_pct"] = _share_pct(player.get("key_passes"), passes_pg)
        player["chance_box_share_pct"] = _share_pct(player.get("passes_to_box"), passes_pg)
        player["chance_impact_ft_share_pct"] = _share_pct(
            player.get("test_impact_v2_start_final_third_p90"), passes_pg,
        )
        cc_pg = _compute_chance_creation_xpv_per_game(player)
        if cc_pg is not None:
            player["chance_creation_xpv_per_game"] = cc_pg
        xp_pg = _safe_float(player.get("xp_per_90"))
        if cc_pg is not None and xp_pg is not None and xp_pg > 0:
            player["chance_xpv_share_pct"] = round(cc_pg / xp_pg * 100.0, 2)

    short_delta = _safe_float(player.get("eff_short_stratum_delta_pp"))
    long_delta = _safe_float(player.get("eff_long_stratum_delta_pp"))
    if short_delta is not None:
        player.setdefault("eff_short_stratum_delta_pp", short_delta)
    if long_delta is not None:
        player.setdefault("eff_long_stratum_delta_pp", long_delta)


def _team_pass_totals(eligible: list[dict]) -> dict[str, dict[str, float]]:
    """Sum per-game pass volume for eligible pool midfielders on each team."""
    buckets: dict[str, list[dict]] = defaultdict(list)
    for player in eligible:
        league = str(player.get("league_source") or "").strip()
        team = str(player.get("team") or "").strip()
        if not league or not team:
            continue
        buckets[f"{league}|{team}"].append(player)

    out: dict[str, dict[str, float]] = {}
    for key, members in buckets.items():
        passes_vals = [_safe_float(p.get("passes_total")) for p in members]
        long_vals = [_safe_float(p.get("long_balls")) for p in members]
        passes_clean = [v for v in passes_vals if v is not None]
        long_clean = [v for v in long_vals if v is not None]
        if passes_clean:
            out[key] = {
                "passes": float(np.sum(passes_clean)),
                "long": float(np.sum(long_clean)) if long_clean else 0.0,
            }
    return out


def _attach_efficiency_stratum_deltas(pool_players: list[dict]) -> None:
    if len(pool_players) < 4:
        return
    df = pd.DataFrame(pool_players)
    if "passes_total" not in df.columns:
        return
    passes = pd.to_numeric(df["passes_total"], errors="coerce")

    for metric, delta_key in (
        ("xpass_coe_pct", "eff_short_stratum_delta_pp"),
        ("xpass_long_coe_pct", "eff_long_stratum_delta_pp"),
    ):
        if metric not in df.columns:
            continue
        coe = pd.to_numeric(df[metric], errors="coerce")
        valid = passes.notna() & (passes > 0) & coe.notna()
        if int(valid.sum()) < 4:
            continue
        try:
            vol_q = pd.Series(np.nan, index=df.index, dtype=float)
            vol_q.loc[passes[valid].index] = pd.qcut(
                passes[valid],
                4,
                labels=False,
                duplicates="drop",
            )
        except ValueError:
            continue
        for q in sorted(vol_q.dropna().unique()):
            q_mask = valid & (vol_q == q)
            if int(q_mask.sum()) < 2:
                continue
            q_mean = float(coe[q_mask].mean())
            for idx in coe[q_mask].index:
                pool_players[int(idx)][delta_key] = round(float(coe.loc[idx]) - q_mean, 2)


def _assign_league_ranks_and_bars(
    league_players: list[dict],
    metric_keys: tuple[str, ...],
) -> None:
    for metric in metric_keys:
        ranked: list[tuple[dict, float]] = []
        values: list[float] = []
        for player in league_players:
            raw = _safe_float(player.get(metric))
            if raw is None:
                player[f"{metric}_rank_in_league"] = None
                player[f"{metric}_rank_pool_in_league"] = len(league_players)
                player[f"{metric}_league_bar"] = None
                continue
            ranked.append((player, raw))
            values.append(raw)

        pool_size = len(league_players)
        if not ranked:
            continue

        ordered = sorted(ranked, key=lambda item: item[1], reverse=True)
        for rank, (player, raw) in enumerate(ordered, start=1):
            player[f"{metric}_rank_in_league"] = rank
            player[f"{metric}_rank_pool_in_league"] = pool_size
            player[f"{metric}_league_bar"] = _league_minmax_display(raw, values)


def _assign_pool_ranks_and_bars(
    pool_players: list[dict],
    metric_keys: tuple[str, ...],
) -> None:
    """Rank pass-score metrics across the full eligible midfielder pool."""
    for metric in metric_keys:
        ranked: list[tuple[dict, float]] = []
        values: list[float] = []
        for player in pool_players:
            raw = _safe_float(player.get(metric))
            if raw is None:
                player[f"{metric}_rank_in_group"] = None
                player[f"{metric}_rank_pool_in_group"] = len(pool_players)
                player[f"{metric}_pool_bar"] = None
                continue
            ranked.append((player, raw))
            values.append(raw)

        pool_size = len(pool_players)
        if not ranked:
            continue

        ordered = sorted(ranked, key=lambda item: item[1], reverse=True)
        for rank, (player, raw) in enumerate(ordered, start=1):
            player[f"{metric}_rank_in_group"] = rank
            player[f"{metric}_rank_pool_in_group"] = pool_size
            player[f"{metric}_pool_bar"] = _league_minmax_display(raw, values)


def _attach_pass_score_composites(
    pool_players: list[dict],
    specs: tuple[tuple[str, str, tuple[str, ...]], ...],
) -> None:
    if not pool_players:
        return
    df = pd.DataFrame(pool_players)
    pool_size = len(pool_players)
    for _title, prefix, metric_cols in specs:
        available = [c for c in metric_cols if c in df.columns]
        if not available:
            continue
        composite = _mean_winsorized_z_columns(df, tuple(available))
        ranks = _rank_descending(composite)
        for i, player in enumerate(pool_players):
            comp = composite.iloc[i]
            rank_raw = ranks.iloc[i]
            if pd.isna(comp) or pd.isna(rank_raw):
                player[f"{prefix}_index"] = None
                player[f"{prefix}_display"] = None
                player[f"{prefix}_letter"] = "—"
                player[f"{prefix}_rank_in_group"] = None
                player[f"{prefix}_rank_pool_in_group"] = pool_size
                continue
            rank = int(rank_raw)
            grade = _league_rank_probit_grade(rank, pool_size)
            player[f"{prefix}_index"] = round(float(comp), 4)
            player[f"{prefix}_display"] = grade
            player[f"{prefix}_letter"] = display_score_letter_grade(grade)
            player[f"{prefix}_rank_in_group"] = rank
            player[f"{prefix}_rank_pool_in_group"] = pool_size


def attach_profile_view_metrics(players: list[dict]) -> None:
    """Compute profile metrics: xp bars league-scoped, pass scores pool-scoped."""
    if not players:
        return

    eligible = [
        p for p in players
        if p.get("xp_profile_bars_eligible")
        and str(p.get("league_source") or "").strip() in EUROPEAN_TOP_FIVE_LEAGUES
    ]
    if not eligible:
        return

    team_totals = _team_pass_totals(eligible)
    for player in eligible:
        league = str(player.get("league_source") or "").strip()
        team = str(player.get("team") or "").strip()
        team_key = f"{league}|{team}"
        totals = team_totals.get(team_key)
        if totals:
            player["team_passes_per_game"] = round(totals["passes"], 2)
            player["team_long_balls_per_game"] = round(totals["long"], 2)
        _compute_profile_derived_metrics(player)

    by_league: dict[str, list[dict]] = defaultdict(list)
    for player in eligible:
        league = str(player.get("league_source") or "").strip()
        by_league[league].append(player)

    _attach_efficiency_stratum_deltas(eligible)
    for player in eligible:
        _compute_profile_derived_metrics(player)

    for league_players in by_league.values():
        _assign_league_ranks_and_bars(league_players, XP_BAR_LEAGUE_METRICS)

    _assign_pool_ranks_and_bars(eligible, PASS_SCORE_POOL_METRICS)
    _attach_pass_score_composites(eligible, PASS_SCORE_ABSOLUTE_SPECS)
    _attach_pass_score_composites(eligible, PASS_SCORE_RELATIVE_SPECS)

    for player in eligible:
        bar = player.get("prec_z_coe_stratum_league_bar")
        if bar is not None:
            player["prec_stratum_league_bar"] = bar
        coe_bar = player.get("prec_coe_per_pass_league_bar")
        if coe_bar is not None:
            player["prec_coe_league_bar"] = coe_bar

    for player in players:
        if player.get("pass_grade_expected") is not None:
            player["pass_grade_relative"] = player.get("pass_grade_expected")
