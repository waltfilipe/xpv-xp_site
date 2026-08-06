#!/usr/bin/env bash
# Build static Pass Scout assets (option B).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/backend"

if ! python3 -c "import fastapi" 2>/dev/null; then
  echo "Installing backend dependencies…"
  python3 -m pip install -r requirements.txt
fi

python3 scripts/build_static_site.py "$@"
