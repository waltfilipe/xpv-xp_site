#!/usr/bin/env python3
"""Study overlap between pass-score components and effect of deduplication."""

from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

POOL = ROOT / "data" / "api_pool_midfielders.json"


def _corr(series_a: pd.Series, series_b: pd.Series) -> float:
    valid = series_a.notna() & series_b.notna()
    if int(valid.sum()) < 10:
        return float("nan")
    return float(series_a[valid].corr(series_b[valid]))


def main() -> int:
    data = json.loads(POOL.read_text(encoding="utf-8"))
    df = pd.DataFrame([p for p in data["players"] if p.get("xp_profile_bars_eligible")])
    print(f"Eligible pool: {len(df)}")

    build_old = ("progressive_passes", "final_third_passes", "special_line_break_p90")
    chance_old = ("key_passes", "passes_to_box")

    print("\n=== Correlations BEFORE dedup ===")
    for cols, label in ((build_old, "Build-up"), (chance_old, "Chance (key/box)")):
        for i, a in enumerate(cols):
            for b in cols[i + 1 :]:
                print(f"  {label} {a} vs {b}: {_corr(df[a], df[b]):.3f}")

    sum_build = df[list(build_old)].fillna(0).sum(axis=1)
    print(f"\nBuild-up sum(mean): {sum_build.mean():.2f} — inflated vs union when components overlap")

    sum_chance = df[list(chance_old)].fillna(0).sum(axis=1)
    print(f"Chance key+box sum(mean): {sum_chance.mean():.2f}")

    print("\n=== After dedup (when exclusive metrics present in pool) ===")
    build_new = (
        "progressive_passes",
        "buildup_final_third_exclusive_pg",
        "buildup_line_break_exclusive_pg",
    )
    chance_new = ("key_passes", "chance_box_exclusive_pg")
    if all(c in df.columns for c in build_new):
        for i, a in enumerate(build_new):
            for b in build_new[i + 1 :]:
                print(f"  Build-up {a} vs {b}: {_corr(df[a], df[b]):.3f}")
        part = df[list(build_new)].fillna(0).sum(axis=1)
        print(f"  Partition sum(mean): {part.mean():.2f} (equals unique build-up passes per game)")
    else:
        print("  Rebuild api_pool_midfielders.json to populate exclusive build-up metrics.")

    if all(c in df.columns for c in chance_new):
        print(f"  Chance key vs box_exclusive: {_corr(df['key_passes'], df['chance_box_exclusive_pg']):.3f}")
    else:
        print("  Rebuild api_pool_midfielders.json to populate chance_box_exclusive_pg.")

    print(f"\nVolume passes_total vs long_balls: {_corr(df['passes_total'], df['long_balls']):.3f}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
