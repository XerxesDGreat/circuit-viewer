#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$ROOT_DIR"

export PRISMA_SCHEMA_PATH="prisma/schema.prisma"

npx prisma db execute --schema "$PRISMA_SCHEMA_PATH" --stdin <<'SQL'
TRUNCATE TABLE
  "NodeLink",
  "Node",
  "BreakerLink",
  "Breaker",
  "Circuit",
  "Panel",
  "NodeType",
  "Room",
  "Floor"
RESTART IDENTITY CASCADE;
SQL

