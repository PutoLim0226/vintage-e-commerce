# ⚙️ 復古刻痕 - 後端 API 系統 (Backend API)
> **Version: 1.3.3**

本目錄為「復古刻痕」電商的後端 API 系統。採用 **無框架 PHP 8.3** 開發，自製物件導向的 MVC 設計、RESTful 路由分發器與中間件 (Middleware) 機制，確保最高運作效率。

---

## 🔑 預設測試帳號 (Default Test Credentials)

| 帳號類型 | 電子郵件 (Email) | 密碼 (Password) | 角色 (Role) | 預設權限與狀態 |
| :--- | :--- | :--- | :--- | :--- |
| **🛡️ 系統管理員** | `admin@vintage.com` | `admin123` | `admin` | 最高管理權限，可存取 `/admin/*` 後台營收儀表板、商品 SKU 管理、訂單履約發貨與折價券開關。 |
| **👤 測試一般會員** | `user@vintage.com` | `admin123` | `customer` | 一般會員權限，擁有 100 點紅利點數，可體驗購物車、折價券折抵、結帳付款與評價功能。 |

---

## 📝 更新日誌 (Changelog)

1.3.1 — 2026-07-21
docs(credentials): 補齊預設管理員與測試會員測試憑證資訊。

1.3.0 — 2026-07-21
feat(testing & devops): 補齊 API 自動化整合測試套件、Try-It-Out 互動式 API 文件與 MySQL 自動化備份腳本。

1.2.0 — 2026-07-21
feat(admin): 後台 API 系統完整化。

1.0.0 — 2026-07-17
init: 初始版本。
