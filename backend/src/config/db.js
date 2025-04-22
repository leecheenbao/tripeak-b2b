const mongoose = require('mongoose');
const logger = require('../utils/logger');

/**
 * 連接 MongoDB 數據庫
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    logger.info(`MongoDB 連接成功: ${conn.connection.host}`);
  } catch (error) {
    logger.error(`MongoDB 連接錯誤: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB; 