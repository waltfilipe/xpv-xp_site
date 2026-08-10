"""Pool filtering and player options — ported from Streamlit app.py."""

from __future__ import annotations

import functools
from typing import Any

import nationality_groups as ng
import player_profiles as pp
import transfermarkt_profiles as tm
from position_families import (
    DEFAULT_POSITION_FAMILY,
    EUROPEAN_POSITION_FAMILIES,
    normalize_position_family,
    position_codes_for_family,
    position_family_label,
    rating_groups_for_family,
)

VALUE_SLIDER_MAX_EUR = 150_000_000
CONTRACT_YEAR_MIN = 2026
CONTRACT_YEAR_MAX = 2033
MINUTES_MIN = 0
MINUTES_MAX = 3600
HEIGHT_MIN_M = 1.60
HEIGHT_MAX_M = 2.05

MIDFIELD_POSITION_BLOCKS: tuple[tuple[str, str, frozenset[str] | None, str | None], ...] = (
    ("cm", "Meio-campistas centrais", None, "central_midfielders"),
    ("am", "Meio-campistas ofensivos", None, "attacking_midfielders"),
)

POSITION_FAMILY_OPTIONS = list(EUROPEAN_POSITION_FAMILIES)

PASS_SCORE_LETTER_FIELDS: dict[str, str] = {
    "volume_grade": "pass_volume_letter",
    "efficiency_grade": "pass_efficiency_letter",
    "buildup_grade": "pass_buildup_letter",
    "chance_grade": "pass_chance_creation_letter",
}

LETTER_GRADE_OPTIONS = [
    ("all", "Todas"),
    ("A+", "A+"),
    ("A", "A"),
    ("A-", "A−"),
    ("B+", "B+"),
    ("B", "B"),
    ("B-", "B−"),
    ("C+", "C+"),
    ("C", "C"),
    ("C-", "C−"),
    ("D", "D"),
]

LEAGUE_OPTIONS = [
    ("all", "All leagues"),
    ("premier_league", "Premier League"),
    ("italia_seriea", "Serie A"),
    ("laliga", "La Liga"),
    ("bundesliga", "Bundesliga"),
    ("ligue1", "Ligue 1"),
]

LEAGUE_LABEL_TO_KEY = {label.lower(): key for key, label in LEAGUE_OPTIONS if key != "all"}
LEAGUE_LABEL_TO_KEY.update({key: key for key, _label in LEAGUE_OPTIONS if key != "all"})


def normalize_league_filter_key(player: dict) -> str:
    source = str(player.get("league_source") or "").strip().lower()
    if source:
        return source
    label = str(player.get("league") or "").strip().lower()
    return LEAGUE_LABEL_TO_KEY.get(label, label)

FOOT_OPTIONS = [
    ("all", "Todos"),
    ("left", "Esquerdo"),
    ("right", "Direito"),
    ("both", "Ambidestro"),
]

AGE_BAND_OPTIONS: tuple[tuple[str, int | None, int | None], ...] = (
    ("all", None, None),
    ("u21", None, 21),
    ("u23", 22, 23),
    ("24_30", 24, 30),
    ("over30", 31, None),
)

AGE_BAND_LABELS = {
    "all": "Todas as idades",
    "u21": "U21",
    "u23": "U23",
    "24_30": "24-30",
    "over30": ">30",
}


def parse_age_band(age_band: str | None) -> tuple[int | None, int | None]:
    key = (age_band or "all").strip().lower()
    for band_key, lo, hi in AGE_BAND_OPTIONS:
        if band_key == key:
            return lo, hi
    return None, None


def position_blocks_for_family(position_family: str = DEFAULT_POSITION_FAMILY) -> list[tuple[str, str]]:
    family = normalize_position_family(position_family)
    family_label = position_family_label(family).lower()
    options: list[tuple[str, str]] = [("all", f"Todos os {family_label}")]
    if family == "midfielders":
        options.extend((block_id, label) for block_id, label, *_rest in MIDFIELD_POSITION_BLOCKS)
    return options


def filter_options_meta(position_family: str = DEFAULT_POSITION_FAMILY) -> dict[str, Any]:
    import nationality_groups as ng

    family = normalize_position_family(position_family)
    return {
        "position_families": [{"key": k, "label": l} for k, l in POSITION_FAMILY_OPTIONS],
        "leagues": [{"key": k, "label": l} for k, l in LEAGUE_OPTIONS],
        "foot": [{"key": k, "label": l} for k, l in FOOT_OPTIONS],
        "age_bands": [
            {"key": k, "label": AGE_BAND_LABELS.get(k, k), "min": lo, "max": hi}
            for k, lo, hi in AGE_BAND_OPTIONS
        ],
        "nationality_regions": list(ng.NATIONALITY_REGION_OPTIONS),
        "age_range": {"min": pp.MIN_PLAYER_AGE, "max": pp.MAX_PLAYER_AGE},
        "value_range_m": {"min": 0, "max": int(VALUE_SLIDER_MAX_EUR / 1_000_000)},
        "contract_year_range": {"min": CONTRACT_YEAR_MIN, "max": CONTRACT_YEAR_MAX},
        "minutes_range": {"min": MINUTES_MIN, "max": MINUTES_MAX},
        "height_range_m": {"min": HEIGHT_MIN_M, "max": HEIGHT_MAX_M},
        "letter_grades": [{"key": k, "label": l} for k, l in LETTER_GRADE_OPTIONS],
        "pass_score_filters": [
            {"key": "volume_grade", "label": "Volume"},
            {"key": "efficiency_grade", "label": "Efficiency"},
            {"key": "buildup_grade", "label": "Build-up"},
            {"key": "chance_grade", "label": "Chance creation"},
        ],
        "position_blocks": [{"key": k, "label": l} for k, l in position_blocks_for_family(family)],
        "defaults": {
            "league": "all",
            "position_family": family,
            "position_block": "all",
            "age_band": "all",
            "age_slider": [pp.MIN_PLAYER_AGE, pp.MAX_PLAYER_AGE],
            "foot": "all",
            "value_slider_m": [0, int(VALUE_SLIDER_MAX_EUR / 1_000_000)],
            "contract_year": [CONTRACT_YEAR_MIN, CONTRACT_YEAR_MAX],
            "minutes_slider": [MINUTES_MIN, MINUTES_MAX],
            "height_slider_m": [HEIGHT_MIN_M, HEIGHT_MAX_M],
            "nationality_regions": [ng.NATIONALITY_REGION_WORLD],
            "nationality_countries": [],
        },
    }


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


def all_position_filters(position_family: str = DEFAULT_POSITION_FAMILY) -> tuple[frozenset[str], frozenset[str]]:
    family = normalize_position_family(position_family)
    return position_codes_for_family(family), rating_groups_for_family(family)


def position_filter_from_block(
    position_block: str = "all",
    *,
    position_family: str = DEFAULT_POSITION_FAMILY,
) -> tuple[frozenset[str], frozenset[str]]:
    family = normalize_position_family(position_family)
    block_id = (position_block or "all").strip().lower()
    if family != "midfielders" or block_id in {"", "all"}:
        return all_position_filters(family)
    for bid, _label, block_codes, rating_group in MIDFIELD_POSITION_BLOCKS:
        if bid != block_id:
            continue
        codes: set[str] = set()
        groups: set[str] = set()
        if block_codes:
            codes.update(block_codes)
        if rating_group:
            groups.add(rating_group)
        return frozenset(codes), frozenset(groups)
    return all_position_filters(family)


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
    minutes_min: int = MINUTES_MIN,
    minutes_max: int = MINUTES_MAX,
    height_min_m: float = HEIGHT_MIN_M,
    height_max_m: float = HEIGHT_MAX_M,
    nationalities: list[str] | None = None,
) -> list[dict]:
    effective_age_min = max(age_min or pp.MIN_PLAYER_AGE, age_slider_min or pp.MIN_PLAYER_AGE)
    effective_age_max = min(age_max or pp.MAX_PLAYER_AGE, age_slider_max or pp.MAX_PLAYER_AGE)
    filter_by_value = value_min_eur > 0 or value_max_eur < VALUE_SLIDER_MAX_EUR
    filter_by_contract = contract_year_min > CONTRACT_YEAR_MIN or contract_year_max < CONTRACT_YEAR_MAX
    filter_by_minutes = minutes_min > MINUTES_MIN or minutes_max < MINUTES_MAX
    filter_by_height = height_min_m > HEIGHT_MIN_M or height_max_m < HEIGHT_MAX_M
    allowed_nationalities = set(nationalities) if nationalities else None

    out: list[dict] = []
    for player in all_players:
        pid = str(player["player_id"])
        if league != "all" and normalize_league_filter_key(player) != league.lower():
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
        if filter_by_minutes:
            minutes = player.get("minutes")
            if minutes is None:
                continue
            try:
                minutes_val = int(minutes)
            except (TypeError, ValueError):
                continue
            if minutes_val < minutes_min or minutes_val > minutes_max:
                continue
        if filter_by_height:
            height_raw = player.get("height") or pp.read_cached_profile(pid).get("height")
            height_m = pp.parse_height_meters(height_raw)
            if height_m is None:
                continue
            if height_m < height_min_m or height_m > height_max_m:
                continue
        if allowed_nationalities is not None:
            nationality = player.get("nationality") or pp.read_cached_nationality(pid)
            if not ng.nationality_matches_filter(nationality, allowed=allowed_nationalities):
                continue
        out.append(player)
    return out


def _normalize_letter_grade(letter: str | None) -> str:
    return str(letter or "").strip().upper().replace("−", "-")


def _letter_grade_score(letter: str | None) -> float | None:
    from xp_stats_engine import LETTER_GRADE_COLOR_SCORES

    normalized = _normalize_letter_grade(letter)
    if not normalized or normalized == "—":
        return None
    return LETTER_GRADE_COLOR_SCORES.get(normalized)


def letter_grade_meets_minimum(player_letter: str | None, minimum_letter: str) -> bool:
    """True when the player letter is at least the selected minimum grade."""
    min_score = _letter_grade_score(minimum_letter)
    if min_score is None:
        return True
    player_score = _letter_grade_score(player_letter)
    if player_score is None:
        return False
    return player_score >= min_score


def matches_pass_letter_filters(
    xp_profile: dict,
    *,
    volume_grade: str = "all",
    efficiency_grade: str = "all",
    buildup_grade: str = "all",
    chance_grade: str = "all",
) -> bool:
    checks = {
        "volume_grade": volume_grade,
        "efficiency_grade": efficiency_grade,
        "buildup_grade": buildup_grade,
        "chance_grade": chance_grade,
    }
    for param_key, selected in checks.items():
        if not selected or selected == "all":
            continue
        letter_key = PASS_SCORE_LETTER_FIELDS[param_key]
        player_letter = xp_profile.get(letter_key)
        if not letter_grade_meets_minimum(player_letter, selected):
            return False
    return True


def filter_players_by_pass_letters(
    players: list[dict],
    xp_by_id: dict[str, dict],
    *,
    volume_grade: str = "all",
    efficiency_grade: str = "all",
    buildup_grade: str = "all",
    chance_grade: str = "all",
) -> list[dict]:
    if all(g == "all" for g in (volume_grade, efficiency_grade, buildup_grade, chance_grade)):
        return players
    out: list[dict] = []
    for player in players:
        pid = str(player["player_id"])
        xp_profile = xp_by_id.get(pid, {})
        if matches_pass_letter_filters(
            xp_profile,
            volume_grade=volume_grade,
            efficiency_grade=efficiency_grade,
            buildup_grade=buildup_grade,
            chance_grade=chance_grade,
        ):
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
    position_block: str = "all",
    position_family: str = DEFAULT_POSITION_FAMILY,
) -> list[dict[str, str]]:
    position_codes, position_groups = position_filter_from_block(
        position_block,
        position_family=position_family,
    )
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
            if rating_val is not None:
                try:
                    suffix = f"· {float(rating_val) * 10:.1f}"
                except (TypeError, ValueError):
                    suffix = "· —"
            else:
                suffix = "· —"
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
