const Category = require('../models/Category');
const Product = require('../models/Product');
const logger = require('../utils/logger');

/**
 * @desc    獲取所有產品分類
 * @route   GET /api/categories
 * @access  Public
 */
exports.getCategories = async (req, res) => {
  try {
    const filter = {};
    
    // 只有管理員可以查看未激活的分類
    if (req.user && req.user.role === 'admin') {
      if (req.query.isActive) {
        filter.isActive = req.query.isActive === 'true';
      }
    } else {
      filter.isActive = true;
    }

    // 先查詢所有分類
    const categories = await Category.find(filter);

    // 顯示個別分類的產品數量
    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        const productCount = await Product.countDocuments({ category: category._id });
        return { ...category._doc, productCount };
      })
    );

    res.status(200).json({
      success: true,
      count: categoriesWithCount.length,
      data: categoriesWithCount
    });
  } catch (err) {
    logger.error(`獲取分類失敗: ${err.message}`);
    console.log(err);
    res.status(500).json({
      success: false,
      error: '獲取分類失敗'
    });
  }
};

/**
 * @desc    獲取單個產品分類
 * @route   GET /api/categories/:id
 * @access  Public
 */
exports.getCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        error: '分類不存在'
      });
    }

    // 非管理員只能查看激活的分類
    if (!category.isActive && (!req.user || req.user.role !== 'admin')) {
      return res.status(404).json({
        success: false,
        error: '分類不存在'
      });
    }

    res.status(200).json({
      success: true,
      data: category
    });
  } catch (err) {
    logger.error(`獲取分類失敗: ${err.message}`);
    res.status(500).json({
      success: false,
      error: '獲取分類失敗'
    });
  }
};

/**
 * @desc    創建產品分類
 * @route   POST /api/categories
 * @access  Private/Admin
 */
exports.createCategory = async (req, res) => {
  try {
    const { name, description, isActive, displayOrder } = req.body;

    const category = await Category.create({
      name,
      description,
      isActive: isActive !== undefined ? isActive : true,
      displayOrder: displayOrder || 0
    });

    res.status(201).json({
      success: true,
      data: category
    });
  } catch (err) {
    logger.error(`創建分類失敗: ${err.message}`);
    res.status(500).json({
      success: false,
      error: '創建分類失敗'
    });
  }
};

/**
 * @desc    更新產品分類
 * @route   PUT /api/categories/:id
 * @access  Private/Admin
 */
exports.updateCategory = async (req, res) => {
  try {
    const { name, description, isActive, displayOrder } = req.body;

    const fieldsToUpdate = {
      name,
      description,
      isActive,
      displayOrder
    };

    // 過濾掉未提供的欄位
    Object.keys(fieldsToUpdate).forEach(key => {
      if (fieldsToUpdate[key] === undefined) {
        delete fieldsToUpdate[key];
      }
    });

    const category = await Category.findByIdAndUpdate(req.params.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        error: '分類不存在'
      });
    }

    res.status(200).json({
      success: true,
      data: category
    });
  } catch (err) {
    logger.error(`更新分類失敗: ${err.message}`);
    res.status(500).json({
      success: false,
      error: '更新分類失敗'
    });
  }
};

/**
 * @desc    刪除產品分類
 * @route   DELETE /api/categories/:id
 * @access  Private/Admin
 */
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        error: '分類不存在'
      });
    }

    // 檢查是否有產品使用此分類
    const productCount = await Product.countDocuments({ category: req.params.id });
    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        error: `無法刪除，此分類下有 ${productCount} 個產品`
      });
    }

    await category.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    logger.error(`刪除分類失敗: ${err.message}`);
    res.status(500).json({
      success: false,
      error: '刪除分類失敗'
    });
  }
}; 