import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// API 基礎 URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// 設置 API 客戶端
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// 異步 Action: 用戶登錄
export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/auth/login', credentials);
      // 保存 token 到本地存儲
      localStorage.setItem('token', response.data.token);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || '登錄失敗，請稍後再試'
      );
    }
  }
);

// 異步 Action: 用戶註冊
export const register = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/auth/register', userData);
      // 保存 token 到本地存儲
      localStorage.setItem('token', response.data.token);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || '註冊失敗，請稍後再試'
      );
    }
  }
);

// 異步 Action: 獲取當前用戶信息
export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (_, { rejectWithValue, getState }) => {
    try {
      // 從狀態中獲取 token
      const { token } = getState().auth;
      
      if (!token) {
        return rejectWithValue('未找到認證令牌');
      }
      
      // 設置請求頭
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      const response = await apiClient.get('/auth/me', config);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || '獲取用戶信息失敗'
      );
    }
  }
);

// 異步 Action: 更新用戶資料
export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (userData, { rejectWithValue, getState }) => {
    try {
      // 從狀態中獲取 token
      const { token } = getState().auth;
      
      if (!token) {
        return rejectWithValue('未找到認證令牌');
      }
      
      // 設置請求頭
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      const response = await apiClient.put('/auth/updatedetails', userData, config);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || '更新用戶資料失敗'
      );
    }
  }
);

// 異步 Action: 更新密碼
export const updatePassword = createAsyncThunk(
  'auth/updatePassword',
  async (passwordData, { rejectWithValue, getState }) => {
    try {
      // 從狀態中獲取 token
      const { token } = getState().auth;
      
      if (!token) {
        return rejectWithValue('未找到認證令牌');
      }
      
      // 設置請求頭
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      const response = await apiClient.put('/auth/updatepassword', passwordData, config);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || '更新密碼失敗'
      );
    }
  }
);

// 初始狀態
const initialState = {
  token: localStorage.getItem('token'),
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null
};

// 創建 Auth Slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // 登出 reducer
    logout: state => {
      localStorage.removeItem('token');
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
    },
    // 清除錯誤 reducer
    clearError: state => {
      state.error = null;
    }
  },
  extraReducers: builder => {
    builder
      // 處理登錄
      .addCase(login.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.user = action.payload.data;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // 處理註冊
      .addCase(register.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.user = action.payload.data;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // 處理獲取當前用戶
      .addCase(getCurrentUser.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.data;
      })
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        // 如果獲取用戶失敗，可能 token 已過期，清除認證狀態
        state.token = null;
        state.isAuthenticated = false;
        localStorage.removeItem('token');
      })
      
      // 處理更新用戶資料
      .addCase(updateProfile.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.data;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // 處理更新密碼
      .addCase(updatePassword.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updatePassword.fulfilled, state => {
        state.isLoading = false;
      })
      .addCase(updatePassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  }
});

// 導出 actions
export const { logout, clearError } = authSlice.actions;

// 導出 selectors
export const selectAuth = state => state.auth;
export const selectUser = state => state.auth.user;
export const selectIsAuthenticated = state => state.auth.isAuthenticated;
export const selectAuthLoading = state => state.auth.isLoading;
export const selectAuthError = state => state.auth.error;

// 導出 reducer
export default authSlice.reducer; 