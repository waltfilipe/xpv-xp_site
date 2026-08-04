#!/usr/bin/env bash
# Start Pass Scout locally (full analytics). Backend binds loopback only;
# expose to others via Cloudflare Tunnel (see scripts/start-cloudflared.sh).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUN_DIR="${ROOT}/.run"
mkdir -p "$RUN_DIR"

export PASS_SCOUT_MODE=local
export HEAVY_MAPS_ENABLED=1
export BACKEND_URL=http://127.0.0.1:8000
export CORS_ORIGINS="${CORS_ORIGINS:-http://localhost:3000,http://127.0.0.1:3000}"

BACKEND_PID_FILE="$RUN_DIR/backend.pid"
FRONTEND_PID_FILE="$RUN_DIR/frontend.pid"
BACKEND_LOG="$RUN_DIR/backend.log"
FRONTEND_LOG="$RUN_DIR/frontend.log"
PYTHON_BIN="${PYTHON_BIN:-python3}"

stop_if_running() {
  for pid_file in "$BACKEND_PID_FILE" "$FRONTEND_PID_FILE"; do
    if [[ -f "$pid_file" ]]; then
      local pid
      pid="$(cat "$pid_file")"
      if kill -0 "$pid" 2>/dev/null; then
        echo "Stopping PID $pid ($pid_file)…"
        kill "$pid" 2>/dev/null || true
        wait "$pid" 2>/dev/null || true
      fi
      rm -f "$pid_file"
    fi
  done
}

backend_python_ok() {
  "$PYTHON_BIN" -c "import uvicorn" >/dev/null 2>&1
}

ensure_backend_deps() {
  if ! command -v "$PYTHON_BIN" >/dev/null 2>&1; then
    echo "Python not found ($PYTHON_BIN). Install Python 3.12+ or set PYTHON_BIN."
    exit 1
  fi
  if ! backend_python_ok; then
    echo "uvicorn not installed for $PYTHON_BIN."
    echo "Run once:"
    echo "  cd \"$ROOT/backend\" && $PYTHON_BIN -m pip install -r requirements.txt"
    exit 1
  fi
}

cleanup() {
  stop_if_running
}
trap cleanup EXIT INT TERM

if [[ "${1:-}" == "stop" ]]; then
  stop_if_running
  trap - EXIT INT TERM
  echo "Pass Scout stopped."
  exit 0
fi

stop_if_running
ensure_backend_deps

echo "==> Starting backend (PASS_SCOUT_MODE=local)…"
(
  cd "$ROOT/backend"
  nohup "$PYTHON_BIN" -m uvicorn main:app --host 127.0.0.1 --port 8000 >"$BACKEND_LOG" 2>&1 &
  echo $! >"$BACKEND_PID_FILE"
)

echo "    Waiting for /health…"
for _ in $(seq 1 60); do
  if curl -fsS http://127.0.0.1:8000/health >/dev/null 2>&1; then
    break
  fi
  sleep 1
done
curl -fsS http://127.0.0.1:8000/health || {
  echo "Backend failed. Log:"
  tail -20 "$BACKEND_LOG"
  exit 1
}

echo "==> Starting frontend…"
(
  cd "$ROOT/frontend"
  if [[ ! -d node_modules ]]; then
    npm install
  fi
  if [[ "${PASS_SCOUT_PRODUCTION:-0}" == "1" ]]; then
    npm run build
    nohup env BACKEND_URL="$BACKEND_URL" npm run start -- -H 127.0.0.1 -p 3000 >"$FRONTEND_LOG" 2>&1 &
  else
    nohup env BACKEND_URL="$BACKEND_URL" npm run dev -- -H 127.0.0.1 -p 3000 >"$FRONTEND_LOG" 2>&1 &
  fi
  echo $! >"$FRONTEND_PID_FILE"
)

echo "    Waiting for frontend…"
for _ in $(seq 1 90); do
  if curl -fsS http://127.0.0.1:3000 >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

echo ""
echo "Pass Scout is running locally."
echo "  App (you):     http://localhost:3000"
echo "  API (local):   http://127.0.0.1:8000/health"
echo ""
echo "Next — expose with Cloudflare Tunnel:"
echo "  ./scripts/start-cloudflared.sh"
echo ""
echo "Logs: $BACKEND_LOG , $FRONTEND_LOG"
echo "Stop: ./scripts/start-pass-scout.sh stop"
echo ""
echo "Press Ctrl+C to stop backend and frontend."
wait "$(cat "$BACKEND_PID_FILE")" "$(cat "$FRONTEND_PID_FILE")" 2>/dev/null || true
