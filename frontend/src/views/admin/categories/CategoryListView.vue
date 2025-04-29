<template>
  <div class="category-management">
    <v-container>
      <div class="d-flex align-center justify-space-between mb-6">
        <h1 class="text-h4 font-weight-bold">分類管理</h1>
        <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          @click="openCreateDialog"
        >
          新增分類
        </v-btn>
      </div>

      <!-- 分類列表 -->
      <v-card>
        <v-data-table-server
          v-model:items-per-page="itemsPerPage"
          :headers="headers"
          :items="categories"
          :items-length="totalCategories"
          :loading="loading"
          item-value="id"
          class="elevation-0"
        >
          <!-- 分類名稱 -->
          <template v-slot:item.name="{ item }">
            <div class="d-flex align-center">
              <v-icon
                :color="item.isActive ? 'success' : 'grey'"
                class="mr-2"
              >
                {{ item.isActive ? 'mdi-check-circle' : 'mdi-close-circle' }}
              </v-icon>
              <div>
                <div class="font-weight-medium">{{ item.name }}</div>
                <div class="text-caption text-grey">{{ item.description }}</div>
              </div>
            </div>
          </template>

          <!-- 顯示順序 -->
          <template v-slot:item.displayOrder="{ item }">
            <v-text-field
              v-model="item.displayOrder"
              type="number"
              density="compact"
              hide-details
              class="mt-0"
              style="width: 80px"
              @change="updateDisplayOrder(item)"
            ></v-text-field>
          </template>

          <!-- 狀態 -->
          <template v-slot:item.isActive="{ item }">
            <v-switch
              v-model="item.isActive"
              color="success"
              hide-details
              density="compact"
              @change="toggleCategoryStatus(item)"
            ></v-switch>
          </template>

          <!-- 操作 -->
          <template v-slot:item.actions="{ item }">
            <v-btn
              icon
              size="small"
              variant="text"
              color="primary"
              @click="editCategory(item)"
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
      </v-card>
    </v-container>

    <!-- 分類編輯對話框 -->
    <v-dialog
      v-model="dialog"
      max-width="500px"
      persistent
    >
      <v-card>
        <v-card-title class="text-h5">
          {{ isEdit ? '編輯分類' : '新增分類' }}
        </v-card-title>
        <v-card-text>
          <v-form ref="form" @submit.prevent="saveCategory">
            <v-text-field
              v-model="editedItem.name"
              label="分類名稱"
              :rules="[rules.required]"
              variant="outlined"
              required
            ></v-text-field>
            
            <v-text-field
              v-model="editedItem.description"
              label="分類描述"
              variant="outlined"
            ></v-text-field>
            
            <v-text-field
              v-model.number="editedItem.displayOrder"
              label="顯示順序"
              type="number"
              variant="outlined"
            ></v-text-field>
            
            <v-switch
              v-model="editedItem.isActive"
              label="啟用分類"
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
            @click="saveCategory"
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
          您確定要刪除分類 <strong>{{ categoryToDelete?.name }}</strong> 嗎？此操作無法撤銷。
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
            @click="deleteCategory"
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
import { ref, onMounted } from 'vue';
import { categoriesApi } from '@/api';
import { useToast } from 'vue-toastification';

// Toast 通知
const toast = useToast();

// 表格配置
const headers = [
  { title: '分類名稱', key: 'name', sortable: false },
  { title: '顯示順序', key: 'displayOrder', sortable: true },
  { title: '狀態', key: 'isActive', sortable: false },
  { title: '操作', key: 'actions', sortable: false, align: 'end' }
];

// 狀態
const categories = ref([]);
const loading = ref(false);
const saving = ref(false);
const deleting = ref(false);
const dialog = ref(false);
const deleteDialog = ref(false);
const isEdit = ref(false);
const form = ref(null);
const itemsPerPage = ref(10);
const totalCategories = ref(0);
const categoryToDelete = ref(null);

// 編輯項目
const defaultItem = {
  name: '',
  description: '',
  displayOrder: 0,
  isActive: true
};
const editedItem = ref({ ...defaultItem });

// 驗證規則
const rules = {
  required: v => !!v || '此欄位為必填'
};

// 方法
const fetchCategories = async () => {
  loading.value = true;
  
  try {
    const response = await categoriesApi.getCategories();
    categories.value = response.data.data;
    totalCategories.value = response.data.count;
  } catch (error) {
    console.error('獲取分類列表失敗:', error);
    toast.error('獲取分類列表失敗');
  } finally {
    loading.value = false;
  }
};

const openCreateDialog = () => {
  isEdit.value = false;
  editedItem.value = { ...defaultItem };
  dialog.value = true;
};

const editCategory = (item) => {
  isEdit.value = true;
  editedItem.value = { ...item };
  dialog.value = true;
};

const closeDialog = () => {
  dialog.value = false;
  form.value?.reset();
};

const saveCategory = async () => {
  const { valid } = await form.value.validate();
  
  if (!valid) return;
  
  saving.value = true;
  
  try {
    if (isEdit.value) {
      // 更新分類
      await categoriesApi.updateCategory(editedItem.value._id, {
        name: editedItem.value.name,
        description: editedItem.value.description,
        displayOrder: editedItem.value.displayOrder,
        isActive: editedItem.value.isActive
      });
      toast.success('分類更新成功');
    } else {
      // 新增分類
      await categoriesApi.createCategory({
        name: editedItem.value.name,
        description: editedItem.value.description,
        displayOrder: editedItem.value.displayOrder,
        isActive: editedItem.value.isActive
      });
      toast.success('分類創建成功');
    }
    
    closeDialog();
    fetchCategories();
  } catch (error) {
    console.error('保存分類失敗:', error);
    toast.error(error.response?.data?.error || '保存分類失敗');
  } finally {
    saving.value = false;
  }
};

const confirmDelete = (item) => {
  categoryToDelete.value = item;
  deleteDialog.value = true;
};

const deleteCategory = async () => {
  if (!categoryToDelete.value) return;
  
  deleting.value = true;
  
  try {
    await categoriesApi.deleteCategory(categoryToDelete.value._id);
    
    toast.success('分類刪除成功');
    deleteDialog.value = false;
    categoryToDelete.value = null;
    fetchCategories();
  } catch (error) {
    console.error('刪除分類失敗:', error);
    toast.error(error.response?.data?.error || '刪除分類失敗');
  } finally {
    deleting.value = false;
  }
};

const toggleCategoryStatus = async (item) => {
  try {
    await categoriesApi.updateCategory(item._id, {
      isActive: item.isActive
    });
    
    toast.success(`分類已${item.isActive ? '啟用' : '停用'}`);
  } catch (error) {
    console.error('更新分類狀態失敗:', error);
    toast.error(error.response?.data?.error || '更新分類狀態失敗');
    // 恢復原狀態
    item.isActive = !item.isActive;
  }
};

const updateDisplayOrder = async (item) => {
  try {
    await categoriesApi.updateCategory(item._id, {
      displayOrder: item.displayOrder
    });
    
    toast.success('顯示順序更新成功');
  } catch (error) {
    console.error('更新顯示順序失敗:', error);
    toast.error(error.response?.data?.error || '更新顯示順序失敗');
    // 重新獲取列表以恢復原順序
    fetchCategories();
  }
};

// 生命週期鉤子
onMounted(() => {
  fetchCategories();
});
</script>

<style lang="scss" scoped>
.category-management {
  padding-bottom: 2rem;
}
</style>