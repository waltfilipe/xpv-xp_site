"""Offline comparison: weighted pass grades vs legacy two-pillar grades (45 profile cohort)."""

from __future__ import annotations

import csv
import json
from pathlib import Path

from profile_view_engine import PASS_GRADE_ABS_WEIGHTS, PASS_GRADE_REL_WEIGHTS


def load_rows(profiles_dir: Path) -> list[dict]:
    rows: list[dict] = []
    for fp in sorted(profiles_dir.glob("*.json")):
        with open(fp) as f:
            data = json.load(f)
        player = data.get("player", {})
        rows.append({
            "name": player.get("player_name", fp.stem),
            "team": player.get("team", ""),
            "league": player.get("league", ""),
            "cur_abs": data.get("pass_grade_general") or player.get("pass_grade_general"),
            "cur_rel": (
                data.get("pass_grade_expected")
                or data.get("pass_grade_relative")
                or player.get("pass_grade_expected")
            ),
            "vol_share": player.get("vol_passes_team_share_pct"),
        })
    return rows


def write_csv(rows: list[dict], out_path: Path) -> None:
    abs_keys = [k for k, _ in PASS_GRADE_ABS_WEIGHTS]
    rel_keys = [k for k, _ in PASS_GRADE_REL_WEIGHTS]
    with open(out_path, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow([
            "Player", "Team", "League", "Pass_Abs", "Pass_Rel", "Passes_vs_Team_%",
            *abs_keys, *rel_keys,
        ])
        for row in rows:
            writer.writerow([
                row["name"], row["team"], row["league"],
                row["cur_abs"], row["cur_rel"], row["vol_share"],
            ])


def main() -> None:
    profiles_dir = Path("/agent/repos/test-site-xpxpv/data/profiles")
    rows = load_rows(profiles_dir)
    out_csv = profiles_dir.parent / "pass-grade-comparison.csv"
    write_csv(rows, out_csv)
    print(f"Players: {len(rows)}")
    print(f"CSV: {out_csv}")


if __name__ == "__main__":
    main()
