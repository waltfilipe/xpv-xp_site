#!/usr/bin/env python3
"""Simulate pass_grade_overall recalibration: league pillars vs pool-normal composite z."""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

import numpy as np
import pandas as pd

_BACKEND = Path(__file__).resolve().parents[1]
if str(_BACKEND) not in sys.path:
    sys.path.insert(0, str(_BACKEND))

os.environ.setdefault("PASS_SCOUT_MODE", "local")

from services.data_parts import clear_data_parts_cache, get_data_parts  # noqa: E402
import profile_view_engine as pve  # noqa: E402
from xp_stats_engine import (  # noqa: E402
    EUROPEAN_TOP_FIVE_LEAGUES,
    PASS_GRADE_OVERALL_WEIGHT_LETH,
    PASS_GRADE_OVERALL_WEIGHT_PREC,
    PASS_GRADE_OVERALL_WEIGHT_PROD,
    XP_PASS_RATING_V2_LETHALITY_XPV_WEIGHT,
    _attach_league_profile_grades,
    _zscore,
    pool_normal_pass_grade,
)

CURATED_IDS_PATH = Path("/agent/repos/test-site-xpxpv/data/profile-cohort-blocks.json")
KEY_PLAYERS = (
    ("363860", "Locatelli"),
    ("363856", "Barella"),
    ("259117", "Kimmich"),
    ("902029", "Vitinha"),
    ("992587", "Pedri"),
    ("795222", "De Jong"),
    ("866469", "Rodri"),
    ("826010", "Gündogan"),
)


def _old_overall_grade(player: dict) -> float | None:
    weights = (
        ("prod_grade_geral", 0.4),
        ("prec_grade_geral", 0.4),
        ("leth_grade_blend", 0.2),
    )
    total = 0.0
    for key, weight in weights:
        raw = player.get(key)
        if raw is None:
            return None
        total += weight * float(raw)
    return round(total, 2)


def _new_overall_grade(eligible: list[dict]) -> dict[str, float]:
    leth_w = XP_PASS_RATING_V2_LETHALITY_XPV_WEIGHT
    df = pd.DataFrame(eligible)
    prod = pd.to_numeric(df.get("prod_xpv_per_game"), errors="coerce")
    prec = pd.to_numeric(df.get("prec_coe_per_pass"), errors="coerce")
    xpv = pd.to_numeric(df.get("leth_xpv_per_pass"), errors="coerce")
    threat = pd.to_numeric(df.get("leth_impact_rate_pct"), errors="coerce")

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

    out: dict[str, float] = {}
    for i, player in enumerate(eligible):
        pid = str(player.get("player_id", ""))
        z_val = z_composite.iloc[i]
        if pd.isna(z_val):
            continue
        out[pid] = pool_normal_pass_grade(float(z_val))
    return out


def _pool_stats(grades: list[float]) -> dict[str, float]:
    arr = np.array(grades, dtype=float)
    return {
        "n": float(len(arr)),
        "mean": round(float(arr.mean()), 3),
        "std": round(float(arr.std()), 3),
        "min": round(float(arr.min()), 2),
        "max": round(float(arr.max()), 2),
        "p90": round(float(np.percentile(arr, 90)), 2),
        "p95": round(float(np.percentile(arr, 95)), 2),
        "p99": round(float(np.percentile(arr, 99)), 2),
    }


def main() -> None:
    clear_data_parts_cache()
    parts = get_data_parts("midfielders", require_passes=False)
    xp_by_id = parts["xp_by_id"]
    players = list(xp_by_id.values())

    derived_path = Path("/agent/repos/test-site-xpxpv/data/pool-derived-metrics.json")
    if derived_path.is_file():
        derived_players = json.loads(derived_path.read_text(encoding="utf-8")).get("players", {})
        for pid, xp in xp_by_id.items():
            row = derived_players.get(str(pid), {})
            if row.get("chance_creation_xpv_per_game") is not None:
                xp["chance_creation_xpv_per_game"] = row["chance_creation_xpv_per_game"]
            if row.get("chance_creation_xpv") is not None:
                xp["chance_creation_xpv"] = row["chance_creation_xpv"]

    eligible = [
        p
        for p in players
        if p.get("xp_profile_bars_eligible")
        and str(p.get("league_source") or "").strip() in EUROPEAN_TOP_FIVE_LEAGUES
    ]

    _attach_league_profile_grades(players)
    old_by_id = {str(p.get("player_id")): _old_overall_grade(p) for p in eligible}
    old_by_id = {k: v for k, v in old_by_id.items() if v is not None}

    work = [dict(p) for p in players]
    pve.attach_profile_view_metrics(work)
    work_by_id = {str(p.get("player_id")): p for p in work}
    new_by_id = {
        pid: float(work_by_id[pid]["pass_grade_overall"])
        for pid in work_by_id
        if work_by_id[pid].get("pass_grade_overall") is not None
    }

    curated_ids = set(json.loads(CURATED_IDS_PATH.read_text(encoding="utf-8")).get("all_player_ids", []))

    print("=== Pool stats (full eligible, n={}) ===".format(len(new_by_id)))
    print("OLD:", _pool_stats(list(old_by_id.values())))
    print("NEW:", _pool_stats(list(new_by_id.values())))
    print()

    print("=== Key players (before → after, Δ) ===")
    print(f"{'Player':<14} {'OLD':>6} {'NEW':>6} {'Δ':>6}  prod_g  prec_g  leth_b  pass_gen")
    for pid, label in KEY_PLAYERS:
        xp = xp_by_id.get(pid)
        if not xp:
            print(f"{label:<14}  — not in pool")
            continue
        old = old_by_id.get(pid)
        new = new_by_id.get(pid)
        delta = round(new - old, 2) if old is not None and new is not None else None
        print(
            f"{label:<14} {old or '—':>6} {new or '—':>6} "
            f"{(f'{delta:+.2f}' if delta is not None else '—'):>6}  "
            f"{xp.get('prod_grade_geral')}  {xp.get('prec_grade_geral')}  "
            f"{xp.get('leth_grade_blend')}  {xp.get('pass_grade_general')}"
        )

    print()
    print("=== Curated pool top 15 (NEW) ===")
    curated_new = [(pid, new_by_id[pid]) for pid in curated_ids if pid in new_by_id]
    curated_new.sort(key=lambda x: x[1], reverse=True)
    for rank, (pid, grade) in enumerate(curated_new[:15], start=1):
        name = xp_by_id.get(pid, {}).get("player_name", pid)
        old = old_by_id.get(pid)
        delta = round(grade - old, 2) if old is not None else None
        print(f"  {rank:2}. {name:<22} {grade:.2f}  (was {old:.2f}, Δ{delta:+.2f})" if old else f"  {rank:2}. {name:<22} {grade:.2f}")

    print()
    print("=== Full pool top 15 (NEW) ===")
    full_sorted = sorted(new_by_id.items(), key=lambda x: x[1], reverse=True)
    for rank, (pid, grade) in enumerate(full_sorted[:15], start=1):
        name = xp_by_id.get(pid, {}).get("player_name", pid)
        old = old_by_id.get(pid)
        delta = round(grade - old, 2) if old is not None else None
        print(f"  {rank:2}. {name:<22} {grade:.2f}  (was {old:.2f}, Δ{delta:+.2f})" if old else f"  {rank:2}. {name:<22} {grade:.2f}")

    print()
    print("=== Curated elite spread (top 10 OLD vs NEW) ===")
    curated_old = [(pid, old_by_id[pid]) for pid in curated_ids if pid in old_by_id]
    curated_old.sort(key=lambda x: x[1], reverse=True)
    print(f"{'Rank':<5} {'Player':<22} {'OLD':>6} {'NEW':>6} {'Δ':>6}")
    for rank, (pid, old) in enumerate(curated_old[:10], start=1):
        name = xp_by_id.get(pid, {}).get("player_name", pid)
        new = new_by_id.get(pid, old)
        delta = round(new - old, 2)
        print(f"{rank:<5} {name:<22} {old:>6.2f} {new:>6.2f} {delta:>+6.2f}")


if __name__ == "__main__":
    main()
