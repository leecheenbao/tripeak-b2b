<template>
  <div class="profile-page">
    <v-container>
      <div class="d-flex align-center justify-space-between mb-6">
        <h1 class="text-h4 font-weight-bold">個人資料</h1>
        <v-btn
          color="primary"
          :loading="saving"
          :disabled="!isFormChanged"
          @click="saveProfile"
        >
          儲存變更
        </v-btn>
      </div>

      <v-row>
        <v-col cols="12" md="8">
          <v-card>
            <v-card-text>
              <v-form ref="form" @submit.prevent="saveProfile">
                <v-row>
                  <!-- 基本資料 -->
                  <v-col cols="12">
                    <div class="text-subtitle-1 font-weight-medium mb-4">基本資料</div>
                  </v-col>
                  
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="profile.contactName"
                      label="姓名"
                      :rules="[rules.required]"
                      variant="outlined"
                      density="comfortable"
                    ></v-text-field>
                  </v-col>

                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="profile.email"
                      label="電子郵件"
                      :rules="[rules.required, rules.email]"
                      variant="outlined"
                      density="comfortable"
                      disabled
                    ></v-text-field>
                  </v-col>

                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="profile.phone"
                      label="電話"
                      :rules="[rules.required, rules.phone]"
                      variant="outlined"
                      density="comfortable"
                    ></v-text-field>
                  </v-col>

                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="profile.companyName"
                      label="公司名稱"
                      :rules="[rules.required]"
                      variant="outlined"
                      density="comfortable"
                    ></v-text-field>
                  </v-col>

                  <v-col cols="12">
                    <v-textarea
                      v-model="profile.address"
                      label="地址"
                      :rules="[rules.required]"
                      variant="outlined"
                      density="comfortable"
                      rows="2"
                    ></v-textarea>
                  </v-col>

                  <!-- 密碼修改 -->
                  <v-col cols="12" class="mt-6">
                    <v-card>
                      <v-card-title class="d-flex align-center">
                        <span class="text-subtitle-1 font-weight-medium">修改密碼</span>
                        <v-spacer></v-spacer>
                        <v-btn
                          variant="text"
                          :icon="showPasswordForm ? 'mdi-chevron-up' : 'mdi-chevron-down'"
                          @click="showPasswordForm = !showPasswordForm"
                        >
                        </v-btn>
                      </v-card-title>
                      <v-expand-transition>
                        <div v-show="showPasswordForm">
                          <v-divider></v-divider>
                          <v-card-text>
                            <v-row>
                              <v-col cols="12" md="6">
                                <v-text-field
                                  v-model="password.current"
                                  label="目前密碼"
                                  type="password"
                                  variant="outlined"
                                  density="comfortable"
                                ></v-text-field>
                              </v-col>

                              <v-col cols="12" md="6">
                                <v-text-field
                                  v-model="password.new"
                                  label="新密碼"
                                  type="password"
                                  :rules="[rules.password]"
                                  variant="outlined"
                                  density="comfortable"
                                ></v-text-field>
                              </v-col>

                              <v-col cols="12" md="6">
                                <v-text-field
                                  v-model="password.confirm"
                                  label="確認新密碼"
                                  type="password"
                                  :rules="[rules.password, rules.passwordMatch]"
                                  variant="outlined"
                                  density="comfortable"
                                ></v-text-field>
                              </v-col>

                              <v-col cols="12" class="d-flex justify-end">
                                <v-btn
                                  color="primary"
                                  :loading="saving"
                                  :disabled="!isPasswordFormValid"
                                  @click="updatePassword"
                                >
                                  更新密碼
                                </v-btn>
                              </v-col>
                            </v-row>
                          </v-card-text>
                        </div>
                      </v-expand-transition>
                    </v-card>
                  </v-col>
                </v-row>
              </v-form>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- 右側資訊卡片 -->
        <v-col cols="12" md="4">
          <v-card class="mb-4">
            <v-card-title class="text-subtitle-1 font-weight-medium">
              帳號資訊
            </v-card-title>
            <v-divider></v-divider>
            <v-list>
              <v-list-item>
                <template v-slot:prepend>
                  <v-icon>mdi-account</v-icon>
                </template>
                <v-list-item-title>角色</v-list-item-title>
                <template v-slot:append>
                  <v-chip
                    :color="profile.role === 'admin' ? 'primary' : 'success'"
                    size="small"
                  >
                    {{ profile.role === 'admin' ? '管理員' : '經銷商' }}
                  </v-chip>
                </template>
              </v-list-item>
              <v-list-item>
                <template v-slot:prepend>
                  <v-icon>mdi-calendar</v-icon>
                </template>
                <v-list-item-title>註冊日期</v-list-item-title>
                <template v-slot:append>
                  {{ new Date(profile.createdAt).toLocaleDateString() }}
                </template>
              </v-list-item>
              <v-list-item>
                <template v-slot:prepend>
                  <v-icon>mdi-clock-outline</v-icon>
                </template>
                <v-list-item-title>最後更新</v-list-item-title>
                <template v-slot:append>
                  {{ new Date(profile.updatedAt).toLocaleDateString() }}
                </template>
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- 通知提示 -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      timeout="3000"
    >
      {{ snackbar.text }}
      <template v-slot:actions>
        <v-btn
          variant="text"
          icon="mdi-close"
          @click="snackbar.show = false"
        ></v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { authApi } from '@/api';
import { useToast } from 'vue-toastification';

const authStore = useAuthStore();
const toast = useToast();
const form = ref(null);
const saving = ref(false);

// 表單驗證規則
const rules = {
  required: v => !!v || '此欄位為必填',
  email: v => /.+@.+\..+/.test(v) || '請輸入有效的電子郵件',
  phone: v => /^[0-9-+()]*$/.test(v) || '請輸入有效的電話號碼',
  password: v => !v || v.length >= 6 || '密碼長度至少為 6 個字元',
  passwordMatch: v => !v || v === password.value.new || '密碼不一致'
};

// 個人資料
const profile = ref({
  name: '',
  email: '',
  phone: '',
  companyName: '',
  address: '',
  role: '',
  createdAt: '',
  updatedAt: ''
});

// 密碼修改
const password = ref({
  current: '',
  new: '',
  confirm: ''
});

// 通知提示
const snackbar = ref({
  show: false,
  text: '',
  color: 'success'
});

// 檢查表單是否有變更
const isFormChanged = computed(() => {
  const originalProfile = authStore.user;
  return JSON.stringify(profile.value) !== JSON.stringify(originalProfile);
});

// 在 script 中添加新的狀態
const showPasswordForm = ref(false);

// 密碼表單驗證
const isPasswordFormValid = computed(() => {
  return password.value.current &&
         password.value.new &&
         password.value.confirm &&
         password.value.new === password.value.confirm &&
         password.value.new.length >= 6;
});

// 獲取個人資料
const fetchProfile = async () => {
  try {
    const userData = await authApi.getCurrentUser();
    profile.value = { ...userData.data.data };
  } catch (error) {
    console.error('獲取個人資料失敗:', error);
    toast.error('獲取個人資料失敗');
  }
};

// 分離密碼更新邏輯
const updatePassword = async () => {
  if (!isPasswordFormValid.value) return;

  saving.value = true;
  try {
    await authStore.updatePassword({
      currentPassword: password.value.current,
      newPassword: password.value.new
    });

    // 重置密碼欄位
    password.value = {
      current: '',
      new: '',
      confirm: ''
    };
    
    // 關閉密碼表單
    showPasswordForm.value = false;

    snackbar.value = {
      show: true,
      text: '密碼更新成功',
      color: 'success'
    };
  } catch (error) {
    console.error('更新密碼失敗:', error);
    toast.error(error.response?.data?.message || '更新密碼失敗');
  } finally {
    saving.value = false;
  }
};

// 修改原有的 saveProfile 方法，移除密碼更新部分
const saveProfile = async () => {
  const { valid } = await form.value.validate();
  if (!valid) return;

  saving.value = true;
  try {
    // 更新基本資料
    if (isFormChanged.value) {
      await authStore.updateProfile({
        contactName: profile.value.contactName,
        phone: profile.value.phone,
        companyName: profile.value.companyName,
        address: profile.value.address
      });

      snackbar.value = {
        show: true,
        text: '個人資料更新成功',
        color: 'success'
      };
    }
    fetchProfile();
  } catch (error) {
    console.error('更新個人資料失敗:', error);
    toast.error(error.response?.data?.message || '更新個人資料失敗');
  } finally {
    saving.value = false;
  }
};

// 生命週期鉤子
onMounted(() => {
  fetchProfile();
});
</script>

<style lang="scss" scoped>
.profile-page {
  padding-bottom: 2rem;
}

.v-expand-transition {
  transition: all 0.3s ease-in-out;
}
</style>

