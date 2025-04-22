import axios from 'axios';
import { useToast } from 'vue-toastification';
import { useAuthStore } from '@/stores/auth';

// API 服務實例
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// 設置 API 客戶端
export function setupApi() {
  const toast = useToast();
  
  // 請求攔截器 - 添加認證令牌等
  apiClient.interceptors.request.use(
    (config) => {
      const authStore = useAuthStore();
      if (authStore.token) {
        config.headers.Authorization = `Bearer ${authStore.token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );
  
  // 響應攔截器 - 處理錯誤等
  apiClient.interceptors.response.use(
    (response) => {
      return response;
    },
    async (error) => {
      const authStore = useAuthStore();
      
      // 獲取原始請求配置
      const originalRequest = error.config;
      
      // 處理 401 錯誤 (未認證)
      if (error.response && error.response.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        
        // 如果用戶已登入但令牌已過期，則登出
        if (authStore.isLoggedIn) {
          authStore.logout();
          toast.error('您的登入已過期，請重新登入');
          window.location.href = '/login';
          return Promise.reject(error);
        }
      }
      
      // 處理 403 錯誤 (無權限)
      if (error.response && error.response.status === 403) {
        toast.error('您沒有權限執行此操作');
      }
      
      // 處理 404 錯誤 (資源不存在)
      if (error.response && error.response.status === 404) {
        toast.error('找不到請求的資源');
      }
      
      // 處理 422 錯誤 (表單驗證錯誤)
      if (error.response && error.response.status === 422) {
        const errors = error.response.data.errors;
        if (errors) {
          Object.keys(errors).forEach(key => {
            toast.error(`${key}: ${errors[key].join(', ')}`);
          });
        } else {
          toast.error(error.response.data.message || '表單驗證失敗');
        }
      }
      
      // 處理 500 錯誤 (伺服器錯誤)
      if (error.response && (error.response.status === 500 || error.response.status === 503)) {
        toast.error('系統發生錯誤，請稍後再試');
      }
      
      // 處理網絡錯誤
      if (error.message.includes('Network Error')) {
        toast.error('網絡連接失敗，請檢查您的網絡連接');
      }
      
      // 處理請求超時
      if (error.message.includes('timeout')) {
        toast.error('請求超時，請稍後再試');
      }
      
      return Promise.reject(error);
    }
  );
}

// API 服務 - 身份驗證
export const authApi = {
  // 登入
  login(credentials) {
    return apiClient.post('/auth/login', credentials);
  },
  
  // 註冊
  register(userData) {
    return apiClient.post('/auth/register', userData);
  },
  
  // 獲取當前用戶資訊
  getCurrentUser() {
    return apiClient.get('/auth/me');
  },
  
  // 登出
  logout() {
    return apiClient.get('/auth/logout');
  },
  
  // 更新個人資料
  updateProfile(data) {
    return apiClient.put('/auth/updatedetails', data);
  },
  
  // 更新密碼
  updatePassword(data) {
    return apiClient.put('/auth/updatepassword', data);
  },
  
  // 忘記密碼
  forgotPassword(email) {
    return apiClient.post('/auth/forgotpassword', { email });
  },
  
  // 重設密碼
  resetPassword(token, password) {
    return apiClient.put(`/auth/resetpassword/${token}`, { password });
  }
};

// API 服務 - 用戶管理 (管理員)
export const usersApi = {
  // 獲取所有用戶
  getUsers(params) {
    return apiClient.get('/users', { params });
  },
  
  // 獲取單個用戶
  getUser(id) {
    return apiClient.get(`/users/${id}`);
  },
  
  // 創建用戶
  createUser(data) {
    return apiClient.post('/users', data);
  },
  
  // 更新用戶
  updateUser(id, data) {
    return apiClient.put(`/users/${id}`, data);
  },
  
  // 刪除用戶
  deleteUser(id) {
    return apiClient.delete(`/users/${id}`);
  },
  
  // 重設用戶密碼
  resetUserPassword(id) {
    return apiClient.put(`/users/${id}/resetpassword`);
  }
};

// API 服務 - 產品分類
export const categoriesApi = {
  // 獲取所有分類
  getCategories(params) {
    return apiClient.get('/categories', { params });
  },
  
  // 獲取單個分類
  getCategory(id) {
    return apiClient.get(`/categories/${id}`);
  },
  
  // 創建分類 (管理員)
  createCategory(data) {
    return apiClient.post('/categories', data);
  },
  
  // 更新分類 (管理員)
  updateCategory(id, data) {
    return apiClient.put(`/categories/${id}`, data);
  },
  
  // 刪除分類 (管理員)
  deleteCategory(id) {
    return apiClient.delete(`/categories/${id}`);
  }
};

// API 服務 - 產品
export const productsApi = {
  // 獲取所有產品
  getProducts(params) {
    return apiClient.get('/products', { params });
  },
  
  // 獲取單個產品
  getProduct(id) {
    return apiClient.get(`/products/${id}`);
  },
  
  // 創建產品 (管理員)
  createProduct(data) {
    return apiClient.post('/products', data);
  },
  
  // 更新產品 (管理員)
  updateProduct(id, data) {
    return apiClient.put(`/products/${id}`, data);
  },
  
  // 刪除產品 (管理員)
  deleteProduct(id) {
    return apiClient.delete(`/products/${id}`);
  },
  
  // 上傳產品圖片 (管理員)
  uploadImage(id, formData) {
    return apiClient.put(`/products/${id}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }
};

// API 服務 - 訂單
export const ordersApi = {
  // 獲取所有訂單
  getOrders(params) {
    return apiClient.get('/orders', { params });
  },
  
  // 獲取單個訂單
  getOrder(id) {
    return apiClient.get(`/orders/${id}`);
  },
  
  // 創建訂單
  createOrder(data) {
    return apiClient.post('/orders', data);
  },
  
  // 更新訂單 (管理員)
  updateOrder(id, data) {
    return apiClient.put(`/orders/${id}`, data);
  },
  
  // 更新訂單狀態 (管理員)
  updateOrderStatus(id, status) {
    return apiClient.put(`/orders/${id}/status`, { status });
  },
  
  // 刪除訂單 (管理員)
  deleteOrder(id) {
    return apiClient.delete(`/orders/${id}`);
  },
  
  // 導出訂單
  exportOrders(params) {
    return apiClient.get('/orders/export', {
      params,
      responseType: 'blob'
    });
  }
};

// API 服務 - LINE 消息
export const lineMessagesApi = {
  // 獲取所有消息模板
  getMessages(params) {
    return apiClient.get('/line/messages', { params });
  },
  
  // 獲取單個消息模板
  getMessage(id) {
    return apiClient.get(`/line/messages/${id}`);
  },
  
  // 創建消息模板
  createMessage(data) {
    return apiClient.post('/line/messages', data);
  },
  
  // 更新消息模板
  updateMessage(id, data) {
    return apiClient.put(`/line/messages/${id}`, data);
  },
  
  // 刪除消息模板
  deleteMessage(id) {
    return apiClient.delete(`/line/messages/${id}`);
  },
  
  // 發送消息
  sendMessage(id, recipients) {
    return apiClient.post(`/line/messages/${id}/send`, { recipients });
  }
}; 