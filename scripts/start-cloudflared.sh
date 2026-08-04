#!/usr/bin/env bash
# Quick Cloudflare Tunnel (no domain required). Prints a public https URL.
# Requires Pass Scout running on http://127.0.0.1:3000 (./scripts/start-pass-scout.sh).
set -euo pipefail

TARGET_URL="${PASS_SCOUT_TUNNEL_URL:-http://127.0.0.1:3000}"

if ! curl -fsS "$TARGET_URL" >/dev/null 2>&1; then
  echo "Pass Scout is not reachable at $TARGET_URL"
  echo "Start it first: ./scripts/start-pass-scout.sh"
  exit 1
fi

if ! command -v cloudflared >/dev/null 2>&1; then
  echo "cloudflared not found."
  echo ""
  echo "Install:"
  echo "  Linux:  https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/"
  echo "  macOS:  brew install cloudflared"
  echo "  Windows: winget install Cloudflare.cloudflared"
  exit 1
fi

echo "Opening Cloudflare quick tunnel → $TARGET_URL"
echo "(URL changes every time you restart this script)"
echo ""
exec cloudflared tunnel --url "$TARGET_URL"
