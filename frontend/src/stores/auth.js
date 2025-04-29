import { defineStore } from 'pinia';
import axios from 'axios';
import { useToast } from 'vue-toastification';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem('token') || null,
    loading: false,
    error: null,
    isAuthenticated: !!localStorage.getItem('token')
  }),
  
  getters: {
    getCurrentUser: state => state.user,
    isLoggedIn: state => !!state.token && state.isAuthenticated,
    isAdmin: state => state.user?.role === 'admin',
    isDealer: state => state.user?.role === 'dealer'
  },
  
  actions: {
    // 登入
    async login(credentials) {
      this.loading = true;
      this.error = null;
      
      try {
        const response = await axios.post(`${API_URL}/auth/login`, credentials);
        
        const { token, user } = response.data;
        
        this.token = token;
        this.user = user;
        this.isAuthenticated = true;
        
        localStorage.setItem('token', token);
        
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        const toast = useToast();
        toast.success('登入成功！');
        
        return response.data;
      } catch (error) {
        this.error = error.response?.data?.message || '登入失敗';
        
        const toast = useToast();
        toast.error(this.error);
        
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    // 註冊
    async register(userData) {
      this.loading = true;
      this.error = null;
      
      try {
        const response = await axios.post(`${API_URL}/auth/register`, userData);
        
        const toast = useToast();
        toast.success('註冊成功！請使用您的憑證登入');
        
        return response.data;
      } catch (error) {
        this.error = error.response?.data?.message || '註冊失敗';
        
        const toast = useToast();
        toast.error(this.error);
        
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    // 忘記密碼
    async forgotPassword(email) {
      this.loading = true;
      this.error = null;
      
      try {
        const response = await axios.post(`${API_URL}/auth/forgot-password`, { email });
        return response.data;
      } catch (error) {
        this.error = error.response?.data?.message || '發送重設密碼連結失敗';
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    // 重設密碼
    async resetPassword(token, newPassword) {
      this.loading = true;
      this.error = null;
      
      try {
        const response = await axios.post(`${API_URL}/auth/reset-password`, { 
          token,
          newPassword 
        });
        return response.data;
      } catch (error) {
        this.error = error.response?.data?.message || '重設密碼失敗';
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    // 獲取當前用戶
    async fetchCurrentUser() {
      if (!this.token) return null;
      
      this.loading = true;
      
      try {
        const response = await axios.get(`${API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${this.token}`
          }
        });
        
        this.user = response.data;
        return response.data;
      } catch (error) {
        console.error('獲取用戶信息失敗', error);
        this.logout();
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    // 登出
    logout() {
      this.user = null;
      this.token = null;
      this.isAuthenticated = false;
      
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      
      const toast = useToast();
      toast.info('您已登出系統');
    },
    
    // 更新個人資料
    async updateProfile(profileData) {
      this.loading = true;
      this.error = null;
      
      try {
        const response = await axios.put(`${API_URL}/auth/update-profile`, profileData, {
          headers: {
            Authorization: `Bearer ${this.token}`
          }
        });
        this.user = response.data.data;
        
        const toast = useToast();
        toast.success('個人資料已更新');
        
        return response.data;
      } catch (error) {
        this.error = error.response?.data?.error || '更新個人資料失敗';
        
        const toast = useToast();
        toast.error(this.error);
        
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    // 更新密碼
    async updatePassword(passwordData) {
      this.loading = true;
      this.error = null;
      
      try {
        const response = await axios.put(`${API_URL}/auth/updatepassword`, passwordData, {
          headers: {
            Authorization: `Bearer ${this.token}`
          }
        });
        
        const toast = useToast();
        toast.success('密碼已更新');
      } catch (error) {
        this.error = error.response?.data?.error || '更新密碼失敗';
        
        const toast = useToast();
        toast.error(this.error);
        
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    // 清除錯誤
    clearError() {
      this.error = null;
    }
  },
  
  persist: {
    enabled: true,
    strategies: [
      {
        key: 'tripeak-auth',
        storage: localStorage,
        paths: ['token']
      }
    ]
  }
}); 