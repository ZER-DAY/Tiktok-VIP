#!/bin/bash
set -euo pipefail

# ─── TikTok Intelligence Platform — Monitoring Script ──────
# Run via cron: */5 * * * * /var/www/tiktok-platform/scripts/monitor.sh

APP_URL="http://localhost:3000"
LOG_FILE="/var/log/tiktok-platform/monitor.log"
ALERT_EMAIL=""  # Set your email for alerts

mkdir -p "$(dirname ${LOG_FILE})"

timestamp() {
    date "+%Y-%m-%d %H:%M:%S"
}

log() {
    echo "[$(timestamp)] $1" | tee -a "${LOG_FILE}"
}

alert() {
    local message="$1"
    log "🚨 ALERT: ${message}"
    # Send email alert (requires mailutils)
    # if [ -n "${ALERT_EMAIL}" ]; then
    #     echo "${message}" | mail -s "TikTok Platform Alert" "${ALERT_EMAIL}"
    # fi
}

# ─── Health Check ──────────────────────────────────────────
log "🔍 Running health check..."

HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "${APP_URL}/api/health" || echo "000")

if [ "${HEALTH_RESPONSE}" = "000" ]; then
    alert "Application is unreachable (connection failed)"
    exit 1
fi

if [ "${HEALTH_RESPONSE}" != "200" ]; then
    alert "Health check returned HTTP ${HEALTH_RESPONSE}"
fi

# ─── Detailed Health Check ─────────────────────────────────
HEALTH_DATA=$(curl -s --max-time 10 "${APP_URL}/api/health" || echo "{}")

DB_STATUS=$(echo "${HEALTH_DATA}" | grep -o '"database":"[^"]*"' | cut -d'"' -f4 || echo "unknown")
REDIS_STATUS=$(echo "${HEALTH_DATA}" | grep -o '"redis":"[^"]*"' | cut -d'"' -f4 || echo "unknown")

if [ "${DB_STATUS}" != "connected" ]; then
    alert "Database is ${DB_STATUS}"
fi

if [ "${REDIS_STATUS}" != "connected" ]; then
    alert "Redis is ${REDIS_STATUS}"
fi

# ─── Response Time Check ───────────────────────────────────
RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" --max-time 10 "${APP_URL}/api/health" || echo "999")

if (( $(echo "${RESPONSE_TIME} > 5.0" | bc -l) )); then
    alert "Response time is too slow: ${RESPONSE_TIME}s"
fi

# ─── Disk Space Check ─────────────────────────────────────
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | tr -d '%')
if [ "${DISK_USAGE}" -gt 85 ]; then
    alert "Disk usage is at ${DISK_USAGE}%"
fi

# ─── Docker Container Check ────────────────────────────────
if command -v docker &> /dev/null; then
    UNHEALTHY=$(docker ps --filter "health=unhealthy" --format "{{.Names}}" 2>/dev/null || true)
    if [ -n "${UNHEALTHY}" ]; then
        alert "Unhealthy containers: ${UNHEALTHY}"
    fi
fi

# ─── Log Rotation ──────────────────────────────────────────
if [ -f "${LOG_FILE}" ]; then
    LOG_SIZE=$(du -m "${LOG_FILE}" | cut -f1)
    if [ "${LOG_SIZE}" -gt 100 ]; then
        mv "${LOG_FILE}" "${LOG_FILE}.old"
        log "Log file rotated"
    fi
fi

log "✅ Health check passed (DB: ${DB_STATUS}, Redis: ${REDIS_STATUS}, Time: ${RESPONSE_TIME}s)"
