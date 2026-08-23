#!/bin/bash
set -euo pipefail

# ─── TikTok Intelligence Platform — Database Backup Script ─
# Usage: ./scripts/backup.sh

BACKUP_DIR="/var/backups/tiktok-platform/db"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/backup-${TIMESTAMP}.sql.gz"
RETENTION_DAYS=14

echo "📦 Starting database backup..."

# ─── Ensure backup directory exists ────────────────────────
mkdir -p "${BACKUP_DIR}"

# ─── Load environment variables ────────────────────────────
if [ -f .env.production ]; then
    export $(grep -v '^#' .env.production | xargs)
fi

# ─── Create backup ─────────────────────────────────────────
echo "🗄️  Dumping database..."
docker compose -f docker-compose.prod.yml exec -T db pg_dump \
    -U "${POSTGRES_USER:-postgres}" \
    -d "${POSTGRES_DB:-tiktok_intelligence}" \
    --format=custom \
    --compress=9 \
    > "${BACKUP_FILE}"

# ─── Verify backup ─────────────────────────────────────────
if [ -f "${BACKUP_FILE}" ] && [ -s "${BACKUP_FILE}" ]; then
    BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
    echo "✅ Backup created: ${BACKUP_FILE} (${BACKUP_SIZE})"
else
    echo "❌ Backup failed: file is empty or missing"
    exit 1
fi

# ─── Cleanup old backups ───────────────────────────────────
echo "🧹 Cleaning up backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "backup-*.sql.gz" -mtime +${RETENTION_DAYS} -delete

# ─── List current backups ──────────────────────────────────
echo "📋 Current backups:"
ls -lh "${BACKUP_DIR}"/*.sql.gz 2>/dev/null | tail -5

echo "🎉 Backup complete!"
