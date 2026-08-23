#!/bin/bash
set -euo pipefail

# ─── TikTok Intelligence Platform — Deployment Script ──────
# Usage: ./scripts/deploy.sh [staging|production]

ENVIRONMENT=${1:-staging}
APP_DIR="/var/www/tiktok-platform"
BACKUP_DIR="/var/backups/tiktok-platform"

echo "🚀 Deploying TikTok Intelligence Platform to ${ENVIRONMENT}..."

# ─── Pre-deployment checks ─────────────────────────────────
echo "📋 Running pre-deployment checks..."

if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not installed"
    exit 1
fi

# ─── Backup current version ────────────────────────────────
echo "📦 Creating backup of current version..."
BACKUP_NAME="backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "${BACKUP_DIR}/${BACKUP_NAME}"

if [ -d "${APP_DIR}" ]; then
    cp -r "${APP_DIR}" "${BACKUP_DIR}/${BACKUP_NAME}/app"
fi

# ─── Pull latest code ──────────────────────────────────────
echo "📥 Pulling latest code..."
cd "${APP_DIR}"
git pull origin main

# ─── Copy environment file ─────────────────────────────────
if [ ! -f "${APP_DIR}/.env.production" ]; then
    echo "❌ .env.production not found. Please create it from .env.production.example"
    exit 1
fi

# ─── Run database migrations ───────────────────────────────
echo "🗄️  Running database migrations..."
docker compose -f docker-compose.prod.yml run --rm web pnpm exec prisma migrate deploy

# ─── Build and start services ──────────────────────────────
echo "🔨 Building and starting services..."
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d

# ─── Wait for health check ─────────────────────────────────
echo "⏳ Waiting for services to be healthy..."
sleep 10

# ─── Verify deployment ─────────────────────────────────────
echo "✅ Verifying deployment..."
HEALTH_RESPONSE=$(curl -s http://localhost:3000/api/health || echo "failed")

if echo "${HEALTH_RESPONSE}" | grep -q '"healthy"'; then
    echo "✅ Deployment successful! Application is healthy."
else
    echo "⚠️  Application may not be fully healthy. Check logs:"
    echo "   docker compose -f docker-compose.prod.yml logs web"
    echo "   docker compose -f docker-compose.prod.yml logs worker"
fi

# ─── Cleanup old backups (keep last 7) ─────────────────────
echo "🧹 Cleaning up old backups..."
cd "${BACKUP_DIR}"
ls -dt */ | tail -n +8 | xargs rm -rf 2>/dev/null || true

echo "🎉 Deployment complete!"
