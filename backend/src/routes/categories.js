const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/categories');

// 所有路由都需要認證
router.use(protect);

// 公開路由（需要認證但不需要管理員權限）
router.get('/', getCategories);
router.get('/:id', getCategory);

// 需要管理員權限的路由
router.use(authorize('admin'));
router.post('/', createCategory);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);

module.exports = router;