const express = require('express');
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage,
  getProductImage
} = require('../controllers/products');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// 公開路由
router.get('/', getProducts);
router.get('/:id', getProduct);
router.get('/:id/image', getProductImage);

// 保護路由（需要登錄和管理員權限）
router.use(protect);
router.use(authorize('admin'));

// 產品管理路由
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);
router.put('/:id/upload', uploadProductImage);

module.exports = router; 