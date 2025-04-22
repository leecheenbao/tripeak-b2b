const winston = require('winston');

// 自定義日誌格式
const logFormat = winston.format.printf(({ level, message, timestamp }) => {
  return `[${timestamp}] ${level}: ${message}`;
});

// 創建 logger 實例
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.colorize(),
    logFormat
  ),
  transports: [
    // 控制台輸出
    new winston.transports.Console(),
    // 文件輸出 - 錯誤級別
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    // 文件輸出 - 所有級別
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

module.exports = logger; 