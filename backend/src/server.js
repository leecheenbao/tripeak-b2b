const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/error');
const logger = require('./utils/logger');
const fileUpload = require('express-fileupload');

// 載入環境變數
dotenv.config();

// 連接數據庫
connectDB();

// 初始化 Express 應用
const app = express();

// 中間件設置
app.use(express.json());
app.use(cors());
app.use(fileUpload());

// 日誌設置
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// API 路由
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/products', require('./routes/products'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/line', require('./routes/line'));

// 根路由測試
app.get('/', (req, res) => {
  res.json({ message: 'TRiPEAK B2B API 運行中' });
});

// 錯誤處理中間件
app.use(errorHandler);

// 啟動服務器
const PORT = process.env.PORT || 8080;
const server = app.listen(PORT, () => {
  logger.info(`服務器在 ${process.env.NODE_ENV} 模式下運行於 http://localhost:${PORT}`);
});

// 處理未捕獲的異常
process.on('unhandledRejection', (err) => {
  logger.error(`錯誤: ${err.message}`);
  // 正常關閉服務器
  server.close(() => process.exit(1));
}); 