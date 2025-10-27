const logger = require('../utils/logger');
const axios = require('axios');

/**
 * NLU 服務配置
 */
const NLU_PROVIDERS = {
  OPENAI: 'openai',
  LOCAL: 'local',
  GOOGLE: 'google',
  DIALOGFLOW: 'dialogflow',
  OLLAMA: 'ollama'
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
      [NLU_PROVIDERS.GOOGLE]: new GoogleNLU(),
      [NLU_PROVIDERS.OPENAI]: new OpenAINLU(),
      [NLU_PROVIDERS.LOCAL]: new LocalNLU(),
      [NLU_PROVIDERS.DIALOGFLOW]: new DialogflowNLU(),
      [NLU_PROVIDERS.OLLAMA]: new OllamaNLU()
    };
  }

  /**
   * 理解用戶意圖
   */
  async understandIntent(message, context = {}) {
    try {
      const provider = this.providers[this.provider];
      console.log(provider);
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
        message: '我可以幫您：\n1. 查詢訂單資訊\n2. 搜尋產品\n3. 查詢庫存\n4. 聯繫客服\n \n請告訴我您需要什麼協助？'
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

/**
 * Ollama NLU 實現（本地大語言模型）
 * 優化版本：包含重試機制、超時控制、和更好的錯誤處理
 */
class OllamaNLU {
  constructor() {
    this.baseURL = process.env.OLLAMA_URL || 'http://localhost:11434';
    this.model = process.env.OLLAMA_MODEL || 'llama2:7b-chat-q4_0';
    this.timeout = parseInt(process.env.OLLAMA_TIMEOUT) || 30000; // 30秒超時
    this.maxRetries = 3; // 最大重試次數
    this.requestCache = new Map(); // 簡單的請求快取
    this.cacheSize = 100; // 快取大小
  }

  /**
   * 理解用戶意圖（主方法）
   */
  async understandIntent(message, context = {}) {
    const startTime = Date.now();
    
    try {
      // 嘗試快取
      const cacheKey = this.getCacheKey(message);
      if (this.requestCache.has(cacheKey)) {
        logger.info('使用快取結果');
        return this.requestCache.get(cacheKey);
      }

      // 調用 Ollama API
      const result = await this.callOllamaWithRetry(message);

      console.log(result);
      
      // 儲存快取
      this.addToCache(cacheKey, result);
      
      const duration = Date.now() - startTime;
      logger.info(`Ollama NLU 處理完成，耗時: ${duration}ms`);
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(`Ollama NLU 錯誤 (${duration}ms): ${error.message}`);
      
      // 降級到規則匹配
      return this.fallbackUnderstanding(message);
    }
  }

  /**
   * 帶重試機制的 Ollama API 調用
   */
  async callOllamaWithRetry(message) {
    let lastError;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        logger.info(`Ollama 調用嘗試 ${attempt}/${this.maxRetries}`);
        return await this.callOllama(message);
      } catch (error) {
        lastError = error;
        
        // 如果不是最後一次嘗試，等待後重試
        if (attempt < this.maxRetries) {
          const delay = attempt * 1000; // 遞增延遲
          logger.warn(`Ollama 調用失敗，${delay}ms 後重試...`);
          await this.sleep(delay);
        }
      }
    }
    
    throw lastError;
  }

  /**
   * 調用 Ollama API
   */
  async callOllama(message) {
    const prompt = this.buildPrompt(message);
    
    // 創建帶超時的請求
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    
    try {
      const response = await axios.post(
        `${this.baseURL}/api/generate`,
        {
          model: this.model,
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.5, // 降低溫度以提高一致性
            top_p: 0.9,
            num_predict: 300  // 限制輸出長度
          }
        },
        {
          signal: controller.signal,
          timeout: this.timeout
        }
      );

      clearTimeout(timeoutId);
      
      // 解析回應
      const content = response.data.response;
      const result = this.parseOllamaResponse(content);
      
      // 驗證結果
      this.validateResult(result);
      
      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.code === 'ECONNREFUSED') {
        throw new Error(`無法連接到 Ollama 服務 (${this.baseURL})`);
      } else if (error.code === 'ETIMEDOUT' || error.name === 'AbortError') {
        throw new Error('Ollama 請求超時');
      } else if (error.response?.status === 404) {
        throw new Error(`模型 "${this.model}" 未找到。請先下載模型：ollama pull ${this.model}`);
      } else if (error.response?.status === 400) {
        logger.error('Ollama API 請求錯誤:', error.response?.data);
        throw new Error('Ollama API 請求格式錯誤');
      } else {
        throw error;
      }
    }
  }

  /**
   * 構建 Prompt
   */
  buildPrompt(message) {
    let systemPrompt =`你是一個專業的經銷商 B2B 客服助手。分析用戶訊息並以 JSON 格式回應。

用戶訊息：「${message}」

分析規則：
- 如果訊息包含「訂單」或「order」→ intent: "query_order"
- 如果訊息包含「產品」、「商品」或「product」→ intent: "query_product"
- 如果訊息包含「庫存」或「stock」→ intent: "query_stock"
- 如果訊息是問候（你好、嗨、hello）→ intent: "greeting"
- 如果訊息詢問「幫助」或「help」→ intent: "get_help"
- 其他情況 → intent: "unclear"

回應格式必須是有效的 JSON：
{
  "intent": "意圖名稱",
  "confidence": 0.0-1.0,
  "entities": {
    "orderNumber": "訂單號碼（如果有）",
    "productName": "產品名稱（如果有）"
  },
  "message": "簡短的給用戶的回覆"
}

回答的語言為繁體中文。
只回應 JSON，不要其他文字。`;

    return systemPrompt;
  }

  /**
   * 解析 Ollama 回應
   */
  parseOllamaResponse(content) {
    // 移除 markdown 代碼塊
    let cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    // 嘗試提取 JSON
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('無法從回應中找到 JSON');
    }

    try {
      const result = JSON.parse(jsonMatch[0]);
      return result;
    } catch (parseError) {
      logger.error(`JSON 解析失敗: ${parseError.message}`);
      logger.error(`原始內容: ${content.substring(0, 200)}`);
      throw new Error('Ollama 回應不是有效的 JSON');
    }
  }

  /**
   * 驗證結果格式
   */
  validateResult(result) {
    if (!result.intent) {
      throw new Error('結果缺少 intent 欄位');
    }
    
    if (!result.entities) {
      result.entities = {};
    }
    
    if (!result.confidence) {
      result.confidence = 0.5;
    }
    
    if (!result.message) {
      result.message = '我明白了，正在為您處理';
    }
  }

  /**
   * 降級到規則匹配
   */
  fallbackUnderstanding(message) {
    logger.info('使用規則匹配進行意圖識別');
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('訂單')) {
      return {
        intent: 'query_order',
        confidence: 0.8,
        entities: { orderNumber: this.extractOrderNumber(message) },
        message: '我將幫您查詢訂單資訊'
      };
    }

    if (lowerMessage.includes('產品') || lowerMessage.includes('商品') || lowerMessage.includes('product')) {
      return {
        intent: 'query_product',
        confidence: 0.8,
        entities: {},
        message: '我將幫您搜尋產品'
      };
    }

    if (lowerMessage.includes('庫存') || lowerMessage.includes('stock')) {
      return {
        intent: 'query_stock',
        confidence: 0.8,
        entities: {},
        message: '我將幫您查詢庫存'
      };
    }

    if (lowerMessage.includes('你好') || lowerMessage.includes('嗨') || 
        lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      return {
        intent: 'greeting',
        confidence: 0.9,
        entities: {},
        message: '您好！我是 TRiPEAK 客服助手，很高興為您服務！'
      };
    }

    if (lowerMessage.includes('幫助') || lowerMessage.includes('help') || lowerMessage.includes('功能')) {
      return {
        intent: 'get_help',
        confidence: 0.8,
        entities: {},
        message: '我可以幫您查詢訂單、搜尋產品、查詢庫存。請告訴我您需要什麼協助？'
      };
    }

    return {
      intent: 'unclear',
      confidence: 0.5,
      entities: {},
      message: '抱歉，我不太理解您的意思。您可以說「訂單查詢」、「產品搜尋」或「幫助」來獲取協助。'
    };
  }

  /**
   * 輔助方法
   */
  extractOrderNumber(message) {
    const match = message.match(/[A-Z0-9]{6,}/);
    return match ? match[0] : null;
  }

  getCacheKey(message) {
    return message.toLowerCase().trim();
  }

  addToCache(key, value) {
    // 如果快取已滿，移除最舊的項目
    if (this.requestCache.size >= this.cacheSize) {
      const firstKey = this.requestCache.keys().next().value;
      this.requestCache.delete(firstKey);
    }
    this.requestCache.set(key, value);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 清理快取（可選）
   */
  clearCache() {
    this.requestCache.clear();
    logger.info('Ollama NLU 快取已清除');
  }
}

// 導出單例實例
module.exports = new NLUService();
module.exports.NLU_PROVIDERS = NLU_PROVIDERS;

