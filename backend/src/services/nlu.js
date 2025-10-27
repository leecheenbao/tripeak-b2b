const logger = require('../utils/logger');
const axios = require('axios');

/**
 * NLU 服務配置
 */
const NLU_PROVIDERS = {
  OPENAI: 'openai',
  LOCAL: 'local',
  GOOGLE: 'google',
  DIALOGFLOW: 'dialogflow'
};

// 當前使用的 NLU 提供商
const currentProvider = process.env.NLU_PROVIDER || NLU_PROVIDERS.OPENAI;

/**
 * NLU 服務主類
 */
class NLUService {
  constructor() {
    this.provider = currentProvider;
    this.providers = {
      [NLU_PROVIDERS.OPENAI]: new OpenAINLU(),
      [NLU_PROVIDERS.LOCAL]: new LocalNLU(),
      [NLU_PROVIDERS.GOOGLE]: new GoogleNLU(),
      [NLU_PROVIDERS.DIALOGFLOW]: new DialogflowNLU()
    };
  }

  /**
   * 理解用戶意圖
   */
  async understandIntent(message, context = {}) {
    try {
      const provider = this.providers[this.provider];
      if (!provider) {
        throw new Error(`不支持的 NLU 提供商: ${this.provider}`);
      }

      const result = await provider.understandIntent(message, context);
      logger.info(`NLU 分析結果: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      logger.error(`NLU 分析失敗: ${error.message}`);
      // 降級到基礎規則匹配
      return this.fallbackUnderstanding(message);
    }
  }

  /**
   * 降級到基礎規則匹配
   */
  fallbackUnderstanding(message) {
    const lowerMessage = message.toLowerCase();

    // 訂單查詢意圖
    if (lowerMessage.includes('訂單') || lowerMessage.includes('order')) {
      if (lowerMessage.includes('查詢') || lowerMessage.includes('查') || lowerMessage.includes('看')) {
        return {
          intent: 'query_order',
          confidence: 0.8,
          entities: this.extractOrderNumber(lowerMessage),
          message: '我將幫您查詢訂單資訊'
        };
      }
    }

    // 產品查詢意圖
    if (lowerMessage.includes('產品') || lowerMessage.includes('商品') || lowerMessage.includes('product')) {
      if (lowerMessage.includes('查詢') || lowerMessage.includes('查') || lowerMessage.includes('有')) {
        return {
          intent: 'query_product',
          confidence: 0.8,
          entities: {},
          message: '我將幫您搜尋產品'
        };
      }
    }

    // 庫存查詢意圖
    if (lowerMessage.includes('庫存') || lowerMessage.includes('stock')) {
      return {
        intent: 'query_stock',
        confidence: 0.7,
        entities: this.extractProductName(lowerMessage),
        message: '我將幫您查詢庫存資訊'
      };
    }

    // 問候意圖
    if (lowerMessage.includes('你好') || lowerMessage.includes('嗨') || lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      return {
        intent: 'greeting',
        confidence: 0.9,
        entities: {},
        message: '您好！我是 TRiPEAK 客服助手，很高興為您服務！'
      };
    }

    // 幫助意圖
    if (lowerMessage.includes('幫助') || lowerMessage.includes('help') || lowerMessage.includes('功能')) {
      return {
        intent: 'get_help',
        confidence: 0.8,
        entities: {},
        message: '我可以幫您：\n1. 查詢訂單資訊\n2. 搜尋產品\n3. 查詢庫存\n4. 聯繫客服\n5. 查看聯繫 Line ID \n請告訴我您需要什麼協助？'
      };
    }

    // 預設：不理解
    return {
      intent: 'unclear',
      confidence: 0.5,
      entities: {},
      message: '抱歉，我不太理解您的意思。您可以說「訂單查詢」、「產品搜尋」或「幫助」來獲取協助。'
    };
  }

  /**
   * 提取訂單號
   */
  extractOrderNumber(message) {
    const orderMatch = message.match(/[A-Z0-9]{6,}/);
    return {
      orderNumber: orderMatch ? orderMatch[0] : null
    };
  }

  /**
   * 提取產品名稱
   */
  extractProductName(message) {
    // 簡單的關鍵詞提取
    const keywords = ['牙盤', '曲柄', '導輪', '螺絲'];
    for (const keyword of keywords) {
      if (message.includes(keyword)) {
        return { productName: keyword };
      }
    }
    return {};
  }
}

/**
 * OpenAI GPT NLU 實現
 */
class OpenAINLU {
  async understandIntent(message, context) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('未設置 OPENAI_API_KEY');
    }

    try {
      const systemPrompt = `你是一個專業的自行車零件 B2B 客服助手。幫助用戶理解意圖並提取關鍵信息。

用戶意圖類型：
1. query_order - 查詢訂單（提取訂單號）
2. query_product - 查詢產品（提取產品名稱）
3. query_stock - 查詢庫存（提取產品名稱）
4. greeting - 問候
5. get_help - 獲取幫助
6. contact_support - 聯繫客服
7. unclear - 無法理解

請回應 JSON 格式：
{
  "intent": "意圖名稱",
  "confidence": 0.0-1.0,
  "entities": {
    "orderNumber": "訂單號（如有）",
    "productName": "產品名稱（如有）",
    "categoryName": "分類名稱（如有）"
  },
  "message": "給用戶的回覆"
}`;

      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ],
          temperature: 0.7,
          max_tokens: 500
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const content = response.data.choices[0].message.content;
      const result = JSON.parse(content);
      return result;
    } catch (error) {
      logger.error(`OpenAI NLU 錯誤: ${error.message}`);
      throw error;
    }
  }
}

/**
 * 本地規則基礎 NLU 實現
 */
class LocalNLU {
  async understandIntent(message, context) {
    // 使用基礎規則匹配
    const nluService = new NLUService();
    return nluService.fallbackUnderstanding(message);
  }
}

/**
 * Google Dialogflow NLU 實現
 */
class GoogleNLU {
  async understandIntent(message, context) {
    // TODO: 實現 Google NLU 整合
    throw new Error('Google NLU 尚未實現');
  }
}

/**
 * Dialogflow ES NLU 實現
 */
class DialogflowNLU {
  async understandIntent(message, context) {
    // TODO: 實現 Dialogflow NLU 整合
    throw new Error('Dialogflow NLU 尚未實現');
  }
}

// 導出單例實例
module.exports = new NLUService();
module.exports.NLU_PROVIDERS = NLU_PROVIDERS;

