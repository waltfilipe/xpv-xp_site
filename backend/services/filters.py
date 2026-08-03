"""Pool filtering and player options — ported from Streamlit app.py."""

from __future__ import annotations

import functools
from typing import Any

import nationality_groups as ng
import player_profiles as pp
import transfermarkt_profiles as tm

VALUE_SLIDER_MAX_EUR = 150_000_000
CONTRACT_YEAR_MIN = 2026
CONTRACT_YEAR_MAX = 2033

POSITION_BLOCKS: tuple[tuple[str, str, frozenset[str] | None, str | None], ...] = (
    ("cm", "Central Midfielders", None, "central_midfielders"),
    ("am", "Attacking Midfielders", None, "attacking_midfielders"),
)

LEAGUE_OPTIONS = [
    ("all", "All leagues"),
    ("premier_league", "Premier League"),
    ("italia_seriea", "Serie A"),
    ("laliga", "La Liga"),
    ("bundesliga", "Bundesliga"),
    ("ligue1", "Ligue 1"),
]


def normalize_filter_foot(value: str | None) -> str | None:
    if not value:
        return None
    text = str(value).strip().lower()
    if text in {"left", "esquerdo"}:
        return "left"
    if text in {"right", "direito"}:
        return "right"
    if text in {"both", "ambidestro"}:
        return "both"
    return None


def all_position_filters() -> tuple[frozenset[str], frozenset[str]]:
    codes: set[str] = set()
    groups: set[str] = set()
    for _block_id, _label, block_codes, rating_group in POSITION_BLOCKS:
        if block_codes:
            codes.update(block_codes)
        if rating_group:
            groups.add(rating_group)
    return frozenset(codes), frozenset(groups)


def player_matches_position_filter(
    player: dict,
    *,
    position_codes: frozenset[str],
    position_groups: frozenset[str],
) -> bool:
    if not position_codes and not position_groups:
        return True
    pos = str(player.get("position") or "").strip().upper()
    group = str(player.get("position_group") or "")
    if position_groups and group in position_groups:
        return True
    if position_codes and pos in position_codes:
        return True
    return False


def filter_player_pool(
    all_players: list[dict],
    progression_by_id: dict[str, dict],
    *,
    league: str = "all",
    age_min: int | None = None,
    age_max: int | None = None,
    age_slider_min: int | None = None,
    age_slider_max: int | None = None,
    foot: str = "all",
    value_min_eur: int = 0,
    value_max_eur: int = VALUE_SLIDER_MAX_EUR,
    contract_year_min: int = CONTRACT_YEAR_MIN,
    contract_year_max: int = CONTRACT_YEAR_MAX,
    nationalities: list[str] | None = None,
) -> list[dict]:
    effective_age_min = max(age_min or pp.MIN_PLAYER_AGE, age_slider_min or pp.MIN_PLAYER_AGE)
    effective_age_max = min(age_max or pp.MAX_PLAYER_AGE, age_slider_max or pp.MAX_PLAYER_AGE)
    filter_by_value = value_min_eur > 0 or value_max_eur < VALUE_SLIDER_MAX_EUR
    filter_by_contract = contract_year_min > CONTRACT_YEAR_MIN or contract_year_max < CONTRACT_YEAR_MAX
    allowed_nationalities = set(nationalities) if nationalities else None

    out: list[dict] = []
    for player in all_players:
        pid = str(player["player_id"])
        if league != "all" and str(player.get("league_source") or "") != league:
            continue
        age = player.get("age")
        if age is None:
            age = pp.read_cached_age(pid)
        if age is not None:
            age_val = int(age)
            if age_val < effective_age_min or age_val > effective_age_max:
                continue
        elif age_min is not None or age_max is not None:
            continue
        if foot != "all":
            player_foot = normalize_filter_foot(
                player.get("dominant_foot") or pp.read_cached_dominant_foot(pid)
            )
            if player_foot is None or player_foot != foot:
                continue
        if filter_by_value:
            market_value_eur = player.get("market_value_eur")
            if market_value_eur is None:
                market_value_eur = tm.read_cached_market_value_eur(pid)
            if market_value_eur is None:
                continue
            mv = int(market_value_eur)
            if mv < value_min_eur or mv > value_max_eur:
                continue
        if filter_by_contract:
            contract_until = player.get("contract_until")
            if not contract_until:
                contract_until = pp.read_cached_profile(pid).get("contract_until")
            if not contract_until:
                continue
            try:
                contract_year = int(str(contract_until)[:4])
            except (TypeError, ValueError):
                continue
            if contract_year < contract_year_min or contract_year > contract_year_max:
                continue
        if allowed_nationalities is not None:
            nationality = player.get("nationality") or pp.read_cached_nationality(pid)
            if not ng.nationality_matches_filter(nationality, allowed=allowed_nationalities):
                continue
        out.append(player)
    return out


def fmt_rating_score(value: Any) -> str:
    if value is None:
        return "—"
    try:
        return f"{float(value):.1f}"
    except (TypeError, ValueError):
        return "—"


def player_options(
    players: list[dict],
    progression_by_id: dict[str, dict],
    *,
    xp_by_id: dict[str, dict] | None = None,
    exclude_player_id: str | None = None,
    sort_by: str = "xp_pass_rating",
) -> list[dict[str, str]]:
    position_codes, position_groups = all_position_filters()
    ranked_rows: list[tuple[str, str, str, float]] = []
    for player in players:
        pid = str(player["player_id"])
        if exclude_player_id and pid == str(exclude_player_id):
            continue
        profile = progression_by_id.get(pid, player)
        if not player_matches_position_filter(
            profile,
            position_codes=position_codes,
            position_groups=position_groups,
        ):
            continue
        xp_profile = (xp_by_id or {}).get(pid, {})
        if sort_by == "xp_pass_rating":
            rating_val = xp_profile.get("xp_pass_rating")
            sort_key = float(rating_val) if rating_val is not None else float("-inf")
        else:
            sort_key = float(xp_profile.get("xp_m4_total", 0.0))
        ranked_rows.append((
            pid,
            str(player.get("player_name", "—")),
            str(player.get("team", "—")),
            sort_key,
        ))

    ranked_rows.sort(key=lambda row: (-row[3], row[1].lower()))
    options: list[dict[str, str]] = []
    for idx, (pid, name, team, sort_key) in enumerate(ranked_rows, start=1):
        xp_profile = (xp_by_id or {}).get(pid, {})
        if sort_by == "xp_pass_rating":
            rating_val = xp_profile.get("xp_pass_rating")
            suffix = f"· Pass {fmt_rating_score(rating_val)}" if rating_val is not None else "· Pass —"
        else:
            suffix = f"· xP {sort_key:.1f}"
        options.append({
            "player_id": pid,
            "player_name": name,
            "team": team,
            "label": f"#{idx} {name} ({team}) {suffix}",
        })
    return options


def available_nationalities(all_players: list[dict]) -> list[str]:
    nationalities: set[str] = set()
    for player in all_players:
        pid = str(player.get("player_id", ""))
        nationality = player.get("nationality") or pp.read_cached_nationality(pid)
        normalized = ng.normalize_nationality(nationality)
        if normalized:
            nationalities.add(normalized)
    return sorted(nationalities)
