#!/usr/bin/env sh
# Backup Postgres from Docker Compose (production or local).
# Usage: ./scripts/backup-db.sh [output-dir]
set -eu

OUT_DIR="${1:-./backups}"
STAMP="$(date +%Y%m%d_%H%M%S)"
FILE="${OUT_DIR}/tombora_hub_${STAMP}.sql.gz"
CONTAINER="${POSTGRES_CONTAINER:-tombora-postgres}"

mkdir -p "$OUT_DIR"

if ! docker ps --format '{{.Names}}' | grep -qx "$CONTAINER"; then
  echo "Container $CONTAINER is not running" >&2
  exit 1
fi

USER_NAME="${POSTGRES_USER:-tombora}"
DB_NAME="${POSTGRES_DB:-tombora_hub}"

docker exec "$CONTAINER" pg_dump -U "$USER_NAME" -d "$DB_NAME" --no-owner --no-acl \
  | gzip > "$FILE"

echo "Wrote $FILE"
