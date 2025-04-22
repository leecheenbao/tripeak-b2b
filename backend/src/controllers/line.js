const LineMessage = require('../models/LineMessage');
const User = require('../models/User');
const lineService = require('../services/line');
const logger = require('../utils/logger');

/**
 * @desc    獲取所有消息模板
 * @route   GET /api/line/messages
 * @access  Private/Admin
 */
exports.getMessages = async (req, res) => {
  try {
    const filter = {};
    
    // 篩選條件
    if (req.query.isTemplate) {
      filter.isTemplate = req.query.isTemplate === 'true';
    }
    
    if (req.query.trigger) {
      filter.trigger = req.query.trigger;
    }
    
    // 獲取消息模板
    const messages = await LineMessage.find(filter)
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name');

    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages
    });
  } catch (err) {
    logger.error(`獲取 LINE 消息失敗: ${err.message}`);
    res.status(500).json({
      success: false,
      error: '獲取 LINE 消息失敗'
    });
  }
};

/**
 * @desc    獲取單個消息模板
 * @route   GET /api/line/messages/:id
 * @access  Private/Admin
 */
exports.getMessage = async (req, res) => {
  try {
    const message = await LineMessage.findById(req.params.id)
      .populate('createdBy', 'name');

    if (!message) {
      return res.status(404).json({
        success: false,
        error: '消息不存在'
      });
    }

    res.status(200).json({
      success: true,
      data: message
    });
  } catch (err) {
    logger.error(`獲取 LINE 消息失敗: ${err.message}`);
    res.status(500).json({
      success: false,
      error: '獲取 LINE 消息失敗'
    });
  }
};

/**
 * @desc    創建消息模板
 * @route   POST /api/line/messages
 * @access  Private/Admin
 */
exports.createMessage = async (req, res) => {
  try {
    const { type, content, title, description, isTemplate, trigger } = req.body;

    // 驗證內容格式
    if (!validateMessageContent(type, content)) {
      return res.status(400).json({
        success: false,
        error: '消息內容格式無效'
      });
    }

    // 如果是模板，檢查觸發器
    if (isTemplate && !trigger) {
      return res.status(400).json({
        success: false,
        error: '模板消息必須指定觸發器'
      });
    }

    // 如果是模板，確保相同觸發器只有一個模板
    if (isTemplate) {
      const existingTemplate = await LineMessage.findOne({ trigger, isTemplate: true });
      if (existingTemplate) {
        return res.status(400).json({
          success: false,
          error: `已存在相同觸發器 ${trigger} 的模板`
        });
      }
    }

    // 創建消息
    const message = await LineMessage.create({
      type,
      content,
      title,
      description,
      isTemplate: isTemplate || false,
      trigger: isTemplate ? trigger : 'manual',
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      data: message
    });
  } catch (err) {
    logger.error(`創建 LINE 消息失敗: ${err.message}`);
    res.status(500).json({
      success: false,
      error: '創建 LINE 消息失敗'
    });
  }
};

/**
 * @desc    更新消息模板
 * @route   PUT /api/line/messages/:id
 * @access  Private/Admin
 */
exports.updateMessage = async (req, res) => {
  try {
    const { type, content, title, description, isTemplate, trigger } = req.body;

    // 查找消息
    const message = await LineMessage.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        error: '消息不存在'
      });
    }

    // 驗證內容格式
    if (type && content && !validateMessageContent(type, content)) {
      return res.status(400).json({
        success: false,
        error: '消息內容格式無效'
      });
    }

    // 如果更改為模板，檢查觸發器
    if (isTemplate && !trigger && !message.trigger) {
      return res.status(400).json({
        success: false,
        error: '模板消息必須指定觸發器'
      });
    }

    // 如果更改觸發器，確保相同觸發器只有一個模板
    if (isTemplate && trigger && trigger !== message.trigger) {
      const existingTemplate = await LineMessage.findOne({ 
        trigger, 
        isTemplate: true,
        _id: { $ne: req.params.id }
      });
      
      if (existingTemplate) {
        return res.status(400).json({
          success: false,
          error: `已存在相同觸發器 ${trigger} 的模板`
        });
      }
    }

    // 更新字段
    if (type) message.type = type;
    if (content) message.content = content;
    if (title !== undefined) message.title = title;
    if (description !== undefined) message.description = description;
    if (isTemplate !== undefined) message.isTemplate = isTemplate;
    if (trigger) message.trigger = trigger;
    
    // 保存更新
    await message.save();

    res.status(200).json({
      success: true,
      data: message
    });
  } catch (err) {
    logger.error(`更新 LINE 消息失敗: ${err.message}`);
    res.status(500).json({
      success: false,
      error: '更新 LINE 消息失敗'
    });
  }
};

/**
 * @desc    刪除消息模板
 * @route   DELETE /api/line/messages/:id
 * @access  Private/Admin
 */
exports.deleteMessage = async (req, res) => {
  try {
    const message = await LineMessage.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        error: '消息不存在'
      });
    }

    // 檢查是否為系統預設模板
    if (message.isTemplate && ['order_created', 'order_processing', 'order_shipped', 'order_completed'].includes(message.trigger)) {
      return res.status(400).json({
        success: false,
        error: '無法刪除系統預設模板'
      });
    }

    await message.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    logger.error(`刪除 LINE 消息失敗: ${err.message}`);
    res.status(500).json({
      success: false,
      error: '刪除 LINE 消息失敗'
    });
  }
};

/**
 * @desc    發送自定義消息
 * @route   POST /api/line/messages/:id/send
 * @access  Private/Admin
 */
exports.sendMessage = async (req, res) => {
  try {
    const { recipients } = req.body;

    // 檢查消息是否存在
    const message = await LineMessage.findById(req.params.id);
    if (!message) {
      return res.status(404).json({
        success: false,
        error: '消息不存在'
      });
    }

    // 檢查接收者
    if (!recipients || recipients.length === 0) {
      return res.status(400).json({
        success: false,
        error: '請指定至少一個接收者'
      });
    }

    // 獲取接收者 LINE ID
    const recipientIds = [];
    
    // 處理特殊接收者
    if (recipients.includes('all_dealers')) {
      const dealers = await User.find({ role: 'dealer', isActive: true });
      dealers.forEach(dealer => {
        if (dealer.lineId) {
          recipientIds.push(dealer.lineId);
        }
      });
    }
    
    if (recipients.includes('all_admins')) {
      const admins = await User.find({ role: 'admin', isActive: true });
      admins.forEach(admin => {
        if (admin.lineId) {
          recipientIds.push(admin.lineId);
        }
      });
    }
    
    // 處理個別用戶
    const userIds = recipients.filter(id => id !== 'all_dealers' && id !== 'all_admins');
    if (userIds.length > 0) {
      const users = await User.find({ _id: { $in: userIds }, isActive: true });
      users.forEach(user => {
        if (user.lineId) {
          recipientIds.push(user.lineId);
        }
      });
    }
    
    // 檢查是否有有效接收者
    if (recipientIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: '沒有有效的接收者 LINE ID'
      });
    }

    // 發送消息
    await lineService.sendCustomMessage(req.params.id, [...new Set(recipientIds)]);

    res.status(200).json({
      success: true,
      data: {
        message: '消息發送成功',
        recipientCount: [...new Set(recipientIds)].length
      }
    });
  } catch (err) {
    logger.error(`發送 LINE 消息失敗: ${err.message}`);
    res.status(500).json({
      success: false,
      error: '發送 LINE 消息失敗'
    });
  }
};

/**
 * 驗證消息內容格式
 */
function validateMessageContent(type, content) {
  try {
    switch (type) {
      case 'text':
        return typeof content === 'string';
        
      case 'flex':
      case 'template':
        return typeof content === 'object' && content !== null;
        
      case 'image':
        return typeof content === 'object' && content !== null && content.url;
        
      default:
        return false;
    }
  } catch (err) {
    return false;
  }
} 