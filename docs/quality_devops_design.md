# 🧪 系統品質、自動化測試與維運規範 (Quality & DevOps) - 設計規格書

> **文件版本**：1.0.0  
> **建立日期**：2026-07-21  
> **狀態**：已通過 Brainstorming 設計驗證 (Approved)

---

## 1. 需求與範疇總結 (Understanding Summary)

* **建構目標 (What)**：完整打造「復古刻痕」系統品質、自動化測試與維運規範套件：
  1. **API 自動化測試套件 (`tests/run-api-tests.js`)**：一鍵式 CLI 測試腳本，自動涵蓋認證、商品、購物車、點數抵扣、折價券驗證、金流 Webhook 對帳與後台權限/訂單狀態變更之 API 測試。
  2. **前端 E2E 業務流程測試 (`tests/run-e2e-tests.js`)**：自動化驗證「會員註冊 ➔ 購物車 ➔ 結帳付款 ➔ 後台訂單履約」的完整核心業務閉環。
  3. **互動式 API 文件 (`src/docs/api_docs.html`)**：升級全站 API 文件，提供瀏覽器內即時 Try-it-out 發送測試請求與回應檢視功能。
  4. **DevOps 系統維運與排錯手冊 (`docs/devops_ops_guide.md`)**：提供完整伺服器部署解析、Nginx/PHP 8.3-FPM 效能調校、MySQL 自動備份與災難復原腳本 (`scripts/backup-db.sh`)、日誌輪轉 (Log rotation) 與故障排除 SOP。
* **核心約束 (Key Constraints)**：
  * **執行效率**：測試腳本需在一鍵內發動並於數秒內回傳結果。
  * **環境獨立**：完全獨立運行於本地與 Linux 伺服器，免去昂貴外部 SaaS 工具或複雜架構設定。

---

## 2. 決策日誌 (Decision Log)

| 決策項目 | 最終決定 | 曾考慮之替代方案 | 選擇理由 |
| :--- | :--- | :--- | :--- |
| **開發範疇** | 全套測試與維運 SOP | 單一測試或僅撰寫文檔 | 提供商業級全方位軟體品質保護網與運維復原能力。 |
| **測試架構** | 內置零依賴極速測試腳本 | 重型框架 (PHPUnit/Cypress) | 執行速度極快 (1-2 秒)，無龐大依賴相依性與複雜設定。 |
| **API 文件** | 內嵌 Try-it-out 互動客戶端 | Swagger UI / Postman | 保持單一離線 HTML 檔案，零外部 CDN 依賴且質感統一。 |
| **資料庫備份**| Shell Cron 每日備份與 30 天輪轉 | 付款雲端備份 SaaS | 免費、簡潔、高可靠度且復原 SOP 明確。 |

---

## 3. 詳細架構設計 (Specifications)

### 3.1 測試套件設計 (`tests/`)
- `tests/run-api-tests.js`：發送 HTTP 請求驗證狀態碼、JSON 回應欄位、JWT 驗證與資料庫狀態。
- `tests/run-e2e-tests.js`：執行完整業務流程閉環驗證。

### 3.2 互動 API 文件設計 (`src/docs/api_docs.html`)
- 新增即時測試控制台：Bearer Token 輸入、Endpoint 下拉、JSON Body 編輯器與 Response 檢視器。

### 3.3 DevOps 與資料庫備份設計 (`docs/devops_ops_guide.md` & `scripts/backup-db.sh`)
- 提供 `scripts/backup-db.sh` 備份腳本。
- 提供 `docs/devops_ops_guide.md` 包含部署、Nginx/PHP-FPM 配置、排錯清單與備份還原流程。
