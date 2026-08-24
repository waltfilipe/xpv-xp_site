"""Absolute vs relative profile views: xp bars league-scoped, pass scores pool-scoped."""

from __future__ import annotations

import functools
from collections import defaultdict
from typing import Any

import numpy as np
import pandas as pd

import passes_engine as pe

from xp_stats_engine import (
    EUROPEAN_TOP_FIVE_LEAGUES,
    PASS_GRADE_OVERALL_WEIGHT_LETH,
    PASS_GRADE_OVERALL_WEIGHT_PREC,
    PASS_GRADE_OVERALL_WEIGHT_PROD,
    XP_PASS_RATING_V2_LETHALITY_XPV_WEIGHT,
    _assign_pool_metric_grades,
    _league_rank_probit_grade,
    _mean_winsorized_z_columns,
    _rank_descending,
    _zscore,
    display_score_letter_grade,
    pool_normal_pass_grade,
    pool_rank_normal_pass_grade,
)

# Overall pass grade: productivity 40%, precision 40%, lethality 20% (league-scoped).
PASS_GRADE_OVERALL_WEIGHTS: tuple[tuple[str, float], ...] = (
    ("prod_grade_geral", 0.4),
    ("prec_grade_geral", 0.4),
    ("leth_grade_blend", 0.2),
)

# Kept for absolute/relative profile views and legacy fields.
_PASS_GRADE_WEIGHT_OTHER = 1.0 / 5.2
_PASS_GRADE_WEIGHT_PROD_PREC = 1.2 / 5.2

PASS_GRADE_ABS_WEIGHTS: tuple[tuple[str, float], ...] = (
    ("prod_grade_pass_pool", _PASS_GRADE_WEIGHT_PROD_PREC),
    ("prec_grade_pass_pool", _PASS_GRADE_WEIGHT_PROD_PREC),
    ("pv_abs_buildup_display", _PASS_GRADE_WEIGHT_OTHER),
    ("pv_abs_chance_display", _PASS_GRADE_WEIGHT_OTHER),
    ("leth_grade_pass_pool", _PASS_GRADE_WEIGHT_OTHER),
)
PASS_GRADE_REL_WEIGHTS: tuple[tuple[str, float], ...] = (
    ("prod_grade_rel_pool", _PASS_GRADE_WEIGHT_PROD_PREC),
    ("prec_grade_stratum_pool", _PASS_GRADE_WEIGHT_PROD_PREC),
    ("pv_rel_buildup_display", _PASS_GRADE_WEIGHT_OTHER),
    ("pv_rel_chance_display", _PASS_GRADE_WEIGHT_OTHER),
    ("leth_grade_rel_pool", _PASS_GRADE_WEIGHT_OTHER),
)

# Precision short/long COE bars (not in pass-score specs after Efficiency removal).
XP_PROFILE_POOL_METRICS: tuple[str, ...] = (
    "xpass_coe_pct",
    "xpass_long_coe_pct",
)

PASS_SCORE_ABSOLUTE_SPECS: tuple[tuple[str, str, tuple[str, ...]], ...] = (
    ("Volume", "pv_abs_volume", ("passes_total", "long_balls")),
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
    (
        "Lethality",
        "pv_abs_leth",
        ("leth_xpv_per_pass", "leth_impact_rate_pct"),
    ),
)

PASS_SCORE_RELATIVE_SPECS: tuple[tuple[str, str, tuple[str, ...]], ...] = (
    ("Volume", "pv_rel_volume", ("vol_passes_team_share_pct", "vol_long_team_share_pct")),
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
            "chance_creation_xpv_per_pass",
        ),
    ),
    (
        "Lethality",
        "pv_rel_leth",
        ("leth_xpv_display", "leth_threat_display"),
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
    matches = _safe_float(player.get("matches_played"))
    if matches is not None and matches > 0:
        games = matches
    else:
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


def _creation_passes_per_game(player: dict) -> float | None:
    parts = [
        _safe_float(player.get("key_passes")),
        _safe_float(player.get("passes_to_box")),
        _safe_float(player.get("test_impact_v2_start_final_third_p90")),
    ]
    if not any(p is not None for p in parts):
        return None
    total = sum(p or 0.0 for p in parts)
    return total if total > 0 else None


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
        creation_pg = _creation_passes_per_game(player)
        if cc_pg is not None and creation_pg is not None and creation_pg > 0:
            player["chance_creation_xpv_per_pass"] = round(cc_pg / creation_pg, 3)

    short_delta = _safe_float(player.get("eff_short_stratum_delta_pp"))
    long_delta = _safe_float(player.get("eff_long_stratum_delta_pp"))
    if short_delta is not None:
        player.setdefault("eff_short_stratum_delta_pp", short_delta)
    if long_delta is not None:
        player.setdefault("eff_long_stratum_delta_pp", long_delta)


@functools.lru_cache(maxsize=1)
def _cached_team_pass_totals_from_frame() -> dict[str, dict[str, float]]:
    """Mean completed passes (and long balls) per match for each team — all positions."""
    frame = pe._load_european_league_pass_frame()
    if frame.empty:
        return {}

    work = frame.copy()
    if "isHome" in work.columns:
        is_home = pe._parse_bool_series(work["isHome"])
        work["team"] = np.where(is_home, work["home_team"], work["away_team"])
    else:
        work["team"] = work.get("home_team", "—")
    work["team"] = work["team"].astype(str).str.strip()
    work["league_source"] = work["league_source"].astype(str).str.strip()

    has_end = work["end_x"].notna() & work["end_y"].notna()
    is_success = (
        pe._parse_bool_series(work["outcome"])
        if "outcome" in work.columns
        else pd.Series(False, index=work.index)
    )
    completed = work[has_end & is_success].copy()
    if completed.empty:
        return {}

    sx, sy = pe._wyscout_to_sb(completed["start_x"], completed["start_y"])
    ex = np.full(len(completed), np.nan)
    ey = np.full(len(completed), np.nan)
    end_mask = completed["end_x"].notna() & completed["end_y"].notna()
    if end_mask.any():
        ex[end_mask.to_numpy()], ey[end_mask.to_numpy()] = pe._wyscout_to_sb(
            completed.loc[end_mask, "end_x"], completed.loc[end_mask, "end_y"],
        )
    pass_dist = np.sqrt((ex - sx) ** 2 + (ey - sy) ** 2)
    completed["is_long_ball"] = end_mask.to_numpy() & (pass_dist >= pe.LONG_PASS_MIN_DISTANCE_M)

    pass_per_match = completed.groupby(
        ["league_source", "team", "event_id"], sort=False,
    ).size()
    long_completed = completed[completed["is_long_ball"]]
    long_per_match = (
        long_completed.groupby(
            ["league_source", "team", "event_id"], sort=False,
        ).size()
        if not long_completed.empty
        else pd.Series(dtype=float)
    )

    out: dict[str, dict[str, float]] = {}
    for (league, team), counts in pass_per_match.groupby(level=[0, 1]):
        key = f"{league}|{team}"
        long_mean = 0.0
        if not long_per_match.empty:
            long_grp = long_per_match.xs((league, team), level=[0, 1], drop_level=False)
            if len(long_grp):
                long_mean = float(long_grp.mean())
        out[key] = {
            "passes": float(counts.mean()),
            "long": long_mean,
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


def _rank_percentile_bar_display(rank: int, cohort_size: int) -> float | None:
    """Map rank (1 = best) to a 0–100 bar position within a peer cohort."""
    if rank <= 0 or cohort_size <= 0:
        return None
    if cohort_size == 1:
        return 100.0
    pct = (float(cohort_size) - float(rank)) / float(cohort_size - 1) * 100.0
    return round(float(np.clip(pct, 0.0, 100.0)), 1)


def _assign_league_ranks_and_bars(
    league_players: list[dict],
    metric_keys: tuple[str, ...],
) -> None:
    for metric in metric_keys:
        ranked: list[tuple[dict, float]] = []
        for player in league_players:
            raw = _safe_float(player.get(metric))
            if raw is None:
                player[f"{metric}_rank_in_league"] = None
                player[f"{metric}_rank_pool_in_league"] = len(league_players)
                player[f"{metric}_league_bar"] = None
                continue
            ranked.append((player, raw))

        pool_size = len(league_players)
        if not ranked:
            continue

        ordered = sorted(ranked, key=lambda item: item[1], reverse=True)
        for rank, (player, _raw) in enumerate(ordered, start=1):
            player[f"{metric}_rank_in_league"] = rank
            player[f"{metric}_rank_pool_in_league"] = pool_size
            player[f"{metric}_league_bar"] = _rank_percentile_bar_display(rank, pool_size)


def _pool_rank_bar_display(rank: int, pool_size: int) -> float | None:
    """Map pool rank (1 = best) to a 0–100 bar position."""
    return _rank_percentile_bar_display(rank, pool_size)


def _assign_pool_ranks_and_bars(
    pool_players: list[dict],
    metric_keys: tuple[str, ...],
) -> None:
    """Rank pass-score metrics across the full eligible midfielder pool."""
    for metric in metric_keys:
        ranked: list[tuple[dict, float]] = []
        for player in pool_players:
            raw = _safe_float(player.get(metric))
            if raw is None:
                player[f"{metric}_rank_in_group"] = None
                player[f"{metric}_rank_pool_in_group"] = len(pool_players)
                player[f"{metric}_pool_bar"] = None
                continue
            ranked.append((player, raw))

        pool_size = len(pool_players)
        if not ranked:
            continue

        ordered = sorted(ranked, key=lambda item: item[1], reverse=True)
        for rank, (player, _raw) in enumerate(ordered, start=1):
            player[f"{metric}_rank_in_group"] = rank
            player[f"{metric}_rank_pool_in_group"] = pool_size
            player[f"{metric}_pool_bar"] = _pool_rank_bar_display(rank, pool_size)


def _weighted_pillar_grade(
    weights: tuple[tuple[str, float], ...],
    player: dict,
) -> float | None:
    total = 0.0
    for key, weight in weights:
        raw = _safe_float(player.get(key))
        if raw is None:
            return None
        total += weight * raw
    return round(total, 2)


def _attach_lethality_pool_grades(eligible: list[dict]) -> None:
    leth_w = XP_PASS_RATING_V2_LETHALITY_XPV_WEIGHT
    _assign_pool_metric_grades(eligible, "leth_xpv_per_pass", "leth_grade_xpv_pool")
    _assign_pool_metric_grades(eligible, "leth_impact_rate_pct", "leth_grade_threat_pool")
    for player in eligible:
        xpv_grade = player.get("leth_grade_xpv_pool")
        threat_grade = player.get("leth_grade_threat_pool")
        if xpv_grade is not None and threat_grade is not None:
            blend = leth_w * float(xpv_grade) + (1.0 - leth_w) * float(threat_grade)
            player["leth_grade_pass_pool"] = round(blend, 2)

    df = pd.DataFrame(eligible)
    xpv = pd.to_numeric(df.get("leth_xpv_per_pass"), errors="coerce")
    threat = pd.to_numeric(df.get("leth_impact_rate_pct"), errors="coerce")
    if xpv.notna().sum() < 2 and threat.notna().sum() < 2:
        return
    z_composite = leth_w * _zscore(xpv.fillna(0.0)) + (1.0 - leth_w) * _zscore(threat.fillna(0.0))
    ranks = _rank_descending(z_composite)
    pool_size = len(eligible)
    for i, player in enumerate(eligible):
        rank_raw = ranks.iloc[i]
        if pd.isna(rank_raw):
            player.pop("leth_grade_rel_pool", None)
            continue
        player["leth_grade_rel_pool"] = _league_rank_probit_grade(int(rank_raw), pool_size)


def _attach_pool_pass_grade_overall(eligible: list[dict]) -> None:
    """Headline pass grade from 40/40/20 composite z on full pool raw metrics."""
    if not eligible:
        return

    leth_w = XP_PASS_RATING_V2_LETHALITY_XPV_WEIGHT
    df = pd.DataFrame(eligible)
    prod = pd.to_numeric(df.get("prod_xpv_per_game"), errors="coerce")
    prec = pd.to_numeric(df.get("prec_coe_per_pass"), errors="coerce")
    xpv = pd.to_numeric(df.get("leth_xpv_per_pass"), errors="coerce")
    threat = pd.to_numeric(df.get("leth_impact_rate_pct"), errors="coerce")

    if prod.notna().sum() < 2 or prec.notna().sum() < 2:
        return

    z_prod = _zscore(prod.fillna(prod.mean()))
    z_prec = _zscore(prec.fillna(prec.mean()))
    z_xpv = _zscore(xpv.fillna(xpv.mean() if xpv.notna().any() else 0.0))
    z_threat = _zscore(threat.fillna(threat.mean() if threat.notna().any() else 0.0))
    z_leth = leth_w * z_xpv + (1.0 - leth_w) * z_threat
    z_composite = (
        PASS_GRADE_OVERALL_WEIGHT_PROD * z_prod
        + PASS_GRADE_OVERALL_WEIGHT_PREC * z_prec
        + PASS_GRADE_OVERALL_WEIGHT_LETH * z_leth
    )
    ranks = _rank_descending(z_composite)
    pool_size = int(ranks.notna().sum())
    if pool_size < 2:
        return

    for player in eligible:
        player.pop("pass_grade_overall", None)
        player.pop("pass_grade_overall_rank_in_league", None)
        player.pop("pass_grade_overall_rank_pool_in_league", None)
        player.pop("pass_grade_overall_rank_in_pool", None)
        player.pop("pass_grade_overall_rank_pool_size", None)

    ranked: list[tuple[dict, float]] = []
    for i, player in enumerate(eligible):
        rank_raw = ranks.iloc[i]
        if pd.isna(rank_raw):
            continue
        rank = int(rank_raw)
        grade = pool_rank_normal_pass_grade(rank, pool_size)
        player["pass_grade_overall"] = grade
        player["pass_grade_overall_rank_in_pool"] = rank
        player["pass_grade_overall_rank_pool_size"] = pool_size
        ranked.append((player, grade))

    if not ranked:
        return

    by_league: dict[str, list[tuple[dict, float]]] = defaultdict(list)
    for player, grade in ranked:
        league = str(player.get("league_source") or "").strip()
        by_league[league].append((player, grade))

    for league_players in by_league.values():
        league_players.sort(key=lambda item: item[1], reverse=True)
        league_size = len(league_players)
        for rank, (player, _) in enumerate(league_players, start=1):
            player["pass_grade_overall_rank_in_league"] = rank
            player["pass_grade_overall_rank_pool_in_league"] = league_size


def _attach_weighted_pass_grades(eligible: list[dict], players: list[dict]) -> None:
    """Pass headline: pool-normal 40/40/20 overall; also keep abs/rel five-pillar grades."""
    if not eligible:
        return

    from xp_stats_engine import _attach_league_profile_grades

    _attach_league_profile_grades(players)

    _assign_pool_metric_grades(eligible, "prod_xpv_per_game", "prod_grade_pass_pool")
    _assign_pool_metric_grades(eligible, "prec_coe_per_pass", "prec_grade_pass_pool")
    _assign_pool_metric_grades(eligible, "prod_rel_xpv", "prod_grade_rel_pool")
    _assign_pool_metric_grades(eligible, "prec_z_coe_stratum", "prec_grade_stratum_pool")
    _attach_lethality_pool_grades(eligible)

    for player in eligible:
        abs_grade = _weighted_pillar_grade(PASS_GRADE_ABS_WEIGHTS, player)
        if abs_grade is not None:
            player["pass_grade_general"] = abs_grade

        rel_grade = _weighted_pillar_grade(PASS_GRADE_REL_WEIGHTS, player)
        if rel_grade is not None:
            player["pass_grade_expected"] = rel_grade
            player["pass_grade_relative"] = rel_grade

    for player in players:
        if player.get("pass_grade_expected") is not None:
            player["pass_grade_relative"] = player.get("pass_grade_expected")

    _attach_pool_pass_grade_overall(eligible)


def _attach_pass_score_composites(
    players: list[dict],
    specs: tuple[tuple[str, str, tuple[str, ...]], ...],
    *,
    scope: str = "pool",
) -> None:
    if not players:
        return
    df = pd.DataFrame(players)
    pool_size = len(players)
    for _title, prefix, metric_cols in specs:
        available = [c for c in metric_cols if c in df.columns]
        if not available:
            continue
        composite = _mean_winsorized_z_columns(df, tuple(available))
        ranks = _rank_descending(composite)
        for i, player in enumerate(players):
            comp = composite.iloc[i]
            rank_raw = ranks.iloc[i]
            if pd.isna(comp) or pd.isna(rank_raw):
                if scope == "league":
                    player[f"{prefix}_league_index"] = None
                    player[f"{prefix}_league_display"] = None
                    player[f"{prefix}_league_letter"] = "—"
                    player[f"{prefix}_rank_in_league"] = None
                    player[f"{prefix}_rank_pool_in_league"] = pool_size
                else:
                    player[f"{prefix}_index"] = None
                    player[f"{prefix}_display"] = None
                    player[f"{prefix}_letter"] = "—"
                    player[f"{prefix}_rank_in_group"] = None
                    player[f"{prefix}_rank_pool_in_group"] = pool_size
                continue
            rank = int(rank_raw)
            grade = _league_rank_probit_grade(rank, pool_size)
            if scope == "league":
                player[f"{prefix}_league_index"] = round(float(comp), 4)
                player[f"{prefix}_league_display"] = grade
                player[f"{prefix}_league_letter"] = display_score_letter_grade(grade)
                player[f"{prefix}_rank_in_league"] = rank
                player[f"{prefix}_rank_pool_in_league"] = pool_size
            else:
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

    team_totals = _cached_team_pass_totals_from_frame()
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
        _assign_league_ranks_and_bars(league_players, PASS_SCORE_POOL_METRICS)
        _assign_league_ranks_and_bars(league_players, XP_PROFILE_POOL_METRICS)

    _assign_pool_ranks_and_bars(eligible, XP_BAR_LEAGUE_METRICS)
    _assign_pool_ranks_and_bars(eligible, PASS_SCORE_POOL_METRICS)
    _assign_pool_ranks_and_bars(eligible, XP_PROFILE_POOL_METRICS)
    _attach_pass_score_composites(eligible, PASS_SCORE_ABSOLUTE_SPECS, scope="pool")
    _attach_pass_score_composites(eligible, PASS_SCORE_RELATIVE_SPECS, scope="pool")
    for league_players in by_league.values():
        _attach_pass_score_composites(league_players, PASS_SCORE_ABSOLUTE_SPECS, scope="league")
        _attach_pass_score_composites(league_players, PASS_SCORE_RELATIVE_SPECS, scope="league")

    for player in eligible:
        bar = player.get("prec_z_coe_stratum_league_bar")
        if bar is not None:
            player["prec_stratum_league_bar"] = bar
        coe_bar = player.get("prec_coe_per_pass_league_bar")
        if coe_bar is not None:
            player["prec_coe_league_bar"] = coe_bar

    _attach_weighted_pass_grades(eligible, players)
