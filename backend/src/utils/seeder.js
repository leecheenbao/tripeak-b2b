const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');
const LineMessage = require('../models/LineMessage');
const logger = require('./logger');

// 載入環境變數
dotenv.config();

// 連接數據庫
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// 初始管理員用戶
const adminUser = {
  name: 'Admin User',
  email: 'admin@tripeak.com',
  password: 'password123',
  role: 'admin',
  companyName: 'TRiPEAK',
  phone: '0123456789',
  address: 'TRiPEAK 總公司',
  isActive: true
};

// 初始商品分類
const categories = [
  {
    name: '自行車零件',
    description: 'TRiPEAK 自行車零件',
    isActive: true,
    displayOrder: 1
  },
  {
    name: '自行車配件',
    description: 'TRiPEAK 自行車配件',
    isActive: true,
    displayOrder: 2
  },
  {
    name: '自行車工具',
    description: 'TRiPEAK 自行車工具',
    isActive: true,
    displayOrder: 3
  }
];

// 初始 LINE 消息模板
const lineMessages = [
  {
    type: 'text',
    content: '感謝您在 TRiPEAK 下單！\n\n訂單編號: {orderNumber}\n訂單日期: {createdAt}\n訂單明細:\n{items}\n\n總額: {totalAmount} 元\n\n我們將盡快處理您的訂單。',
    title: '訂單創建通知',
    description: '當用戶創建新訂單時發送',
    isTemplate: true,
    trigger: 'order_created'
  },
  {
    type: 'text',
    content: '您的訂單 {orderNumber} 正在處理中！\n\n我們正在準備您的訂單，將會盡快發貨。\n\n訂單明細:\n{items}\n\n總額: {totalAmount} 元',
    title: '訂單處理通知',
    description: '當訂單狀態更改為處理中時發送',
    isTemplate: true,
    trigger: 'order_processing'
  },
  {
    type: 'text',
    content: '您的訂單 {orderNumber} 已發貨！\n\n訂單明細:\n{items}\n\n總額: {totalAmount} 元\n\n感謝您的購買！',
    title: '訂單出貨通知',
    description: '當訂單狀態更改為已出貨時發送',
    isTemplate: true,
    trigger: 'order_shipped'
  },
  {
    type: 'text',
    content: '您的訂單 {orderNumber} 已完成！\n\n訂單明細:\n{items}\n\n總額: {totalAmount} 元\n\n感謝您的購買，希望您滿意我們的產品和服務！',
    title: '訂單完成通知',
    description: '當訂單狀態更改為已完成時發送',
    isTemplate: true,
    trigger: 'order_completed'
  }
];

// 導入種子數據
const importData = async () => {
  try {
    // 確認數據庫連接
    await mongoose.connection.db.admin().ping();
    logger.info('數據庫連接成功');

    // 檢查是否已有管理員用戶
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (!existingAdmin) {
      await User.create(adminUser);
      logger.info('創建管理員用戶');
    } else {
      logger.info('管理員用戶已存在，跳過創建');
    }

    // 匯入分類
    const existingCategories = await Category.countDocuments();
    if (existingCategories === 0) {
      await Category.insertMany(categories);
      logger.info('創建初始商品分類');
    } else {
      logger.info('商品分類已存在，跳過創建');
    }

    // 匯入 LINE 消息模板
    const existingMessages = await LineMessage.countDocuments({ isTemplate: true });
    if (existingMessages === 0) {
      // 將最後更新者設為管理員
      const admin = await User.findOne({ role: 'admin' });
      if (admin) {
        const messagesWithCreator = lineMessages.map(msg => ({
          ...msg,
          createdBy: admin._id
        }));
        await LineMessage.insertMany(messagesWithCreator);
      } else {
        await LineMessage.insertMany(lineMessages);
      }
      logger.info('創建預設 LINE 消息模板');
    } else {
      logger.info('LINE 消息模板已存在，跳過創建');
    }

    logger.info('數據導入完成');
    process.exit();
  } catch (err) {
    logger.error(`導入數據時發生錯誤: ${err.message}`);
    process.exit(1);
  }
};

// 執行導入
importData(); 