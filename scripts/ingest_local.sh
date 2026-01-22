#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "[ERROR] .env not found at repo root: $ENV_FILE" >&2
  echo "Create it with at least: DATABASE_URL=postgresql+psycopg2://..." >&2
  exit 1
fi

# Load .env safely (ignore comment/blank lines)
set -a
source <(grep -vE '^\s*#' "$ENV_FILE" | grep -vE '^\s*$')
set +a

cd "$ROOT_DIR/backend"
python -m app.routers.ingest