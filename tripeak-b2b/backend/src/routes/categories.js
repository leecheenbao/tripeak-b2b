const express = require('express');
const {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/categories');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// 公開路由
router.get('/', getCategories);
router.get('/:id', getCategory);

// 保護路由（需要登錄和管理員權限）
router.use(protect);
router.use(authorize('admin'));

// 產品分類管理路由
router.post('/', createCategory);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);

module.exports = router; 