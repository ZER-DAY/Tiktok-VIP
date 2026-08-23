#!/bin/bash
set -euo pipefail

# ─── TikTok Intelligence Platform — Project Backup Script ──
# Backs up the entire project folder (including docs/, prompts/)
# to an external location (e.g., remote server, S3, etc.)

BACKUP_SOURCE="/var/www/tiktok-platform"
BACKUP_DEST="/var/backups/tiktok-platform/project"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_NAME="project-${TIMESTAMP}.tar.gz"
RETENTION_DAYS=30

echo "📦 Starting project backup..."

# ─── Ensure backup directory exists ────────────────────────
mkdir -p "${BACKUP_DEST}"

# ─── Create tarball ────────────────────────────────────────
echo "📁 Creating project archive..."
tar -czf "${BACKUP_DEST}/${BACKUP_NAME}" \
    --exclude='node_modules' \
    --exclude='.next' \
    --exclude='dist' \
    --exclude='backups' \
    --exclude='.git' \
    -C "$(dirname ${BACKUP_SOURCE})" \
    "$(basename ${BACKUP_SOURCE})"

# ─── Verify backup ─────────────────────────────────────────
if [ -f "${BACKUP_DEST}/${BACKUP_NAME}" ] && [ -s "${BACKUP_DEST}/${BACKUP_NAME}" ]; then
    BACKUP_SIZE=$(du -h "${BACKUP_DEST}/${BACKUP_NAME}" | cut -f1)
    echo "✅ Project backup created: ${BACKUP_DEST}/${BACKUP_NAME} (${BACKUP_SIZE})"
else
    echo "❌ Project backup failed: file is empty or missing"
    exit 1
fi

# ─── Cleanup old backups ───────────────────────────────────
echo "🧹 Cleaning up project backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DEST}" -name "project-*.tar.gz" -mtime +${RETENTION_DAYS} -delete

# ─── Optional: Upload to remote ────────────────────────────
# Uncomment and configure one of the following:

# # Upload to S3-compatible storage
# if command -v aws &> /dev/null; then
#     echo "☁️  Uploading to S3..."
#     aws s3 cp "${BACKUP_DEST}/${BACKUP_NAME}" s3://your-backup-bucket/tiktok-platform/
# fi

# # Upload via rsync to remote server
# if command -v rsync &> /dev/null; then
#     echo "☁️  Uploading to remote server..."
#     rsync -avz "${BACKUP_DEST}/${BACKUP_NAME}" user@backup-server:/backups/tiktok-platform/
# fi

echo "🎉 Project backup complete!"
