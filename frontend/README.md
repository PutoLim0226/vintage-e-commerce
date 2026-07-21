# 🎨 復古刻痕 - 前端系統 (Frontend SPA)
> **Version: 1.3.1**

本目錄包含「復古刻痕」電商的前端 Single Page Application (SPA)。全站採用 React 18 搭配 Vite 構建，最大特色為**零 UI 庫依賴**，以底層 SCSS 與設計標記 (Design Tokens) 進行排版與精緻的微交互動畫。

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
feat(testing): 補齊自動化測試套件與 E2E 業務閉環驗證。

1.2.0 — 2026-07-21
feat(admin): 後台管理系統完整化 (營收統計儀表板, 訂單履約與出貨管理, 折價券管理系統)。

1.0.0 — 2026-07-17
init: 初始版本。
