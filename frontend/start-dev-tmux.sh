#!/usr/bin/env bash
# ============================================================
# 在獨立背景 Tmux Session 中啟動 Vite 前端開發伺服器
# 用法: bash frontend/start-dev-tmux.sh [start|stop|restart|status]
# ============================================================

SESSION_NAME="vintage-frontend"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

action="${1:-start}"

stop_session() {
  if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
    echo "⏹  正在停止前端 Tmux Session: $SESSION_NAME..."
    tmux kill-session -t "$SESSION_NAME"
  else
    echo "ℹ  前端 Tmux Session $SESSION_NAME 並未運行。"
  fi
}

start_session() {
  if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
    echo "⚠️  前端 Tmux Session $SESSION_NAME 已經在運行中。"
    echo "   使用 'bash frontend/start-dev-tmux.sh restart' 來重啟。"
    return
  fi

  echo "🚀 正在獨立 Tmux Session 中啟動前端..."
  tmux new-session -d -s "$SESSION_NAME" -c "$FRONTEND_DIR"
  # 發送啟動命令至 tmux session
  tmux send-keys -t "$SESSION_NAME" "npm run dev" C-m

  echo "✅ 已成功在背景啟動！"
  echo "   - 查看日誌/互動: tmux attach -t $SESSION_NAME"
  echo "   - 從 Session 返回: 按 Ctrl + B 然後按 D"
}

show_status() {
  if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
    echo "🟢 前端狀態: 運行中 (Tmux Session: $SESSION_NAME)"
  else
    echo "🔴 前端狀態: 未運行"
  fi
}

case "$action" in
  start)
    start_session
    ;;
  stop)
    stop_session
    ;;
  restart)
    stop_session
    sleep 1
    start_session
    ;;
  status)
    show_status
    ;;
  *)
    echo "用法: $0 {start|stop|restart|status}"
    exit 1
    ;;
esac
