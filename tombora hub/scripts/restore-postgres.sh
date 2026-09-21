#!/bin/sh
# Restore PostgreSQL from a gzipped dump
# Usage: ./scripts/restore-postgres.sh ./backups/tombora_hub_YYYYMMDD_HHMMSS.sql.gz

set -e
FILE="$1"
if [ -z "$FILE" ]; then
  echo "Usage: $0 <backup.sql.gz>"
  exit 1
fi

gunzip -c "$FILE" | docker compose exec -T postgres psql -U "${POSTGRES_USER:-tombora}" "${POSTGRES_DB:-tombora_hub}"
echo "Restore completed from $FILE"
