# 🧥 復古刻痕 - 全端電商平台 (Vintage E-Commerce)
> **Version: 1.2.0**

這是一個從零到完整上線的電商作品，專注於復古服飾零售。**本專案最大的特色在於「零 UI 框架依賴」** — 所有視覺效果皆由底層 SCSS 手刻打造，前端採用 React + Vite，後端使用純 PHP 自製 RESTful API，完整實現電商進銷存、金物流串接與會員行銷系統。

---

### 🌟 新增特色亮點
- **後台管理系統完整化 (Admin Backoffice Expansion)**：
  - **營收統計儀表板 (Dashboard)**：純 SVG 渲染無框架動態營收趨勢圖、KPI指標卡片（總營收、客單價、會員數）、熱銷商品 Top 5 與低庫存 (Stock &le; 5) 警示。
  - **訂單與履約出貨管理 (Order Fulfillment)**：支援狀態切換頁籤與多條件關鍵字搜尋、彈窗檢視詳細商品與收件地址、填寫物流承運商與追蹤單號。訂單取消時觸發 DB Transaction 自動還原 SKU 庫存與退還會員紅利點數。
  - **折價券促銷管理 (Coupon Management)**：提供折價券清單、一鍵啟停開關 (Toggle Switch)、新增與編輯彈窗（可設定折扣數值、百分比/固定金額、最低滿額門檻、有效期限與使用次數上限）。
- **折價券即時折抵**：結帳頁支持即時 API 驗證折價券，無感套用並即時在畫面上更新小計與總額。
- **人氣與評分自動排序**：商品預設依「平均評分」及「點擊數」進行加權熱度排序，並在詳情頁自動累加點擊量。
- **顧客真實評價與星級系統**：歷史訂單中購買過的商品支持 1-5 星評價與文字心得，商品詳情頁動態呈現星級評分與用戶去識別化評價牆。
- **會員紅利點數 (Points) 抵扣**：消費回饋 1% 紅利點數，結帳時可即時勾選「以點數折抵現金」，後端自動校驗扣減並記錄於點數日誌。
- **後台商品與多規格 SKU 管理**：管理後台可直接進行商品的新增、編輯與刪除。支持多維度 SKU（顏色／尺寸／庫存／獨立售價）動態行數編輯與自動安全更新機制。
- **自製金流模擬 Sandbox 頁面與 Webhook 異步對帳**：提供擬真擬信用卡 3D 安全授權付款介面，交易成功後觸發後端異步 Webhook 對帳機制，自動化完成付款對賬與訂單狀態變更。

## 🛠 技術棧 (Tech Stack)

| 分層 | 使用技術 | 備註 |
| :--- | :--- | :--- |
| **前端框架** | React 18 + Vite | 極速開發與 HMR 熱更新 |
| **樣式系統** | **自製 SCSS (7-1 模組化架構)** | **✅ 零 UI 框架依賴** (無 Bootstrap / Tailwind / MUI) |
| **前端狀態管理** | React Context | 自製輕量購物車與用戶狀態管理 |
| **後端 API** | Pure PHP 8.3 (RESTful API) | **✅ 無框架** (自製 Router 與 Middleware) |
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

### 服務控制指令
- **查看狀態**：`bash backend/start-dev-tmux.sh status` 或 `bash frontend/start-dev-tmux.sh status`
- **重啟服務**：`bash backend/start-dev-tmux.sh restart`
- **停止服務**：`bash backend/start-dev-tmux.sh stop`
- **進入服務視窗 (查看輸出 log)**：
  - 後端：`tmux attach -t vintage-backend`
  - 前端：`tmux attach -t vintage-frontend`
  *提示：進入後若想退回原終端，按 `Ctrl + B` 接著按 `D` 即可。*

---

## 📂 專案目錄結構

```text
vintage-e-commerce/
├── backend/                   # PHP 自製後端 API 系統
│   ├── database/              # SQL 綱要與種子資料
│   ├── public/                # 單一入口 index.php
│   └── src/                   # 核心 MVC 控制器、路由與中間件
├── docs/                      # 系統架構與設計規格文件
│   └── admin_expansion_design.md
├── frontend/                  # React + Vite 前端 SPA
│   ├── src/
│   │   ├── api/               # Axios 客戶端與攔截器設定
│   │   ├── assets/scss/       # 自製 7-1 SCSS 樣式系統
│   │   ├── components/        # 共用元件 (Header, Footer, Layout 等)
│   │   └── pages/             # 頁面元件 (首頁, 商品, 購物車, 會員, 後台)
└── README.md                  # 專案總說明文件 (本檔案)
```

---

## 📄 各模組詳細說明
- **前端詳情與樣式系統**：請參閱 [frontend/README.md](file:///home/linuxuser/vintage-e-commerce/frontend/README.md)
- **後端架構與 API 接口**：請參閱 [backend/README.md](file:///home/linuxuser/vintage-e-commerce/backend/README.md)
- **後台完整化設計文檔**：請參閱 [docs/admin_expansion_design.md](file:///home/linuxuser/vintage-e-commerce/docs/admin_expansion_design.md)

---

## 📝 更新日誌 (Changelog)

1.2.0 — 2026-07-21
feat(admin): 後台管理系統完整化 (營收統計儀表板, 訂單履約與出貨管理, 折價券管理系統)。
- 前端新增 `AdminLayout.jsx` 統一子路由外框、`AdminDashboardPage.jsx` (含動態 SVG 圖表、KPI指標與低庫存警示)、`AdminOrdersPage.jsx` (含搜尋篩選、彈窗履約出貨與物流單號填寫)、`AdminCouponsPage.jsx` (含一鍵開關、新增編輯折價券)。
- 後端升級 `AdminDashboardController.php` 支援動態區間趨勢與庫存預警、升級 `AdminOrderController.php` 支援搜尋與訂單取消 DB Transaction 自動還原庫存與紅利點數、新增 `AdminCouponController.php` 提供折價券 CRUD API。
- 專案新增架構與設計規範 `docs/admin_expansion_design.md` 與 `src/docs/api_docs.html`。

1.1.1 — 2026-07-20
ops(deploy): 新增伺服器一鍵自動部署腳本 `deploy-server.sh`。

1.1.0 — 2026-07-20
ux(notice): 增加 API 連線防呆全域提示 Banner，優化 GitHub Pages 獨立運行體驗。

1.0.9 — 2026-07-20
style(favicon): 替換預設圖示，客製化復古黃金衣架品牌 SVG Favicon。

1.0.8 — 2026-07-20
feat(tailscale): 支援 Tailscale 內網 IP / 域名動態連線與無感跨域配置。

1.0.7 — 2026-07-19
fix(cors): 修復部署在 GitHub Pages 時跨域請求 (CORS) 拒絕及 API 位址錯誤。

1.0.6 — 2026-07-19
feat(payment): 實作自製金流模擬 Sandbox 頁面與 Webhook 異步對帳。

1.0.5 — 2026-07-19
feat(admin): 升級後台商品與多規格 SKU 管理。

1.0.4 — 2026-07-19
feat(points): 實作會員紅利點數 (Points) 結帳折抵。

1.0.3 — 2026-07-19
feat(reviews): 實作商品評價與星級系統（Reviews）及熱度排序。

1.0.2 — 2026-07-19
feat(navigation): 修復 Header 搜尋框與 ProductListPage URL 同步及清除按鈕。

1.0.1 — 2026-07-18
feat(coupon): 實作折價券 (Coupon) 前台即時折抵與結帳扣除。

1.0.0 — 2026-07-17
init: 初始版本。
