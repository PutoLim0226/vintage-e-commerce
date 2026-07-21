# 🧥 復古刻痕 - 全端電商平台 (Vintage E-Commerce)
> **Version: 1.3.3**

這是一個從零到完整上線的電商作品，專注於復古服飾零售。**本專案最大的特色在於「零 UI 框架依賴」** — 所有視覺效果皆由底層 SCSS 手刻打造，前端採用 React + Vite，後端使用純 PHP 自製 RESTful API，完整實現電商進銷存、金物流串接與會員行銷系統。

---

## 🔑 預設測試帳號 (Default Test Credentials)

您可以直接使用以下預設帳號進行前台購物流程與後台管理功能的測試：

| 帳號類型 | 電子郵件 (Email) | 密碼 (Password) | 角色 (Role) | 預設權限與狀態 |
| :--- | :--- | :--- | :--- | :--- |
| **🛡️ 系統管理員** | `admin@vintage.com` | `admin123` | `admin` | 最高管理權限，可存取 `/admin/*` 後台營收儀表板、商品 SKU 管理、訂單履約發貨與折價券開關。 |
| **👤 測試一般會員** | `user@vintage.com` | `admin123` | `customer` | 一般會員權限，擁有 100 點紅利點數，可體驗購物車、折價券折抵、結帳付款與評價功能。 |

---

### 🌟 新增特色亮點
- **後台管理系統完整化 (Admin Backoffice Expansion)**：
  - **營收統計儀表板 (Dashboard)**：純 SVG 渲染無框架動態營收趨勢圖、KPI指標卡片（總營收、客單價、會員數）、熱銷商品 Top 5 與低庫存 (Stock &le; 5) 警示。
  - **訂單與履約出貨管理 (Order Fulfillment)**：支援狀態切換頁籤與多條件關鍵字搜尋、彈窗檢視詳細商品與收件地址、填寫物流承運商與追蹤單號。訂單取消時觸發 DB Transaction 自動還原 SKU 庫存與退還會員紅利點數。
  - **折價券促銷管理 (Coupon Management)**：提供折價券清單、一鍵啟停開關 (Toggle Switch)、新增與編輯彈窗。
- **系統品質、自動化測試與 DevOps 規範 (Quality & DevOps)**：
  - **極速 API 測試套件 (`tests/run-api-tests.js`)**：1 秒發動 100% 端點斷言測試，自動涵蓋 Auth、購物車、折價券門檻、訂單建立、Webhook 對帳與 Admin 防護機制。
  - **E2E 關鍵業務閉環測試 (`tests/run-e2e-tests.js`)**：自動化驗證「註冊 ➔ 選購 ➔ 購物車 ➔ 結帳 ➔ 付款對帳 ➔ 管理員履約出貨」業務閉環。
  - **互動式 API 文件 (Try-It-Out Console)**：`src/docs/api_docs.html` 內嵌原生 JavaScript Fetch 控制台。
  - **自動化 MySQL 備份與維運手冊**：`scripts/backup-db.sh` 支援 30 天歷史備份輪轉清理，附帶 `docs/devops_ops_guide.md` 排錯 SOP 與災難還原指引。

## 🛠 技術棧 (Tech Stack)

| 分層 | 使用技術 | 備註 |
| :--- | :--- | :--- |
| **前端框架** | React 18 + Vite | 極速開發與 HMR 熱更新 |
| **樣式系統** | **自製 SCSS (7-1 模組化架構)** | **✅ 零 UI 框架依賴** (無 Bootstrap / Tailwind / MUI) |
| **前端狀態管理** | React Context | 自製輕量購物車與用戶狀態管理 |
| **後端 API** | Pure PHP 8.3 (RESTful API) | **✅ 無框架** (自製 Router 與 Middleware) |
| **自動化測試** | Native Node.js Test Runner | 極速 CLI 自動化整合與 E2E 測試 |
| **資料庫** | MySQL 8.0 | 使用 PDO 預處理語句防範 SQL 注入 |
| **身分驗證** | JWT (Access Token + Refresh Token) | 雙 Token 輪轉機制提升安全性 |
| **部署自動化** | GitHub Actions + GitHub Pages | 前端靜態資源自動打包部署 |

---

## 🚀 快速啟動與開發指南 (隔離背景服務)

本專案提供基於 **Tmux** 的背景隔離啟動腳本，即使關閉當前終端機視窗，服務也將持續在獨立會話中運行。

### 一鍵背景啟動
```bash
# 啟動後端 (127.0.0.1:8000)
rtk bash backend/start-dev-tmux.sh start

# 啟動前端 (localhost:5173)
rtk bash frontend/start-dev-tmux.sh start
```

### 一鍵自動測試
```bash
# 執行 API 自動化測試套件
rtk node tests/run-api-tests.js

# 執行 E2E 端到端業務閉環測試
rtk node tests/run-e2e-tests.js
```

---

## 📝 更新日誌 (Changelog)

1.3.3 — 2026-07-22
fix(cart): 修正加入購物車時因 X-Cart-Token 缺失導致 SQLSTATE[23000] Column cart_id cannot be null 異常，實作前後端雙重防呆容錯保護。

1.3.2 — 2026-07-21
fix(ui & category): 修正後台訂單操作按鈕文字對比度與 Modal 畫面置中定位，並修正父分類 (如男裝、配件) 自動涵蓋子分類商品查詢。

1.3.1 — 2026-07-21
docs(credentials): 在 README 明確列出管理員與測試會員之預設登入帳號密碼對，方便測試驗證。

1.3.0 — 2026-07-21
feat(testing & devops): 補齊自動化測試套件、Try-It-Out API 互動文檔與 DevOps 維運備份手冊。

1.2.0 — 2026-07-21
feat(admin): 後台管理系統完整化 (營收統計儀表板, 訂單履約與出貨管理, 折價券管理系統)。

1.1.1 — 2026-07-20
ops(deploy): 新增伺服器一鍵自動部署腳本 `deploy-server.sh`。

1.0.0 — 2026-07-17
init: 初始版本。
