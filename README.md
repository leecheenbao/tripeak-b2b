# TRiPEAK B2B 經銷商下單平台

TRiPEAK B2B 經銷商下單平台是一個專為自行車零組件經銷商設計的訂購系統，用於管理產品目錄、訂單和銷售分析。

## 功能特點

### 經銷商功能
- 瀏覽和搜索產品目錄
- 購物車和訂單管理
- 訂單狀態追蹤
- 個人帳戶管理
- 歷史訂單查詢

### 管理員功能
- 用戶管理 (新增、編輯、停用經銷商帳戶)
- 產品管理 (新增、編輯、上下架產品)
- 訂單管理 (處理訂單、更新訂單狀態)
- 分類管理
- 銷售報表和數據分析
- LINE 通知管理

## 技術架構

### 前端
- Vue 3 (Composition API)
- Vuetify 3
- Vue Router
- Pinia 狀態管理
- Axios
- Chart.js

### 後端
- Node.js + Express
- MongoDB + Mongoose
- JWT 認證
- RESTful API
- LINE Bot SDK

## 專案結構

```
tripeak-b2b/
├── backend/              # 後端 API 服務
│   ├── src/              # 源碼
│   ├── public/           # 靜態資源
│   └── ...
├── frontend/             # 前端 Vue 應用
│   ├── src/              # 源碼
│   ├── public/           # 靜態資源
│   └── ...
├── .gitignore            # Git 忽略配置
└── README.md             # 專案說明文檔
```

## 開發環境設置

### 前置需求
- Node.js (>= 14.x)
- MongoDB
- npm 或 yarn

### 安裝步驟

1. 安裝並運行後端

```bash
cd backend
npm install
cp .env.example .env  # 複製環境變數配置檔並修改
npm run dev
```

2. 安裝並運行前端

```bash
cd ../frontend
npm install
cp .env.example .env.local  # 複製環境變數配置檔並修改
npm run dev
```

後端服務將運行在 http://localhost:8888，前端應用將運行在 http://localhost:5301

## 構建生產版本

### 後端

```bash
cd backend
npm run build
```

### 前端

```bash
cd frontend
npm run build
```

## 部署指南

詳細的部署指南請參閱 `docs/deployment.md`。

© 2025 Paul Lee. 版權所有。 