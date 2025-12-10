#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is not set; export it or place it in .env/apps/backend/.env" >&2
  exit 1
fi

BACKUP_DIR="${BACKUP_DIR:-"$(dirname "$0")/../backups"}"
mkdir -p "$BACKUP_DIR"

timestamp="$(date +%Y%m%d_%H%M%S)"
outfile="${BACKUP_DIR}/backup_${timestamp}.sql"

echo "Writing backup to ${outfile}"
pg_dump "${DATABASE_URL}" > "${outfile}"
echo "Done."

