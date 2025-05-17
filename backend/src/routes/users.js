const express = require('express');
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  resetPassword
} = require('../controllers/users');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// 保護所有路由（必須登錄）
router.use(protect);
// 限制只有管理員可以訪問
router.use(authorize('admin'));

// 用戶管理路由
router.route('/')
  .get(getUsers)
  .post(createUser);

router.route('/:id')
  .get(getUser)
  .put(updateUser)
  .delete(deleteUser);

router.put('/:id/resetpassword', resetPassword);

module.exports = router; 