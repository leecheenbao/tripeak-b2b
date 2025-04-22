// 使用數據庫
db = db.getSiblingDB('tripeak-b2b');

// 建立初始集合
db.createCollection('users');
db.createCollection('products');
db.createCollection('categories');
db.createCollection('orders');
db.createCollection('dealers');

// 插入管理員用戶
db.users.insertOne({
  name: '系統管理員',
  email: 'admin@tripeak.com',
  password: '$2b$10$Y.bC1I9X9oP3u6TZJFuE8OxbSXYQRbJIWJn.bfL4YFWwGlDJqxX3O', // 預設密碼: admin123
  role: 'admin',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
});

// 插入預設分類
const categories = [
  { name: '牙盤', description: '自行車牙盤系列產品', createdAt: new Date(), updatedAt: new Date() },
  { name: '曲柄', description: '自行車曲柄系列產品', createdAt: new Date(), updatedAt: new Date() },
  { name: '導輪', description: '自行車導輪系列產品', createdAt: new Date(), updatedAt: new Date() },
  { name: '螺絲', description: '自行車相關螺絲配件', createdAt: new Date(), updatedAt: new Date() }
];

db.categories.insertMany(categories);

// 插入預設產品
const categoriesToInsert = db.categories.find().toArray();
const products = categoriesToInsert.flatMap(category => {
  const count = Math.floor(Math.random() * 5) + 3; // 每個分類 3-7 個產品
  const productsForCategory = [];
  
  for (let i = 1; i <= count; i++) {
    const product = {
      name: `${category.name} 測試產品 ${i}`,
      description: `${category.name}系列的高品質產品，適合專業車手使用。`,
      price: Math.floor(Math.random() * 9000) + 1000,
      stock: Math.floor(Math.random() * 100) + 10,
      categoryId: category._id,
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

if (products.length > 0) {
  db.products.insertMany(products);
}

// 插入示範經銷商
const dealers = [
  {
    name: '台北自行車行',
    contactName: '王小明',
    email: 'dealer1@example.com',
    password: '$2b$10$Y.bC1I9X9oP3u6TZJFuE8OxbSXYQRbJIWJn.bfL4YFWwGlDJqxX3O', // 預設密碼: dealer123
    phone: '0223456789',
    address: '台北市大安區復興南路一段123號',
    role: 'dealer',
    isActive: true,
    isApproved: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: '高雄單車專賣店',
    contactName: '李小華',
    email: 'dealer2@example.com',
    password: '$2b$10$Y.bC1I9X9oP3u6TZJFuE8OxbSXYQRbJIWJn.bfL4YFWwGlDJqxX3O', // 預設密碼: dealer123
    phone: '0756781234',
    address: '高雄市前鎮區中山二路456號',
    role: 'dealer',
    isActive: true,
    isApproved: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

db.dealers.insertMany(dealers);

// 最後確認訊息
print('MongoDB 初始化完成: 已建立 tripeak-b2b 數據庫與必要集合，並插入示範數據。'); 