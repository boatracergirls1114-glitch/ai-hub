#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/opt/ai-hub"
LOCAL_BACKUP_DIR="${APP_DIR}/backups"
NAS_BACKUP_DIR="/mnt/aihub-nas-backup"

DATE=$(date +"%Y%m%d-%H%M%S")
NAME="ai-hub-v1.1.2-backup-${DATE}"

mkdir -p "$LOCAL_BACKUP_DIR"

echo "======================================"
echo " AI Hub v1.1.2 Backup Edition"
echo " Backup name: $NAME"
echo "======================================"

echo "[1/5] Checking app directory..."
if [ ! -d "$APP_DIR" ]; then
  echo "ERROR: APP_DIR not found: $APP_DIR"
  exit 1
fi

echo "[2/5] Backing up AI Hub files..."
tar --exclude="$APP_DIR/backups"     --exclude="$APP_DIR/node_modules"     --exclude="$APP_DIR/frontend/node_modules"     --exclude="$APP_DIR/backend/node_modules"     -czf "$LOCAL_BACKUP_DIR/${NAME}-files.tar.gz"     -C /opt ai-hub

echo "[3/5] Backing up PostgreSQL database..."
if docker ps --format '{{.Names}}' | grep -q '^ai-hub-postgres$'; then
  docker exec ai-hub-postgres pg_dump -U aihub aihub > "$LOCAL_BACKUP_DIR/${NAME}-db.sql"
else
  echo "WARNING: ai-hub-postgres container not found. Skipping DB dump."
  echo "-- DB dump skipped: ai-hub-postgres not running" > "$LOCAL_BACKUP_DIR/${NAME}-db.sql"
fi

echo "[4/5] Creating restore memo..."
cat > "$LOCAL_BACKUP_DIR/${NAME}-restore.txt" <<RESTORE
AI Hub v1.1.2 Backup Edition Restore Memo

Backup:
${NAME}

Files:
${NAME}-files.tar.gz

Database:
${NAME}-db.sql

Restore example:

1. Stop AI Hub

cd /opt/ai-hub
docker compose down

2. Restore files

cd /opt
tar -xzf ${NAME}-files.tar.gz

3. Start database

cd /opt/ai-hub
docker compose up -d postgres

4. Restore database

cat ${NAME}-db.sql | docker exec -i ai-hub-postgres psql -U aihub aihub

5. Start all services

docker compose up -d

6. Health check

curl http://localhost/api/health
RESTORE

echo "[5/5] Copying to NAS if available..."
if [ -d "$NAS_BACKUP_DIR" ] && [ -w "$NAS_BACKUP_DIR" ]; then
  cp "$LOCAL_BACKUP_DIR/${NAME}-files.tar.gz" "$NAS_BACKUP_DIR/"
  cp "$LOCAL_BACKUP_DIR/${NAME}-db.sql" "$NAS_BACKUP_DIR/"
  cp "$LOCAL_BACKUP_DIR/${NAME}-restore.txt" "$NAS_BACKUP_DIR/"
  echo "NAS backup complete: $NAS_BACKUP_DIR"
else
  echo "NAS backup directory not writable or not found: $NAS_BACKUP_DIR"
  echo "Local backup only: $LOCAL_BACKUP_DIR"
fi

echo ""
echo "Backup complete."
echo "Local:"
ls -lh "$LOCAL_BACKUP_DIR" | tail -10

if [ -d "$NAS_BACKUP_DIR" ]; then
  echo ""
  echo "NAS:"
  ls -lh "$NAS_BACKUP_DIR" | tail -10
fi
