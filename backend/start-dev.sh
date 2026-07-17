#!/usr/bin/env bash
# ============================================================
# 啟動 PHP 後端開發伺服器 (port 8000)
# 用法: bash backend/start-dev.sh
# ============================================================

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
LOG_FILE="/tmp/vintage-ec-backend.log"
PID_FILE="/tmp/vintage-ec-backend.pid"

# 若已有舊 process，先停掉
if [ -f "$PID_FILE" ]; then
  OLD_PID=$(cat "$PID_FILE")
  if kill -0 "$OLD_PID" 2>/dev/null; then
    echo "⏹  停止舊後端 process (PID: $OLD_PID)..."
    kill "$OLD_PID"
    sleep 1
  fi
  rm -f "$PID_FILE"
fi

echo "🚀 啟動 PHP 後端..."
echo "   目錄: $BACKEND_DIR/public"
echo "   監聽: http://127.0.0.1:8000"
echo "   日誌: $LOG_FILE"

php -S 127.0.0.1:8000 \
  -t "$BACKEND_DIR/public" \
  "$BACKEND_DIR/public/index.php" \
  >> "$LOG_FILE" 2>&1 &

BACKEND_PID=$!
echo "$BACKEND_PID" > "$PID_FILE"

sleep 1

if kill -0 "$BACKEND_PID" 2>/dev/null; then
  echo "✅ 後端已啟動 (PID: $BACKEND_PID)"
  echo "   停止: kill \$(cat $PID_FILE)"
else
  echo "❌ 啟動失敗，請查看日誌："
  cat "$LOG_FILE"
  exit 1
fi
