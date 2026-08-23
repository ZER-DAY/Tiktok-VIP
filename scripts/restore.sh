#!/bin/bash
set -euo pipefail

# ─── TikTok Intelligence Platform — Database Restore Script ─
# Usage: ./scripts/restore.sh <backup-file>

BACKUP_FILE=${1:-}
BACKUP_DIR="/var/backups/tiktok-platform/db"

if [ -z "${BACKUP_FILE}" ]; then
    echo "Usage: ./scripts/restore.sh <backup-file>"
    echo ""
    echo "Available backups:"
    ls -lh "${BACKUP_DIR}"/*.sql.gz 2>/dev/null || echo "  No backups found"
    exit 1
fi

if [ ! -f "${BACKUP_FILE}" ]; then
    echo "❌ Backup file not found: ${BACKUP_FILE}"
    exit 1
fi

echo "⚠️  WARNING: This will overwrite the current database!"
echo "   Backup file: ${BACKUP_FILE}"
echo "   Press Ctrl+C within 5 seconds to cancel..."
sleep 5

# ─── Load environment variables ────────────────────────────
if [ -f .env.production ]; then
    export $(grep -v '^#' .env.production | xargs)
fi

# ─── Stop web and worker services ──────────────────────────
echo "🛑 Stopping application services..."
docker compose -f docker-compose.prod.yml stop web worker

# ─── Drop and recreate database ────────────────────────────
echo "🗄️  Recreating database..."
docker compose -f docker-compose.prod.yml exec -T db psql \
    -U "${POSTGRES_USER:-postgres}" \
    -c "DROP DATABASE IF EXISTS ${POSTGRES_DB:-tiktok_intelligence};"
docker compose -f docker-compose.prod.yml exec -T db psql \
    -U "${POSTGRES_USER:-postgres}" \
    -c "CREATE DATABASE ${POSTGRES_DB:-tiktok_intelligence};"

# ─── Restore from backup ───────────────────────────────────
echo "📥 Restoring database from backup..."
cat "${BACKUP_FILE}" | docker compose -f docker-compose.prod.yml exec -T db pg_restore \
    -U "${POSTGRES_USER:-postgres}" \
    -d "${POSTGRES_DB:-tiktok_intelligence}" \
    --no-owner \
    --no-acl \
    --verbose 2>/dev/null || true

# ─── Run migrations ────────────────────────────────────────
echo "🔄 Running migrations..."
docker compose -f docker-compose.prod.yml run --rm web pnpm exec prisma migrate deploy

# ─── Restart services ──────────────────────────────────────
echo "🚀 Starting application services..."
docker compose -f docker-compose.prod.yml up -d

# ─── Verify ────────────────────────────────────────────────
echo "⏳ Waiting for services to be healthy..."
sleep 10

HEALTH_RESPONSE=$(curl -s http://localhost:3000/api/health || echo "failed")
if echo "${HEALTH_RESPONSE}" | grep -q '"healthy"'; then
    echo "✅ Restore successful! Application is healthy."
else
    echo "⚠️  Application may not be fully healthy. Check logs."
fi

echo "🎉 Restore complete!"
