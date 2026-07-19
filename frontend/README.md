# 🎨 復古刻痕 - 前端系統 (Frontend SPA)
> **Version: 1.0.4**

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
