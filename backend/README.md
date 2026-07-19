# ⚙️ 復古刻痕 - 後端 API 系統 (Backend API)
> **Version: 1.0.4**

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
- `GET` `/api/admin/dashboard` : 獲取後台營收/訂單統計資料
- `GET` `/api/admin/products` : 後台商品總覽
- `POST` `/api/admin/products` : 新增商品
- `PUT` `/api/admin/products/{id}` : 修改商品與上下架狀態
- `DELETE` `/api/admin/products/{id}` : 刪除商品
- `GET` `/api/admin/orders` : 後台所有訂單清單
- `PATCH` `/api/admin/orders/{id}` : 修改訂單狀態

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
