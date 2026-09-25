#!/usr/bin/env bash
# Regenerate aggregate map PNGs/JSON and restart Pass Scout (local or production build).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PYTHON_BIN="${PYTHON_BIN:-python3}"

echo "==> Regenerating aggregate map assets (v2 PNGs + JSON)…"
(
  cd "$ROOT/backend"
  export PASS_SCOUT_MODE=local HEAVY_MAPS_ENABLED=1
  "$PYTHON_BIN" scripts/regenerate_aggregated_map_assets.py
)

ENV_FILE="$ROOT/pass-scout.env"
if [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  set -a && source "$ENV_FILE" && set +a
fi

if [[ -n "${NEXT_PUBLIC_STATIC_ASSETS_URL:-}" ]] && [[ -n "${R2_ACCOUNT_ID:-}" ]] && [[ -n "${R2_ACCESS_KEY_ID:-}" ]] && [[ -n "${R2_SECRET_ACCESS_KEY:-}" ]] && [[ -n "${R2_BUCKET:-}" ]]; then
  echo "==> Uploading aggregated/ to R2 bucket ${R2_BUCKET}…"
  if ! command -v aws >/dev/null 2>&1; then
    echo "Install AWS CLI (aws s3 cp) to upload to R2."
  else
    ENDPOINT="https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
    aws s3 sync "$ROOT/frontend/public/static/assets/aggregated/" "s3://${R2_BUCKET}/aggregated/" \
      --endpoint-url "$ENDPOINT" \
      --cache-control "public, max-age=300"
    echo "    CDN base: ${NEXT_PUBLIC_STATIC_ASSETS_URL}"
  fi
else
  echo "==> Skipping R2 upload (set R2_* + NEXT_PUBLIC_STATIC_ASSETS_URL in pass-scout.env to enable)."
fi

echo "==> Restarting Pass Scout (daemon, production build)…"
export PASS_SCOUT_PRODUCTION=1
exec "$ROOT/scripts/start-pass-scout.sh" daemon
