# 🏛️ 後台管理系統完整化 (Admin Backoffice Expansion) - 設計規格書

> **文件版本**：1.0.0  
> **建立日期**：2026-07-21  
> **狀態**：已通過 Brainstorming 設計驗證 (Approved)

---

## 1. 需求與範疇總結 (Understanding Summary)

* **建構目標 (What)**：完整打造「復古刻痕」後台管理系統三大核心模組：
  1. **營收統計儀表板 (`AdminDashboardPage.jsx`)**：KPI 數據卡片（總營收、總訂單數、客單價、會員數）、動態 SVG 營收趨勢圖、熱銷商品 Top 5 榜單及低庫存預警。
  2. **訂單管理與履約流程 (`AdminOrdersPage.jsx`)**：全站訂單列表與多條件篩選（狀態/日期/關鍵字）、訂單詳細內容（商品規格、折抵點數、折價券明細）、手動變更狀態與填寫物流追蹤號碼。
  3. **折價券管理系統 (`AdminCouponsPage.jsx`)**：折價券列表檢視、新增/編輯優惠碼（設定折扣金額/比例、滿額門檻、使用期限、總數量上限）與一鍵停用/啟用。
* **核心約束 (Key Constraints)**：
  * **前端**：堅持「零 UI 框架依賴」，所有新後台模組與視覺圖表皆由自製 SCSS 7-1 模組化樣式與原生 SVG 渲染。
  * **後端**：Pure PHP 8.3 RESTful API + PDO，無第三方框架與外部快取套件 (Redis)。
  * **權限**：使用 JWT 驗證，後端嚴格校驗 `is_admin === 1` 中間件。

---

## 2. 決策日誌 (Decision Log)

| 決策項目 | 最終決定 | 曾考慮之替代方案 | 選擇理由 |
| :--- | :--- | :--- | :--- |
| **開發範疇** | 全套三大模組整體規劃 | 單一模組分期發布 | 達成後台營運業務（進銷存、訂單履約、行銷工具、數據分析）完整閉環。 |
| **系統架構** | 單一統一 Layout + 子路由 | 單頁式 `useState` Tab | 分離關心點，支援網址列同步與重新整理，便於未來持續拓展新後台模組。 |
| **圖表呈現** | 純 SCSS + 原生 SVG 動態圖表 | 引入 Chart.js / Recharts | 貫徹本專案「零 UI 框架依賴」之技術特色與高階工藝展示。 |
| **權限控管** | JWT Token `is_admin === 1` 防護 | Session / Cookie 驗證 | 保持現有 RESTful API JWT 雙 Token 架構一致性。 |
| **訂單取消處理**| DB Transaction 自動歸還庫存與紅利 | 管理員手動調整 | 確保資料一致性，防範人為遺漏或庫存數據失真。 |

---

## 3. 詳細架構與 API 設計 (Final Architecture & API Specifications)

### 3.1 前端路由與頁面結構
- `/admin` ➔ 自動轉址至 `/admin/dashboard`
- `/admin/dashboard` ➔ `AdminDashboardPage.jsx`
- `/admin/products` ➔ `AdminProductsPage.jsx` (現有商品與 SKU 管理重構入統一 Layout)
- `/admin/orders` ➔ `AdminOrdersPage.jsx`
- `/admin/coupons` ➔ `AdminCouponsPage.jsx`

### 3.2 後端 API 接口定義
- **Dashboard API**:
  - `GET /api/admin/dashboard/summary?period=7d|30d|1y`
- **Orders API**:
  - `GET /api/admin/orders?page=1&status=paid&keyword=ORD-xxx`
  - `GET /api/admin/orders/{id}`
  - `PUT /api/admin/orders/{id}/status` (Body: `{ status, shipping_carrier, tracking_number }`)
- **Coupons API**:
  - `GET /api/admin/coupons`
  - `POST /api/admin/coupons`
  - `PUT /api/admin/coupons/{id}`
  - `PUT /api/admin/coupons/{id}/toggle`

### 3.3 資料庫結構擴充 (Database Schema)
- `orders`: `status` ENUM(`pending`, `paid`, `shipped`, `completed`, `cancelled`), `shipping_carrier`, `tracking_number`, `shipped_at`.
- `coupons`: `id`, `code`, `discount_type`, `discount_value`, `min_spend`, `usage_limit`, `used_count`, `start_date`, `end_date`, `is_active`.

---

## 4. 例外狀況與交易安全機制 (Edge Cases)

1. **訂單取消資產還原**：於 `AdminOrderController.php` 執行 `cancelled` 變更時，自動回滾 SKU `stock` 與退還用戶 `points` 並寫入日誌。
2. **折價券門檻判定**：`used_count >= usage_limit` 或 `NOW() > end_date` 時自動無效化。
3. **前端防呆**：出貨狀態變更必填物流單號，全域操作透過 Toast 進行非同步異步狀態回饋。
