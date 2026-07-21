# ⚙️ 復古刻痕 - 後端 API 系統 (Backend API)
> **Version: 1.3.0**

本目錄為「復古刻痕」電商的後端 API 系統。採用 **無框架 PHP 8.3** 開發，自製物件導向的 MVC 設計、RESTful 路由分發器與中間件 (Middleware) 機制，確保最高運作效率。

---

## 🛠 後端核心技術

- **自製 Router**：支援動態 URL 參數解析（如 `/api/products/{slug}`）與 HTTP 方法限制。
- **JWT 身分驗證中間件**：
  - 阻擋未授權請求保護敏感端點（如結帳與會員資料）。
  - 對管理端 API 實施角色權限校驗（`AdminMiddleware`）。
- **自動化測試與備份**：內置 `tests/run-api-tests.js` 1 秒極速測試套件與 `scripts/backup-db.sh` 每日 MySQL 備份清理腳本。

---

## 📝 更新日誌 (Changelog)

1.3.0 — 2026-07-21
feat(testing & devops): 補齊 API 自動化整合測試套件、Try-It-Out 互動式 API 文件與 MySQL 自動化備份腳本。
- 新增 `tests/run-api-tests.js` API 自動化測試套件（通過率 100%）。
- 升級 `CartController.php` 與 `OrderController.php` 支援訪客購物車與會員 Token 無縫關聯。
- 新增 MySQL 自動化備份與 30 天清理腳本 `scripts/backup-db.sh`。

1.2.0 — 2026-07-21
feat(admin): 後台 API 系統完整化。

1.1.1 — 2026-07-20
ops(deploy): 新增伺服器一鍵自動部署腳本 `deploy-server.sh`。

1.0.0 — 2026-07-17
init: 初始版本。
