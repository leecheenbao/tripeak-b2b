<template>
  <div class="category-management">
    <v-container>
      <div class="d-flex align-center justify-space-between mb-6 category-header-btns">
        <h1 class="text-h4 font-weight-bold">分類管理</h1>
        <div class="category-btn-group">
          <v-btn
            color="secondary"
            prepend-icon="mdi-drag"
            class="mr-2"
            @click="toggleDragMode"
          >
            {{ dragMode ? '手動輸入' : '拖拉排序' }}
          </v-btn>
          <v-btn
            color="primary"
            prepend-icon="mdi-plus"
            @click="openCreateDialog"
          >
            新增分類
          </v-btn>
        </div>
      </div>

      <!-- 拖拉排序區塊 -->
      <v-card v-if="dragMode" class="mb-4 drag-card">
        <draggable
          v-model="dragCategories"
          item-key="_id"
          handle=".drag-handle"
          animation="200"
        >
          <template #item="{ element }">
            <div class="drag-item">
              <v-icon class="mr-4 drag-handle drag-handle-icon" color="grey darken-2">mdi-drag</v-icon>
              <div class="drag-content">
                <div class="drag-title">{{ element.name }}</div>
                <div class="drag-desc">{{ element.description }}</div>
              </div>
              <div class="drag-actions-btns">
                <v-btn
                  icon
                  size="small"
                  variant="text"
                  color="primary"
                  class="drag-edit-btn"
                  @click.stop="editCategory(element)"
                >
                  <v-icon>mdi-pencil</v-icon>
                </v-btn>
                <v-btn
                  icon
                  size="small"
                  variant="text"
                  color="error"
                  class="drag-delete-btn"
                  @click.stop="confirmDelete(element)"
                >
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </div>
            </div>
          </template>
          <template #footer>
            <div v-if="dragCategories.length === 0" class="empty-tip">尚無分類，請先新增分類</div>
          </template>
        </draggable>
        <div class="drag-actions">
          <v-btn color="primary" @click="saveDragOrder" :loading="saving">儲存排序</v-btn>
        </div>
      </v-card>

      <!-- 分類列表 -->
      <v-card v-if="!dragMode">
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
          <template #item.name="{ item }">
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
          <template #item.displayOrder="{ item }">
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
          <template #item.isActive="{ item }">
            <v-switch
              v-model="item.isActive"
              color="success"
              hide-details
              density="compact"
              @change="toggleCategoryStatus(item)"
            ></v-switch>
          </template>

          <!-- 操作 -->
          <template #item.actions="{ item }">
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
import draggable from 'vuedraggable';

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
const dragMode = ref(true);
const dragCategories = ref([]);

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
    // 拖拉模式時自動同步資料
    if (dragMode.value) {
      dragCategories.value = [...categories.value].sort((a, b) => a.displayOrder - b.displayOrder);
    }
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

const editCategory = item => {
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

const confirmDelete = item => {
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

const toggleCategoryStatus = async item => {
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

const updateDisplayOrder = async item => {
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

const toggleDragMode = () => {
  dragMode.value = !dragMode.value;
  if (dragMode.value) {
    dragCategories.value = [...categories.value].sort((a, b) => a.displayOrder - b.displayOrder);
  }
};

const saveDragOrder = async () => {
  saving.value = true;
  try {
    for (let i = 0; i < dragCategories.value.length; i++) {
      const cat = dragCategories.value[i];
      if (cat.displayOrder !== i + 1) {
        await categoriesApi.updateCategory(cat._id, { displayOrder: i + 1 });
      }
    }
    toast.success('分類順序已更新');
    dragMode.value = false;
    fetchCategories();
  } catch (error) {
    toast.error('儲存排序失敗');
  } finally {
    saving.value = false;
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
.drag-card {
  padding: 0 0 32px 0;
  min-height: 200px;
  position: relative;
}
.drag-item {
  display: flex;
  align-items: center;
  padding: 18px 32px 18px 24px;
  border-bottom: 1px solid #eee;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px 0 rgba(60,60,60,0.04);
  margin-bottom: 12px;
  transition: background 0.2s, box-shadow 0.2s;
  cursor: grab;
  &:hover {
    background: #f5f7fa;
    box-shadow: 0 4px 16px 0 rgba(60,60,60,0.10);
    .drag-edit-btn, .drag-delete-btn {
      opacity: 1;
    }
  }
}
.drag-item:last-child {
  margin-bottom: 0;
  border-bottom: none;
}
.drag-handle-icon {
  font-size: 2rem;
  cursor: grab;
  opacity: 0.8;
  transition: opacity 0.2s;
  &:hover {
    opacity: 1;
  }
}
.drag-content {
  flex: 1;
  min-width: 0;
}
.drag-title {
  font-size: 1.22rem;
  font-weight: 700;
  color: #222;
  word-break: break-all;
}
.drag-desc {
  font-size: 0.98rem;
  color: #bbb;
  margin-top: 2px;
  word-break: break-all;
}
.drag-actions-btns {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 16px;
}
.drag-edit-btn, .drag-delete-btn {
  opacity: 0.6;
  transition: opacity 0.2s;
}
.drag-edit-btn:hover, .drag-delete-btn:hover {
  opacity: 1;
}
.drag-actions {
  position: absolute;
  right: 32px;
  bottom: 5px;
  padding-top: 10px;
}
.empty-tip {
  text-align: center;
  color: #aaa;
  padding: 32px 0 16px 0;
  font-size: 1.1rem;
}
.category-header-btns {
  .category-btn-group {
    display: flex;
    align-items: center;
  }
}
@media (max-width: 700px) {
  .drag-item {
    flex-direction: column;
    align-items: flex-start;
    padding: 18px 12px 18px 12px;
    border-radius: 16px;
    margin-bottom: 18px;
    box-shadow: 0 2px 10px 0 rgba(60,60,60,0.07);
  }
  .drag-content {
    width: 100%;
  }
  .drag-title {
    font-size: 1.25rem;
    font-weight: 700;
    margin-bottom: 10px;
  }
  .drag-desc {
    font-size: 1.05rem;
    margin-bottom: 18px;
  }
  .drag-actions-btns {
    margin-left: 0;
    margin-top: 10px;
    width: 100%;
    justify-content: flex-start;
    gap: 18px;
  }
  .drag-actions {
    position: static;
    right: auto;
    bottom: auto;
    width: 100%;
    padding: 0 0 10px 0;
    display: flex;
    justify-content: center;
  }
  .drag-actions .v-btn {
    width: 90%;
    font-size: 1.15rem;
    padding: 14px 0;
    margin-top: 8px;
    border-radius: 8px;
  }
  .category-header-btns {
    flex-direction: column;
    align-items: flex-start;
    .category-btn-group {
      flex-direction: column;
      width: 100%;
      margin-top: 10px;
      > .v-btn {
        width: 100%;
        margin: 0 0 10px 0;
        font-size: 1.1rem;
        justify-content: center;
      }
      > .v-btn:last-child {
        margin-bottom: 0;
      }
    }
  }
}
</style>