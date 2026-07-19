# 🧥 復古刻痕 - 全端電商平台 (Vintage E-Commerce)
> **Version: 1.0.2**

這是一個從零到完整上線的電商作品，專注於復古服飾零售。**本專案最大的特色在於「零 UI 框架依賴」** — 所有視覺效果皆由底層 SCSS 手刻打造，前端採用 React + Vite，後端使用純 PHP 自製 RESTful API，完整實現電商進銷存、金物流串接與會員行銷系統。

---

### 🌟 新增特色亮點
- **折價券即時折抵**：結帳頁支持即時 API 驗證折價券，無感套用並即時在畫面上更新小計與總額。
- **人氣與評分自動排序**：商品預設依「平均評分」及「點擊數」進行加權熱度排序，並在詳情頁自動累加點擊量。

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
