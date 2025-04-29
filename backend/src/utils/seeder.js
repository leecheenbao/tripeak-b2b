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
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('數據庫連接成功');
    logger.info('數據庫連接成功');
  } catch (error) {
    console.error('數據庫連接失敗:', error);
    logger.error('數據庫連接失敗:', error);
    process.exit(1);
  }
};

// 初始管理員用戶
const adminUser = {
  contactName: 'Admin Paul',
  email: 'leecheenbao@gmail.com',
  password: '111111',
  role: 'admin',
  companyName: 'TRiPEAK',
  phone: '0912345678',
  address: 'TRiPEAK 總公司',
  isActive: true
};

// 插入示範經銷商
const dealers = [
  {
    companyName: '台北自行車行',
    contactName: '王小明',
    email: 'dealer1@example.com',
    password: '111111',
    phone: '0223456789',
    address: '台北市大安區復興南路一段123號',
    role: 'dealer',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    companyName: '高雄單車專賣店',
    contactName: '李小華',
    email: 'dealer2@example.com',
    password: '111111',
    phone: '0756781234',
    address: '高雄市前鎮區中山二路456號',
    role: 'dealer',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// 插入預設分類
const categories = [
  { name: '牙盤', description: '自行車牙盤系列產品', isActive: true, displayOrder: 1, createdAt: new Date(), updatedAt: new Date() },
  { name: '曲柄', description: '自行車曲柄系列產品', isActive: true, displayOrder: 2, createdAt: new Date(), updatedAt: new Date() },
  { name: '導輪', description: '自行車導輪系列產品', isActive: true, displayOrder: 3, createdAt: new Date(), updatedAt: new Date() },
  { name: '螺絲', description: '自行車相關螺絲配件', isActive: true, displayOrder: 4, createdAt: new Date(), updatedAt: new Date() }
];

// 生成產品數據的函數
const generateProducts = (categories) => {
  return categories.flatMap(category => {
    const count = Math.floor(Math.random() * 5) + 3; // 每個分類 3-7 個產品
    const productsForCategory = [];
    
    for (let i = 1; i <= count; i++) {
      const product = {
        name: `${category.name} 測試產品 ${i}`,
        description: `${category.name}系列的高品質產品，適合專業車手使用。`,
        price: Math.floor(Math.random() * 900) + 100,
        stockQuantity: Math.floor(Math.random() * 100) + 10,
        sku: `${category.name}-${i}`,
        category: category._id, // 修改為 category 而不是 categoryId
        categoryName: category.name,
        images: [
          'https://picsum.photos/id/237/300/300',
          'https://picsum.photos/id/238/300/300'
        ],
        specifications: {
          weight: `${Math.floor(Math.random() * 500) + 100}g`,
          material: Math.random() > 0.5 ? '鋁合金' : '碳纖維',
          color: ['黑色', '銀色']
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      productsForCategory.push(product);
    }
    
    return productsForCategory;
  });
};

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
    // 連接數據庫
    await connectDB();

    // 清除現有資料
    await User.deleteMany();
    await Category.deleteMany();
    await LineMessage.deleteMany();
    await Product.deleteMany();
    logger.info('清除現有資料');

    // 創建管理員用戶
    await User.create(adminUser);
    logger.info('創建管理員用戶');

    // 匯入分類
    const insertedCategories = await Category.insertMany(categories);
    logger.info('創建初始商品分類');

    // 匯入經銷商
    await User.insertMany(dealers);
    logger.info('創建初始經銷商');

    // 生成並匯入產品
    const products = generateProducts(insertedCategories);
    await Product.insertMany(products);
    logger.info('創建初始商品');

    // 匯入 LINE 消息模板
    const admin = await User.findOne({ role: 'admin' });
    const messagesWithCreator = lineMessages.map(msg => ({
      ...msg,
      createdBy: admin._id
    }));
    await LineMessage.insertMany(messagesWithCreator);
    logger.info('創建預設 LINE 消息模板');

    logger.info('數據導入完成');
    process.exit(0);
  } catch (err) {
    console.error('導入數據時發生錯誤:', err);
    logger.error(`導入數據時發生錯誤: ${err.message}`);
    process.exit(1);
  }
};

// 執行導入
importData(); 