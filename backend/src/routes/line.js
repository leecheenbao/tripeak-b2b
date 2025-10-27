const express = require('express');
const {
  getMessages,
  getMessage,
  createMessage,
  updateMessage,
  deleteMessage,
  sendMessage,
  sendTestMessage
} = require('../controllers/line');
const { protect, authorize } = require('../middleware/auth');
const { handleWebhook, lineWebhookMiddleware } = require('../controllers/webhook');

const router = express.Router();

// Webhook 端點（LINE 專用，不需要身份驗證）
router.post('/webhook', 
  lineWebhookMiddleware,
  handleWebhook
);

// 以下路由需要身份驗證
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

// 發送測試消息
router.post('/test-message', sendTestMessage);


module.exports = router; 