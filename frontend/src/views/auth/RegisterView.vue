<template>
  <div class="register-page">
    <v-container class="fill-height">
      <v-row class="fill-height" align="center" justify="center">
        <v-col 
          cols="12" 
          sm="8" 
          md="6" 
          lg="4"
        >
          <v-card class="register-card">
            <v-card-title class="text-center py-4">
              <h1 class="text-h4 font-weight-bold primary--text">TRiPEAK B2B</h1>
            </v-card-title>
            
            <v-card-subtitle class="text-center mb-4">
              經銷商註冊
            </v-card-subtitle>
            
            <v-card-text>
              <v-form ref="form" @submit.prevent="handleRegister">
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
                  v-model="companyName"
                  :rules="[rules.required]"
                  label="公司名稱"
                  prepend-inner-icon="mdi-domain"
                  variant="outlined"
                  required
                ></v-text-field>
                
                <v-text-field
                  v-model="name"
                  :rules="[rules.required]"
                  label="聯絡人姓名"
                  prepend-inner-icon="mdi-account"
                  variant="outlined"
                  required
                ></v-text-field>
                
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
                  v-model="phone"
                  :rules="[rules.required, rules.phone]"
                  label="聯絡電話"
                  prepend-inner-icon="mdi-phone"
                  variant="outlined"
                  required
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
                  autocomplete="new-password"
                  @click:append-inner="showPassword = !showPassword"
                ></v-text-field>
                
                <v-text-field
                  v-model="confirmPassword"
                  :append-inner-icon="showConfirmPassword ? 'mdi-eye' : 'mdi-eye-off'"
                  :rules="[rules.required, rules.min, rules.matchPassword]"
                  :type="showConfirmPassword ? 'text' : 'password'"
                  label="確認密碼"
                  prepend-inner-icon="mdi-lock-check"
                  variant="outlined"
                  required
                  autocomplete="new-password"
                  @click:append-inner="showConfirmPassword = !showConfirmPassword"
                ></v-text-field>
                
                <v-textarea
                  v-model="address"
                  :rules="[rules.required]"
                  label="公司地址"
                  prepend-inner-icon="mdi-map-marker"
                  variant="outlined"
                  required
                  rows="2"
                  auto-grow
                ></v-textarea>
                
                <v-checkbox 
                  v-model="agreeTerms" 
                  :rules="[rules.agreeTerms]"
                  label="我同意服務條款與隱私政策" 
                  required
                  density="comfortable"
                ></v-checkbox>
                
                <v-btn
                  type="submit"
                  color="primary"
                  variant="elevated"
                  size="large"
                  block
                  :loading="loading"
                  :disabled="loading"
                >
                  註冊
                </v-btn>
                
                <div class="text-center mt-6">
                  <span class="text-caption">已經有帳號？</span>
                  <router-link 
                    to="/login" 
                    class="text-decoration-none font-weight-medium"
                  >
                    登入
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
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

// 路由
const router = useRouter();

// 表單數據
const name = ref('');
const contactName = ref('');
const email = ref('');
const phone = ref('');
const password = ref('');
const confirmPassword = ref('');
const address = ref('');
const agreeTerms = ref(false);
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const form = ref(null);
const error = ref('');

// 驗證規則
const rules = reactive({
  required: v => !!v || '此欄位為必填',
  email: v => /.+@.+\..+/.test(v) || '請輸入有效的電子郵件',
  min: v => (v && v.length >= 6) || '密碼長度至少為 6 個字符',
  phone: v => /^[0-9]{8,10}$/.test(v) || '請輸入有效的電話號碼',
  matchPassword: v => v === password.value || '密碼不一致',
  agreeTerms: v => v || '您必須同意服務條款才能繼續'
});

// Store
const authStore = useAuthStore();
const loading = computed(() => authStore.loading);

// 方法
const handleRegister = async () => {
  // 表單驗證
  const { valid } = await form.value.validate();
  
  if (!valid) return;
  
  try {
    error.value = '';
    
    // 準備註冊數據
    const registerData = {
      name: name.value,
      companyName: contactName.value,
      email: email.value,
      phone: phone.value,
      password: password.value,
      address: address.value
    };
    
    // 呼叫註冊方法
    await authStore.register(registerData);
    
    // 註冊成功，重定向到登入頁面
    router.push('/login');
  } catch (err) {
    error.value = err.response?.data?.error || '註冊失敗，請稍後再試';
  }
};
</script>

<style lang="scss" scoped>
.register-page {
  background-color: #f5f5f5;
  min-height: 100vh;
}

.register-card {
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  padding: 1rem;
  
  &:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  }
}
</style> 