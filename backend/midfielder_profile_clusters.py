"""K=4 midfielder pass-profile clusters on raw absolute metrics."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

FEATURES: tuple[tuple[str, str], ...] = (
    ("passes_total", "Passes p90"),
    ("progressive_passes", "Progressive passes p90"),
    ("final_third_passes", "Final third passes p90"),
    ("key_passes", "Key passes p90"),
    ("passes_to_box", "Passes to box p90"),
    ("chance_creation_xpv_per_game", "Chance xPV/game"),
    ("leth_xpv_per_pass", "Lethality xPV/pass"),
    ("leth_impact_rate_pct", "Impact pass rate %"),
    ("prod_xpv_per_game", "xPV/game"),
    ("prec_coe_per_pass", "COE/pass (pp)"),
)

CLUSTER_K = 4
KMEANS_RANDOM_STATE = 42

# Stable keys ordered by typical productivity (assigned after fit).
CLUSTER_KEYS: tuple[str, ...] = (
    "elite_engine",
    "box_to_box",
    "chance_creator",
    "low_volume",
)

# low_volume is kept for k=4 fit only; players are surfaced as box_to_box (Organizador).
DISPLAY_CLUSTER_REMAP: dict[str, str] = {
    "low_volume": "box_to_box",
}

DISPLAY_CLUSTER_KEYS: tuple[str, ...] = (
    "elite_engine",
    "box_to_box",
    "chance_creator",
)

CLUSTER_CATALOG: dict[str, dict[str, Any]] = {
    "elite_engine": {
        "icon": "fa-bolt",
        "accent": "#a3e635",
        "title_en": "Elite",
        "title_pt": "Elite",
        "summary_en": "Very high pass volume, xPV/game and COE/pass — organises and progresses at elite level.",
        "summary_pt": "Volume de passe, xPV/jogo e COE/pass muito altos — organiza e progride em nível elite.",
    },
    "box_to_box": {
        "icon": "fa-sitemap",
        "accent": "#38bdf8",
        "title_en": "Organiser",
        "title_pt": "Organizador",
        "summary_en": "Solid volume and xPV with positive precision — organises and contributes across the midfield.",
        "summary_pt": "Volume sólido e xPV com precisão positiva — organiza e contribui no meio-campo.",
    },
    "chance_creator": {
        "icon": "fa-wand-magic-sparkles",
        "accent": "#f472b6",
        "title_en": "Chance creator",
        "title_pt": "Criador de Chance",
        "summary_en": "Moderate volume but high key passes and chance xPV — chance creation over raw pass count.",
        "summary_pt": "Volume moderado, mas key passes e chance xPV altos — criação acima do volume bruto.",
    },
    "low_volume": {
        "icon": "fa-sitemap",
        "accent": "#38bdf8",
        "title_en": "Organiser",
        "title_pt": "Organizador",
        "summary_en": "Solid volume and xPV with positive precision — organises and contributes across the midfield.",
        "summary_pt": "Volume sólido e xPV com precisão positiva — organiza e contribui no meio-campo.",
    },
}


def _display_cluster_key(raw_key: str) -> str:
    return DISPLAY_CLUSTER_REMAP.get(raw_key, raw_key)


def _winsorize(series: pd.Series, lower: float = 0.01, upper: float = 0.99) -> pd.Series:
    lo, hi = series.quantile(lower), series.quantile(upper)
    return series.clip(lo, hi)


def _derived_metrics_path() -> Path:
    return Path("/agent/repos/test-site-xpxpv/data/pool-derived-metrics.json")


def build_cluster_assignments(
    pool_players: list[dict[str, Any]],
    *,
    derived_path: Path | None = None,
) -> dict[str, Any]:
    """Fit k=4 clusters on eligible players; return catalog + per-player assignments."""
    derived_path = derived_path or _derived_metrics_path()
    derived_players: dict[str, Any] = {}
    if derived_path.is_file():
        derived_players = json.loads(derived_path.read_text(encoding="utf-8")).get("players", {})

    rows: list[dict[str, Any]] = []
    for player in pool_players:
        if not player.get("xp_profile_bars_eligible"):
            continue
        row = dict(player)
        pid = str(player.get("player_id", ""))
        row["chance_creation_xpv_per_game"] = derived_players.get(pid, {}).get(
            "chance_creation_xpv_per_game",
        )
        rows.append(row)

    keys = [k for k, _ in FEATURES]
    df = pd.DataFrame(rows)
    df = df.dropna(subset=keys).copy()
    for key in keys:
        df[key] = pd.to_numeric(df[key], errors="coerce")
    df = df.dropna(subset=keys).copy()

    raw = df[keys].copy()
    for key in keys:
        raw[key] = _winsorize(raw[key])
    X = StandardScaler().fit_transform(raw.to_numpy(dtype=float))

    raw_labels = KMeans(
        n_clusters=CLUSTER_K,
        random_state=KMEANS_RANDOM_STATE,
        n_init=40,
    ).fit_predict(X)
    df["raw_cluster"] = raw_labels

    # Map raw ids -> stable keys by descending mean xPV/game.
    order = (
        df.groupby("raw_cluster")["prod_xpv_per_game"]
        .mean()
        .sort_values(ascending=False)
        .index.tolist()
    )
    raw_to_key = {int(raw_id): CLUSTER_KEYS[i] for i, raw_id in enumerate(order)}

    df["cluster_key"] = df["raw_cluster"].map(lambda rid: raw_to_key[int(rid)])
    df["display_key"] = df["cluster_key"].map(_display_cluster_key)

    clusters_out: list[dict[str, Any]] = []
    for rank, key in enumerate(DISPLAY_CLUSTER_KEYS):
        sub = df[df["display_key"] == key]
        meta = CLUSTER_CATALOG[key]
        clusters_out.append(
            {
                "key": key,
                "rank": rank,
                "n": int(len(sub)),
                "pool_pct": round(100.0 * len(sub) / len(df), 1),
                "icon": meta["icon"],
                "accent": meta["accent"],
                "title_en": meta["title_en"],
                "title_pt": meta["title_pt"],
                "summary_en": meta["summary_en"],
                "summary_pt": meta["summary_pt"],
                "centroid": {k: round(float(sub[k].mean()), 3) for k in keys},
            }
        )

    cluster_meta_by_key = {c["key"]: c for c in clusters_out}

    by_player: dict[str, dict[str, Any]] = {}
    for _, row in df.iterrows():
        pid = str(row["player_id"])
        cluster_key = _display_cluster_key(raw_to_key[int(row["raw_cluster"])])
        meta = CLUSTER_CATALOG[cluster_key]
        cluster_meta = cluster_meta_by_key[cluster_key]
        by_player[pid] = {
            "key": cluster_key,
            "rank": DISPLAY_CLUSTER_KEYS.index(cluster_key),
            "pool_pct": cluster_meta["pool_pct"],
            "icon": meta["icon"],
            "accent": meta["accent"],
            "title_en": meta["title_en"],
            "title_pt": meta["title_pt"],
            "summary_en": meta["summary_en"],
            "summary_pt": meta["summary_pt"],
        }

    return {
        "k": len(DISPLAY_CLUSTER_KEYS),
        "k_fit": CLUSTER_K,
        "n_players": len(df),
        "features": [{"key": k, "label": label} for k, label in FEATURES],
        "clusters": clusters_out,
        "by_player_id": by_player,
    }


def profile_cluster_for_player(
    player_id: str,
    pool_players: list[dict[str, Any]] | None = None,
    cache: dict[str, Any] | None = None,
) -> dict[str, Any] | None:
    if cache is None:
        if pool_players is None:
            return None
        cache = build_cluster_assignments(pool_players)
    return cache.get("by_player_id", {}).get(str(player_id))
