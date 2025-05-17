import { defineStore } from 'pinia';
import axios from 'axios';

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null
  }),
  actions: {
    async fetchMe() {
      // 從 localStorage 取得 token
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('未找到登入 token，請先登入');
      }
      const res = await axios.get('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      this.user = res.data.data;
    }
  }
});
