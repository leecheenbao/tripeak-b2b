# TRiPEAK B2B 經銷商下單平台 - 前端

這是 TRiPEAK B2B 經銷商下單平台的前端應用部分，使用 Vue 3 開發。

## 功能特點

- **完整的經銷商下單流程**：瀏覽產品目錄、加入購物車、提交訂單
- **訂單追蹤與管理**：查看訂單狀態、歷史訂單記錄
- **個人帳戶管理**：更新個人資料、變更密碼
- **管理員後台**：用戶管理、產品管理、訂單管理、報表分析等
- **LINE 通知整合**：訂單狀態自動通知
- **響應式設計**：支援桌面和移動設備
- **多種主題**：淺色/深色模式

## 技術架構

- **Vue 3**：使用 Composition API 進行開發
- **Vuetify 3**：UI 組件庫
- **Vue Router**：前端路由管理
- **Pinia**：狀態管理
- **Axios**：API 請求
- **Vee-Validate + Yup**：表單驗證
- **Vue Toastification**：通知提醒
- **Chart.js + Vue-Chartjs**：數據視覺化

## 開發環境設置

### 前置需求

- Node.js（>= 14.x）
- npm 或 yarn

### 安裝步驟

1. 克隆專案存儲庫

```bash
git clone https://github.com/your-username/tripeak-b2b.git
cd tripeak-b2b/frontend
```

2. 安裝依賴

```bash
npm install
# 或者
yarn install
```

3. 複製環境變數配置檔

```bash
cp .env.example .env.local
```

4. 啟動開發服務器

```bash
npm run serve
# 或者
yarn serve
```

應用將運行在 http://localhost:8888 (默認端口)

## 構建生產版本

```bash
npm run build
# 或者
yarn build
```

構建後的文件將輸出到 `dist` 目錄。

## 專案結構

```
frontend/
├── public/               # 靜態資源
├── src/
│   ├── api/              # API 調用
│   ├── assets/           # 靜態資源 (圖片、字體等)
│   ├── components/       # Vue 組件
│   ├── router/           # 路由配置
│   ├── stores/           # Pinia 狀態管理
│   ├── utils/            # 工具函數
│   ├── views/            # 頁面組件
│   ├── App.vue           # 根組件
│   └── main.js           # 應用入口點
├── .env.example          # 環境變數範例
├── .gitignore            # Git 忽略配置
├── package.json          # 專案配置
└── README.md             # 專案說明文檔
```

## 命名規範

- **組件**：使用 PascalCase 命名，例如 `ProductCard.vue`
- **JS 文件**：使用 camelCase 命名，例如 `formatUtils.js`
- **目錄**：使用小寫和連字符，例如 `product-images/`
- **CSS 類**：使用連字符命名，例如 `.product-card`

## 主要功能區域

### 公共區域

- **登入/註冊**：用戶認證
- **忘記密碼**：密碼恢復功能

### 經銷商區域

- **儀表板**：快速訪問常用功能和統計資訊
- **產品目錄**：瀏覽和搜索產品
- **購物車**：管理訂購項目
- **我的訂單**：訂單歷史和追蹤
- **個人資料**：管理帳戶信息

### 管理員區域

- **用戶管理**：創建和管理經銷商帳戶
- **產品管理**：添加、編輯和移除產品
- **訂單管理**：處理訂單和更新狀態
- **分類管理**：管理產品分類
- **報表分析**：銷售統計和報表
- **LINE 通知管理**：設置和發送 LINE 消息

## 開發貢獻指南

1. 遵循 Vue 3 和 Composition API 的最佳實踐
2. 使用 Git Flow 工作流進行開發
3. 保持代碼風格一致，遵循項目 ESLint 配置
4. 提交前運行測試確保功能正常
5. 提交訊息應描述性且遵循約定式提交規範

## 部署

應用可以部署到任何支持靜態網站的主機服務。推薦使用：

- Netlify
- Vercel
- AWS S3 + CloudFront
- GCP Cloud Storage
- Firebase Hosting

## 版本記錄

- **v1.0.0** - 初始版本