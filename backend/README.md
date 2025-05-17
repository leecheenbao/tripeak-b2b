# TRiPEAK B2B 經銷商下單平台

TRiPEAK B2B 是一個專為自行車零件製造商 TRiPEAK 設計的經銷商訂購平台，允許經銷商瀏覽產品目錄、下訂單，以及追蹤訂單狀態。

## 技術架構

- 前端：Vue 3 + Vuetify 3 + Pinia
- 後端：Node.js + Express
- 數據庫：MongoDB
- 容器化：Docker & Docker Compose

## 安裝與設置

### 前置條件

- Node.js >= 16.x
- Docker 與 Docker Compose
- Git

### 使用 Docker Compose 啟動 MongoDB

1. 在項目根目錄中運行 Docker Compose 來啟動 MongoDB 和 Mongo Express：

```bash
docker-compose up -d
```

這將啟動以下服務：
- MongoDB 數據庫 (端口 27017)
- Mongo Express 管理界面 (端口 8081)

2. 訪問 MongoDB 管理界面：
   - URL: http://localhost:8081
   - 用戶名: admin
   - 密碼: adminpassword

### 後端設置

1. 進入後端目錄：

```bash
cd tripeak-b2b/backend
```

2. 安裝依賴：

```bash
npm install
```

3. 創建環境變數文件：

```bash
cp .env.example .env
```

4. 根據需要修改 `.env` 文件中的配置。

5. 啟動後端服務：

```bash
npm run dev
```

後端服務將在 http://localhost:8888 運行。

### 前端設置

1. 進入前端目錄：

```bash
cd tripeak-b2b/frontend
```

2. 安裝依賴：

```bash
npm install
```

3. 創建環境變數文件：

```bash
cp .env.example .env
```

4. 啟動前端服務：

```bash
npm run dev
```

前端應用將在 http://localhost:5173 運行。

## 預設賬戶

系統初始化時會創建以下預設賬戶：

### 管理員
- 電子郵件: admin@tripeak.com
- 密碼: admin123

### 經銷商
- 電子郵件: dealer1@example.com
- 密碼: dealer123

## 數據庫結構

Docker Compose 啟動時會初始化以下 MongoDB 集合：

- users: 系統用戶（包括管理員）
- dealers: 經銷商信息
- products: 產品目錄
- categories: 產品分類
- orders: 訂單記錄

## 開發建議

- 前端開發：修改 `frontend` 目錄中的文件
- 後端開發：修改 `backend` 目錄中的文件
- 數據庫變更：更新 `mongo-init.js` 文件

## 停止服務

要停止所有相關的 Docker 容器：

```bash
docker-compose down
```

如果需要同時刪除數據卷（這將刪除所有數據庫數據）：

```bash
docker-compose down -v
``` 