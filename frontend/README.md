# 🎨 復古刻痕 - 前端系統 (Frontend SPA)
> **Version: 1.0.9**

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
- **`pages/`**：首頁、商品詳情、結帳與後台管理專屬樣式。

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
   - 獨立的 Layout 佈局與管理員角色守衛 (Admin Guard)。
   - 總覽儀表板：營收、訂單、商品統計。
   - 商品管理：支持商品列表、即時上/下架狀態切換。
   - 訂單管理：快速篩選與狀態（待確認、備貨中、已出貨等）修改。

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

1.0.9 — 2026-07-20
style(favicon): 替換預設圖示，客製化復古黃金衣架品牌 SVG Favicon。
- 設計並套用全站 `favicon.svg`，融合黑金典雅徽章與復古衣架 monogram 標誌。

1.0.8 — 2026-07-20
feat(tailscale): 支援動態指定 API URL 與 localStorage 覆蓋。
- 前端 `api.js` 改進 API URL 解析順序，優先支援 `localStorage.getItem('VINTAGE_API_URL')` 與環境變數，方便自由切換 Tailscale 伺服器網址。

1.0.7 — 2026-07-19
fix(cors): 修復部署在 GitHub Pages 時 API 連線位址錯誤與對應的跨域問題。
- 前端 `api.js` 改進 `API_BASE_URL` 宣告，在檢測到由 GitHub Pages (`github.io`) 託管環境運行時，自動 fallback 到本地後端 `http://localhost:8000` 進行數據請求與跨域通訊。

1.0.6 — 2026-07-19
feat(payment): 實作自製金流模擬 Sandbox 頁面與 Webhook 異步對帳。
- 新增 `PaymentPage.jsx` 付款頁面，提供磨砂玻璃設計的擬真 3D 信用卡刷卡授權 UI（支援卡號跳格、到期日 MMYY、CVC 翻轉卡片）。
- 前端結帳成功頁面引導跳轉至金流模擬頁，歷史訂單列表若狀態為 `pending` 則動態顯示「付款」按鈕。

1.0.5 — 2026-07-19
feat(admin): 升級後台商品與多規格 SKU 管理。
- 前端 `AdminProductsPage.jsx` 重構為可新增商品、編輯商品細部資訊。
- SKU 規格表格化動態行數編輯器（可增減列，輸入顏色、尺寸、價格、庫存等）。

1.0.4 — 2026-07-19
feat(points): 實作會員紅利點數 (Points) 結帳折抵。
- 前端 `CheckoutPage.jsx` 加載最新點數，提供勾選紅利折抵功能（1 點折 1 元，上限為商品總價，不含運費）。
- 發送 `POST /api/orders` 時傳送 `use_points` 參數。
- 前端 `OrdersPage.jsx` 訂單明細彈窗加入「紅利點數折抵」的金額展示。

1.0.3 — 2026-07-19
feat(reviews): 實作商品評價與星級系統（Reviews）及熱度排序。
- 前端 `OrdersPage.jsx` 加入評價 Modal、1-5 星填寫，商品詳情頁展示評價牆與平均星等。

1.0.2 — 2026-07-19
feat(navigation): 修復 Header 搜尋框與 ProductListPage URL 同步及清除按鈕。
- 解決輸入後按 Enter 沒反應、網址列參數不同步之問題。
- 新增 `start-dev-tmux.sh` 腳本，避免 tmux kill-window 時中斷開發伺服器。

1.0.1 — 2026-07-18
feat(coupon): 實作折價券 (Coupon) 前台即時折抵與結帳扣除。
- 前端 `CheckoutPage.jsx` 即時計算折價券減免並動態刷新總計金額。

1.0.0 — 2026-07-17
init: 初始版本。
- 實作會員中心訂單歷史記錄頁面。
- 整合 GitHub Actions 部署配置，新增 `deploy.yaml` 工作流。
