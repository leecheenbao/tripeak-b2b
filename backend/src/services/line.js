const line = require('@line/bot-sdk');
const User = require('../models/User');
const LineMessage = require('../models/LineMessage');
const logger = require('../utils/logger');

// LINE Bot 客戶端配置
const lineConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET
};

// 創建 LINE Bot 客戶端實例
const lineClient = new line.Client(lineConfig);

/**
 * 發送訂單相關通知
 */
exports.sendOrderNotification = async (trigger, order) => {
  try {
    // 查找對應的消息模板
    const messageTemplate = await LineMessage.findOne({ trigger, isTemplate: true });
    
    if (!messageTemplate) {
      logger.warn(`沒有找到 ${trigger} 類型的消息模板`);
      return;
    }

    // 獲取要發送通知的用戶列表
    const recipientIds = [];
    
    // 獲取管理員 LINE ID（需發送給所有管理員）
    const admins = await User.find({ role: 'admin', isActive: true });
    admins.forEach(admin => {
      if (admin.lineId) {
        recipientIds.push(admin.lineId);
      }
    });
    
    // 添加訂單對應的經銷商 ID
    if (order.dealer.lineId) {
      recipientIds.push(order.dealer.lineId);
    }
    
    // 移除重複 ID
    const uniqueRecipients = [...new Set(recipientIds)];
    
    if (uniqueRecipients.length === 0) {
      logger.warn('沒有可發送通知的接收者');
      return;
    }

    // 處理消息中的動態變量
    let messageContent = processMessageVariables(messageTemplate.content, order);
    
    // 遍歷接收者並發送消息
    for (const lineId of uniqueRecipients) {
      try {
        switch (messageTemplate.type) {
          case 'text':
            await lineClient.pushMessage(lineId, {
              type: 'text',
              text: messageContent
            });
            break;
          
          case 'flex':
            await lineClient.pushMessage(lineId, {
              type: 'flex',
              altText: messageTemplate.title || '訂單通知',
              contents: messageContent
            });
            break;
            
          case 'template':
            await lineClient.pushMessage(lineId, {
              type: 'template',
              altText: messageTemplate.title || '訂單通知',
              template: messageContent
            });
            break;
            
          case 'image':
            await lineClient.pushMessage(lineId, {
              type: 'image',
              originalContentUrl: messageContent.url,
              previewImageUrl: messageContent.previewUrl || messageContent.url
            });
            break;
        }
        
        logger.info(`已成功發送 ${trigger} 通知給 ${lineId}`);
      } catch (pushError) {
        logger.error(`無法發送 LINE 通知至 ${lineId}: ${pushError.message}`);
      }
    }
  } catch (err) {
    logger.error(`發送訂單通知失敗: ${err.message}`);
    throw err;
  }
};

/**
 * 發送自定義消息
 */
exports.sendCustomMessage = async (messageId, recipientIds) => {
  try {
    // 查找消息
    const message = await LineMessage.findById(messageId);
    if (!message) {
      throw new Error('消息不存在');
    }
    
    // 確保接收者不為空
    if (!recipientIds || recipientIds.length === 0) {
      throw new Error('未指定接收者');
    }
    
    // 遍歷接收者並發送消息
    for (const lineId of recipientIds) {
      try {
        switch (message.type) {
          case 'text':
            await lineClient.pushMessage(lineId, {
              type: 'text',
              text: message.content
            });
            break;
          
          case 'flex':
            await lineClient.pushMessage(lineId, {
              type: 'flex',
              altText: message.title || '自定義通知',
              contents: message.content
            });
            break;
            
          case 'template':
            await lineClient.pushMessage(lineId, {
              type: 'template',
              altText: message.title || '自定義通知',
              template: message.content
            });
            break;
            
          case 'image':
            await lineClient.pushMessage(lineId, {
              type: 'image',
              originalContentUrl: message.content.url,
              previewImageUrl: message.content.previewUrl || message.content.url
            });
            break;
        }
        
        logger.info(`已成功發送自定義消息 ${messageId} 給 ${lineId}`);
      } catch (pushError) {
        logger.error(`無法發送 LINE 消息至 ${lineId}: ${pushError.message}`);
      }
    }
    
    return true;
  } catch (err) {
    logger.error(`發送自定義消息失敗: ${err.message}`);
    throw err;
  }
};

/**
 * 處理消息中的動態變量
 */
function processMessageVariables(content, order) {
  if (typeof content === 'string') {
    // 替換文本消息中的變量
    let processedText = content;
    processedText = processedText.replace(/\{orderNumber\}/g, order.orderNumber);
    processedText = processedText.replace(/\{dealerName\}/g, order.dealer.name);
    processedText = processedText.replace(/\{companyName\}/g, order.dealer.companyName);
    processedText = processedText.replace(/\{totalAmount\}/g, order.totalAmount);
    processedText = processedText.replace(/\{status\}/g, translateStatus(order.status));
    processedText = processedText.replace(/\{createdAt\}/g, 
      new Date(order.createdAt).toLocaleDateString('zh-TW')
    );
    
    // 處理訂單項目清單
    if (processedText.includes('{items}')) {
      const itemsList = order.items.map(item => 
        `${item.name} x ${item.quantity}${item.unit || '件'}`
      ).join('\n');
      processedText = processedText.replace(/\{items\}/g, itemsList);
    }
    
    return processedText;
  } else if (typeof content === 'object') {
    // 深複製對象以避免修改原始模板
    const processedContent = JSON.parse(JSON.stringify(content));
    
    // 遞歸處理對象中的所有字符串屬性
    processObjectVariables(processedContent, order);
    
    return processedContent;
  }
  
  return content;
}

/**
 * 遞歸處理對象中的動態變量
 */
function processObjectVariables(obj, order) {
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      // 替換字符串變量
      let processedText = obj[key];
      processedText = processedText.replace(/\{orderNumber\}/g, order.orderNumber);
      processedText = processedText.replace(/\{dealerName\}/g, order.dealer.name);
      processedText = processedText.replace(/\{companyName\}/g, order.dealer.companyName);
      processedText = processedText.replace(/\{totalAmount\}/g, order.totalAmount);
      processedText = processedText.replace(/\{status\}/g, translateStatus(order.status));
      processedText = processedText.replace(/\{createdAt\}/g, 
        new Date(order.createdAt).toLocaleDateString('zh-TW')
      );
      
      // 處理訂單項目清單
      if (processedText.includes('{items}')) {
        const itemsList = order.items.map(item => 
          `${item.name} x ${item.quantity}${item.unit || '件'}`
        ).join('\n');
        processedText = processedText.replace(/\{items\}/g, itemsList);
      }
      
      obj[key] = processedText;
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      // 遞歸處理嵌套對象
      processObjectVariables(obj[key], order);
    }
  }
}

/**
 * 將訂單狀態轉換為中文
 */
function translateStatus(status) {
  switch (status) {
    case 'pending':
      return '待處理';
    case 'processing':
      return '處理中';
    case 'shipped':
      return '已出貨';
    case 'completed':
      return '已完成';
    case 'cancelled':
      return '已取消';
    default:
      return status;
  }
} 