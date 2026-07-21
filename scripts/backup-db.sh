#!/usr/bin/env bash
# ============================================================
# scripts/backup-db.sh
# 🗄️ MySQL 資料庫自動化備份與 30 天輪轉清理腳本
# ============================================================

set -e

DB_HOST="${DB_HOST:-127.0.0.1}"
DB_USER="${DB_USER:-root}"
DB_PASS="${DB_PASS:-Putolim@0226}"
DB_NAME="${DB_NAME:-vintage_ec}"

BACKUP_DIR="${BACKUP_DIR:-/home/linuxuser/vintage-e-commerce/backend/storage/backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.sql.gz"

echo "[$(date)] 🚀 開始發動【${DB_NAME}】資料庫自動化備份作業..."
mkdir -p "${BACKUP_DIR}"

# 執行 mysqldump 並進行 gzip 壓縮
mysqldump -h "${DB_HOST}" -u "${DB_USER}" -p"${DB_PASS}" --single-transaction --quick "${DB_NAME}" | gzip > "${BACKUP_FILE}"

echo "[$(date)] ✅ 備份完成！備份檔案: ${BACKUP_FILE} (檔案大小: $(du -h "${BACKUP_FILE}" | cut -f1))"

# 自動清除過期（超過 30 天）之歷史備份檔
echo "[$(date)] 🧹 執行 30 天歷史備份檔案輪轉清理..."
find "${BACKUP_DIR}" -name "${DB_NAME}_*.sql.gz" -mtime +30 -exec rm -f {} \;

echo "[$(date)] 🏁 備份與輪轉維護流程執行成功！"
