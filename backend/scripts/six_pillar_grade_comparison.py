"""Offline comparison: 6-pillar mean grades vs current pass grades (45 profile cohort)."""

from __future__ import annotations

import csv
import json
from pathlib import Path

ABS_KEYS = [
    ("Productivity", "prod_grade_pass_pool"),
    ("Precision", "prec_grade_pass_pool"),
    ("Volume", "pv_abs_volume_display"),
    ("Efficiency", "pv_abs_efficiency_display"),
    ("Build-Up", "pv_abs_buildup_display"),
    ("Chance Creation", "pv_abs_chance_display"),
]
REL_KEYS = [
    ("Productivity", "prod_grade_rel_pool"),
    ("Precision", "prec_grade_stratum_pool"),
    ("Volume", "pv_rel_volume_display"),
    ("Efficiency", "pv_rel_efficiency_display"),
    ("Build-Up", "pv_rel_buildup_display"),
    ("Chance Creation", "pv_rel_chance_display"),
]


def mean(vals: list[float | None]) -> float | None:
    clean = [float(v) for v in vals if v is not None]
    return round(sum(clean) / len(clean), 2) if clean else None


def load_rows(profiles_dir: Path) -> list[dict]:
    rows: list[dict] = []
    for fp in sorted(profiles_dir.glob("*.json")):
        with open(fp) as f:
            data = json.load(f)
        player = data.get("player", {})
        abs_grades = {label: data.get(key) or player.get(key) for label, key in ABS_KEYS}
        rel_grades = {label: data.get(key) or player.get(key) for label, key in REL_KEYS}

        abs_new = mean(list(abs_grades.values()))
        rel_new = mean(list(rel_grades.values()))
        overall_new = mean([abs_new, rel_new])

        cur_abs = data.get("pass_grade_general") or player.get("pass_grade_general")
        cur_rel = (
            data.get("pass_grade_expected")
            or data.get("pass_grade_relative")
            or player.get("pass_grade_expected")
        )
        cur_overall = mean([cur_abs, cur_rel])

        rows.append({
            "name": player.get("player_name", fp.stem),
            "team": player.get("team", ""),
            "league": player.get("league", ""),
            "cur_abs": cur_abs,
            "new_abs": abs_new,
            "delta_abs": round(abs_new - float(cur_abs), 2) if abs_new and cur_abs else None,
            "cur_rel": cur_rel,
            "new_rel": rel_new,
            "delta_rel": round(rel_new - float(cur_rel), 2) if rel_new and cur_rel else None,
            "new_overall": overall_new,
            "cur_overall": cur_overall,
            "abs_grades": abs_grades,
            "rel_grades": rel_grades,
        })
    return rows


def write_csv(rows: list[dict], out_path: Path) -> None:
    with open(out_path, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow([
            "Player", "Team", "League",
            "Cur_Abs", "New_Abs_6avg", "Delta_Abs",
            "Cur_Rel", "New_Rel_6avg", "Delta_Rel",
            "Cur_Overall_2avg", "New_Overall_6avg",
            "Abs_Prod", "Abs_Prec", "Abs_Vol", "Abs_Eff", "Abs_Build", "Abs_Chance",
            "Rel_Prod", "Rel_Prec", "Rel_Vol", "Rel_Eff", "Rel_Build", "Rel_Chance",
        ])
        for row in rows:
            ag = row["abs_grades"]
            rg = row["rel_grades"]
            writer.writerow([
                row["name"], row["team"], row["league"],
                row["cur_abs"], row["new_abs"], row["delta_abs"],
                row["cur_rel"], row["new_rel"], row["delta_rel"],
                row["cur_overall"], row["new_overall"],
                ag["Productivity"], ag["Precision"], ag["Volume"], ag["Efficiency"],
                ag["Build-Up"], ag["Chance Creation"],
                rg["Productivity"], rg["Precision"], rg["Volume"], rg["Efficiency"],
                rg["Build-Up"], rg["Chance Creation"],
            ])


def print_table(rows: list[dict]) -> None:
    ranked = sorted(rows, key=lambda r: -(r["new_overall"] or 0))
    deltas_abs = [r["delta_abs"] for r in ranked if r["delta_abs"] is not None]
    deltas_rel = [r["delta_rel"] for r in ranked if r["delta_rel"] is not None]
    print(f"Players: {len(ranked)}")
    if deltas_abs:
        print(f"Mean Δ Abs (new − current): {sum(deltas_abs) / len(deltas_abs):+.2f}")
    if deltas_rel:
        print(f"Mean Δ Rel (new − current): {sum(deltas_rel) / len(deltas_rel):+.2f}")
    print()
    print(f"{'Player':<28} {'CurAbs':>6} {'NewAbs':>6} {'Δ':>5} {'CurRel':>6} {'NewRel':>6} {'Δ':>5} {'NewAll':>6}")
    for row in ranked:
        print(
            f"{row['name']:<28} {row['cur_abs']:>6} {row['new_abs']:>6} "
            f"{row['delta_abs']:>+5.2f} {row['cur_rel']:>6} {row['new_rel']:>6} "
            f"{row['delta_rel']:>+5.2f} {row['new_overall']:>6}"
        )


def main() -> None:
    profiles_dir = Path(__file__).resolve().parents[2].parent / "test-site-xpxpv" / "data" / "profiles"
    if not profiles_dir.is_dir():
        profiles_dir = Path("/agent/repos/test-site-xpxpv/data/profiles")
    rows = load_rows(profiles_dir)
    out_csv = profiles_dir.parent / "six-pillar-grade-comparison.csv"
    write_csv(rows, out_csv)
    print_table(rows)
    print(f"\nCSV written to {out_csv}")


if __name__ == "__main__":
    main()
