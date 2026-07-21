# 🎨 復古刻痕 - 前端系統 (Frontend SPA)
> **Version: 1.2.0**

本目錄包含「復古刻痕」電商的前端 Single Page Application (SPA)。全站採用 React 18 搭配 Vite 構建，最大特色為**零 UI 庫依賴**，以底層 SCSS 與設計標記 (Design Tokens) 進行排版與精緻的微交互動畫。

---

## 🛠 技術與架構亮點

- **路由管理**：採用 `react-router-dom` v6/7，支援巢狀路由 (Nested Routes)，並實作 `<ProtectedRoute />` 確保會員結帳與中心安全。
- **樣式系統**：手寫 SCSS，採 **7-1 模組化設計模式** (Abstracts, Base, Components, Layout, Pages)，具備極佳的可維護性。
- **狀態管理**：
  - `AuthContext`：管理使用者 JWT 登入狀態、角色權限（普通用戶、管理員）。
  - `CartContext`：跨頁面即時同步購物車、客製化側欄購物車抽屜。
- **網路請求攔截器 (Token Rotation)**：
  - Axios 自定義攔截器，在 token 到期 (401) 時自動調用 `/api/auth/refresh`。
  - 自動同步存取憑證，無感為用戶續期。
  - 對未登入用戶自動注入 `X-Cart-Token`，實現遊客購物車。

---

## 📂 7-1 SCSS 樣式架構

我們在 `src/assets/scss` 下實作了模組化樣式設計：
- **`abstracts/`**：定義顏色色票 (Gold, Copper, Dark)、字體、間距 token 與 RWD 斷點 Mixins。
- **`base/`**：自製 CSS Reset 與排版字體定義。
- **`components/`**：按鈕 (`_button.scss`)、卡片 (`_product-card.scss`)、抽屜 (`_modal.scss`) 等高重用性元件。
- **`layout/`**：網格系統、Header 與 Footer 佈局。
- **`pages/`**：首頁、商品詳情、結帳與後台管理專屬樣式 (`_admin.scss`)。

### 樣式編譯命令
```bash
rtk npx sass src/assets/scss/main.scss src/assets/css/main.css --style=compressed
```

---

## 🖥 頁面功能清單

1. **首頁 (`HomePage.jsx`)**：精緻 Hero 區塊、新品推薦、促銷推廣與品牌理念。
2. **商品列表 (`ProductListPage.jsx`)**：具備左側分類篩選、價格排序、即時關鍵字搜尋與分頁載入。
3. **商品詳情 (`ProductDetailPage.jsx`)**：規格選擇器（顏色/尺寸）、動態庫存校驗、主圖/多視角輪播。
4. **購物車頁面 (`CartPage.jsx`)**：數量增減控制、移除品項、即時計算金額小計與免運額度提示。
5. **結帳與訂單 (`CheckoutPage.jsx` & `OrdersPage.jsx`)**：折價券套用、寄送資訊表單、歷史訂單追蹤與付款狀態。
6. **後台管理 (`/admin/*`)**：
   - 獨立的 `AdminLayout` 佈局與管理員角色守衛 (Admin Guard)。
   - **總覽儀表板 (`AdminDashboardPage.jsx`)**：純 SVG 渲染動態營收趨勢圖、KPI指標與低庫存警示。
   - **商品與 SKU 管理 (`AdminProductsPage.jsx`)**：支持商品列表、SKU表格動態編輯與即時上/下架狀態切換。
   - **訂單與履約管理 (`AdminOrdersPage.jsx`)**：快速關鍵字搜尋與狀態篩選、彈窗明細與物流追蹤單號填寫（支援訂單取消庫存與點數自動退還）。
   - **折價券促銷管理 (`AdminCouponsPage.jsx`)**：折價券列表、一鍵啟停開關與新增/編輯彈窗。

---

## 📦 本地開發與背景守護

### 1. 標準背景啟動 (推薦，防斷線)
使用內建的 Tmux 背景腳本，使服務運行在獨立 session，不受終端視窗關閉影響：
```bash
# 啟動前端 (Vite)
rtk bash start-dev-tmux.sh start

# 停止前端
rtk bash start-dev-tmux.sh stop

# 重啟前端
rtk bash start-dev-tmux.sh restart

# 查看輸出日誌與互動
tmux attach -t vintage-frontend
# (離開請按 Ctrl+B 接著按 D)
```

### 2. 一般啟動
```bash
# 安裝前端依賴
rtk npm install

# 前台啟動 Vite 開發伺服器
rtk npm run dev

# 專案打包
rtk npm run build
```

---

## 📝 更新日誌 (Changelog)

1.2.0 — 2026-07-21
feat(admin): 後台管理系統完整化 (營收統計儀表板, 訂單履約與出貨管理, 折價券管理系統)。
- 前端新增 `AdminLayout.jsx` 統一子路由外框、`AdminDashboardPage.jsx` (含動態 SVG 圖表、KPI指標與低庫存警示)、`AdminOrdersPage.jsx` (含搜尋篩選、彈窗履約出貨與物流單號填寫)、`AdminCouponsPage.jsx` (含一鍵開關、新增編輯折價券)。
- 手刻 SCSS 7-1 擴充 `_admin.scss` 支援質感儀表板、Toggle Switch、狀態 Badges。

1.1.1 — 2026-07-20
ops(deploy): 新增伺服器一鍵自動部署腳本 `deploy-server.sh`。

1.1.0 — 2026-07-20
ux(notice): 增加 API 連線防呆全域提示 Banner。

1.0.9 — 2026-07-20
style(favicon): 替換預設圖示，客製化復古黃金衣架品牌 SVG Favicon。

1.0.8 — 2026-07-20
feat(tailscale): 支援動態指定 API URL 與 localStorage 覆蓋。

1.0.7 — 2026-07-19
fix(cors): 修復部署在 GitHub Pages 時 API 連線位址錯誤與對應的跨域問題。

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
