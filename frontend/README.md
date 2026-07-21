# 🎨 復古刻痕 - 前端系統 (Frontend SPA)
> **Version: 1.3.0**

本目錄包含「復古刻痕」電商的前端 Single Page Application (SPA)。全站採用 React 18 搭配 Vite 構建，最大特色為**零 UI 庫依賴**，以底層 SCSS 與設計標記 (Design Tokens) 進行排版與精緻的微交互動畫。

---

## 🛠 技術與架構亮點

- **路由管理**：採用 `react-router-dom` v6/7，支援巢狀路由 (Nested Routes)，並實作 `<ProtectedRoute />` 確保會員結帳與中心安全。
- **樣式系統**：手寫 SCSS，採 **7-1 模組化設計模式** (Abstracts, Base, Components, Layout, Pages)，具備極佳的可維護性。
- **自動化測試**：具備與後端閉環對接之 E2E 業務流程測試 `tests/run-e2e-tests.js`。

---

## 📝 更新日誌 (Changelog)

1.3.0 — 2026-07-21
feat(testing): 補齊自動化測試套件與 E2E 業務閉環驗證。
- 對接 `tests/run-e2e-tests.js` 自動化驗證「註冊 ➔ 選購 ➔ 購物車 ➔ 結帳 ➔ 付款對帳 ➔ 管理員履約出貨」前端流程。

1.2.0 — 2026-07-21
feat(admin): 後台管理系統完整化 (營收統計儀表板, 訂單履約與出貨管理, 折價券管理系統)。

1.1.1 — 2026-07-20
ops(deploy): 新增伺服器一鍵自動部署腳本 `deploy-server.sh`。

1.0.0 — 2026-07-17
init: 初始版本。
