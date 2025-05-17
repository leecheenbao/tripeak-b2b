<template>
  <div class="user-management">
    <v-container>
      <div class="d-flex align-center justify-space-between mb-6">
        <h1 class="text-h4 font-weight-bold">用戶管理</h1>
        <v-btn
          color="primary"
          prepend-icon="mdi-account-plus"
          @click="openCreateDialog"
        >
          新增用戶
        </v-btn>
      </div>

      <!-- 搜索和篩選 -->
      <v-card class="mb-6">
        <v-card-text>
          <v-row>
            <v-col cols="12" sm="4">
              <v-text-field
                v-model="search"
                label="搜索用戶"
                prepend-inner-icon="mdi-magnify"
                variant="outlined"
                density="comfortable"
                hide-details
                @update:model-value="handleSearch"
              ></v-text-field>
            </v-col>
            <v-col cols="12" sm="3">
              <v-select
                v-model="roleFilter"
                label="角色"
                :items="roleOptions"
                variant="outlined"
                density="comfortable"
                hide-details
                @update:model-value="handleFilter"
              ></v-select>
            </v-col>
            <v-col cols="12" sm="3">
              <v-select
                v-model="statusFilter"
                label="狀態"
                :items="statusOptions"
                variant="outlined"
                density="comfortable"
                hide-details
                @update:model-value="handleFilter"
              ></v-select>
            </v-col>
            <v-col cols="12" sm="2" class="d-flex align-center">
              <v-btn
                color="primary"
                variant="text"
                @click="resetFilters"
                class="ml-auto"
              >
                重置
              </v-btn>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- 用戶列表 -->
      <v-card>
        <template v-if="!isMobile">
          <v-data-table-server
            v-model:items-per-page="itemsPerPage"
            :headers="headers"
            :items="users"
            :items-length="totalUsers"
            :loading="loading"
            item-value="id"
            class="elevation-0"
            @update:options="handleTableUpdate"
          >
            <!-- 公司名稱 -->
            <template #item.companyName="{ item }">
              <div class="d-flex align-center">
                <v-avatar size="36" color="primary" class="mr-3">
                  <span class="text-h6 text-white">{{ getInitials(item.companyName) }}</span>
                </v-avatar>
                <div class="font-weight-medium">{{ item.companyName }}</div>
              </div>
            </template>
            
            <!-- 用戶名稱 -->
            <template #item.contactName="{ item }">
              <div class="d-flex align-center">
                <v-avatar size="36" color="primary" class="mr-3">
                  <span class="text-h6 text-white">{{ getInitials(item.contactName) }}</span>
                </v-avatar>
                <div>
                  <div class="font-weight-medium">{{ item.contactName }}</div>
                  <div class="text-caption text-grey">{{ item.email }}</div>
                </div>
              </div>
            </template>

            <!-- 角色 -->
            <template #item.role="{ item }">
              <v-chip
                :color="getRoleColor(item.role)"
                size="small"
                class="text-caption"
              >
                {{ getRoleText(item.role) }}
              </v-chip>
            </template>

            <!-- 狀態 -->
            <template #item.isActive="{ item }">
              <v-switch
                v-model="item.isActive"
                color="success"
                hide-details
                density="compact"
                @change="toggleUserStatus(item)"
              ></v-switch>
            </template>

            <!-- 創建時間 -->
            <template #item.createdAt="{ item }">
              {{ formatDate(item.createdAt) }}
            </template>

            <!-- 操作 -->
            <template #item.actions="{ item }">
              <v-btn
                icon
                size="small"
                variant="text"
                color="primary"
                @click="editUser(item)"
              >
                <v-icon>mdi-pencil</v-icon>
              </v-btn>
              <v-btn
                icon
                size="small"
                variant="text"
                color="error"
                @click="confirmDelete(item)"
              >
                <v-icon>mdi-delete</v-icon>
              </v-btn>
            </template>
          </v-data-table-server>
        </template>
        <template v-else>
          <v-card-text>
            <v-row dense>
              <v-col
                v-for="item in users"
                :key="item._id"
                cols="12"
              >
                <v-card class="mb-3" outlined>
                  <v-card-title class="d-flex align-center">
                    <v-avatar size="36" color="primary" class="mr-3">
                      <span class="text-h6 text-white">{{ getInitials(item.companyName) }}</span>
                    </v-avatar>
                    <span class="font-weight-medium">{{ item.companyName }}</span>
                  </v-card-title>
                  <v-card-subtitle class="d-flex align-center">
                    <v-avatar size="36" color="primary" class="mr-3">
                      <span class="text-h6 text-white">{{ getInitials(item.contactName) }}</span>
                    </v-avatar>
                    <div>
                      <div class="font-weight-medium">{{ item.contactName }}</div>
                      <div class="text-caption text-grey">{{ item.email }}</div>
                    </div>
                  </v-card-subtitle>
                  <v-card-text>
                    <div class="mb-1">
                      <v-chip :color="getRoleColor(item.role)" size="small" class="text-caption mr-2">
                        {{ getRoleText(item.role) }}
                      </v-chip>
                      <v-switch
                        v-model="item.isActive"
                        color="success"
                        hide-details
                        density="compact"
                        @change="toggleUserStatus(item)"
                        class="ml-2"
                        label="啟用"
                      ></v-switch>
                    </div>
                    <div class="text-caption text-grey mb-1">
                      建立：{{ formatDate(item.createdAt) }}
                    </div>
                  </v-card-text>
                  <v-card-actions>
                    <v-btn
                      icon
                      size="small"
                      variant="text"
                      color="primary"
                      @click="editUser(item)"
                    >
                      <v-icon>mdi-pencil</v-icon>
                    </v-btn>
                    <v-btn
                      icon
                      size="small"
                      variant="text"
                      color="error"
                      @click="confirmDelete(item)"
                    >
                      <v-icon>mdi-delete</v-icon>
                    </v-btn>
                  </v-card-actions>
                </v-card>
              </v-col>
            </v-row>
            <div class="text-center text-caption mt-2">
              共 {{ totalUsers }} 筆
            </div>
          </v-card-text>
        </template>
      </v-card>
    </v-container>

    <!-- 用戶編輯對話框 -->
    <v-dialog
      v-model="dialog"
      max-width="600px"
    >
      <v-card>
        <v-card-title class="text-h5">
          {{ isEdit ? '編輯用戶' : '新增用戶' }}
        </v-card-title>
        <v-card-text>
          <v-form ref="form" @submit.prevent="saveUser">
            <v-text-field
              v-model="editedItem.companyName"
              label="公司名稱"
              variant="outlined"
              required
            ></v-text-field>
            
            <v-text-field
              v-model="editedItem.contactName"
              label="姓名"
              :rules="[rules.required]"
              variant="outlined"
              required
            ></v-text-field>
            
            <v-text-field
              v-model="editedItem.email"
              label="電子郵件"
              :rules="[rules.required, rules.email]"
              variant="outlined"
              required
              :disabled="isEdit"
            ></v-text-field>

            <v-text-field
              v-model="editedItem.phone"
              label="電話"
              variant="outlined"
              required
            ></v-text-field>
            
            <v-text-field
              v-if="!isEdit"
              v-model="editedItem.password"
              label="密碼"
              :rules="[rules.required, rules.min]"
              :type="showPassword ? 'text' : 'password'"
              variant="outlined"
              required
              :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
              @click:append-inner="showPassword = !showPassword"
            ></v-text-field>
            
            <v-select
              v-model="editedItem.role"
              label="角色"
              :items="roleOptions"
              variant="outlined"
              required
            ></v-select>
            
            <v-switch
              v-model="editedItem.isActive"
              label="啟用帳號"
              color="success"
              hide-details
            ></v-switch>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="grey-darken-1"
            variant="text"
            @click="closeDialog"
          >
            取消
          </v-btn>
          <v-btn
            color="primary"
            variant="text"
            @click="saveUser"
            :loading="saving"
          >
            保存
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 刪除確認對話框 -->
    <v-dialog
      v-model="deleteDialog"
      max-width="400px"
    >
      <v-card>
        <v-card-title class="text-h5">確認刪除</v-card-title>
        <v-card-text>
          您確定要刪除用戶 <strong>{{ userToDelete?.contactName }}</strong> 嗎？此操作無法撤銷。
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="grey-darken-1"
            variant="text"
            @click="deleteDialog = false"
          >
            取消
          </v-btn>
          <v-btn
            color="error"
            variant="text"
            @click="deleteUser"
            :loading="deleting"
          >
            刪除
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { usersApi } from '@/api';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { useToast } from 'vue-toastification';
import { useDisplay } from 'vuetify';

// Toast 通知
const toast = useToast();

// 表格配置
const headers = [
  { title: '公司名稱', key: 'companyName', sortable: true },
  { title: '用戶', key: 'contactName', sortable: true },
  { title: '角色', key: 'role', sortable: true },
  { title: '狀態', key: 'isActive', sortable: true },
  { title: '創建時間', key: 'createdAt', sortable: true },
  { title: '操作', key: 'actions', sortable: false, align: 'end' }
];

// 狀態
const users = ref([]);
const loading = ref(false);
const saving = ref(false);
const deleting = ref(false);
const dialog = ref(false);
const deleteDialog = ref(false);
const isEdit = ref(false);
const showPassword = ref(false);
const form = ref(null);
const search = ref('');
const roleFilter = ref(null);
const statusFilter = ref(null);
const itemsPerPage = ref(10);
const totalUsers = ref(0);
const userToDelete = ref(null);

// 編輯項目
const defaultItem = {
  contactName: '',
  email: '',
  password: '',
  role: 'dealer',
  isActive: true
};
const editedItem = ref({ ...defaultItem });

// 選項
const roleOptions = [
  { title: '全部', value: null },
  { title: '管理員', value: 'admin' },
  { title: '經銷商', value: 'dealer' }
];

const statusOptions = [
  { title: '全部', value: null },
  { title: '啟用', value: true },
  { title: '停用', value: false }
];

// 驗證規則
const rules = {
  required: v => !!v || '此欄位為必填',
  email: v => /.+@.+\..+/.test(v) || '請輸入有效的電子郵件',
  min: v => (v && v.length >= 6) || '密碼長度至少為 6 個字符'
};

// 方法
const fetchUsers = async (options = {}) => {
  loading.value = true;
  
  try {
    // 構建查詢參數
    const params = {
      page: options.page || 1,
      limit: options.itemsPerPage || itemsPerPage.value,
      search: search.value,
      role: roleFilter.value,
      isActive: statusFilter.value
    };

    // 調用 API
    const response = await usersApi.getUsers(params);
    
    // 更新數據
    users.value = response.data.data;
    totalUsers.value = typeof response.data.total === 'number' ? response.data.total : (Array.isArray(response.data.data) ? response.data.data.length : 0);
    
  } catch (error) {
    console.error('獲取用戶列表失敗:', error);
    toast.error('獲取用戶列表失敗');
  } finally {
    loading.value = false;
  }
};

const handleTableUpdate = (options) => {
  const { page, itemsPerPage, sortBy, sortDesc } = options;
  
  fetchUsers({
    page,
    itemsPerPage,
    sortBy: sortBy[0],
    sortDesc: sortDesc[0]
  });
};

const handleSearch = () => {
  fetchUsers();
};

const handleFilter = () => {
  fetchUsers();
};

const resetFilters = () => {
  search.value = '';
  roleFilter.value = null;
  statusFilter.value = null;
  fetchUsers();
};

const openCreateDialog = () => {
  isEdit.value = false;
  editedItem.value = { ...defaultItem };
  dialog.value = true;
};

const editUser = (item) => {
  isEdit.value = true;
  editedItem.value = { ...item };
  dialog.value = true;
};

const closeDialog = () => {
  dialog.value = false;
  form.value?.reset();
};

const saveUser = async () => {
  const { valid } = await form.value.validate();
  
  if (!valid) return;
  
  saving.value = true;
  
  try {
    if (isEdit.value) {
      // 更新用戶
      await usersApi.updateUser(editedItem.value._id, {
        companyName: editedItem.value.companyName,
        contactName: editedItem.value.contactName,
        email: editedItem.value.email,
        phone: editedItem.value.phone,
        role: editedItem.value.role,
        isActive: editedItem.value.isActive
      });
      toast.success('用戶更新成功');
      fetchUsers();
    } else {
      // 新增用戶
      const response = await usersApi.createUser({
        companyName: editedItem.value.companyName,
        contactName: editedItem.value.contactName,
        email: editedItem.value.email,
        phone: editedItem.value.phone,
        password: editedItem.value.password,
        role: editedItem.value.role,
        isActive: editedItem.value.isActive
      });
      
      // 將新用戶添加到列表開頭
      users.value.unshift(response.data);
      toast.success('用戶創建成功');
      fetchUsers();
    }
    
    closeDialog();
  } catch (error) {
    console.error('保存用戶失敗:', error);
    toast.error(error.response?.data?.message || '保存用戶失敗');
  } finally {
    saving.value = false;
  }
};

const confirmDelete = (item) => {
  userToDelete.value = item;
  deleteDialog.value = true;
};

const deleteUser = async () => {
  if (!userToDelete.value) return;
  
  deleting.value = true;
  
  try {
    await usersApi.deleteUser(userToDelete.value._id);
    
    // 從列表中移除用戶
    const index = users.value.findIndex(u => u._id === userToDelete.value._id);
    if (index !== -1) {
      users.value.splice(index, 1);
    }
    
    toast.success('用戶刪除成功');
    deleteDialog.value = false;
    userToDelete.value = null;
  } catch (error) {
    console.error('刪除用戶失敗:', error);
    toast.error(error.response?.data?.message || '刪除用戶失敗');
  } finally {
    deleting.value = false;
  }
};

const toggleUserStatus = async (item) => {
  try {
    await usersApi.updateUser(item._id, {
      isActive: item.isActive
    });
    
    toast.success(`用戶已${item.isActive ? '啟用' : '停用'}`);
  } catch (error) {
    console.error('更新用戶狀態失敗:', error);
    toast.error(error.response?.data?.message || '更新用戶狀態失敗');
    // 恢復原狀態
    item.isActive = !item.isActive;
  }
};

// 輔助方法
const getInitials = contactName => {
  if (!contactName) return '';
  return contactName
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

const getRoleColor = role => {
  const roleColors = {
    admin: 'error',
    dealer: 'primary'
  };
  return roleColors[role] || 'grey';
};

const getRoleText = role => {
  const roleTexts = {
    admin: '管理員',
    dealer: '經銷商'
  };
  return roleTexts[role] || '未知';
};

const formatDate = dateStr => {
  return format(new Date(dateStr), 'yyyy/MM/dd HH:mm', { locale: zhTW });
};

// 生命週期鉤子
onMounted(() => {
  fetchUsers();
});

const { mobile } = useDisplay();
const isMobile = computed(() => mobile.value);
</script>

<style lang="scss" scoped>
.user-management {
  padding-bottom: 2rem;
}
@media (max-width: 700px) {
  .v-card {
    border-radius: 12px;
    box-shadow: 0 2px 8px 0 rgba(60,60,60,0.10);
  }
}
</style> 