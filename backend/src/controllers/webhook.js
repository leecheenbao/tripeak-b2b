const line = require('@line/bot-sdk');
const nluService = require('../services/nlu');
const lineService = require('../services/line');
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');
const logger = require('../utils/logger');

// LINE Bot 配置
const clientConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET
};

const client = new line.Client(clientConfig);
const middleware = line.middleware(clientConfig);

/**
 * LINE Webhook 處理中間件
 */
exports.lineWebhookMiddleware = middleware;

/**
 * 處理 Webhook 事件
 */
exports.handleWebhook = async (req, res) => {
  try {
    const events = req.body.events;

    // 處理所有事件
    await Promise.all(
      events.map(async (event) => {
        try {
          await handleEvent(event);
        } catch (err) {
          logger.error(`處理事件失敗: ${err.message}`, event);
        }
      })
    );

    res.status(200).send('OK');
  } catch (err) {
    logger.error(`Webhook 處理失敗: ${err.message}`);
    res.status(500).send('Error');
  }
};

/**
 * 處理單個事件
 */
async function handleEvent(event) {
  // 只處理消息事件
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  const { userId } = event.source;
  const userMessage = event.message.text;

  logger.info(`收到來自 ${userId} 的消息: ${userMessage}`);

  // 獲取或創建對話
  let conversation = await Conversation.findOne({ lineId: userId });
  if (!conversation) {
    // 嘗試找到對應的用戶
    const user = await User.findOne({ lineId: userId });
    console.log(user);
    if (user) {
      conversation = await Conversation.create({
        userId: user._id,
        lineId: userId,
        currentState: 'idle',
        messageHistory: []
      });
    } else {
      // 用戶未註冊，返回 LINE User ID 和註冊提示
      // 注意：需要 replyToken，從 event 中獲取
      if (event.replyToken) {
        const lineUserId = userId;
        logger.info(`未註冊用戶的 LINE User ID: ${lineUserId}`);
        
        await replyMessage(event.replyToken, `您好！您的 LINE User ID 是：\n\n${lineUserId}\n\n請將此 ID 提供給管理員完成註冊，或者在前端介面手動綁定此 ID 到您的帳號。`);
      } else {
        logger.warn('用戶未註冊，但無法獲取 replyToken');
      }
      return;
    }
  }

  // 添加用戶消息到歷史
  conversation.messageHistory.push({
    role: 'user',
    content: userMessage,
    timestamp: new Date()
  });

  // 使用 NLU 理解意圖
  const nluResult = await nluService.understandIntent(userMessage, {
    currentState: conversation.currentState,
    context: conversation.context
  });

  // 處理意圖
  const response = await handleIntent(nluResult, conversation, event);

  // 添加助手回復到歷史
  if (response && response.text) {
    conversation.messageHistory.push({
      role: 'assistant',
      content: response.text,
      timestamp: new Date()
    });
  }

  // 更新對話狀態
  conversation.lastMessage = userMessage;
  conversation.currentState = response.state || conversation.currentState;
  conversation.context = response.context || conversation.context;

  await conversation.save();

  // 發送回復
  if (response && response.text) {
    await replyMessage(event.replyToken, response.text);
  }
}

/**
 * 處理意圖並生成回應
 */
async function handleIntent(nluResult, conversation, event) {
  const { intent, entities, message } = nluResult;

  switch (intent) {
    case 'greeting':
      return {
        text: message,
        state: 'idle'
      };

    case 'get_help':
      return {
        text: message,
        state: 'idle'
      };

    case 'query_order':
      return await handleQueryOrder(entities, conversation, event);

    case 'query_product':
      return await handleQueryProduct(entities, conversation, event);

    case 'query_stock':
      return await handleQueryStock(entities, conversation, event);

    case 'contact_support':
      return {
        text: '您想要聯繫客服嗎？請撥打 0800-123-456 或發送郵件至 support@tripeak.com',
        state: 'idle'
      };

    case 'get_line_user_id':
      return {
        text: `您的 LINE User ID 是：\n\n${get33DigitLineUserId(conversation.lineId)}\n\n請將此 ID 提供給管理員完成註冊，或者在前端介面手動綁定此 ID 到您的帳號。`,
        state: 'idle'
      };

    case 'unclear':
    default:
      return {
        text: message,
        state: conversation.currentState
      };
  }
}

/**
 * 處理訂單查詢意圖
 */
async function handleQueryOrder(entities, conversation, event) {
  if (conversation.currentState === 'waiting_order_number') {
    // 用戶提供了訂單號
    return await fetchOrderByNumber(entities.orderNumber || conversation.lastMessage);
  }

  if (entities.orderNumber) {
    // 直接提取到訂單號
    return await fetchOrderByNumber(entities.orderNumber);
  }

  // 需要詢問訂單號
  conversation.currentState = 'waiting_order_number';
  return {
    text: '請提供您的訂單編號，我將為您查詢訂單資訊。',
    state: 'waiting_order_number'
  };
}

/**
 * 獲取訂單資訊
 */
async function fetchOrderByNumber(orderNumber) {
  try {
    const order = await Order.findOne({ orderNumber })
      .populate('dealer', 'companyName contactName email')
      .populate('items.product', 'name sku price');

    if (!order) {
      return {
        text: `抱歉，找不到訂單編號為 ${orderNumber} 的訂單。請確認訂單編號是否正確。`,
        state: 'idle'
      };
    }

    const itemsText = order.items.map(item => 
      `・${item.product.name} x ${item.quantity}${item.unit || '件'}`
    ).join('\n');

    return {
      text: `訂單資訊：\n\n訂單編號：${order.orderNumber}\n狀態：${getOrderStatusText(order.status)}\n下單時間：${new Date(order.createdAt).toLocaleString('zh-TW')}\n\n訂單明細：\n${itemsText}\n\n總額：${order.totalAmount} 元`,
      state: 'idle'
    };
  } catch (error) {
    logger.error(`查詢訂單失敗: ${error.message}`);
    return {
      text: '查詢訂單時發生錯誤，請稍後再試。',
      state: 'idle'
    };
  }
}

/**
 * 處理產品查詢意圖
 */
async function handleQueryProduct(entities, conversation, event) {
  if (!entities.productName && !entities.categoryName) {
    return {
      text: '請告訴我您想查詢的產品名稱或分類，例如「牙盤」、「曲柄」等。',
      state: 'waiting_product_query'
    };
  }

  try {
    const query = {};
    if (entities.productName) {
      query.name = { $regex: entities.productName, $options: 'i' };
    }
    if (entities.categoryName) {
      query.categoryName = entities.categoryName;
    }

    const products = await Product.find(query).limit(5);

    if (products.length === 0) {
      return {
        text: '抱歉，找不到相關產品。',
        state: 'idle'
      };
    }

    const productsText = products.map(p => 
      `・${p.name} - ${p.price} 元 (庫存：${p.stockQuantity})`
    ).join('\n');

    return {
      text: `找到以下產品：\n\n${productsText}\n\n共找到 ${products.length} 個產品。`,
      state: 'idle'
    };
  } catch (error) {
    logger.error(`查詢產品失敗: ${error.message}`);
    return {
      text: '查詢產品時發生錯誤，請稍後再試。',
      state: 'idle'
    };
  }
}

/**
 * 處理庫存查詢意圖
 */
async function handleQueryStock(entities, conversation, event) {
  if (!entities.productName) {
    return {
      text: '請告訴我您想查詢庫存的產品名稱。',
      state: 'waiting_stock_query'
    };
  }

  try {
    const product = await Product.findOne({ 
      name: { $regex: entities.productName, $options: 'i' } 
    });

    if (!product) {
      return {
        text: `抱歉，找不到名稱為「${entities.productName}」的產品。`,
        state: 'idle'
      };
    }

    const stockStatus = product.stockQuantity > 0 
      ? `目前庫存充足（${product.stockQuantity} 件）`
      : '目前缺貨中';

    return {
      text: `產品：${product.name}\n${stockStatus}\n價格：${product.price} 元`,
      state: 'idle'
    };
  } catch (error) {
    logger.error(`查詢庫存失敗: ${error.message}`);
    return {
      text: '查詢庫存時發生錯誤，請稍後再試。',
      state: 'idle'
    };
  }
}

/**
 * 取得 當前用戶 33 碼的 LINE User ID
 */
function get33DigitLineUserId(userId) {
  return userId.substring(0, 33);
}



/**
 * 發送文字消息回復
 */
async function replyMessage(replyToken, text) {
  logger.info(`準備發送回復消息 - Token: ${replyToken}, Text: ${text}`);
  if (!replyToken) {
    logger.error('Reply Token 為空，無法發送消息');
    throw new Error('Reply Token 為空');
  }
  
  if (!text) {
    logger.error('消息內容為空');
    throw new Error('消息內容為空');
  }
  
    try {
    // 根據 LINE Bot SDK，replyMessage 需要傳遞 reply token 和消息陣列
    const messages = [{
      type: 'text',
      text: text
    }];
    
    const result = await client.replyMessage(replyToken, messages);
    
    logger.info('回復消息發送成功');
    return result;
  } catch (error) {
    logger.error(`發送回復消息失敗: ${error.message}`);
    
    // 記錄詳細錯誤信息
    if (error.response) {
      logger.error(`LINE API 錯誤狀態: ${error.response.status}`);
      logger.error(`LINE API 請求 URL: ${error.config?.url}`);
      if (error.response.data) {
        logger.error(`LINE API 錯誤資料: ${JSON.stringify(error.response.data, null, 2)}`);
      } else {
        logger.error(`LINE API 無詳細資料: ${error.response.statusText}`);
      }
    } else if (error.request) {
      logger.error(`無法連接到 LINE API`);
    }
    
    // 不拋出錯誤，避免中斷整個 webhook 處理
    // throw error;
  }
}


/**
 * 獲取訂單狀態中文
 */
function getOrderStatusText(status) {
  const statusMap = {
    'pending': '待處理',
    'processing': '處理中',
    'shipped': '已出貨',
    'completed': '已完成',
    'cancelled': '已取消'
  };
  return statusMap[status] || status;
}

