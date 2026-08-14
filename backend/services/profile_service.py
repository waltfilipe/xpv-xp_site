"""Player profile assembly."""

from __future__ import annotations

from typing import Any

import progression_engine as pge
from passes_maps import draw_action_origin_smooth_heatmap
from xp_stats_engine import COE_STRATUM_METRICS, XP_ROUND_SERIES_KEY, _index_tier_from_rank, round_production_series

from services.figures import fig_to_b64

COE_STRATUM_STAR_BY_METRIC = dict(COE_STRATUM_METRICS)

XP_PA_REGULAR_SCORE_SPECS: tuple[tuple[str, str, str, str, tuple[str, ...]], ...] = (
    ("pass_volume_display", "pass_volume_index", "pass_volume_letter", "Volume", ("passes_total", "long_balls")),
    (
        "pass_efficiency_display",
        "pass_efficiency_index",
        "pass_efficiency_letter",
        "Efficiency",
        ("xpass_coe_pct", "xpass_long_coe_pct", "xpv_per_pass", "threat_pass_pct"),
    ),
    ("pass_buildup_display", "pass_buildup_index", "pass_buildup_letter", "Build-up", ("progressive_passes", "final_third_passes", "special_line_break_p90")),
    ("pass_chance_creation_display", "pass_chance_creation_index", "pass_chance_creation_letter", "Chance creation", ("key_passes", "passes_to_box", "test_impact_v2_start_final_third_p90")),
)

EFFICIENCY_LETHALITY_COMPONENT_KEYS: frozenset[str] = frozenset({"xpv_per_pass", "threat_pass_pct"})
EFFICIENCY_LETHALITY_GRADE_KEYS: dict[str, str] = {
    "xpv_per_pass": "leth_grade_xpv",
    "threat_pass_pct": "leth_grade_threat",
}

XP_PROFILE_BAR_KEYS = ("xp_activity_display", "xp_efficiency_display")
XP_PROFILE_BAR_LABELS = {
    "xp_activity_display": "Productivity",
    "xp_efficiency_display": "Precision",
}

DEFENSIVE_INDEX_COMPONENTS: tuple[tuple[str, str], ...] = (
    ("def_won_tackle_p90", "Won tackles / 90"),
    ("def_interception_p90", "Interceptions / 90"),
    ("def_clearance_p90", "Clearances / 90"),
    ("def_recovery_p90", "Recoveries / 90"),
    ("def_tackle_won_pct", "Tackle won %"),
    ("def_aerial_won_pct", "Aerial won %"),
)


def build_pass_score_sections(xp_profile: dict) -> list[dict[str, Any]]:
    sections: list[dict[str, Any]] = []
    for display_key, index_key, letter_key, title, component_keys in XP_PA_REGULAR_SCORE_SPECS:
        components = []
        for ck in component_keys:
            star_key = COE_STRATUM_STAR_BY_METRIC.get(ck, f"{ck}_stratum_star")
            value = xp_profile.get(ck)
            if ck == "xpv_per_pass" and value is None:
                value = xp_profile.get("leth_xpv_per_pass")
            if ck == "threat_pass_pct" and value is None:
                value = xp_profile.get("leth_impact_rate_pct")
            grade_key = EFFICIENCY_LETHALITY_GRADE_KEYS.get(ck)
            component: dict[str, Any] = {
                "key": ck,
                "value": value,
                "rank": xp_profile.get(f"{ck}_rank_in_group"),
                "rank_pool": xp_profile.get(f"{ck}_rank_pool_in_group"),
                "stratum_star": bool(xp_profile.get(star_key)),
            }
            if grade_key:
                component["grade"] = xp_profile.get(grade_key)
                component["lethality"] = True
            components.append(component)
        sections.append({
            "title": title,
            "display_score": xp_profile.get(display_key),
            "letter": xp_profile.get(letter_key),
            "index": xp_profile.get(index_key),
            "rank": xp_profile.get(f"{index_key}_rank_in_group"),
            "rank_pool": xp_profile.get(f"{index_key}_rank_pool_in_group"),
            "components": components,
        })
    return sections


def build_defensive_index_item(xp_profile: dict) -> dict[str, Any] | None:
    if xp_profile.get("defense_display") is None and not xp_profile.get("defense_idx_tier"):
        return None
    rank = xp_profile.get("defense_index_rank_in_league")
    pool = xp_profile.get("defense_index_rank_pool_in_league")
    tier = xp_profile.get("defense_idx_tier")
    if tier is None and rank is not None and pool is not None:
        try:
            tier = _index_tier_from_rank(int(rank), int(pool))
        except (TypeError, ValueError):
            tier = None
    components = []
    for key, label in DEFENSIVE_INDEX_COMPONENTS:
        if xp_profile.get(key) is None:
            continue
        components.append({
            "key": key,
            "label": label,
            "value": xp_profile.get(key),
            "rank": xp_profile.get(f"{key}_rank_in_league"),
            "rank_pool": xp_profile.get(f"{key}_rank_pool_in_league"),
        })
    if not tier and not components:
        return None
    return {
        "key": "defense",
        "label": "Defensive Contribution",
        "tier": tier,
        "tier_key": "xp_idx_defense",
        "value": xp_profile.get("defense_display"),
        "icon": "fa-shield-halved",
        "components": components,
    }


def build_xp_indices(xp_profile: dict) -> list[dict[str, Any]]:
    if not xp_profile:
        return []
    indices: list[dict[str, Any]] = [
        {
            "key": "consistency",
            "label": "Consistency",
            "tier": xp_profile.get("xp_idx_consistency_tier"),
            "tier_key": "xp_idx_consistency",
            "value": xp_profile.get("xp_game_consistency_score"),
            "icon": "fa-wave-square",
        },
    ]
    defense = build_defensive_index_item(xp_profile)
    if defense:
        indices.append(defense)
    return indices


def build_xp_profile_bars(xp_profile: dict) -> list[dict[str, Any]]:
    bars: list[dict[str, Any]] = []
    for key in XP_PROFILE_BAR_KEYS:
        bars.append({
            "key": key,
            "label": XP_PROFILE_BAR_LABELS.get(key, key),
            "value": xp_profile.get(key),
            "rank": xp_profile.get(f"{key}_rank_in_group"),
            "rank_pool": xp_profile.get(f"{key}_rank_pool_in_group"),
        })
    return bars


def _prepare_passes_for_round_series(passes_df):
    if passes_df is None or getattr(passes_df, "empty", True):
        return None
    import xpass_engine as xpe

    return xpe.attach_xpass_to_passes(passes_df.copy())


def _round_series_source(xp_profile: dict, passes_df) -> list[dict[str, Any]]:
    prepared = _prepare_passes_for_round_series(passes_df)
    if prepared is not None:
        return list(round_production_series(prepared))
    return list(xp_profile.get(XP_ROUND_SERIES_KEY) or [])


def build_round_grade_series(xp_profile: dict, passes_df=None) -> list[dict[str, Any]]:
    series = _round_series_source(xp_profile, passes_df)
    grades = xp_profile.get("xp_game_grades") or ()
    out: list[dict[str, Any]] = []
    for i, point in enumerate(series):
        grade = grades[i] if i < len(grades) else None
        out.append({
            "round": point.get("round", i + 1),
            "grade": grade,
            "opponent": point.get("opponent"),
            "date": point.get("date"),
            "xp": point.get("xp"),
            "impact": point.get("impact"),
            "passes": point.get("passes"),
            "event_id": point.get("event_id"),
            "short_pass_eff_pct": point.get("short_pass_eff_pct"),
            "long_pass_eff_pct": point.get("long_pass_eff_pct"),
            "breakline_passes": point.get("breakline_passes"),
            "key_passes": point.get("key_passes"),
        })
    return out


def origin_heatmap_b64(player_id: str, passes_by_player: dict, player_name: str) -> str | None:
    passes_df = passes_by_player.get(player_id)
    if passes_df is None or passes_df.empty:
        return None
    fig = draw_action_origin_smooth_heatmap(passes_df, None, str(player_name), profile=True)
    return fig_to_b64(fig)


def build_profile_payload(
    player_id: str,
    *,
    players_by_id: dict[str, dict],
    progression_by_id: dict[str, dict],
    xp_by_id: dict[str, dict],
    passes_by_player: dict,
) -> dict[str, Any] | None:
    rated = players_by_id.get(player_id)
    if rated is None:
        return None

    progression = progression_by_id.get(player_id, {})
    xp = xp_by_id.get(player_id, {})
    pass_player = players_by_id.get(player_id)

    merged = {**rated, **progression}
    if xp:
        merged = {**merged, **xp}
    if pass_player:
        merged = pge.enrich_traditional_participation_fields(merged, pass_player=pass_player)

    return {
        "player": merged,
        "xp": xp,
        "pass_scores": build_pass_score_sections(xp) if xp else [],
        "xp_bars": build_xp_profile_bars(xp) if xp else [],
        "origin_heatmap_b64": origin_heatmap_b64(player_id, passes_by_player, merged.get("player_name", "")),
        "long_pass_share_pct": xp.get("long_pass_share_pct") if xp else None,
        "long_pass_share_ref_avg_pct": xp.get("long_pass_share_ref_avg_pct") if xp else None,
        "long_pass_share_pctile": xp.get("long_pass_share_pctile") if xp else None,
        "xp_pass_rating": xp.get("xp_pass_rating"),
        "pass_grade_general": xp.get("pass_grade_general"),
        "pass_grade_expected": xp.get("pass_grade_expected"),
        "prod_grade_geral": xp.get("prod_grade_geral"),
        "prod_grade_rel": xp.get("prod_grade_rel"),
        "prod_grade_expected": xp.get("prod_grade_rel"),
        "prod_grade_blend": xp.get("prod_grade_blend"),
        "prod_xpv_per_game": xp.get("prod_xpv_per_game"),
        "prod_xpv_expected": xp.get("prod_xpv_expected"),
        "prod_rel_xpv": xp.get("prod_rel_xpv"),
        "prod_geral_display": xp.get("prod_geral_display"),
        "prod_rel_display": xp.get("prod_rel_display"),
        "prod_rel_gap": xp.get("prod_rel_gap"),
        "prod_rel_lift_badge": xp.get("prod_rel_lift_badge"),
        "prod_rel_gap_pool_mean": xp.get("prod_rel_gap_pool_mean"),
        "prod_rel_gap_pool_p70": xp.get("prod_rel_gap_pool_p70"),
        "prod_z_geral": xp.get("prod_z_geral"),
        "prod_z_rel": xp.get("prod_z_rel"),
        "prec_grade_geral": xp.get("prec_grade_geral"),
        "prec_grade_stratum": xp.get("prec_grade_stratum"),
        "prec_grade_expected": xp.get("prec_grade_stratum"),
        "prec_grade_blend": xp.get("prec_grade_blend"),
        "prec_coe_per_pass": xp.get("prec_coe_per_pass"),
        "prec_display": xp.get("prec_display"),
        "prec_stratum_gap": xp.get("prec_stratum_gap"),
        "prec_stratum_lift_badge": xp.get("prec_stratum_lift_badge"),
        "prec_stratum_gap_pool_mean": xp.get("prec_stratum_gap_pool_mean"),
        "prec_stratum_gap_pool_p70": xp.get("prec_stratum_gap_pool_p70"),
        "leth_grade_xpv": xp.get("leth_grade_xpv"),
        "leth_grade_threat": xp.get("leth_grade_threat"),
        "leth_grade_blend": xp.get("leth_grade_blend"),
        "leth_xpv_per_pass": xp.get("leth_xpv_per_pass"),
        "leth_impact_rate_pct": xp.get("leth_impact_rate_pct"),
        "leth_xpv_display": xp.get("leth_xpv_display"),
        "leth_threat_display": xp.get("leth_threat_display"),
        "leth_display": xp.get("leth_display"),
        "xp_game_consistency_score": xp.get("xp_game_consistency_score"),
        "test_impact_v2_p90": xp.get("test_impact_v2_p90"),
        "xp_indices": build_xp_indices(xp) if xp else [],
        "xp_round_grades": build_round_grade_series(xp, passes_by_player.get(player_id)) if xp else [],
    }
