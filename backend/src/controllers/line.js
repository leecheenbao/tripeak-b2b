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
 * 發送測試消息
 * 
 * 注意：
 * - pushMessage 需要用戶已成為好友
 * - replyMessage 需要 replyToken（只能透過 webhook 回覆）
 * - 最佳測試方式：讓用戶在 LINE 中發送消息，系統自動回覆
 */
exports.sendTestMessage = async (req, res) => {
  try {
    const { lineId } = req.body;
    const user = req.user;

    // 如果沒有傳入 lineId，使用當前用戶的 lineId
    const targetLineId = lineId || user.lineId;

    if (!targetLineId) {
      return res.status(400).json({
        success: false,
        error: '請提供 LINE User ID'
      });
    }

    // 檢查環境變數
    if (!process.env.LINE_CHANNEL_ACCESS_TOKEN || !process.env.LINE_CHANNEL_SECRET) {
      logger.error('LINE Bot 環境變數未配置');
      return res.status(500).json({
        success: false,
        error: 'LINE Bot 環境變數未配置'
      });
    }
    
    // 使用 LINE Bot 客戶端發送測試消息
    const line = require('@line/bot-sdk');
    const lineClient = new line.Client({
      channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
      channelSecret: process.env.LINE_CHANNEL_SECRET
    });

    logger.info(`嘗試發送測試消息給 ${targetLineId}`);

    // 方法 1: 使用 pushMessage（推播消息）
    // 根據 LINE Bot SDK，消息可以是單個對象或陣列
    const message = {
      type: 'text',
      text: `這是來自 TRiPEAK B2B 系統的測試消息！

訊息時間：${new Date().toLocaleString('zh-TW')}
綁定帳號：${user.email}

如果您收到此消息，表示 LINE Bot 綁定成功！`
    };

    logger.info(`準備發送消息給 User ID: ${targetLineId}`);
    logger.info(`消息類型: ${message.type}`);
    logger.info(`Channel Access Token 開頭: ${process.env.LINE_CHANNEL_ACCESS_TOKEN?.substring(0, 20)}...`);
    logger.info(`Channel Secret: ${process.env.LINE_CHANNEL_SECRET?.substring(0, 10)}...`);

    try {
      logger.info(`使用 pushMessage 發送給 User ID: ${targetLineId}`);
      logger.info(`消息內容: ${message.text.substring(0, 50)}...`);
      
      // 使用 pushMessage 發送消息（單個消息對象）
      const result = await lineClient.pushMessage(targetLineId, message);
      logger.info(`成功使用 pushMessage 發送消息: ${JSON.stringify(result)}`);
      
      res.status(200).json({
        success: true,
        message: '測試消息已發送'
      });
    } catch (pushError) {
      logger.error(`pushMessage 失敗: ${pushError.message}`);
      logger.error(`錯誤堆疊: ${pushError.stack}`);
      
      // 記錄詳細錯誤
      if (pushError.response) {
        logger.error(`錯誤狀態碼: ${pushError.response.status}`);
        logger.error(`錯誤標頭: ${JSON.stringify(pushError.response.headers)}`);
        logger.error(`錯誤數據: ${JSON.stringify(pushError.response.data)}`);
        logger.error(`請求 URL: ${pushError.request?.responseURL || pushError.config?.url}`);
        logger.error(`請求方法: ${pushError.config?.method}`);
        logger.error(`請求標頭: ${JSON.stringify(pushError.config?.headers)}`);
        if (pushError.config?.data) {
          logger.error(`請求數據類型: ${typeof pushError.config.data}`);
          logger.error(`請求數據: ${JSON.stringify(pushError.config.data)}`);
        }
      } else {
        logger.error(`錯誤對象: ${JSON.stringify(pushError)}`);
      }
      
      // LINE API 400 錯誤通常是因為用戶未成為好友
      if (pushError.response && pushError.response.status === 400) {
        const errorData = pushError.response.data || {};
        logger.error(`LINE API 400 錯誤詳情: ${JSON.stringify(errorData, null, 2)}`);
        
        // 返回友好的錯誤訊息，但不拋出異常
        return res.status(200).json({
          success: false,
          message: '測試消息發送失敗',
          error: `無法發送消息。可能原因：
1. 用戶尚未將機器人加為好友（最常見）
2. User ID 不正確
3. Messaging API 未啟用

請在 LINE 中找到機器人並加為好友後再試。`,
          details: errorData
        });
      }
      
      throw pushError;
    }
  } catch (err) {
    logger.error(`發送測試消息失敗: ${err.message}`);
    logger.error(`詳細錯誤: ${err.stack}`);
    
    // 提供更詳細的錯誤信息
    let errorMessage = '發送測試消息失敗';
    
    if (err.response) {
      // LINE API 返回的錯誤
      logger.error(`LINE API 錯誤狀態: ${err.response.status}`);
      if (err.response.data) {
        logger.error(`LINE API 錯誤資料: ${JSON.stringify(err.response.data, null, 2)}`);
        errorMessage = `LINE API 錯誤 (${err.response.status}): ${JSON.stringify(err.response.data)}`;
      } else {
        logger.error(`LINE API 沒有返回錯誤資料`);
        errorMessage = `LINE API 錯誤 (${err.response.status}): 無詳細信息`;
      }
    } else if (err.request) {
      logger.error(`LINE API 請求失敗，無響應: ${JSON.stringify(err.request)}`);
      errorMessage = '無法連接到 LINE API';
    } else {
      errorMessage = err.message || '未知錯誤';
    }
    
    res.status(500).json({
      success: false,
      error: errorMessage
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