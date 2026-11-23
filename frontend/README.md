# 🎨 復古刻痕 - 前端系統 (Frontend SPA)
> **Version: 1.4.8**

本目錄包含「復古刻痕」電商的前端 Single Page Application (SPA)。全站採用 React 18 搭配 Vite 構建，最大特色為**零 UI 庫依賴**，以底層 SCSS 與設計標記 (Design Tokens) 進行排版與精緻的微交互動畫。

---

## 🔑 預設測試帳號 (Default Test Credentials)

| 帳號類型 | 電子郵件 (Email) | 密碼 (Password) | 角色 (Role) | 預設權限與狀態 |
| :--- | :--- | :--- | :--- | :--- |
| **🛡️ 系統管理員** | `admin@vintage.com` | `admin123` | `admin` | 最高管理權限，可存取 `/admin/*` 後台營收儀表板、商品 SKU 管理、訂單履約發貨與折價券開關。 |
| **👤 測試一般會員** | `user@vintage.com` | `admin123` | `customer` | 一般會員權限，擁有 100 點紅利點數，可體驗購物車、折價券折抵、結帳付款與評價功能。 |

---

## 📝 更新日誌 (Changelog)

1.4.8 — 2026-11-23
fix(i18n): 深度補齊全站 i18n 國際化文字（達到 100% 零死角）：
- 補齊結帳頁面 `CheckoutPage` 收件人欄位驗證錯誤提示、套用折價券提示與訂單建立異常 alert。
- 補齊折價券管理 `AdminCouponsPage` 折扣類型選單（百分比/固定金額）、最高折扣提示、無上限與無效期限制標籤。
- 新增商品規格顏色字典 `colors`，全面支援複合篩選側邊欄、規格選取按鈕與購物車規格多語系。
- 新增商品名稱 `products_name` 與商品故事描述 `products_desc` 字典，首頁、商品列表、商品詳情、願望清單、購物車與訂單品項名稱同步多語系化。
- 三大語系字典檔（繁體中文、簡體中文、英文）各自具備 580 個鍵值，零差異 100% 嚴格對齊。

1.4.7 — 2026-11-23
feat(i18n): 串接後端方案 B 分類多語系支援：
- `api.js` Request Interceptor 自動注入 `Accept-Language` 標頭至所有後端請求。
- 首頁、商品列表頁、商品詳情頁與收藏清單 `useEffect` 綁定 `language` 變更，語系切換時分類名稱與商品卡片即時無縫重新整理。

1.4.6 — 2026-11-23
refactor(quality): 全站程式碼品質稽核修復完成（i18n / SCSS / RWD）：
- 清除全站所有元件與頁面之 Inline CSS (`style={{...}}`)，全數提取並收納至 `src/assets/scss/` 各模組中。
- 前台全頁面（Home, ProductList, ProductDetail, Cart, Checkout, Payment, Orders, Profile, Wishlist, Login, Register, NotFound）與後台全管理頁面（AdminDashboard, AdminOrders, AdminProducts, AdminCoupons）全面補齊三語系 i18n 翻譯。
- 表格增加 `.table-responsive` 容器並針對行動版（375px/576px/768px）提供靈活折行與 Modal 90vh 捲軸防破版優化。

1.4.5 — 2026-11-23
feat(i18n): 實作多語系國際化支援 (i18n)，涵蓋台灣繁體中文 (zh-TW)、簡體中文 (zh-CN) 與英文 (en)。自製輕量高效 LanguageContext，Header 內建桌面端下拉選單與行動端側邊語言切換器，具備持久化 localStorage 與自動 HTML lang 同步機制。

1.4.4 — 2026-07-22
responsive(header): 修正行動版 Header 排版寬度溢出問題（行動裝置下將登入/登出與使用者名字按鈕隱藏，收納入漢堡導航選單中，並將 header__inner 的 gap 縮小至 8px，防止左右滑動 overflow 缺陷）。

1.4.3 — 2026-07-22
responsive(filters): 為商品清單頁的複合篩選面板實作 RWD 設計，在行動裝置上（<1024px）收納入折疊選單中，並提供「展開/關閉篩選條件」按鈕，避免阻擋商品列表展示。

1.4.2 — 2026-07-22
style(filters): 優化商品清單複合篩選視覺反饋（選取分類加上左側金色指示條、選取顏色/尺寸加上「✓」前綴符號與金色發光盒陰影）。

1.4.1 — 2026-07-22
fix(header): 修正 RWD 樣式先後順序，確保桌機版能正確隱藏漢堡選單 (display: none)。

1.4.0 — 2026-07-22
feat(customer-experience): 實作前台顧客購物體驗與行銷功能（商品收藏/願望清單、動態屬性複合篩選、低庫存售罄警示、補貨訂閱、LINE 官方帳號綁定 UI 模擬與微交互 SCSS 動畫）。

1.3.1 — 2026-07-21
docs(credentials): 補齊預設管理員與測試會員測試憑證資訊。

1.3.0 — 2026-07-21
feat(testing): 補齊自動化測試套件與 E2E 業務閉環驗證。

1.2.0 — 2026-07-21
feat(admin): 後台管理系統完整化 (營收統計儀表板, 訂單履約與出貨管理, 折價券管理系統)。

1.0.0 — 2026-07-17
init: 初始版本。
