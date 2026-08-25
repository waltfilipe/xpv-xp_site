"""Pass-score deduplication: mutually exclusive build-up and chance partitions."""

from __future__ import annotations

import numpy as np
import pandas as pd

import passes_engine as pe
import xp_stats_engine as xse


def _synthetic_enriched() -> pd.DataFrame:
    """Five successful passes exercising overlap between build/chance categories."""
    rows = [
        # progressive only
        {"x_start": 40.0, "y_start": 40.0, "x_end": 55.0, "y_end": 40.0, "is_key_pass": False},
        # progressive + final third
        {"x_start": 50.0, "y_start": 40.0, "x_end": 85.0, "y_end": 40.0, "is_key_pass": False},
        # final third only (lateral, short — not progressive)
        {"x_start": 70.0, "y_start": 40.0, "x_end": 90.0, "y_end": 42.0, "is_key_pass": False},
        # key pass into box (overlap key + box)
        {"x_start": 75.0, "y_start": 40.0, "x_end": 105.0, "y_end": 40.0, "is_key_pass": True},
        # box only
        {"x_start": 78.0, "y_start": 38.0, "x_end": 108.0, "y_end": 40.0, "is_key_pass": False},
    ]
    frame = pd.DataFrame(rows)
    frame["is_success"] = True
    frame["is_won"] = True
    frame["has_end"] = True
    frame["is_progressive_wyscout"] = pe._progressive_wyscout_vec(
        frame["x_start"].to_numpy(),
        frame["y_start"].to_numpy(),
        frame["x_end"].to_numpy(),
        frame["y_end"].to_numpy(),
    )
    frame["prog_success"] = frame["is_success"] & frame["is_progressive_wyscout"]
    frame["pass_distance"] = np.sqrt(
        (frame["x_end"] - frame["x_start"]) ** 2 + (frame["y_end"] - frame["y_start"]) ** 2
    )
    return frame


def test_build_up_partition_sums_to_unique_passes() -> None:
    enriched = _synthetic_enriched()
    counts = xse._compute_deduplicated_pass_score_counts(enriched)

    prog_mask = enriched["prog_success"].to_numpy(bool)
    ft_mask = (
        enriched["has_end"].to_numpy(bool)
        & (enriched["x_end"].to_numpy(float) >= pe.FINAL_THIRD_LINE_X)
    )
    lb_mask = xse.compute_special_pass_masks(enriched)["line_break"]
    union_count = int((prog_mask | ft_mask | lb_mask).sum())

    partition_sum = (
        int(prog_mask.sum())
        + counts["buildup_final_third_exclusive_pg"]
        + counts["buildup_line_break_exclusive_pg"]
    )
    assert partition_sum == union_count


def test_chance_box_exclusive_excludes_key_passes() -> None:
    enriched = _synthetic_enriched()
    counts = xse._compute_deduplicated_pass_score_counts(enriched)

    key = enriched["is_key_pass"].to_numpy(bool)
    box = pe._ended_in_penalty_box(enriched).to_numpy(bool)
    assert counts["chance_box_exclusive_pg"] == int((box & ~key).sum())
    assert counts["chance_box_exclusive_pg"] < int(box.sum())
