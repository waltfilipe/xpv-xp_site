#!/usr/bin/env bash
# Quick Cloudflare Tunnel (no domain required). Prints a public https URL.
# Requires Pass Scout running on http://127.0.0.1:3000 (./scripts/start-pass-scout.sh).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUN_DIR="${ROOT}/.run"
mkdir -p "$RUN_DIR"

TARGET_URL="${PASS_SCOUT_TUNNEL_URL:-http://127.0.0.1:3000}"
PID_FILE="$RUN_DIR/cloudflared.pid"
LOG_FILE="$RUN_DIR/cloudflared.log"
URL_FILE="$RUN_DIR/tunnel.url"

find_cloudflared() {
  if command -v cloudflared >/dev/null 2>&1; then
    command -v cloudflared
    return 0
  fi
  if [[ -x /tmp/cloudflared ]]; then
    echo /tmp/cloudflared
    return 0
  fi
  return 1
}

ensure_cloudflared() {
  if find_cloudflared >/dev/null 2>&1; then
    return 0
  fi
  echo "cloudflared not found. Downloading to /tmp/cloudflared…"
  curl -fsSL -o /tmp/cloudflared \
    "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64"
  chmod +x /tmp/cloudflared
}

stop_tunnel() {
  if [[ -f "$PID_FILE" ]]; then
    local pid
    pid="$(cat "$PID_FILE")"
    if kill -0 "$pid" 2>/dev/null; then
      echo "Stopping cloudflared (PID $pid)…"
      kill "$pid" 2>/dev/null || true
      wait "$pid" 2>/dev/null || true
    fi
    rm -f "$PID_FILE"
  fi
  pkill -f "cloudflared tunnel --url" 2>/dev/null || true
}

extract_url() {
  grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' "$LOG_FILE" 2>/dev/null | tail -1
}

start_tunnel() {
  local bin
  bin="$(find_cloudflared)"
  rm -f "$LOG_FILE"
  nohup "$bin" tunnel --url "$TARGET_URL" >>"$LOG_FILE" 2>&1 &
  echo $! >"$PID_FILE"
  for _ in $(seq 1 30); do
    local url
    url="$(extract_url)"
    if [[ -n "$url" ]]; then
      echo "$url" >"$URL_FILE"
      echo "$url"
      return 0
    fi
    sleep 1
  done
  echo "Tunnel started but URL not ready yet. Check: tail -f $LOG_FILE"
  return 1
}

if [[ "${1:-}" == "stop" ]]; then
  stop_tunnel
  rm -f "$URL_FILE"
  echo "Cloudflare tunnel stopped."
  exit 0
fi

if [[ "${1:-}" == "url" ]]; then
  if [[ -f "$URL_FILE" ]]; then
    cat "$URL_FILE"
    exit 0
  fi
  url="$(extract_url)"
  if [[ -n "$url" ]]; then
    echo "$url"
    exit 0
  fi
  echo "No tunnel URL found. Run: ./scripts/start-cloudflared.sh daemon"
  exit 1
fi

if ! curl -fsS "$TARGET_URL" >/dev/null 2>&1; then
  echo "Pass Scout is not reachable at $TARGET_URL"
  echo "Start it first: ./scripts/start-pass-scout.sh daemon"
  exit 1
fi

ensure_cloudflared

if [[ "${1:-}" == "daemon" ]]; then
  stop_tunnel
  echo "Opening Cloudflare quick tunnel → $TARGET_URL"
  url="$(start_tunnel)" || true
  if [[ -n "${url:-}" ]]; then
    echo ""
    echo "Public URL: $url"
    echo "Profile:    ${url}/profile"
    echo "Saved to:   $URL_FILE"
    echo "Log:        $LOG_FILE"
    echo "Stop:       ./scripts/start-cloudflared.sh stop"
  fi
  exit 0
fi

echo "Opening Cloudflare quick tunnel → $TARGET_URL"
echo "(URL changes every time you restart; use 'daemon' to run in background)"
echo ""
exec "$(find_cloudflared)" tunnel --url "$TARGET_URL"
