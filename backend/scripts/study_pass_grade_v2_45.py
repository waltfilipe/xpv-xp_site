#!/usr/bin/env python3
"""Offline v2 overall pass grade (3 pillars only) for 45 test-site midfielders.

Pillar z-scores within the 45 pool:
  Productivity — 0.7 z(xp_per_90) + 0.3 z(xp_per_90 / team_xp_per_90)
  Precision    — 0.7 z(xpass_residual_p90) + 0.3 z(COE stratum: short+total)
  Lethality    — mean z(xpv_per_pass, test_impact_v2_p90, threat_pass_pct)

Overall composite (equal pillar weights):
  composite_z = mean(z_productivity, z_precision, z_lethality)

Grade mapping: 5.0–9.15 via normal CDF on composite_z (mean ≈ 7, rare highs).
"""

from __future__ import annotations

import json
import pathlib
import sys

import numpy as np
import pandas as pd
from scipy.stats import norm

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

import xp_engine as xe  # noqa: E402
import xp_stats_engine as xs  # noqa: E402

TEST_SITE = ROOT.parent.parent / "test-site-xpxpv"
PLAYER_IDS = json.loads((TEST_SITE / "data" / "player-ids.json").read_text(encoding="utf-8"))
OUTPUT_CSV = ROOT / "data" / "pass_grade_v2_45.csv"
PROD_CSV = ROOT / "data" / "productivity_models_45.csv"

PROD_PURE_W = 0.70
PREC_RES_W = 0.70

GRADE_FLOOR = 5.0
GRADE_CAP = 9.15
GRADE_CDF_SCALE = 0.92


def zscore(s: pd.Series) -> pd.Series:
    std = float(s.std())
    if std <= 1e-12:
        return pd.Series(0.0, index=s.index)
    return (s - float(s.mean())) / std


def coe_stratum_z(df: pd.DataFrame) -> pd.Series:
    passes = pd.to_numeric(df["passes_total"], errors="coerce")
    parts: list[pd.Series] = []
    for col in ("xpass_coe_pct", "xpass_total_coe_pct"):
        if col in df.columns:
            parts.append(xs._coe_stratum_z_by_volume_quartile(passes, df[col]))
    if not parts:
        return pd.Series(0.0, index=df.index)
    return pd.concat(parts, axis=1).mean(axis=1, skipna=True)


def composite_to_grade(z: float) -> float:
    span = GRADE_CAP - GRADE_FLOOR
    return float(GRADE_FLOOR + span * norm.cdf(float(z) * GRADE_CDF_SCALE))


def main() -> int:
    _, all_players = xe.build_european_league_xp_analytics(position_family="midfielders")
    by_id = {str(p["player_id"]): p for p in all_players}

    prod_df = pd.read_csv(PROD_CSV).set_index("player_id") if PROD_CSV.is_file() else pd.DataFrame()

    records: list[dict] = []
    for pid in PLAYER_IDS:
        p = by_id.get(str(pid))
        if not p:
            continue
        pr = prod_df.loc[pid] if pid in prod_df.index else None
        ratio = float(pr["model_R_D_ratio"]) if pr is not None and pd.notna(pr.get("model_R_D_ratio")) else None
        xp_per_90 = float(p.get("xp_per_90") or 0.0)
        if ratio is None and pr is not None and pd.notna(pr.get("team_xp_per_90")):
            t = float(pr["team_xp_per_90"])
            ratio = xp_per_90 / t if t > 0 else None

        records.append(
            {
                "player_id": pid,
                "player_name": p.get("player_name"),
                "team": p.get("team"),
                "league": p.get("league"),
                "xp_per_90": xp_per_90,
                "prod_ratio_R_D": ratio,
                "xpass_residual_p90": float(p.get("xpass_residual_p90") or 0.0),
                "xpass_coe_pct": p.get("xpass_coe_pct"),
                "xpass_total_coe_pct": p.get("xpass_total_coe_pct"),
                "passes_total": float(p.get("passes_total") or 0.0),
                "xpv_per_pass": p.get("xpv_per_pass"),
                "test_impact_v2_p90": float(p.get("test_impact_v2_p90") or 0.0),
                "threat_pass_pct": p.get("threat_pass_pct"),
                "xp_pass_rating_old": p.get("xp_pass_rating"),
                "xp_pass_rating_display_old": p.get("xp_pass_rating_percentile_display"),
            }
        )

    df = pd.DataFrame(records)
    if df.empty:
        print("No players loaded.")
        return 1

    df["prod_ratio_R_D"] = pd.to_numeric(df["prod_ratio_R_D"], errors="coerce")
    ratio_median = float(df["prod_ratio_R_D"].median()) if df["prod_ratio_R_D"].notna().any() else 1.0
    df["prod_ratio_R_D"] = df["prod_ratio_R_D"].fillna(ratio_median)

    df["z_prod_pure"] = zscore(df["xp_per_90"])
    df["z_prod_ratio"] = zscore(df["prod_ratio_R_D"])
    df["z_productivity"] = PROD_PURE_W * df["z_prod_pure"] + (1.0 - PROD_PURE_W) * df["z_prod_ratio"]

    df["z_prec_residual"] = zscore(df["xpass_residual_p90"])
    df["z_prec_coe_stratum"] = coe_stratum_z(df).fillna(0.0)
    df["z_precision"] = (
        PREC_RES_W * df["z_prec_residual"] + (1.0 - PREC_RES_W) * df["z_prec_coe_stratum"]
    )

    for col in ("xpv_per_pass", "test_impact_v2_p90", "threat_pass_pct"):
        df[f"z_{col}"] = zscore(pd.to_numeric(df[col], errors="coerce").fillna(0.0))
    df["z_lethality"] = (
        df["z_xpv_per_pass"] + df["z_test_impact_v2_p90"] + df["z_threat_pass_pct"]
    ) / 3.0

    # Equal weight across the three pillars
    df["composite_z"] = (
        df["z_productivity"] + df["z_precision"] + df["z_lethality"]
    ) / 3.0

    df["pass_grade_v2"] = df["composite_z"].map(composite_to_grade).round(2)
    df["pass_grade_v2_stored"] = (df["pass_grade_v2"] / 10.0).round(4)

    old = pd.to_numeric(df["xp_pass_rating_display_old"], errors="coerce")
    df["rank_v2"] = df["pass_grade_v2"].rank(method="min", ascending=False)
    df["rank_old"] = old.rank(method="min", ascending=False)
    df["rank_delta"] = df["rank_old"] - df["rank_v2"]

    df = df.sort_values("pass_grade_v2", ascending=False)
    OUTPUT_CSV.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(OUTPUT_CSV, index=False)

    print(f"Wrote {OUTPUT_CSV} ({len(df)} rows)")
    print(
        f"pass_grade_v2: mean={df['pass_grade_v2'].mean():.2f}, "
        f"std={df['pass_grade_v2'].std():.2f}, "
        f"min={df['pass_grade_v2'].min():.2f}, max={df['pass_grade_v2'].max():.2f}"
    )
    print(f">= 9.0: {int((df['pass_grade_v2'] >= 9.0).sum())}/{len(df)}")
    print(f">= 8.5: {int((df['pass_grade_v2'] >= 8.5).sum())}/{len(df)}")

    show = df[
        [
            "player_name",
            "team",
            "pass_grade_v2",
            "rank_v2",
            "xp_pass_rating_display_old",
            "rank_delta",
            "z_productivity",
            "z_precision",
            "z_lethality",
            "composite_z",
        ]
    ]
    print("\n", show.to_string(index=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
