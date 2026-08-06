"""Player analysis bundle — ported from Streamlit load_player_analysis_bundle()."""

from __future__ import annotations

import functools
from typing import Any

import midfield_origin as mo
import passes_engine as pe
import player_profiles as pp
import progression_engine as pge
import transfermarkt_profiles as tm
import xp_engine as xe
from comparison_config import (
    CLASSIFICATION_MODEL_DEFAULT,
    TIER_MODEL_DEFAULT,
    XT_SURFACE_MODE_DEFAULT,
    normalize_classification_model,
    normalize_tier_model,
    normalize_xt_surface_mode,
)
from position_families import DEFAULT_POSITION_FAMILY, normalize_position_family

DATA_CACHE_VERSION = pe.DATA_CACHE_VERSION
XP_DATA_CACHE_VERSION = xe.XP_DATA_CACHE_VERSION
CARRIES_DATA_CACHE_VERSION = 0

FIXED_XT_SURFACE_MODE = normalize_xt_surface_mode(XT_SURFACE_MODE_DEFAULT)


def _load_player_analysis_passes(
    position_family: str = DEFAULT_POSITION_FAMILY,
    cache_version: int = DATA_CACHE_VERSION,
    tier_model: str = TIER_MODEL_DEFAULT,
    classification_model: str = CLASSIFICATION_MODEL_DEFAULT,
    xt_surface_mode: str = FIXED_XT_SURFACE_MODE,
) -> dict[str, Any]:
    return pe.load_european_league_passes_grouped(
        cache_version,
        position_family=normalize_position_family(position_family),
        tier_model=normalize_tier_model(tier_model),
        classification_model=normalize_classification_model(classification_model),
        xt_surface_mode=normalize_xt_surface_mode(xt_surface_mode),
    )


@functools.lru_cache(maxsize=8)
def load_player_analysis_bundle(
    position_family: str = DEFAULT_POSITION_FAMILY,
    _pass_cache: int = DATA_CACHE_VERSION,
    _xp_cache: int = XP_DATA_CACHE_VERSION,
    _carry_cache: int = CARRIES_DATA_CACHE_VERSION,
) -> tuple[Any, ...]:
    """Cached load for one European-league position family."""
    family = normalize_position_family(position_family)
    analysis_players = pe.build_european_league_players(family, _pass_cache)
    passes_by_player = _load_player_analysis_passes(family, _pass_cache)
    empty_carries: dict[str, Any] = {}
    if family == "midfielders":
        analysis_players = mo.apply_midfield_position_groups(
            analysis_players,
            passes_by_player,
            empty_carries,
        )
    _, players_by_id, pool_by_position = pe.compute_pass_ratings(analysis_players)
    carries_by_id: dict[str, dict] = {}
    carries_pool_by_position: dict[str, list[dict]] = {}
    _, progression_by_id, progression_pool_by_position = pge.compute_progression_ratings(
        analysis_players,
        [],
        pass_by_id=players_by_id,
        carry_by_id=carries_by_id,
    )
    _, xp_players = xe.build_european_league_xp_analytics(
        _xp_cache,
        position_family=family,
    )

    origin_by_id = {
        str(p["player_id"]): {
            "position_group": p.get("position_group"),
            "position_family": p.get("position_family") or family,
            "midfield_offensive_origin_pct": p.get("midfield_offensive_origin_pct"),
            "midfield_origin_profile": p.get("midfield_origin_profile"),
            "league": p.get("league"),
            "league_source": p.get("league_source"),
        }
        for p in analysis_players
    }
    for player in analysis_players:
        pid = str(player["player_id"])
        player["position_family"] = family
        player["age"] = pp.read_cached_age(pid)
        player["height"] = pp.read_cached_height_display(pid)
        player["nationality"] = pp.read_cached_nationality(pid)
        player["market_value"] = tm.read_cached_market_value(pid)
        player["market_value_eur"] = tm.read_cached_market_value_eur(pid)
        player["contract_until"] = pp.read_cached_profile(pid).get("contract_until")
        player["dominant_foot"] = pp.read_cached_dominant_foot(pid)
        player["photo_url"] = pp.read_cached_photo_url(pid)
    for xp_profile in xp_players:
        pid = str(xp_profile["player_id"])
        xp_profile["position_family"] = family
        xp_profile["age"] = pp.read_cached_age(pid)
        xp_profile["height"] = pp.read_cached_height_display(pid)
        xp_profile["nationality"] = pp.read_cached_nationality(pid)
        xp_profile["market_value"] = tm.read_cached_market_value(pid)
        xp_profile["market_value_eur"] = tm.read_cached_market_value_eur(pid)
        xp_profile["contract_until"] = pp.read_cached_profile(pid).get("contract_until")
        xp_profile["dominant_foot"] = pp.read_cached_dominant_foot(pid)
        xp_profile["photo_url"] = pp.read_cached_photo_url(pid)
        origin = origin_by_id.get(pid)
        if origin:
            if origin.get("league"):
                xp_profile["league"] = origin.get("league")
            if origin.get("league_source"):
                xp_profile["league_source"] = origin.get("league_source")
            xp_profile["position_group"] = origin.get("position_group") or xp_profile.get("position_group")
            xp_profile["midfield_offensive_origin_pct"] = origin.get("midfield_offensive_origin_pct")
            xp_profile["midfield_origin_profile"] = origin.get("midfield_origin_profile")
    if family == "midfielders":
        xe.refresh_xp_midfield_origin_rankings(xp_players)
    import defensive_engine as de

    de.attach_defensive_contribution(xp_players)
    xp_by_id = {str(p["player_id"]): p for p in xp_players}
    for prof in progression_by_id.values():
        pid = str(prof.get("player_id"))
        prof["position_family"] = family
        prof["age"] = pp.read_cached_age(pid)
        prof["height"] = pp.read_cached_height_display(pid)
        prof["nationality"] = pp.read_cached_nationality(pid)
        prof["market_value"] = tm.read_cached_market_value(pid)
        prof["market_value_eur"] = tm.read_cached_market_value_eur(pid)
        prof["contract_until"] = pp.read_cached_profile(pid).get("contract_until")
        prof["dominant_foot"] = pp.read_cached_dominant_foot(pid)
        prof["photo_url"] = pp.read_cached_photo_url(pid)
        origin = origin_by_id.get(pid)
        if origin:
            if origin.get("league"):
                prof["league"] = origin.get("league")
            if origin.get("league_source"):
                prof["league_source"] = origin.get("league_source")
            prof["position_group"] = origin.get("position_group") or prof.get("position_group")
    return (
        analysis_players,
        passes_by_player,
        progression_by_id,
        players_by_id,
        carries_by_id,
        progression_pool_by_position,
        pool_by_position,
        carries_pool_by_position,
        xp_by_id,
    )
