const express = require('express');
const {
  getOrders,
  getOrder,
  createOrder,
  updateOrderStatus,
  updateOrder,
  deleteOrder,
  exportOrders,
  getDashboardSummary
} = require('../controllers/orders');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// 保護所有路由（必須登錄）
router.use(protect);

// 普通用戶和管理員都可以訪問的路由
router.get('/', getOrders);
router.get('/:id', getOrder);
router.post('/', createOrder);
router.get('/dashboard/summary', getDashboardSummary);

// 僅管理員可以訪問的路由
router.get('/export', authorize('admin'), exportOrders);
router.put('/:id/status', authorize('admin'), updateOrderStatus);
router.put('/:id', authorize('admin'), updateOrder);
router.delete('/:id', authorize('admin'), deleteOrder);

module.exports = router; 