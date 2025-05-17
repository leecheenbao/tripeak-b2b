<template>
  <div class="forgot-password-page">
    <v-container class="fill-height">
      <v-row class="fill-height" align="center" justify="center">
        <v-col 
          cols="12" 
          sm="8" 
          md="6" 
          lg="4"
        >
          <v-card class="forgot-password-card">
            <v-card-title class="text-center py-4">
              <h1 class="text-h4 font-weight-bold primary--text">TRiPEAK B2B</h1>
            </v-card-title>
            
            <v-card-subtitle class="text-center mb-4">
              重設密碼
            </v-card-subtitle>
            
            <v-card-text>
              <v-form ref="form" @submit.prevent="handleSubmit">
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
                
                <v-alert
                  v-if="success"
                  type="success"
                  variant="tonal"
                  class="mb-4"
                >
                  {{ success }}
                </v-alert>
                
                <template v-if="!sent">
                  <v-text-field
                    v-model="email"
                    :rules="[rules.required, rules.email]"
                    label="電子郵件"
                    prepend-inner-icon="mdi-email"
                    variant="outlined"
                    required
                    autocomplete="email"
                  ></v-text-field>
                  <v-btn
                    type="submit"
                    color="primary"
                    variant="elevated"
                    size="large"
                    block
                    :loading="loading"
                    :disabled="loading"
                  >
                    發送重設密碼連結
                  </v-btn>
                </template>
                
                <div class="text-center mt-6">
                  <span class="text-caption">記起密碼了？</span>
                  <router-link 
                    to="/login" 
                    class="text-decoration-none font-weight-medium"
                  >
                    返回登入
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
import { useAuthStore } from '@/stores/auth';

// 表單數據
const email = ref('');
const form = ref(null);
const error = ref('');
const success = ref('');
const sent = ref(false);

// 驗證規則
const rules = reactive({
  required: v => !!v || '此欄位為必填',
  email: v => /.+@.+\..+/.test(v) || '請輸入有效的電子郵件'
});

// Store
const authStore = useAuthStore();
const loading = computed(() => authStore.loading);

// 方法
const handleSubmit = async () => {
  // 表單驗證
  const { valid } = await form.value.validate();
  
  if (!valid) return;
  
  try {
    error.value = '';
    success.value = '';
    
    // 呼叫忘記密碼方法
    await authStore.forgotPassword(email.value);
    
    // 顯示成功訊息
    success.value = '重設密碼連結已發送至您的電子郵件，請檢查您的收件匣';
    
    // 清空表單
    email.value = '';
    
    sent.value = true;
    
  } catch (err) {
    error.value = err.response?.data?.error || '發送重設密碼連結失敗，請稍後再試';
  }
};
</script>

<style lang="scss" scoped>
.forgot-password-page {
  background-color: #f5f5f5;
  min-height: 100vh;
}

.forgot-password-card {
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  padding: 1rem;
  
  &:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  }
}
</style> 