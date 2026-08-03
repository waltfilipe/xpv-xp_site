"""Player profile assembly."""

from __future__ import annotations

from typing import Any

import progression_engine as pge
from passes_maps import draw_action_origin_smooth_heatmap

from services.figures import fig_to_b64

XP_PA_REGULAR_SCORE_SPECS: tuple[tuple[str, str, str, str, tuple[str, ...]], ...] = (
    ("pass_volume_display", "pass_volume_index", "pass_volume_letter", "Volume", ("passes_total", "long_balls")),
    ("pass_efficiency_display", "pass_efficiency_index", "pass_efficiency_letter", "Efficiency", ("xpass_coe_pct", "xpass_long_coe_pct")),
    ("pass_buildup_display", "pass_buildup_index", "pass_buildup_letter", "Build-up", ("progressive_passes", "final_third_passes", "special_line_break_p90")),
    ("pass_chance_creation_display", "pass_chance_creation_index", "pass_chance_creation_letter", "Chance creation", ("key_passes", "passes_to_box", "test_impact_v2_start_final_third_p90")),
)

XP_PROFILE_BAR_KEYS = ("xp_activity_display", "xp_efficiency_display", "xp_edge_display")
XP_PROFILE_BAR_LABELS = {
    "xp_activity_display": "Productivity",
    "xp_efficiency_display": "Precision",
    "xp_edge_display": "Lethality",
}


def build_pass_score_sections(xp_profile: dict) -> list[dict[str, Any]]:
    sections: list[dict[str, Any]] = []
    for display_key, index_key, letter_key, title, component_keys in XP_PA_REGULAR_SCORE_SPECS:
        components = []
        for ck in component_keys:
            components.append({
                "key": ck,
                "value": xp_profile.get(ck),
            })
        sections.append({
            "title": title,
            "display_score": xp_profile.get(display_key),
            "letter": xp_profile.get(letter_key),
            "index": xp_profile.get(index_key),
            "components": components,
        })
    return sections


def build_xp_profile_bars(xp_profile: dict) -> list[dict[str, Any]]:
    bars: list[dict[str, Any]] = []
    for key in XP_PROFILE_BAR_KEYS:
        bars.append({
            "key": key,
            "label": XP_PROFILE_BAR_LABELS.get(key, key),
            "value": xp_profile.get(key),
            "rank": xp_profile.get(f"{key.replace('_display', '')}_rank_in_group")
            if key == "xp_activity_display"
            else xp_profile.get(f"xp_{key.split('_')[1]}_rank_in_group"),
        })
    return bars


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
        "xp_pass_rating": xp.get("xp_pass_rating"),
        "xp_game_consistency_score": xp.get("xp_game_consistency_score"),
        "test_impact_v2_p90": xp.get("test_impact_v2_p90"),
    }
