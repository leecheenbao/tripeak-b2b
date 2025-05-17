<template>
  <div class="reset-password-bg">
    <div class="reset-password-card">
      <h2 class="title">重設密碼</h2>
      <p class="subtitle">請輸入新密碼並確認</p>
      <form @submit.prevent="onSubmit" class="reset-form">
        <div class="input-group">
          <label for="password">新密碼</label>
          <div class="input-wrapper">
            <input
              id="password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              required
              minlength="6"
              placeholder="請輸入新密碼"
            />
            <span class="toggle-eye" @click="showPassword = !showPassword">
              <svg
                v-if="showPassword"
                width="20"
                height="20"
                viewBox="0 0 20 20"
              >
                <path fill="#888" d="M10 4C5 4 1.73 7.11 1 10c.73 2.89 4 6 9 6s8.27-3.11 9-6c-.73-2.89-4-6-9-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/>
                <circle fill="#888" cx="10" cy="10" r="2.5" />
              </svg>
              <svg
                v-else
                width="20"
                height="20"
                viewBox="0 0 20 20"
              >
                <path fill="#888" d="M2.39 1.73L1.11 3l2.06 2.06C2.42 6.36 1.27 8.07 1 10c.73 2.89 4 6 9 6 1.61 0 3.09-.31 4.39-.85l2.48 2.48 1.27-1.27-16-16zm7.61 13.27c-2.21 0-4-1.79-4-4 0-.46.08-.9.21-1.31l5.1 5.1c-.41.13-.85.21-1.31.21zm6.9-2.9l-1.45-1.45c.03-.13.05-.27.05-.42 0-2.21-1.79-4-4-4-.15 0-.29.02-.42.05L7.73 4.61C8.47 4.22 9.22 4 10 4c5 0 8.27 3.11 9 6-.27 1.07-1.09 2.36-2.49 3.1z"/>
              </svg>
            </span>
          </div>
        </div>
        <div class="input-group">
          <label for="confirmPassword">確認新密碼</label>
          <div class="input-wrapper">
            <input
              id="confirmPassword"
              v-model="confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              required
              minlength="6"
              placeholder="請再次輸入新密碼"
            />
            <span class="toggle-eye" @click="showConfirmPassword = !showConfirmPassword">
              <svg
                v-if="showConfirmPassword"
                width="20"
                height="20"
                viewBox="0 0 20 20"
              >
                <path fill="#888" d="M10 4C5 4 1.73 7.11 1 10c.73 2.89 4 6 9 6s8.27-3.11 9-6c-.73-2.89-4-6-9-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/>
                <circle fill="#888" cx="10" cy="10" r="2.5" />
              </svg>
              <svg
                v-else
                width="20"
                height="20"
                viewBox="0 0 20 20"
              >
                <path fill="#888" d="M2.39 1.73L1.11 3l2.06 2.06C2.42 6.36 1.27 8.07 1 10c.73 2.89 4 6 9 6 1.61 0 3.09-.31 4.39-.85l2.48 2.48 1.27-1.27-16-16zm7.61 13.27c-2.21 0-4-1.79-4-4 0-.46.08-.9.21-1.31l5.1 5.1c-.41.13-.85.21-1.31.21zm6.9-2.9l-1.45-1.45c.03-.13.05-.27.05-.42 0-2.21-1.79-4-4-4-.15 0-.29.02-.42.05L7.73 4.61C8.47 4.22 9.22 4 10 4c5 0 8.27 3.11 9 6-.27 1.07-1.09 2.36-2.49 3.1z"/>
              </svg>
            </span>
          </div>
        </div>
        <button type="submit" :disabled="loading">
          {{ loading ? '送出中...' : '重設密碼' }}
        </button>
        <transition name="fade">
          <div v-if="error" class="error">{{ error }}</div>
        </transition>
        <transition name="fade">
          <div v-if="success" class="success">
            {{ success }}
            <button type="button" class="to-login-btn" @click="router.push('/login')">
              前往登入頁
            </button>
          </div>
        </transition>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const token = route.query.token;

const password = ref('');
const confirmPassword = ref('');
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const loading = ref(false);
const error = ref('');
const success = ref('');
const countdown = ref(3); // 倒數秒數
let timer = null;

const onSubmit = async () => {
  error.value = '';
  success.value = '';
  if (!password.value || password.value.length < 6) {
    error.value = '密碼長度至少 6 碼';
    return;
  }
  if (password.value !== confirmPassword.value) {
    error.value = '兩次密碼輸入不一致';
    return;
  }
  loading.value = true;
  try {
    await axios.post('/api/auth/reset-password', {
      token,
      newPassword: password.value
    });
    countdown.value = 3;
    success.value = `密碼重設成功，${countdown.value} 秒後自動跳轉登入頁`;
    timer = setInterval(() => {
      countdown.value--;
      if (countdown.value > 0) {
        success.value = `密碼重設成功，${countdown.value} 秒後自動跳轉登入頁`;
      } else {
        clearInterval(timer);
        router.push('/login');
      }
    }, 1000);
  } catch (err) {
    error.value = err.response?.data?.error || '重設失敗，請確認連結是否過期';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.reset-password-bg {
  min-height: 100vh;
  background: #f6f6f7;
  display: flex;
  align-items: center;
  justify-content: center;
}
.reset-password-card {
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 4px 24px 0 rgba(0,0,0,0.08);
  padding: 40px 36px 32px 36px;
  max-width: 420px;
  width: 100%;
  margin: 32px auto;
}
.title {
  text-align: center;
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 8px;
}
.subtitle {
  text-align: center;
  color: #888;
  margin-bottom: 28px;
  font-size: 1.1rem;
}
.reset-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.input-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.input-wrapper {
  position: relative;
}
input[type='password'], input[type='text'] {
  width: 100%;
  padding: 10px 38px 10px 12px;
  border: 1px solid #d0d0d0;
  border-radius: 6px;
  font-size: 1rem;
  background: #fafbfc;
  transition: border 0.2s;
}
input:focus {
  border: 1.5px solid #1976d2;
  outline: none;
}
.toggle-eye {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  user-select: none;
}
button {
  width: 100%;
  padding: 12px;
  background: #357ae8;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 1.1rem;
  font-weight: 500;
  margin-top: 10px;
  transition: background 0.2s;
}
button:disabled {
  background: #90caf9;
}
.error {
  color: #d32f2f;
  margin-top: 8px;
  text-align: center;
  font-size: 1rem;
  animation: shake 0.2s;
}
.success {
  color: #388e3c;
  margin-top: 8px;
  text-align: center;
  font-size: 1rem;
}
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
@keyframes shake {
  0% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  50% { transform: translateX(4px); }
  75% { transform: translateX(-4px); }
  100% { transform: translateX(0); }
}
.to-login-btn {
  margin-top: 14px;
  width: 100%;
  background: #fff;
  color: #357ae8;
  border: 1.5px solid #357ae8;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  padding: 10px;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}
.to-login-btn:hover {
  background: #357ae8;
  color: #fff;
}
</style>
