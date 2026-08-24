"""League and pool peer bars use the same rank-percentile mapping."""

from __future__ import annotations

import profile_view_engine as pve


def test_league_and_pool_bars_use_rank_percentile() -> None:
    players = [
        {"player_id": "1", "league_source": "laliga", "key_passes": 3.0, "xp_profile_bars_eligible": True},
        {"player_id": "2", "league_source": "laliga", "key_passes": 2.0, "xp_profile_bars_eligible": True},
        {"player_id": "3", "league_source": "laliga", "key_passes": 1.0, "xp_profile_bars_eligible": True},
        {"player_id": "4", "league_source": "premier_league", "key_passes": 2.5, "xp_profile_bars_eligible": True},
        {"player_id": "5", "league_source": "premier_league", "key_passes": 0.5, "xp_profile_bars_eligible": True},
    ]

    eligible = [p for p in players if p.get("xp_profile_bars_eligible")]
    by_league: dict[str, list[dict]] = {}
    for player in eligible:
        by_league.setdefault(str(player["league_source"]), []).append(player)

    for league_players in by_league.values():
        pve._assign_league_ranks_and_bars(league_players, ("key_passes",))
    pve._assign_pool_ranks_and_bars(eligible, ("key_passes",))

    martim_like = next(p for p in players if p["player_id"] == "2")
    assert martim_like["key_passes_rank_in_league"] == 2
    assert martim_like["key_passes_league_bar"] == 50.0
    assert martim_like["key_passes_rank_in_group"] == 3
    assert martim_like["key_passes_pool_bar"] == 50.0

    best = next(p for p in players if p["player_id"] == "1")
    assert best["key_passes_league_bar"] == 100.0
    assert best["key_passes_pool_bar"] == 100.0

    worst = next(p for p in players if p["player_id"] == "5")
    assert worst["key_passes_league_bar"] == 0.0
    assert worst["key_passes_pool_bar"] == 0.0
