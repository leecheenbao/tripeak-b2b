const logger = require('../utils/logger');

/**
 * 自定義錯誤處理中間件
 */
const errorHandler = (err, req, res, next) => {
  // 記錄錯誤信息
  logger.error(`${err.name}: ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  
  let error = { ...err };
  error.message = err.message;

  // Mongoose 錯誤處理
  // Mongoose 重複鍵錯誤
  if (err.code === 11000) {
    const message = '資料重複';
    error = new Error(message);
    error.statusCode = 400;
  }

  // Mongoose 驗證錯誤
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    error = new Error(message);
    error.statusCode = 400;
  }

  // Mongoose 無效ID
  if (err.name === 'CastError') {
    const message = `資源不存在`;
    error = new Error(message);
    error.statusCode = 404;
  }

  // 返回錯誤響應
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || '服務器錯誤'
  });
};

module.exports = errorHandler; 