const Product = require('../models/Product');
const Category = require('../models/Category');
const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs');
const express = require('express');
const fileUpload = require('express-fileupload');

const app = express();
app.use(fileUpload());

/**
 * @desc    獲取所有產品
 * @route   GET /api/products
 * @access  Public
 */
exports.getProducts = async (req, res) => {
  try {
    const filter = {};
    
    // 分類篩選
    if (req.query.category) {
      filter.category = req.query.category;
    }

    // 活躍狀態篩選（管理員可以查看所有產品，經銷商只能查看活躍產品）
    if (req.user && req.user.role === 'admin') {
      if (req.query.isActive) {
        filter.isActive = req.query.isActive === 'true';
      }
    } else {
      filter.isActive = true;
    }

    // 搜尋關鍵字
    if (req.query.keyword) {
      filter.$or = [
        { name: { $regex: req.query.keyword, $options: 'i' } },
        { description: { $regex: req.query.keyword, $options: 'i' } },
        { sku: { $regex: req.query.keyword, $options: 'i' } }
      ];
    }

    // 分類
    if (req.query.category_id) {
      filter.category = req.query.category_id;
    }

    // 價格範圍
    if (req.query.min_price && req.query.max_price) {
      filter.price = { $gte: req.query.min_price, $lte: req.query.max_price };
    }
    
    // 分頁設置
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    // 排序設置
    let sort = {};
    switch (req.query.sort) {
      case 'newest':
        sort = { createdAt: -1 };
        break;
      case 'price:desc':
        sort = { price: -1 };
        break;
      case 'price:asc':
        sort = { price: -1 };
        break;
      case 'name:asc':
        sort = { name: 1 };
        break;
      case 'name:desc':
        sort = { name: -1 };
        break;
      case 'stockQuantity:asc':
        sort = { stockQuantity: 1 };
        break;
      case 'stockQuantity:desc':
        sort = { stockQuantity: -1 };
        break;
      default:
        sort = { displayOrder: 1, name: 1 };
    }

    // 執行查詢 - 忽略 image 欄位
    const products = await Product.find(filter)
      .select('-image') // 忽略 image 欄位
      .populate('category', 'name')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    // 獲取總數
    const total = await Product.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: products.length,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      },
      data: products
    });
  } catch (err) {
    logger.error(`獲取產品列表失敗: ${err.message}`);
    res.status(500).json({
      success: false,
      error: '獲取產品列表失敗'
    });
  }
};

/**
 * @desc    獲取單個產品
 * @route   GET /api/products/:id
 * @access  Public
 */
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('category', 'name');

    if (!product) {
      return res.status(404).json({
        success: false,
        error: '產品不存在'
      });
    }

    // 非管理員只能查看激活的產品
    if (!product.isActive && (!req.user || req.user.role !== 'admin')) {
      return res.status(404).json({
        success: false,
        error: '產品不存在'
      });
    }

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (err) {
    logger.error(`獲取產品詳情失敗: ${err.message}`);
    res.status(500).json({
      success: false,
      error: '獲取產品詳情失敗'
    });
  }
};

/**
 * @desc    創建產品
 * @route   POST /api/products
 * @access  Private/Admin
 */
exports.createProduct = async (req, res) => {
  try {
    const { 
      name, 
      description, 
      sku, 
      price, 
      stockQuantity, 
      category: categoryId, 
      isActive, 
      displayOrder,
      unit
    } = req.body;

    // 檢查分類是否存在
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(400).json({
        success: false,
        error: '分類不存在'
      });
    }

    // 創建產品
    const product = await Product.create({
      name,
      description,
      sku,
      price,
      stockQuantity: stockQuantity || 0,
      category: categoryId,
      isActive: isActive !== undefined ? isActive : true,
      displayOrder: displayOrder || 0,
      unit: unit || '件'
    });

    res.status(201).json({
      success: true,
      data: product
    });
  } catch (err) {
    logger.error(`創建產品失敗: ${err.message}`);
    res.status(500).json({
      success: false,
      error: '創建產品失敗'
    });
  }
};

/**
 * @desc    更新產品
 * @route   PUT /api/products/:id
 * @access  Private/Admin
 */
exports.updateProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      sku,
      price,
      stockQuantity,
      category: categoryId,
      isActive,
      displayOrder,
      unit
    } = req.body;

    const fieldsToUpdate = {
      name,
      description,
      sku,
      price,
      stockQuantity,
      category: categoryId,
      isActive,
      displayOrder,
      unit
    };

    // 過濾掉未提供的欄位
    Object.keys(fieldsToUpdate).forEach(key => {
      if (fieldsToUpdate[key] === undefined) {
        delete fieldsToUpdate[key];
      }
    });

    // 如果有更新分類，檢查分類是否存在
    if (categoryId) {
      const category = await Category.findById(categoryId);
      if (!category) {
        return res.status(400).json({
          success: false,
          error: '分類不存在'
        });
      }
    }

    // 更新產品
    const product = await Product.findByIdAndUpdate(req.params.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    }).populate('category', 'name');

    if (!product) {
      return res.status(404).json({
        success: false,
        error: '產品不存在'
      });
    }

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (err) {
    logger.error(`更新產品失敗: ${err.message}`);
    res.status(500).json({
      success: false,
      error: '更新產品失敗'
    });
  }
};

/**
 * @desc    刪除產品
 * @route   DELETE /api/products/:id
 * @access  Private/Admin
 */
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: '產品不存在'
      });
    }

    await product.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    logger.error(`刪除產品失敗: ${err.message}`);
    res.status(500).json({
      success: false,
      error: '刪除產品失敗'
    });
  }
};

/**
 * @desc    上傳產品圖片
 * @route   PUT /api/products/:id/upload
 * @access  Private/Admin
 */
exports.uploadProductImage = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: '產品不存在'
      });
    }

    if (!req.files || !req.files.image) {
      return res.status(400).json({
        success: false,
        error: '請上傳圖片'
      });
    }

    const file = req.files.image;

    // 確保文件是圖片
    if (!file.mimetype.startsWith('image')) {
      return res.status(400).json({
        success: false,
        error: '請上傳圖片格式文件'
      });
    }

    // 檢查文件大小
    if (file.size > process.env.MAX_FILE_SIZE) {
      return res.status(400).json({
        success: false,
        error: `圖片大小不能超過 ${process.env.MAX_FILE_SIZE / 1000000} MB`
      });
    }

    // 將圖片 buffer 及 mimetype 存入資料庫
    product.image = file.data; // file.data 為 Buffer
    product.imageType = file.mimetype;
    await product.save();

    res.status(200).json({
      success: true,
      data: {
        message: '圖片已儲存於資料庫'
      }
    });
  } catch (err) {
    logger.error(`上傳產品圖片失敗: ${err.message}`);
    console.log(err)
    res.status(500).json({
      success: false,
      error: '上傳產品圖片失敗'
    });
  }
};

// 取得產品圖片
exports.getProductImage = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product || !product.image) {
      // 沒有圖片時回傳 404
      return res.status(404).send('找不到圖片');
    }
    res.set('Content-Type', product.imageType);
    res.send(product.image);
  } catch (err) {
    res.status(500).send('讀取圖片失敗');
  }
};