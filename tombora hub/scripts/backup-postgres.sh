#!/bin/sh
# Daily PostgreSQL backup for Tombora Hub
# Usage: ./scripts/backup-postgres.sh
# Schedule via cron: 0 2 * * * /path/to/scripts/backup-postgres.sh

set -e
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
STAMP=$(date +%Y%m%d_%H%M%S)
mkdir -p "$BACKUP_DIR"

docker compose exec -T postgres pg_dump -U "${POSTGRES_USER:-tombora}" "${POSTGRES_DB:-tombora_hub}" \
  | gzip > "$BACKUP_DIR/tombora_hub_$STAMP.sql.gz"

find "$BACKUP_DIR" -name 'tombora_hub_*.sql.gz' -mtime +"$RETENTION_DAYS" -delete
echo "Backup written: $BACKUP_DIR/tombora_hub_$STAMP.sql.gz"
