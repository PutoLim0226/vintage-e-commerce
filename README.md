# 🧥 復古刻痕 - 全端電商平台 (Vintage E-Commerce)
> **Version: 1.1.2**

這是一個從零到完整上線的電商作品，專注於復古服飾零售。**本專案最大的特色在於「零 UI 框架依賴」** — 所有視覺效果皆由底層 SCSS 手刻打造，前端採用 React + Vite，後端使用純 PHP 自製 RESTful API，完整實現電商進銷存、金物流串接與會員行銷系統。

---

### 🌟 新增特色亮點
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
- **前端詳情與樣式系統**：請參閱 [frontend/README.md](file:///home/puto/project/vintage-e-commerce/frontend/README.md)
- **後端架構與 API 接口**：請參閱 [backend/README.md](file:///home/puto/project/vintage-e-commerce/backend/README.md)

---

## 📝 更新日誌 (Changelog)

1.1.1 — 2026-07-20
ops(deploy): 新增伺服器一鍵自動部署腳本 `deploy-server.sh`。
- 自動初始化 Nginx 獨立站台、PHP 8.3-FPM、MySQL 資料庫匯入與權限管理。
- 支援靜態前端自動編譯與 `/api` RESTful 反向代理路徑映射。

1.1.0 — 2026-07-20
ux(notice): 增加 API 連線防呆全域提示 Banner，優化 GitHub Pages 獨立運行體驗。
- 前端 `api.js` 在遭遇 `ERR_CONNECTION_REFUSED` 網路中斷時廣播全域 `api_connection_error` 事件。
- `Header.jsx` 增加優雅的頂部黃金提示條，指引使用者啟動本地伺服器或設定全域遠端 API URL。

1.0.9 — 2026-07-20
style(favicon): 替換預設圖示，客製化復古黃金衣架品牌 SVG Favicon。
- 設計並套用全站 `favicon.svg`，融合黑金典雅徽章與復古衣架 monogram 標誌。
- `index.html` 補齊 `apple-touch-icon` 及 `#19120c` 復古網址列 `theme-color` meta 標籤。

1.0.8 — 2026-07-20
feat(tailscale): 支援 Tailscale 內網 IP / 域名動態連線與無感跨域配置。
- 後端 `App.php` 的 CORS 設定升級為動態回傳傳入的 `HTTP_ORIGIN`，全面適配 Tailscale IP (100.x.x.x)、MagicDNS 網域以及公開網頁連線。
- 前端 `api.js` 改進 API URL 解析順序，優先支援 `localStorage.getItem('VINTAGE_API_URL')` 與環境變數，方便自由切換 Tailscale 伺服器網址。

1.0.7 — 2026-07-19
fix(cors): 修復部署在 GitHub Pages 時跨域請求 (CORS) 拒絕及 API 位址錯誤。
- 後端 `App.php` 中設定 `handleCors()` 的 `Access-Control-Allow-Origin` 白名單，將 `https://putolim0226.github.io` 與 `X-Cart-Token` 等自訂 Header 寫入。
- 前端 `api.js` 改進 `API_BASE_URL` 宣告，在檢測到 GitHub Pages (`github.io`) 託管環境時自動 fallback 串接到本地 `http://localhost:8000` 連線，確保前台運作順暢。

1.0.6 — 2026-07-19
feat(payment): 實作自製金流模擬 Sandbox 頁面與 Webhook 異步對帳。
- 新增 `PaymentPage.jsx` 付款頁面，提供磨砂玻璃設計的擬真 3D 信用卡刷卡授權 UI（支援卡號跳格、到期日 MMYY、CVC 翻轉卡片）。
- 後端 `OrderController@create` 建立訂單時寫入 `payments` 初始 pending 記錄。
- 前端結帳成功頁面引導跳轉至金流模擬頁，歷史訂單列表若狀態為 `pending` 則動態顯示「付款」按鈕。
- 付款成功後打後端 `/api/webhook/payment` API 模擬 Webhook 信號，更新支付與訂單狀態（orders.status -> paid）。

1.0.5 — 2026-07-19
feat(admin): 升級後台商品與多規格 SKU 管理。
- 前端 `AdminProductsPage.jsx` 重構為可新增商品、編輯商品細部資訊。
- SKU 規格表格化動態行數編輯器（可增減列，輸入顏色、尺寸、價格、庫存等）。
- 後端 `AdminProductController.php` 與路由新增 `GET /api/admin/products/{id}`（單一商品加載 SKUs）。
- 後端 `AdminProductController@update` 實作 Transaction SKU 安全更新機制（對現存 SKU 更新、新規格寫入，並比對被歷史訂單引用的舊規格執行 is_active 下架或無關聯直接安全刪除）。

1.0.4 — 2026-07-19
feat(points): 實作會員紅利點數 (Points) 結帳折抵。
- 前端 `CheckoutPage.jsx` 加載最新點數，提供勾選紅利折抵功能（1 點折 1 元，上限為商品總價，不含運費）。
- 發送 `POST /api/orders` 時傳送 `use_points` 參數。
- 後端 `OrderController.php` 實作 transaction 扣除折抵紅利點數、更新 `users.points` 並寫入 `point_logs` 紀錄。
- 前端 `OrdersPage.jsx` 訂單明細彈窗加入「紅利點數折抵」的金額展示。

1.0.3 — 2026-07-19
feat(reviews): 實作商品評價與星級系統（Reviews）及熱度排序。
- 後端新增 `product_reviews` 資料表與 `ReviewController.php` API（包含 `POST /api/reviews` 與 `GET /api/products/{slug}/reviews`，用戶名去識別化遮罩如「陳*明」）。
- 前端 `OrdersPage.jsx` 加入評價 Modal、1-5 星填寫，商品詳情頁展示評價牆與平均星等。
- 商品排序調整為 `rating DESC, view_count DESC`。詳情頁 API 載入時自動將點擊量 `view_count = view_count + 1`。

1.0.2 — 2026-07-19
feat(navigation): 修復 Header 搜尋框與 ProductListPage URL 同步及清除按鈕。
- 解決輸入後按 Enter 沒反應、網址列參數不同步之問題。
- 新增 `start-dev-tmux.sh` 腳本，避免 tmux kill-window 時中斷開發伺服器。

1.0.1 — 2026-07-18
feat(coupon): 實作折價券 (Coupon) 前台即時折抵與結帳扣除。
- 後端新增 `POST /api/coupons/check` 驗證門檻與過期日。
- 前端 `CheckoutPage.jsx` 即時計算折價券減免並動態刷新總計金額。

1.0.0 — 2026-07-17
init: 初始版本。
- 實作會員中心訂單歷史記錄頁面。
- 整合 GitHub Actions 部署配置，新增 `deploy.yaml` 工作流。
