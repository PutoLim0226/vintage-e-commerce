# 🧥 復古刻痕 - 全端電商平台 (Vintage E-Commerce)

這是一個從零到完整上線的電商作品，專注於復古服飾零售。**本專案最大的特色在於「零 UI 框架依賴」** — 所有視覺效果皆由底層 SCSS 手刻打造，前端採用 React + Vite，後端使用純 PHP 自製 RESTful API，完整實現電商進銷存、金物流串接與會員行銷系統。

---

## ✨ 專案核心功能

- **產品與目錄管理**：支援多層級分類、獨立 SKU 規格設定（顏色／尺寸／獨立庫存），並具備商品詳情與批量圖片上傳。
- **金流與結帳系統**：串接第三方支付 (藍新/綠界)，支援信用卡分期、虛擬帳號 ATM、超商代碼，並實作 Webhook 自動對帳機制。
- **物流與配送**：串聯第三方物流 API（宅配／超商店到店），具備動態運費計算與訂單狀態即時追蹤（出貨中、配送中、已送達）。
- **客戶與行銷工具**：涵蓋會員分級制度、消費紅利點數累積、折價券發放，並實作動態 SEO Meta 標籤優化。
- **數據分析後台**：自定義 SQL 報表，即時監控營收、熱銷商品排行與訂單轉換率。

---

## 🛠 技術棧 (Tech Stack)

| 分層 | 使用技術 | 備註 |
| :--- | :--- | :--- |
| **前端框架** | React 18 + Vite | 極速開發與 HMR 熱更新 |
| **樣式系統** | **自製 SCSS (7-1 模組化架構)** | **✅ 零 UI 框架依賴** (無 Bootstrap / Tailwind / MUI) |
| **前端狀態管理** | React Context + useReducer | 自製輕量購物車與用戶狀態 |
| **後端 API** | Pure PHP 8.2 (RESTful API) | **✅ 無框架** (自製 Router 與 Middleware) |
| **資料庫** | MySQL 8.0 | 使用 PDO 預處理語句防範 SQL 注入 |
| **身分驗證** | JWT (Access Token + Refresh Token) | 雙 Token 機制提升安全性 |
| **部署** | 前端 (Vercel / Netlify) / 後端 (Apache / Nginx) | |

---

## 📂 前端 SCSS 目錄結構 (作品集精髓)

所有樣式統一收納於 `src/assets/scss`，並嚴格採用 **7-1 模組化設計模式**，確保專案在大規模開發下仍具備極佳的可維護性：

```text
/frontend
└── /src
    └── /assets
        └── /scss
            ├── /abstracts                     # 抽象工具層
            │   ├── _variables.scss            # 品牌色票、字體基數、間距系統 (Design Tokens)
            │   ├── _functions.scss            # 自動計算 rem / 顏色運算函數
            │   └── _mixins.scss               # 自製 RWD 斷點 (@include mobile) 與 Flex/CSS 語法糖
            ├── /base                          # 基礎重置層
            │   ├── _reset.scss                # 自製 CSS Reset (清除預設樣式)
            │   └── _typography.scss           # 標題、段落、連結全域設定
            ├── /components                    # 獨立元件層 (顆粒化)
            │   ├── _button.scss               # 主要/次要/危險按鈕變化
            │   ├── _product-card.scss         # 商品卡片 (含 hover 動畫)
            │   └── _modal.scss                # 彈窗與購物車抽屜
            ├── /layout                        # 整體佈局層
            │   ├── _header.scss               # 導航列與搜尋框
            │   ├── _footer.scss               # 頁尾資訊
            │   └── _grid-system.scss          # 自製響應式網格系統 (Flexbox / CSS Grid)
            ├── /pages                         # 頁面專屬層
            │   ├── _home.scss                 # 首頁與主視覺 (Hero)
            │   ├── _product-detail.scss       # 商品詳情、規格切換、數量選擇器
            │   └── _checkout.scss             # 結帳流程與訂單摘要
            └── main.scss                      # 🚀 唯一全域入口 (僅包含 @import 順序)

## 📂 系統架構圖 (Architecture)
本專案採用前後端完全分離的架構設計：
· 前端 (React + Vite) 透過 Axios 發送 HTTP 請求至後端 API。
· 後端 (Pure PHP) 提供 RESTful API，並透過 JWT 進行身分驗證。
· MySQL 資料庫 儲存所有會員、商品、訂單與行銷數據。
撰寫了 `Middleware/Auth.php`，攔截所有 `/api/private/*` 的路由，解析 JWT 並將用戶 ID 注入 Request 中，確保 API 安全性。
*(在此貼上您的攔截器程式碼片段)*
