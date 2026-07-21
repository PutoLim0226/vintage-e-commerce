# 🛠️ DevOps 系統維運、備份復原與排錯 SOP 手冊

> **文件版本**：1.0.0 (v1.3.0)  
> **適用環境**：Linux (Ubuntu / Debian), Nginx 1.24+, PHP 8.3-FPM, MySQL 8.0  
> **建立日期**：2026-07-21

---

## 1. 伺服器部署與架構 (Server Architecture)

「復古刻痕」採用前後端分離佈局，靜態前端由 Nginx 處理代理，API 請求轉發至 PHP 8.3-FPM 單一入口：

```text
[ 客戶端 Browser ]
       │
       ▼
[ Nginx (Port 80/443) ]
  ├── 靜態資源 (HTML / SCSS CSS / React JS Bundle) ➔ /var/www/vintage-frontend/dist
  └── /api/* 反向代理 (Reverse Proxy) ➔ 127.0.0.1:8000 (Pure PHP 8.3-FPM)
```

### 一鍵自動部署指令
專案內建伺服器自動初始化與部署腳本：
```bash
rtk bash deploy-server.sh
```

---

## 2. 自動化測試執行 SOP (Automated Testing SOP)

本專案內建零依賴極速測試套件，可在數秒內完成 100% 覆蓋率驗證：

```bash
# 1. 執行全套 API 端點與資產還原整合測試
rtk node tests/run-api-tests.js

# 2. 執行 E2E 關鍵業務閉環測試 (註冊 ➔ 購物 ➔ 付款 ➔ 發貨)
rtk node tests/run-e2e-tests.js
```

---

## 3. 資料庫自動備份與災難復原 (Database Backup & Disaster Recovery)

### 3.1 每日自動備份與 30 天輪轉
腳本位置：`scripts/backup-db.sh`

**設定 Linux Crontab 定時任務** (每天凌晨 03:00 自動執行)：
```bash
crontab -e
# 加入以下設定行：
0 3 * * * /home/linuxuser/vintage-e-commerce/scripts/backup-db.sh >> /home/linuxuser/vintage-e-commerce/backend/storage/logs/backup.log 2>&1
```

### 3.2 一鍵災難復原步驟 (Disaster Recovery SOP)
當伺服器遭遇硬體毀損或資料庫異常時：
```bash
# 1. 解壓縮歷史備份檔
gunzip -c /home/linuxuser/vintage-e-commerce/backend/storage/backups/vintage_ec_YYYYMMDD_HHMMSS.sql.gz > recovery.sql

# 2. 匯入復原至 MySQL 8.0
rtk mysql -u root -p'Putolim@0226' vintage_ec < recovery.sql
```

---

## 4. 常見故障排除清單 (Troubleshooting Checklist)

### 🔴 狀況一：502 Bad Gateway (Nginx 無法與後端連線)
- **原因**：PHP 8.3-FPM 服務停止或連線埠 `8000` 被占用。
- **排除步驟**：
  1. 檢視後端服務狀態：`rtk bash backend/start-dev-tmux.sh status`
  2. 重啟後端服務：`rtk bash backend/start-dev-tmux.sh restart`
  3. 檢查端口佔用：`rtk netstat -tulnp | grep 8000`

### 🔴 狀況二：403 Forbidden 權限拒絕
- **原因**：未登入者嘗試存取 `/api/admin/*` 端點，或 Nginx 目錄權限缺乏 `www-data` 讀取權限。
- **排除步驟**：
  1. 重置權限：`sudo chown -R www-data:www-data /home/linuxuser/vintage-e-commerce/frontend/dist`
  2. 檢查使用者 JWT Token 之 `role` 欄位是否為 `'admin'`。

### 🔴 狀況三：CORS 跨域請求被阻擋
- **原因**：存取來源 Origin 未寫入後端 CORS 白名單。
- **排除步驟**：
  - 後端 `backend/src/Core/App.php` 已具備動態適配傳入 Origin (包含 Tailscale 100.x.x.x 與 GitHub Pages)，請確認 Header 是否包含 `Access-Control-Allow-Origin`。

---

## 5. 互動式 API 文件 (Interactive API Console)

造訪 [src/docs/api_docs.html](file:///home/linuxuser/vintage-e-commerce/src/docs/api_docs.html)，內嵌「Try-It-Out 線上即時測試控制台」，可即時發送測試請求並調試 JSON 回應。
