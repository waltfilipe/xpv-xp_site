#!/usr/bin/env python3
"""Correlate Productivity General (xP/game) vs Relative (team share) on test-site profiles."""

from __future__ import annotations

import json
import math
from pathlib import Path

PROFILES_DIR = Path(__file__).resolve().parents[2].parent / "test-site-xpxpv" / "data" / "profiles"


def pearson(xs: list[float], ys: list[float]) -> float | None:
    n = len(xs)
    if n < 3:
        return None
    mx = sum(xs) / n
    my = sum(ys) / n
    cov = sum((x - mx) * (y - my) for x, y in zip(xs, ys))
    vx = sum((x - mx) ** 2 for x in xs)
    vy = sum((y - my) ** 2 for y in ys)
    if vx <= 0 or vy <= 0:
        return None
    return cov / math.sqrt(vx * vy)


def load_rows() -> list[dict]:
    rows: list[dict] = []
    for path in sorted(PROFILES_DIR.glob("*.json")):
        data = json.loads(path.read_text())
        player = data.get("player") or {}
        g = data.get("prod_grade_geral")
        r = data.get("prod_grade_rel")
        zg = data.get("prod_z_geral")
        zr = data.get("prod_z_rel")
        if g is None or r is None:
            xp = data.get("xp") or {}
            g = g or xp.get("prod_grade_geral")
            r = r or xp.get("prod_grade_rel")
            zg = zg or xp.get("prod_z_geral")
            zr = zr or xp.get("prod_z_rel")
        if g is None or r is None:
            continue
        rows.append(
            {
                "player_id": str(player.get("player_id") or path.stem),
                "name": str(player.get("player_name") or ""),
                "team": str(player.get("team") or ""),
                "minutes": player.get("minutes"),
                "xp_per_90": (data.get("xp") or {}).get("xp_per_90"),
                "grade_geral": float(g),
                "grade_rel": float(r),
                "z_geral": float(zg) if zg is not None else None,
                "z_rel": float(zr) if zr is not None else None,
                "gap_grade": float(r) - float(g),
                "gap_z": (float(zr) - float(zg)) if zg is not None and zr is not None else None,
            }
        )
    return rows


def main() -> None:
    rows = load_rows()
    if not rows:
        print("No profile rows with productivity grades found.")
        return

    grades_g = [r["grade_geral"] for r in rows]
    grades_r = [r["grade_rel"] for r in rows]
    z_g = [r["z_geral"] for r in rows if r["z_geral"] is not None]
    z_r = [r["z_rel"] for r in rows if r["z_rel"] is not None]
    z_pairs = [(r["z_geral"], r["z_rel"]) for r in rows if r["z_geral"] is not None and r["z_rel"] is not None]

    med_g = sorted(grades_g)[len(grades_g) // 2]
    med_r = sorted(grades_r)[len(grades_r) // 2]

    corr_grade = pearson(grades_g, grades_r)
    corr_z = pearson([p[0] for p in z_pairs], [p[1] for p in z_pairs]) if z_pairs else None

    print(f"N = {len(rows)} midfielders (test site)")
    print(f"Grade Geral median: {med_g:.2f} | Grade Rel median: {med_r:.2f}")
    if corr_grade is not None:
        print(f"Pearson r (grades): {corr_grade:.3f}")
    if corr_z is not None:
        print(f"Pearson r (z-scores): {corr_z:.3f}")

  # Low general + high relative: below median geral AND above median rel
    carriers = [
        r for r in rows
        if r["grade_geral"] < med_g and r["grade_rel"] > med_r
    ]
    carriers.sort(key=lambda r: r["gap_grade"], reverse=True)

    print()
    print("Team-share carriers (Geral < median, Rel > median):")
    for r in carriers:
        print(
            f"  {r['name']:22} ({r['team']})  "
            f"Geral {r['grade_geral']:.1f}  Rel {r['grade_rel']:.1f}  "
            f"gap +{r['gap_grade']:.2f}"
        )
    if not carriers:
        print("  (none)")

    # Strong gap on z: rel z - geral z >= 0.5
    z_carriers = [r for r in rows if r["gap_z"] is not None and r["gap_z"] >= 0.5]
    z_carriers.sort(key=lambda r: r["gap_z"] or 0, reverse=True)

    print()
    print("Strong relative lift (z_rel − z_geral ≥ 0.5):")
    for r in z_carriers:
        print(
            f"  {r['name']:22} ({r['team']})  "
            f"z_g {r['z_geral']:+.2f}  z_r {r['z_rel']:+.2f}  "
            f"Δz +{r['gap_z']:.2f}"
        )

    # Inverse: high general low relative
    volume_led = [
        r for r in rows
        if r["grade_geral"] > med_g and r["grade_rel"] < med_r
    ]
    volume_led.sort(key=lambda r: r["gap_grade"])
    print()
    print("Volume-led (Geral > median, Rel < median) — top gaps:")
    for r in volume_led[:8]:
        print(
            f"  {r['name']:22} ({r['team']})  "
            f"Geral {r['grade_geral']:.1f}  Rel {r['grade_rel']:.1f}  "
            f"gap {r['gap_grade']:.2f}"
        )


if __name__ == "__main__":
    main()
