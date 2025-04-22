<template>
  <div class="login-page">
    <v-container class="fill-height">
      <v-row class="fill-height" align="center" justify="center">
        <v-col 
          cols="12" 
          sm="8" 
          md="6" 
          lg="4"
        >
          <v-card class="login-card">
            <v-card-title class="text-center py-4">
              <h1 class="text-h4 font-weight-bold primary--text">TRiPEAK B2B</h1>
            </v-card-title>
            
            <v-card-subtitle class="text-center mb-4">
              經銷商下單平台
            </v-card-subtitle>
            
            <v-card-text>
              <v-form ref="form" @submit.prevent="handleLogin">
                <v-alert
                  v-if="error"
                  type="error"
                  variant="tonal"
                  class="mb-4"
                  closable
                  @click:close="error = ''"
                >
                  {{ error }}
                </v-alert>
                
                <v-text-field
                  v-model="email"
                  :rules="[rules.required, rules.email]"
                  label="電子郵件"
                  prepend-inner-icon="mdi-email"
                  variant="outlined"
                  required
                  autocomplete="email"
                ></v-text-field>
                
                <v-text-field
                  v-model="password"
                  :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                  :rules="[rules.required, rules.min]"
                  :type="showPassword ? 'text' : 'password'"
                  label="密碼"
                  prepend-inner-icon="mdi-lock"
                  variant="outlined"
                  required
                  autocomplete="current-password"
                  @click:append-inner="showPassword = !showPassword"
                ></v-text-field>
                
                <div class="d-flex justify-space-between align-center mt-2 mb-6">
                  <v-checkbox 
                    v-model="rememberMe" 
                    label="記住我" 
                    density="compact"
                    hide-details
                  ></v-checkbox>
                  
                  <router-link 
                    to="/forgot-password" 
                    class="text-decoration-none text-caption"
                  >
                    忘記密碼？
                  </router-link>
                </div>
                
                <v-btn
                  type="submit"
                  color="primary"
                  variant="elevated"
                  size="large"
                  block
                  :loading="loading"
                  :disabled="loading"
                >
                  登入
                </v-btn>
                
                <div class="text-center mt-6">
                  <span class="text-caption">還沒有帳號？</span>
                  <router-link 
                    to="/register" 
                    class="text-decoration-none font-weight-medium"
                  >
                    註冊
                  </router-link>
                </div>
              </v-form>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

// 路由
const router = useRouter();
const route = useRoute();

// 表單數據
const email = ref('');
const password = ref('');
const rememberMe = ref(false);
const showPassword = ref(false);
const form = ref(null);
const error = ref('');

// 驗證規則
const rules = reactive({
  required: v => !!v || '此欄位為必填',
  email: v => /.+@.+\..+/.test(v) || '請輸入有效的電子郵件',
  min: v => (v && v.length >= 6) || '密碼長度至少為 6 個字符'
});

// Store
const authStore = useAuthStore();
const loading = computed(() => authStore.loading);

// 方法
const handleLogin = async () => {
  // 表單驗證
  const { valid } = await form.value.validate();
  
  if (!valid) return;
  
  try {
    error.value = '';
    await authStore.login({ email: email.value, password: password.value });
    
    // 登入成功，重定向
    const redirectPath = route.query.redirect || '/dashboard';
    router.push(redirectPath);
  } catch (err) {
    error.value = err.response?.data?.error || '登入失敗，請檢查您的郵箱和密碼';
  }
};
</script>

<style lang="scss" scoped>
.login-page {
  background-color: #f5f5f5;
  min-height: 100vh;
}

.login-card {
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  padding: 1rem;
  
  &:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  }
}
</style> 