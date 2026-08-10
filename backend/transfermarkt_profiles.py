"""Transfermarkt enrichment via transfermarkt-wrapper (offline prefetch only).

Fetches market value, contract, photo, and player profile fields (age, DOB,
height, foot, nationality). Uses the alpha API when accessible; falls back to
the public profile HTML page when player detail endpoints return 403.
"""

from __future__ import annotations

import asyncio
import re
import unicodedata
import urllib.error
import urllib.request
from datetime import datetime, timezone
from typing import Any

from player_profiles import (
    MIN_PLAYER_AGE,
    MAX_PLAYER_AGE,
    USER_AGENT,
    _age_from_birthdate,
    _birthdate_iso,
    _name_match_score,
    _normalize_name,
    _normalize_team,
    _team_match_score,
    format_height_display,
    read_cached_profile,
    update_player_profile_cache,
)

TRANSFERMARKT_FETCH_STATUS_KEY = "transfermarkt_fetch_status"
TRANSFERMARKT_PROFILE_FETCH_STATUS_KEY = "transfermarkt_profile_fetch_status"
TRANSFERMARKT_ID_KEY = "transfermarkt_id"
TRANSFERMARKT_PHOTO_URL_KEY = "transfermarkt_photo_url"
CONTRACT_UNTIL_KEY = "contract_until"
MARKET_VALUE_EUR_KEY = "market_value_eur"
MARKET_VALUE_DISPLAY_KEY = "market_value_display"
MARKET_VALUE_UPDATED_KEY = "market_value_updated"
TMKT_MAX_RETRIES = 4
TMKT_RETRY_BACKOFF_SEC = 1.5
TM_PROFILE_BASE_URL = "https://www.transfermarkt.co.uk"


async def _tmkt_call_with_retry(coro_factory, *, label: str):
    last_error: Exception | None = None
    for attempt in range(TMKT_MAX_RETRIES):
        try:
            return await coro_factory()
        except Exception as exc:  # noqa: BLE001 - retry transient Transfermarkt API failures
            last_error = exc
            if attempt >= TMKT_MAX_RETRIES - 1:
                break
            await asyncio.sleep(TMKT_RETRY_BACKOFF_SEC * (attempt + 1))
    raise RuntimeError(f"Transfermarkt request failed for {label}: {last_error}") from last_error


def _tmkt_row_name(row: dict) -> str:
    name_field = str(row.get("name") or "").strip()
    club = str(row.get("club") or "").strip()
    if club and name_field.endswith(club):
        return name_field[: -len(club)].strip()
    return name_field


def _pick_tmkt_search_result(
    results: list[dict],
    *,
    player_name: str,
    team: str,
) -> dict | None:
    if not results:
        return None
    target_name = _normalize_name(player_name)
    scored: list[tuple[float, dict]] = []
    for row in results:
        row_name = _normalize_name(_tmkt_row_name(row))
        name_score = _name_match_score(row_name, target_name)
        team_score = _team_match_score(row.get("club"), team)
        min_team = 0.55 if len(target_name.split()) == 1 else 0.2
        if team_score < min_team and name_score < 0.95:
            continue
        scored.append((name_score * 0.65 + team_score * 0.35, row))
    scored.sort(key=lambda item: item[0], reverse=True)
    if not scored:
        return None
    best_score, best_row = scored[0]
    return best_row if best_score >= 0.45 else None


def transfermarkt_profile_slug(player_name: str) -> str:
    text = unicodedata.normalize("NFKD", str(player_name or ""))
    text = text.encode("ascii", "ignore").decode("ascii")
    text = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return text or "player"


def parse_transfermarkt_birth_text(value: str | None) -> tuple[str | None, int | None]:
    """Parse Transfermarkt birth labels into ISO date and age."""
    if not value:
        return None, None
    text = re.sub(r"\s+", " ", str(value).strip())
    if not text:
        return None, None

    age_match = re.search(r"\((\d{1,2})\)\s*$", text)
    inline_age = int(age_match.group(1)) if age_match else None
    date_text = re.sub(r"\s*\(\d{1,2}\)\s*$", "", text).strip()

    dob_iso: str | None = None
    for fmt in ("%d/%m/%Y", "%Y-%m-%d", "%d.%m.%Y", "%b %d, %Y", "%d %b %Y"):
        try:
            dob_iso = datetime.strptime(date_text[:30], fmt).date().isoformat()
            break
        except ValueError:
            continue
    if dob_iso is None:
        dob_iso = _birthdate_iso(date_text)

    age = _age_from_birthdate(dob_iso) if dob_iso else None
    if age is None and inline_age is not None:
        if MIN_PLAYER_AGE <= inline_age <= MAX_PLAYER_AGE:
            age = inline_age
    return dob_iso, age


def _normalize_foot_label(value: str | None) -> str | None:
    if not value:
        return None
    text = str(value).strip().lower()
    mapping = {
        "left": "Left",
        "right": "Right",
        "both": "Both",
        "ambidextrous": "Both",
    }
    return mapping.get(text, str(value).strip().title() or None)


def _height_from_transfermarkt_value(value: Any) -> str | None:
    if value is None:
        return None
    if isinstance(value, (int, float)):
        meters = float(value)
        if meters > 3:
            meters /= 100.0
        if 1.40 <= meters <= 2.20:
            return format_height_display(f"{meters:.2f} m")
        return None
    text = str(value).strip()
    return format_height_display(text) or text or None


def _profile_fields_from_attributes(attributes: dict[str, Any]) -> dict[str, Any]:
    if not isinstance(attributes, dict):
        return {}

    dob_raw = (
        attributes.get("dateOfBirth")
        or attributes.get("date_of_birth")
        or attributes.get("birthDate")
    )
    dob_iso, parsed_age = parse_transfermarkt_birth_text(
        str(dob_raw) if dob_raw is not None else None
    )
    age = attributes.get("age")
    try:
        age_value = int(age) if age is not None else parsed_age
    except (TypeError, ValueError):
        age_value = parsed_age
    if age_value is not None and not (MIN_PLAYER_AGE <= age_value <= MAX_PLAYER_AGE):
        age_value = parsed_age

    nationality = (
        attributes.get("citizenship")
        or attributes.get("nationality")
        or attributes.get("country")
    )
    return {
        "date_of_birth": dob_iso,
        "age": age_value,
        "height": _height_from_transfermarkt_value(
            attributes.get("height") or attributes.get("heightMeters")
        ),
        "dominant_foot": _normalize_foot_label(
            attributes.get("foot") or attributes.get("preferredFoot")
        ),
        "nationality": str(nationality).strip() if nationality else None,
    }


def transfermarkt_fields_from_html(html: str) -> dict[str, Any]:
    """Extract profile fields from a Transfermarkt player profile HTML page."""
    fields: dict[str, Any] = {}

    birth_match = re.search(
        r'itemprop="birthDate"[^>]*>\s*([^<]+)\s*</span>',
        html,
        flags=re.IGNORECASE,
    )
    if birth_match:
        dob_iso, age = parse_transfermarkt_birth_text(birth_match.group(1))
        if dob_iso:
            fields["date_of_birth"] = dob_iso
        if age is not None:
            fields["age"] = age

    height_match = re.search(
        r'itemprop="height"[^>]*>\s*([^<]+)\s*</span>',
        html,
        flags=re.IGNORECASE,
    )
    if height_match:
        height = _height_from_transfermarkt_value(height_match.group(1))
        if height:
            fields["height"] = height

    nationality_match = re.search(
        r'itemprop="nationality"[^>]*>\s*(?:<img[^>]*>\s*)?([^<]+?)\s*</span>',
        html,
        flags=re.IGNORECASE | re.DOTALL,
    )
    if nationality_match:
        nationality = re.sub(r"\s+", " ", nationality_match.group(1)).strip()
        if nationality:
            fields["nationality"] = nationality

    foot_match = re.search(
        r"Foot:</span>\s*<span[^>]*>\s*([^<]+)\s*</span>",
        html,
        flags=re.IGNORECASE,
    )
    if foot_match:
        foot = _normalize_foot_label(foot_match.group(1))
        if foot:
            fields["dominant_foot"] = foot

    return fields


def _fetch_transfermarkt_profile_html(transfermarkt_id: str, player_name: str) -> str | None:
    slug = transfermarkt_profile_slug(player_name)
    url = f"{TM_PROFILE_BASE_URL}/{slug}/profil/spieler/{transfermarkt_id}"
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=12) as resp:
            return resp.read().decode("utf-8", errors="ignore")
    except (urllib.error.URLError, TimeoutError, ValueError):
        return None


def transfermarkt_fields_from_player_payload(payload: dict[str, Any]) -> dict[str, Any]:
    data = payload.get("data") if isinstance(payload.get("data"), dict) else payload
    current = (data.get("marketValueDetails") or {}).get("current") or {}
    value_eur = current.get("value")
    compact = current.get("compact") or {}
    display = None
    if isinstance(compact, dict) and compact.get("content"):
        display = (
            f"{compact.get('prefix', '')}"
            f"{compact.get('content', '')}"
            f"{compact.get('suffix', '')}"
        )
    elif value_eur is not None:
        display = format_market_value_eur(int(value_eur))
    portrait = data.get("portraitUrl")
    attributes = data.get("attributes") or {}
    contract_until = attributes.get("contractUntil")
    profile_fields = _profile_fields_from_attributes(attributes)
    return {
        MARKET_VALUE_EUR_KEY: int(value_eur) if value_eur is not None else None,
        MARKET_VALUE_DISPLAY_KEY: display,
        MARKET_VALUE_UPDATED_KEY: current.get("determined"),
        TRANSFERMARKT_PHOTO_URL_KEY: str(portrait) if portrait else None,
        CONTRACT_UNTIL_KEY: str(contract_until)[:10] if contract_until else None,
        **profile_fields,
    }


def _transfermarkt_fields_from_player_payload(payload: dict[str, Any]) -> dict[str, Any]:
    return transfermarkt_fields_from_player_payload(payload)


def _market_value_from_player_payload(payload: dict[str, Any]) -> dict[str, Any]:
    fields = _transfermarkt_fields_from_player_payload(payload)
    return {
        MARKET_VALUE_EUR_KEY: fields.get(MARKET_VALUE_EUR_KEY),
        MARKET_VALUE_DISPLAY_KEY: fields.get(MARKET_VALUE_DISPLAY_KEY),
        MARKET_VALUE_UPDATED_KEY: fields.get(MARKET_VALUE_UPDATED_KEY),
    }


def format_market_value_eur(value_eur: int) -> str:
    if value_eur >= 1_000_000:
        amount = value_eur / 1_000_000
        text = f"{amount:.2f}".rstrip("0").rstrip(".")
        return f"€{text}M"
    if value_eur >= 1_000:
        amount = value_eur / 1_000
        text = f"{amount:.1f}".rstrip("0").rstrip(".")
        return f"€{text}K"
    return f"€{value_eur:,}"


def read_cached_market_value(player_id: str) -> str | None:
    """Cached Transfermarkt market value label (e.g. €55.00M) or None. No network."""
    profile = read_cached_profile(player_id)
    display = profile.get(MARKET_VALUE_DISPLAY_KEY)
    if display:
        return str(display)
    value_eur = profile.get(MARKET_VALUE_EUR_KEY)
    if value_eur is not None:
        try:
            return format_market_value_eur(int(value_eur))
        except (TypeError, ValueError):
            return None
    return None


def read_cached_market_value_eur(player_id: str) -> int | None:
    """Cached Transfermarkt market value in EUR or None. No network."""
    value_eur = read_cached_profile(player_id).get(MARKET_VALUE_EUR_KEY)
    if value_eur is None:
        return None
    try:
        return int(value_eur)
    except (TypeError, ValueError):
        return None


def format_contract_until_display(value: str | None) -> str | None:
    from player_profiles import format_contract_until_display as _format

    return _format(value)


def read_cached_contract_until(player_id: str) -> str | None:
    from player_profiles import read_cached_contract_until as _read

    return _read(player_id)


def transfermarkt_age_cache_is_fresh(player_id: str, *, force: bool = False) -> bool:
    if force:
        return False
    profile = read_cached_profile(player_id)
    if not profile:
        return False
    if profile.get("age") is not None or profile.get("date_of_birth"):
        return True
    return profile.get(TRANSFERMARKT_PROFILE_FETCH_STATUS_KEY) == "not_found"


def transfermarkt_cache_is_fresh(player_id: str, *, force: bool = False) -> bool:
    if force:
        return False
    profile = read_cached_profile(player_id)
    if not profile:
        return False
    if profile.get(MARKET_VALUE_EUR_KEY) is not None or profile.get(MARKET_VALUE_DISPLAY_KEY):
        return True
    return profile.get(TRANSFERMARKT_FETCH_STATUS_KEY) == "not_found"


async def _search_transfermarkt_player(player_name: str, team: str) -> dict | None:
    from tmkt import TMKT

    queries = [player_name]
    if team:
        queries.append(f"{player_name} {team}")

    best_row: dict | None = None
    best_score = 0.0
    seen_ids: set[str] = set()

    async with TMKT() as tmkt:
        for query in queries:
            results = await _tmkt_call_with_retry(
                lambda q=query: tmkt.player_search(q),
                label=f"search:{query}",
            )
            if not isinstance(results, list):
                continue
            for row in results:
                row_id = str(row.get("id") or "")
                if row_id and row_id in seen_ids:
                    continue
                if row_id:
                    seen_ids.add(row_id)
            picked = _pick_tmkt_search_result(results, player_name=player_name, team=team)
            if not picked:
                continue
            row_name = _normalize_name(_tmkt_row_name(picked))
            target_name = _normalize_name(player_name)
            score = _name_match_score(row_name, target_name) * 0.65 + _team_match_score(
                picked.get("club"),
                team,
            ) * 0.35
            if score > best_score:
                best_row = picked
                best_score = score
    return best_row


async def fetch_transfermarkt_player_async(
    player_name: str,
    team: str,
    *,
    include_market_value: bool = True,
    include_profile: bool = True,
) -> dict[str, Any]:
    """Search Transfermarkt and return cached enrichment fields for a player."""
    from tmkt import TMKT

    best_row = await _search_transfermarkt_player(player_name, team)
    if not best_row:
        out: dict[str, Any] = {TRANSFERMARKT_FETCH_STATUS_KEY: "not_found"}
        if include_profile:
            out[TRANSFERMARKT_PROFILE_FETCH_STATUS_KEY] = "not_found"
        return out

    transfermarkt_id = str(best_row["id"])
    picked_name = _tmkt_row_name(best_row)
    out: dict[str, Any] = {TRANSFERMARKT_ID_KEY: transfermarkt_id}

    api_fields: dict[str, Any] = {}
    api_error: str | None = None
    try:
        async with TMKT() as tmkt:
            payload = await _tmkt_call_with_retry(
                lambda pid=int(transfermarkt_id): tmkt.get_player(pid),
                label=f"player:{transfermarkt_id}",
            )
        api_fields = transfermarkt_fields_from_player_payload(
            payload if isinstance(payload, dict) else {}
        )
    except Exception as exc:  # noqa: BLE001 - fall back to HTML profile page
        api_error = str(exc)

    if include_profile and (not api_fields.get("age") and not api_fields.get("date_of_birth")):
        html = _fetch_transfermarkt_profile_html(transfermarkt_id, picked_name or player_name)
        if html:
            html_fields = transfermarkt_fields_from_html(html)
            for key, value in html_fields.items():
                if api_fields.get(key) is None and value is not None:
                    api_fields[key] = value

    out.update(api_fields)

    if include_market_value:
        if out.get(MARKET_VALUE_EUR_KEY) is not None or out.get(MARKET_VALUE_DISPLAY_KEY):
            out[TRANSFERMARKT_FETCH_STATUS_KEY] = "ok"
        else:
            out[TRANSFERMARKT_FETCH_STATUS_KEY] = "not_found" if api_error else "not_found"
    if include_profile:
        if out.get("age") is not None or out.get("date_of_birth"):
            out[TRANSFERMARKT_PROFILE_FETCH_STATUS_KEY] = "ok"
            out["source"] = "transfermarkt"
        else:
            out[TRANSFERMARKT_PROFILE_FETCH_STATUS_KEY] = "not_found"
    return out


async def fetch_transfermarkt_market_value_async(
    player_name: str,
    team: str,
) -> dict[str, Any]:
    return await fetch_transfermarkt_player_async(
        player_name,
        team,
        include_market_value=True,
        include_profile=True,
    )


def fetch_transfermarkt_market_value(player_name: str, team: str) -> dict[str, Any]:
    """Network fetch for offline prefetch scripts. Do not call from Streamlit hot path."""
    return asyncio.run(fetch_transfermarkt_market_value_async(player_name, team))


def fetch_transfermarkt_age(player_name: str, team: str) -> dict[str, Any]:
    """Fetch age/profile fields from Transfermarkt with HTML fallback."""
    return asyncio.run(
        fetch_transfermarkt_player_async(
            player_name,
            team,
            include_market_value=False,
            include_profile=True,
        )
    )


def prefetch_transfermarkt_for_player(
    player_id: str,
    player_name: str,
    team: str,
    *,
    force: bool = False,
) -> dict[str, Any]:
    pid = str(player_id or "").strip()
    if transfermarkt_cache_is_fresh(pid, force=force):
        return read_cached_profile(pid)
    fetched = fetch_transfermarkt_market_value(player_name, team)
    return update_player_profile_cache(pid, fetched)


def prefetch_transfermarkt_age_for_player(
    player_id: str,
    player_name: str,
    team: str,
    *,
    force: bool = False,
) -> dict[str, Any]:
    """Fetch and cache age/profile fields from Transfermarkt when missing."""
    pid = str(player_id or "").strip()
    if transfermarkt_age_cache_is_fresh(pid, force=force):
        return read_cached_profile(pid)
    fetched = fetch_transfermarkt_age(player_name, team)
    return update_player_profile_cache(pid, fetched)


async def fetch_transfermarkt_photo_by_id_async(transfermarkt_id: str) -> dict[str, Any]:
    from tmkt import TMKT

    async with TMKT() as tmkt:
        payload = await _tmkt_call_with_retry(
            lambda tid=int(transfermarkt_id): tmkt.get_player(tid),
            label=f"player-photo:{transfermarkt_id}",
        )
    fields = _transfermarkt_fields_from_player_payload(payload if isinstance(payload, dict) else {})
    return {
        TRANSFERMARKT_PHOTO_URL_KEY: fields.get(TRANSFERMARKT_PHOTO_URL_KEY),
        CONTRACT_UNTIL_KEY: fields.get(CONTRACT_UNTIL_KEY),
    }


def prefetch_transfermarkt_photo_for_player(
    player_id: str,
    *,
    force: bool = False,
) -> dict[str, Any]:
    pid = str(player_id or "").strip()
    profile = read_cached_profile(pid)
    if not force and profile.get(TRANSFERMARKT_PHOTO_URL_KEY) and profile.get(CONTRACT_UNTIL_KEY):
        return profile
    transfermarkt_id = profile.get(TRANSFERMARKT_ID_KEY)
    if not transfermarkt_id:
        return profile
    fetched = asyncio.run(fetch_transfermarkt_photo_by_id_async(str(transfermarkt_id)))
    return update_player_profile_cache(pid, fetched)
