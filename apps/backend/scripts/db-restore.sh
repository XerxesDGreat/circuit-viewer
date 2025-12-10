#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is not set; export it or place it in .env/apps/backend/.env" >&2
  exit 1
fi

FILE="${1:-}"
if [[ -z "${FILE}" ]]; then
  echo "Usage: bash scripts/db-restore.sh path/to/backup.sql" >&2
  exit 1
fi

if [[ ! -f "${FILE}" ]]; then
  echo "File not found: ${FILE}" >&2
  exit 1
fi

echo "Restoring from ${FILE}"
psql "${DATABASE_URL}" < "${FILE}"
echo "Done."

