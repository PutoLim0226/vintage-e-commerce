# ⚙️ 復古刻痕 - 後端 API 系統 (Backend API)
> **Version: 1.2.0**

本目錄為「復古刻痕」電商的後端 API 系統。採用 **無框架 PHP 8.3** 開發，自製物件導向的 MVC 設計、RESTful 路由分發器與中間件 (Middleware) 機制，確保最高運作效率。

---

## 🛠 後端核心技術

- **自製 Router**：支援動態 URL 參數解析（如 `/api/products/{slug}`）與 HTTP 方法限制。
- **JWT 身分驗證中間件**：
  - 阻擋未授權請求保護敏感端點（如結帳與會員資料）。
  - 對管理端 API 實施角色權限校驗（`AdminMiddleware`）。
- **資料庫存取 (PDO)**：全面使用預處理語句 (Prepared Statements)，杜絕 SQL 注入風險。
- **自製環境變數載入器**：手寫 `.env` 剖析程式，輕量加載專案配置。

---

## 📂 資料庫架構與 Seed

資料庫採用 MySQL 8.0，包含以下關鍵資料表與優化：
- `users`：會員資料與角色標記（`user`, `admin`）。
- `products` & `product_skus`：商品主表與規格子表（顏色、尺寸、價格、庫存），以應對多變商品屬性。
- `product_images`：商品附圖庫，支援多視角展示。
- `carts` & `cart_items`：支援會員購物車及遊客 X-Cart-Token 購物車機制。
- `orders` & `order_items`：訂單明細與狀態追蹤。
- `coupons`：折價券折扣系統。
- `v_revenue_daily` & `v_top_products`：MySQL 視圖 (Views) 用於統計日營收與熱銷排行。

---

## 📋 API 路由清單 (Routes List)

### 🔓 公開 API
- `POST` `/api/auth/register` : 用戶註冊
- `POST` `/api/auth/login` : 用戶登入
- `POST` `/api/auth/refresh` : JWT 刷新
- `GET` `/api/products` : 獲取商品列表（支援篩選、排序、分頁與搜尋）
- `GET` `/api/products/{slug}` : 商品詳細資訊
- `GET` `/api/categories` : 分類樹狀結構

### 🔐 會員受保護 API
- `GET` `/api/profile` : 獲取會員資料
- `PUT` `/api/profile` : 修改會員資料
- `GET` `/api/cart` : 獲取購物車內容
- `POST` `/api/cart/items` : 加入商品至購物車
- `PATCH` `/api/cart/items/{id}` : 更新購物車數量
- `DELETE` `/api/cart/items/{id}` : 移除購物車商品
- `POST` `/api/orders` : 創立訂單（結帳）
- `GET` `/api/orders/history` : 獲取會員歷史訂單

### 🛡 管理員專屬 API (需 Role: admin)
- `GET` `/api/admin/dashboard` : 獲取後台營收/訂單統計資料、趨勢圖陣列與低庫存警示
- `GET` `/api/admin/products` : 後台商品總覽
- `POST` `/api/admin/products` : 新增商品
- `PUT` `/api/admin/products/{id}` : 修改商品與上下架狀態
- `DELETE` `/api/admin/products/{id}` : 刪除商品
- `GET` `/api/admin/orders` : 後台所有訂單清單（支援狀態篩選與關鍵字搜尋）
- `GET` `/api/admin/orders/{id}` : 獲取單一訂單細節與發貨記錄
- `PUT` `/api/admin/orders/{id}` : 修改訂單狀態與物流單號（訂單取消自動 DB Transaction 退還庫存與紅利點數）
- `GET` `/api/admin/coupons` : 後台折價券總覽
- `POST` `/api/admin/coupons` : 新增折價券
- `PUT` `/api/admin/coupons/{id}` : 編輯折價券
- `PUT` `/api/admin/coupons/{id}/toggle` : 一鍵切換折價券啟用狀態
- `DELETE` `/api/admin/coupons/{id}` : 刪除折價券

---

## 🚀 啟動方式與背景守護

### 1. 標準背景啟動 (推薦，防斷線)
使用內建的 Tmux 背景腳本，使後端服務運行在獨立 session，不受終端視窗關閉影響：
```bash
# 啟動後端
rtk bash start-dev-tmux.sh start

# 停止後端
rtk bash start-dev-tmux.sh stop

# 重啟後端
rtk bash start-dev-tmux.sh restart

# 查看輸出日誌與互動
tmux attach -t vintage-backend
# (離開請按 Ctrl+B 接著按 D)
```

### 2. 一般啟動
```bash
# 安裝 Composer 依賴
composer install

# 匯入資料庫
rtk mysql -u root -pPutolim@0226 vintage_ec < database/schema.sql
rtk mysql -u root -pPutolim@0226 vintage_ec < database/seeds.sql

# 前台啟動開發伺服器
rtk php -S 127.0.0.1:8000 -t public/ public/index.php
```

---

## 📝 更新日誌 (Changelog)

1.2.0 — 2026-07-21
feat(admin): 後台 API 系統完整化。
- 升級 `AdminDashboardController.php` 支援動態區間趨勢與庫存預警。
- 升級 `AdminOrderController.php` 支援搜尋與訂單取消 DB Transaction 自動還原庫存與紅利點數。
- 新增 `AdminCouponController.php` 提供折價券 CRUD API。

1.1.1 — 2026-07-20
ops(deploy): 新增伺服器一鍵自動部署腳本 `deploy-server.sh`。

1.1.0 — 2026-07-20
ux(notice): 前端增加 API 連線防呆全域提示 Banner。

1.0.9 — 2026-07-20
style(favicon): 前端替換預設圖示，套用復古黑金徽章 Favicon。

1.0.8 — 2026-07-20
feat(tailscale): 全面適配 Tailscale IP / 網域跨域對應。

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
