# 🧥 復古刻痕 - 全端電商平台 (Vintage E-Commerce)

這是一個從零到完整上線的電商作品。專注於復古服飾零售，實現完整的進銷存、金物流串接與會員行銷系統。

## ✨ 專案亮點與功能展示
- **產品與規格庫存**：支援「一件商品多種顏色/尺寸」，並獨立控管各規格庫存數量。
- **多元金流整合**：串接第三方支付，支援信用卡分期、虛擬帳號 ATM 與超商代碼繳費，並實作 Webhook 自動對帳。
- **智慧物流串接**：自動計算運費，串接超商取貨 API，訂單狀態即時追蹤。
- **會員分級與行銷**：實作消費累積紅利、折價券發放，並設計 SEO Meta 動態標籤提升搜尋能見度。
- **數據戰情室**：自定義 SQL 報表，視覺化呈現即時營收、熱銷商品排行與轉換率。

## 🛠 技術棧 (Tech Stack)
| 分層 | 使用技術 |
| :--- | :--- |
| **前端** | React 18, Vite, React Router, Axios, TailwindCSS |
| **後端 API** | Pure PHP 8.2 (自製 RESTful API, 無框架) |
| **資料庫** | MySQL 8.0 (使用 PDO 預處理) |
| **安全性** | JWT (Access Token + Refresh Token) |
| **部署** | 前端 (Vercel / Netlify) / 後端 (Apache / Nginx) |

## 📂 系統架構圖 (Architecture)
*(請在此插入您用 Draw.io 畫的前後端分離架構圖)*

## 🚀 如何在本機快速啟動 (Quick Start)
1.  Clone 專案後，匯入 `/database/schema.sql` 至 MySQL。
2.  後端：進入 `/backend`，複製 `.env.example` 為 `.env` 並填入資料庫帳密，執行 `php -S localhost:8000 -t public`。
3.  前端：進入 `/frontend`，執行 `npm install` 後，執行 `npm run dev`。

## 🧪 核心程式碼解說 (程式碼作品集重點)
### 1. 庫存鎖定機制 (防止超賣)
在 `OrderController.php` 中，我使用了「樂觀鎖 (Optimistic Locking)」概念，在建立訂單時檢查庫存並同時更新，確保兩人同時購買最後一件商品時，只有一人能成功。
*(在此貼上您的核心 PHP 程式碼片段)*

### 2. JWT 中間層攔截
撰寫了 `Middleware/Auth.php`，攔截所有 `/api/private/*` 的路由，解析 JWT 並將用戶 ID 注入 Request 中，確保 API 安全性。
*(在此貼上您的攔截器程式碼片段)*
