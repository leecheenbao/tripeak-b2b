const express = require('express');
const {
  getMessages,
  getMessage,
  createMessage,
  updateMessage,
  deleteMessage,
  sendMessage
} = require('../controllers/line');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// 保護所有路由（必須登錄且必須是管理員）
router.use(protect);
router.use(authorize('admin'));

// LINE 消息管理路由
router.route('/messages')
  .get(getMessages)
  .post(createMessage);

router.route('/messages/:id')
  .get(getMessage)
  .put(updateMessage)
  .delete(deleteMessage);

// 發送消息路由
router.post('/messages/:id/send', sendMessage);

module.exports = router; 