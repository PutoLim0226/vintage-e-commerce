# 🧥 復古刻痕 - 全端電商平台 (Vintage E-Commerce)
> **Version: 1.3.0**

這是一個從零到完整上線的電商作品，專注於復古服飾零售。**本專案最大的特色在於「零 UI 框架依賴」** — 所有視覺效果皆由底層 SCSS 手刻打造，前端採用 React + Vite，後端使用純 PHP 自製 RESTful API，完整實現電商進銷存、金物流串接與會員行銷系統。

---

### 🌟 新增特色亮點
- **系統品質、自動化測試與 DevOps 規範 (Quality & DevOps)**：
  - **極速 API 測試套件 (`tests/run-api-tests.js`)**：1 秒發動 100% 端點斷言測試，自動涵蓋 Auth、購物車、折價券門檻、訂單建立、Webhook 對帳與 Admin 防護機制。
  - **E2E 關鍵業務閉環測試 (`tests/run-e2e-tests.js`)**：自動化驗證「註冊 ➔ 選購 ➔ 購物車 ➔ 結帳 ➔ 付款對帳 ➔ 管理員履約出貨」業務閉環。
  - **互動式 API 文件 (Try-It-Out Console)**：`src/docs/api_docs.html` 內嵌原生 JavaScript Fetch 控制台，可於瀏覽器線上發送 API 測試請求。
  - **自動化 MySQL 備份與維運手冊**：`scripts/backup-db.sh` 支援 30 天歷史備份輪轉清理，附帶 `docs/devops_ops_guide.md` 排錯 SOP 與災難還原指引。
- **後台管理系統完整化 (Admin Backoffice Expansion)**：
  - **營收統計儀表板 (Dashboard)**：純 SVG 渲染無框架動態營收趨勢圖、KPI指標卡片（總營收、客單價、會員數）、熱銷商品 Top 5 與低庫存 (Stock &le; 5) 警示。
  - **訂單與履約出貨管理 (Order Fulfillment)**：支援狀態切換頁籤與多條件關鍵字搜尋、彈窗檢視詳細商品與收件地址、填寫物流承運商與追蹤單號。訂單取消時觸發 DB Transaction 自動還原 SKU 庫存與退還會員紅利點數。
  - **折價券促銷管理 (Coupon Management)**：提供折價券清單、一鍵啟停開關 (Toggle Switch)、新增與編輯彈窗。
- **折價券即時折抵**：結帳頁支持即時 API 驗證折價券，無感套用並即時在畫面上更新小計與總額。
- **顧客真實評價與星級系統**：歷史訂單中購買過的商品支持 1-5 星評價與文字心得，商品詳情頁動態呈現星級評分與用戶去識別化評價牆。
- **會員紅利點數 (Points) 抵扣**：消費回饋 1% 紅利點數，結帳時可即時勾選「以點數折抵現金」，後端自動校驗扣減並記錄於點數日誌。
- **自製金流模擬 Sandbox 頁面與 Webhook 異步對帳**：提供擬真擬信用卡 3D 安全授權付款介面，交易成功後觸發後端異步 Webhook 對帳機制。

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

### 一鍵自動測試
```bash
# 執行 API 自動化測試套件
rtk node tests/run-api-tests.js

# 執行 E2E 端到端業務閉環測試
rtk node tests/run-e2e-tests.js
```

### 服務控制指令
- **查看狀態**：`bash backend/start-dev-tmux.sh status` 或 `bash frontend/start-dev-tmux.sh status`
- **重啟服務**：`bash backend/start-dev-tmux.sh restart`
- **停止服務**：`bash backend/start-dev-tmux.sh stop`

---

## 📂 專案目錄結構

```text
vintage-e-commerce/
├── backend/                   # PHP 自製後端 API 系統
├── docs/                      # 系統架構與設計規格文件
│   ├── admin_expansion_design.md
│   ├── quality_devops_design.md
│   └── devops_ops_guide.md    # 系統維運、自動化備份與排錯手冊
├── frontend/                  # React + Vite 前端 SPA
├── scripts/                   # 系統維運工具腳本
│   └── backup-db.sh           # MySQL 自動化備份與 30 天輪轉
├── src/docs/
│   └── api_docs.html          # 互動式 Try-It-Out API 測試文檔
├── tests/                     # 自動化測試套件
│   ├── run-api-tests.js       # API 整合測試腳本
│   └── run-e2e-tests.js       # E2E 關鍵流程測試腳本
└── README.md                  # 專案總說明文件 (本檔案)
```

---

## 📄 各模組詳細說明
- **前端詳情與樣式系統**：請參閱 [frontend/README.md](file:///home/linuxuser/vintage-e-commerce/frontend/README.md)
- **後端架構與 API 接口**：請參閱 [backend/README.md](file:///home/linuxuser/vintage-e-commerce/backend/README.md)
- **系統品質與 DevOps 規範**：請參閱 [docs/devops_ops_guide.md](file:///home/linuxuser/vintage-e-commerce/docs/devops_ops_guide.md)

---

## 📝 更新日誌 (Changelog)

1.3.0 — 2026-07-21
feat(testing & devops): 補齊自動化測試套件、Try-It-Out API 互動文檔與 DevOps 維運備份手冊。
- 新增 API 整合測試套件 `tests/run-api-tests.js` (10/10 測試全數通過) 與 E2E 業務流程測試 `tests/run-e2e-tests.js`。
- 升級 `src/docs/api_docs.html` 內嵌原生 JavaScript 互動式 Fetch API 控制台。
- 新增 MySQL 自動化每日備份與 30 天輪轉清理腳本 `scripts/backup-db.sh`。
- 新增 DevOps 系統維運、自動化備份與排錯手冊 `docs/devops_ops_guide.md` 與規格書 `docs/quality_devops_design.md`。

1.2.0 — 2026-07-21
feat(admin): 後台管理系統完整化 (營收統計儀表板, 訂單履約與出貨管理, 折價券管理系統)。

1.1.1 — 2026-07-20
ops(deploy): 新增伺服器一鍵自動部署腳本 `deploy-server.sh`。

1.1.0 — 2026-07-20
ux(notice): 增加 API 連線防呆全域提示 Banner。

1.0.0 — 2026-07-17
init: 初始版本。
