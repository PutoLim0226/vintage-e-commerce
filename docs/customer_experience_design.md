# 🛍️ 前台顧客購物體驗與行銷 (Customer Experience) 設計規格書

> **文件版本**：1.0.0 (v1.3.4)  
> **狀態**：已批准 (Approved)  
> **建立日期**：2026-07-22

---

## 1. 🔒 Understanding Lock (系統分析與規格鎖定)

### 系統功能概要
*   **商品收藏 / 願望清單 (Wishlist)**：
    *   新增 `wishlists` 資料表。僅限登入會員使用。
    *   商品卡片加上「愛心收藏按鈕」，點擊即時與後端同步；右上角導覽列新增「收藏清單」入口與專屬收藏列表頁面。
*   **多條件複合篩選器 (Composite Filters)**：
    *   後端提供專屬端點，動態計算當前有庫存的所有 `顏色`、`尺寸` 及價格極值。
    *   前端列表頁側邊欄整合「價格區間 Slider」、「顏色圓點按鈕群組」與「尺寸方塊按鈕群組」，支援多條件複合篩選。
*   **庫存與售罄防護提示 (Inventory Alerts)**：
    *   商品全部規格總庫存 = 0 時，列表頁卡片覆蓋「已售罄」暗色濾鏡與 Badge，詳情頁按鈕置灰。
    *   詳情頁 SKU 規格庫存為 0 的選項加上刪除線並停用 (disabled)；規格庫存 &le; 5 件時，即時浮現「僅剩 X 件！」提示。
*   **✉️ 雙管齊下行銷通知 (Email & LINE Notifications)**：
    *   **訂閱觸發**：當商品售罄時開放會員點擊「補貨通知我」；或直接在會員收藏商品降價時觸發。
    *   **Email 通知**：後端建立 `mail_queues` 隊列，由 Linux Crontab 背景 Worker 定時撈取發送 HTML 精緻信件（開發期使用 Mailtrap SMTP 沙盒測試）。
    *   **LINE 通知**：會員中心可一鍵點擊授權綁定 LINE 帳號。觸發通知時，會發送包含商品圖、價格與超連結按鈕的 **LINE Flex Message (氣泡卡片)**。

### 關鍵非功能性假設 (NFR & Constraints)
*   **零 UI 框架依賴**：完全不使用 MUI, Tailwind 等外部 UI 元件，保持純手刻 React + SCSS 設計（採用 SCSS 7-1 架構）。
*   **異步排程不卡頓**：所有的 Email 寄送與 LINE 訊息推送均寫入資料庫隊列，由背景程式異步派遣，保證前台與後台操作速度皆低於 **100ms**。

### 明確非目標 (Non-Goals)
*   不提供傳統簡訊 (SMS) 通知（僅限 HTML Email 與 LINE 官方帳號 Flex Message）。
*   不支援未登入訪客訂閱補貨通知。

---

## 2. 🗃️ 資料庫與 API 設計 (Database & API Design)

### 資料庫遷移定義
```sql
-- 1. 商品收藏表
CREATE TABLE IF NOT EXISTS wishlists (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_user_product (user_id, product_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. 商品訂閱通知表
CREATE TABLE IF NOT EXISTS product_subscriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_subs_user_product (user_id, product_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. 信件發送隊列表
CREATE TABLE IF NOT EXISTS mail_queues (
    id INT AUTO_INCREMENT PRIMARY KEY,
    to_email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    status ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
    attempts INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP NULL DEFAULT NULL,
    KEY idx_status_attempts (status, attempts)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. 會員資料表擴充
ALTER TABLE users ADD COLUMN IF NOT EXISTS line_user_id VARCHAR(100) UNIQUE NULL AFTER level;
```

### API 路由列表
*   `GET /api/wishlist` ➔ 獲取目前登入者的願望清單
*   `POST /api/wishlist/toggle` ➔ 切換收藏狀態 (Body: `{"product_id": 12}`)
*   `GET /api/products/filter-metadata` ➔ 取得目前有庫存的顏色、尺寸列表及價格區間 (Min/Max)
*   `POST /api/products/{id}/subscribe` ➔ 訂閱商品補貨通知
*   `POST /api/auth/line-bind` ➔ 將 LINE Login 授權回傳之 `line_user_id` 綁定至當前 Web 會員

---

## 3. 📝 決策紀錄 (Decision Log)

| 決策項目 | 決策結果 | 考量替代方案 | 決策理由 |
| :--- | :--- | :--- | :--- |
| **收藏清單儲存** | **會員資料庫儲存 (A)** | 訪客 `localStorage` 儲存 | 提供穩定的跨裝置收藏體驗，且與降價/補貨郵件通知有直接關聯性。 |
| **篩選元數據產生** | **後端動態計算 (A)** | 前端靜態寫死篩選選項 | 確保前台篩選選單中的顏色/尺寸「必定有貨」，不會點開空頁面。 |
| **庫存不足警示** | **統一防護提示 (A)** | 僅提示售罄不提示低庫存 | 在低於 5 件時提供急迫感字眼，有效提升購物車轉換率 (AOV/CRO)。 |
| **網址安全與 SEO** | **PDO 預處理與數值轉型 (A)**| 網址參數模糊加密 | 保障網址可分享性與爬蟲 SEO 友善，並在底層以 SQL 參數綁定與強制型別轉換 100% 杜絕 Injection。 |
| **發信與通知架構** | **異步隊列 Worker (A)** | 管理員儲存時同步發送 | 避免同步寄信發送大量 Request 造成 HTTP 連線超時與網頁卡頓。 |
| **LINE 綁定入口** | **會員中心一鍵授權 (A)** | 聊天室手動驗證碼綁定 | 網站登入後點擊直接導向 OAuth，體驗最順暢。 |
