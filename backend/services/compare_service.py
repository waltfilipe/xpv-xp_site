"""Head-to-head player comparison."""

from __future__ import annotations

from typing import Any

import progression_engine as pge
from passes_maps import draw_action_origin_smooth_heatmap

from services.figures import fig_to_b64
from services.profile_service import build_xp_profile_bars

COMPARE_PILLAR_SPECS: tuple[tuple[str, str], ...] = (
    ("xp_activity_display", "Productivity"),
    ("xp_efficiency_display", "Precision"),
    ("xp_edge_display", "Lethality"),
)
COMPARE_PASS_GRID_SPECS: tuple[tuple[str, str], ...] = (
    ("pass_volume_display", "Volume"),
    ("pass_efficiency_display", "Efficiency"),
    ("pass_buildup_display", "Build-up"),
    ("pass_chance_creation_display", "Chance creation"),
)


def _compare_source(
    player: dict | None,
    xp_profile: dict | None,
    *,
    pass_player: dict | None = None,
) -> dict:
    base = {**(player or {}), **(xp_profile or {})}
    if pass_player:
        base = pge.enrich_traditional_participation_fields(base, pass_player=pass_player)
    if xp_profile:
        base = {**base, **xp_profile}
    return base


def _heatmap_b64(player_id: str, passes_by_player: dict, player_name: str) -> str | None:
    passes_df = passes_by_player.get(player_id)
    if passes_df is None or passes_df.empty:
        return None
    fig = draw_action_origin_smooth_heatmap(passes_df, None, str(player_name), profile=True)
    return fig_to_b64(fig)


def _metric_value(source: dict, key: str) -> float | None:
    val = source.get(key)
    if val is None:
        return None
    try:
        return float(val)
    except (TypeError, ValueError):
        return None


def build_compare_payload(
    player_a_id: str,
    player_b_id: str,
    *,
    players_by_id: dict[str, dict],
    progression_by_id: dict[str, dict],
    xp_by_id: dict[str, dict],
    passes_by_player: dict,
) -> dict[str, Any] | None:
    xp_a = xp_by_id.get(player_a_id)
    xp_b = xp_by_id.get(player_b_id)
    if not xp_a or not xp_b:
        return None

    prog_a = progression_by_id.get(player_a_id, players_by_id.get(player_a_id, {}))
    prog_b = progression_by_id.get(player_b_id, players_by_id.get(player_b_id, {}))
    source_a = _compare_source(prog_a, xp_a, pass_player=players_by_id.get(player_a_id))
    source_b = _compare_source(prog_b, xp_b, pass_player=players_by_id.get(player_b_id))

    pillars: list[dict[str, Any]] = []
    for key, label in COMPARE_PILLAR_SPECS:
        val_a = _metric_value(source_a, key)
        val_b = _metric_value(source_b, key)
        pillars.append({
            "key": key,
            "label": label,
            "value_a": val_a,
            "value_b": val_b,
            "winner": "a" if (val_a or 0) > (val_b or 0) else ("b" if (val_b or 0) > (val_a or 0) else "tie"),
        })

    pass_grid: list[dict[str, Any]] = []
    for key, label in COMPARE_PASS_GRID_SPECS:
        val_a = _metric_value(source_a, key)
        val_b = _metric_value(source_b, key)
        letter_a = source_a.get(key.replace("_display", "_letter"))
        letter_b = source_b.get(key.replace("_display", "_letter"))
        pass_grid.append({
            "key": key,
            "label": label,
            "value_a": val_a,
            "value_b": val_b,
            "letter_a": letter_a,
            "letter_b": letter_b,
            "winner": "a" if (val_a or 0) > (val_b or 0) else ("b" if (val_b or 0) > (val_a or 0) else "tie"),
        })

    def player_card(pid: str, source: dict, xp: dict) -> dict[str, Any]:
        return {
            "player_id": pid,
            "player_name": source.get("player_name"),
            "team": source.get("team"),
            "position": source.get("position"),
            "position_group": source.get("position_group"),
            "photo_url": source.get("photo_url"),
            "market_value": source.get("market_value"),
            "contract_until": source.get("contract_until"),
            "dominant_foot": source.get("dominant_foot"),
            "age": source.get("age"),
            "height": source.get("height"),
            "nationality": source.get("nationality"),
            "minutes": source.get("minutes"),
            "minutes_pct": source.get("minutes_pct"),
            "long_pass_share_pct": xp.get("long_pass_share_pct"),
            "long_pass_share_ref_avg_pct": xp.get("long_pass_share_ref_avg_pct"),
            "long_pass_share_pctile": xp.get("long_pass_share_pctile"),
            "xp_bars": build_xp_profile_bars(xp),
            "xp_game_consistency_score": xp.get("xp_game_consistency_score"),
            "test_impact_v2_p90": xp.get("test_impact_v2_p90"),
        }

    return {
        "player_a": player_card(player_a_id, source_a, xp_a),
        "player_b": player_card(player_b_id, source_b, xp_b),
        "heatmap_a_b64": _heatmap_b64(player_a_id, passes_by_player, str(source_a.get("player_name", ""))),
        "heatmap_b_b64": _heatmap_b64(player_b_id, passes_by_player, str(source_b.get("player_name", ""))),
        "pillars": pillars,
        "pass_grid": pass_grid,
    }
