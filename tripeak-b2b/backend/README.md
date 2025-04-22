# TRiPEAK B2B 經銷商下單平台 - 後端

本專案是 TRiPEAK B2B 經銷商下單平台的後端 API 服務。為經銷商提供產品訂購和訂單管理功能，同時為管理員提供完整的後台管理系統。

## 功能特點

- **用戶管理**: 管理員可以添加和管理經銷商帳戶
- **產品管理**: 上架、編輯、分類、上下架產品
- **訂單管理**: 完整的訂單流程和狀態追蹤
- **LINE 通知**: 整合 LINE 通知功能，即時通知訂單狀態
- **報表導出**: 提供訂單資料 Excel 導出功能

## 技術架構

- Node.js & Express.js
- MongoDB & Mongoose
- JSON Web Token (JWT) 驗證
- LINE Bot SDK 整合
- 基於 REST API 設計

## 安裝指南

### 前置需求

- Node.js (版本 > 14.x)
- MongoDB 資料庫
- LINE 開發者帳號（用於 LINE Bot 整合）

### 安裝步驟

1. 複製專案

```bash
git clone https://your-repository-url/tripeak-b2b.git
cd tripeak-b2b/backend
```

2. 安裝依賴

```bash
npm install
```

3. 環境設定

複製環境配置模板並填入你的配置

```bash
cp .env.example .env
```

編輯 .env 文件，填入必要的配置:

```
# 基本配置
PORT=5000
NODE_ENV=development

# MongoDB 連接
MONGO_URI=your_mongodb_connection_string

# JWT 密鑰
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=30d

# LINE Bot 設定
LINE_CHANNEL_SECRET=your_line_channel_secret
LINE_CHANNEL_ACCESS_TOKEN=your_line_channel_access_token

# 文件上傳設置
FILE_UPLOAD_PATH=./public/uploads
MAX_FILE_SIZE=1000000 # 1MB
```

4. 創建上傳目錄

```bash
mkdir -p public/uploads/products
```

5. 啟動開發伺服器

```bash
npm run dev
```

## API 文檔

主要 API 端點:

- `POST /api/auth/register` - 註冊新用戶
- `POST /api/auth/login` - 用戶登錄
- `GET /api/products` - 獲取產品列表
- `GET /api/categories` - 獲取分類列表
- `POST /api/orders` - 創建訂單
- `GET /api/orders` - 獲取訂單列表
- `PUT /api/orders/:id/status` - 更新訂單狀態

完整 API 文檔請參考 API 說明文件。

## 創建管理員帳號

第一次啟動應用時，需要創建一個管理員帳號:

```bash
# 使用種子腳本創建默認管理員帳號
npm run seed
```

預設管理員帳號:
- 郵箱: admin@tripeak.com
- 密碼: password123 (首次登錄後請修改)

## 執行測試

```bash
npm run test
```

## 部署指南

生產環境部署:

```bash
npm start
```

推薦使用 PM2 管理 Node.js 應用程序:

```bash
npm install -g pm2
pm2 start src/server.js --name tripeak-b2b-api
```

## 版本信息

v1.0.0 - 初始發布版本

## 授權條款

© 2023 TRiPEAK. 版權所有。 