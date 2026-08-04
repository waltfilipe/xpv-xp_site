#!/usr/bin/env bash
# Build parquet + API pool JSON for every position family (run once offline).
# Needs ~8 GB RAM and can take 30–60 minutes.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT/backend"

echo "==> Building European parquets (all position families)…"
python3 scripts/build_xp_european.py

echo "==> Building API pool JSON caches…"
python3 scripts/build_api_pool_cache.py

echo "Done. Files in backend/data/:"
ls -lh data/api_pool_*.json data/xp_passes_european*.parquet 2>/dev/null || true
