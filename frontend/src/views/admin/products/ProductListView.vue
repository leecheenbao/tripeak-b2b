<template>
  <div class="product-management">
    <v-container>
      <div class="d-flex align-center justify-space-between mb-6">
        <h1 class="text-h4 font-weight-bold">
          產品管理
        </h1>
        <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          @click="openCreateDialog"
        >
          新增產品
        </v-btn>
      </div>

      <!-- 搜索和篩選 -->
      <v-card class="mb-6">
        <v-card-text>
          <v-row>
            <v-col cols="12" sm="4">
              <v-text-field
                v-model="search"
                label="搜索產品"
                prepend-inner-icon="mdi-magnify"
                variant="outlined"
                density="comfortable"
                hide-details
                @update:model-value="handleSearch"
              />
            </v-col>
            <v-col cols="12" sm="3">
              <v-select
                v-model="categoryFilter"
                label="分類"
                :items="categories"
                item-title="name"
                item-value="_id"
                variant="outlined"
                density="comfortable"
                hide-details
                @update:model-value="handleFilter"
              />
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
              />
            </v-col>
            <v-col cols="12" sm="2" class="d-flex align-center">
              <v-btn
                color="primary"
                variant="text"
                class="ml-auto"
                @click="resetFilters"
              >
                重置
              </v-btn>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- 桌機 datatable -->
      <v-card v-if="!isMobile">
        <v-data-table-server
          v-model:items-per-page="itemsPerPage"
          :headers="headers"
          :items="products"
          :items-length="totalProducts"
          :loading="loading"
          item-value="id"
          class="elevation-0"
          @update:options="handleTableUpdate"
        >
          <!-- 產品圖片 -->
          <template #item.image="{ item }">
            <v-avatar size="40" rounded>
              <v-img
                :src="getProductImageUrl(item)"
                cover
                @error="event => event.target.src = '/images/no-image.jpg'"
              />
            </v-avatar>
          </template>

          <!-- 產品名稱 -->
          <template #item.name="{ item }">
            <div>
              <div class="font-weight-medium">
                {{ item.name }}
              </div>
              <div class="text-caption text-grey">
                {{ item.sku }}
              </div>
            </div>
          </template>

          <!-- 分類 -->
          <template #item.category="{ item }">
            {{ item.category?.name }}
          </template>

          <!-- 價格 -->
          <template #item.price="{ item }">
            NT$ {{ item.price.toLocaleString() }}
          </template>

          <!-- 庫存 -->
          <template #item.stockQuantity="{ item }">
            <v-text-field
              v-model="item.stockQuantity"
              type="number"
              density="compact"
              hide-details
              class="mt-0"
              style="width: 80px"
              @change="updateStock(item)"
            />
          </template>

          <!-- 狀態 -->
          <template #item.isActive="{ item }">
            <v-switch
              v-model="item.isActive"
              color="success"
              hide-details
              density="compact"
              @change="toggleProductStatus(item)"
            />
          </template>

          <!-- 操作 -->
          <template #item.actions="{ item }">
            <v-btn
              icon
              size="small"
              variant="text"
              color="primary"
              @click="editProduct(item)"
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

      <!-- 手機卡片式 -->
      <div v-else>
        <v-card
          v-for="item in products"
          :key="item.id"
          class="mb-3 rwd-product-card"
        >
          <v-row no-gutters>
            <v-col cols="3" class="d-flex align-center justify-center">
              <v-avatar size="48" rounded>
                <v-img :src="getProductImageUrl(item)" cover />
              </v-avatar>
            </v-col>
            <v-col cols="9">
              <div class="font-weight-bold mb-1">{{ item.name }}</div>
              <div class="text-caption text-grey mb-1">{{ item.sku }}</div>
              <div>分類：{{ item.category?.name }}</div>
              <div>價格：<span class="text-primary">NT$ {{ item.price.toLocaleString() }}</span></div>
              <div>庫存：{{ item.stockQuantity }}</div>
              <div class="mt-2">
                <v-btn icon size="small" variant="text" color="primary" @click="editProduct(item)">
                  <v-icon>mdi-pencil</v-icon>
                </v-btn>
                <v-btn icon size="small" variant="text" color="error" @click="confirmDelete(item)">
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </div>
            </v-col>
          </v-row>
        </v-card>
      </div>
    </v-container>

    <!-- 產品編輯對話框 -->
    <v-dialog
      v-model="dialog"
      max-width="800px"
    >
      <v-card>
        <v-card-title class="text-h5">
          {{ isEdit ? '編輯產品' : '新增產品' }}
        </v-card-title>
        <v-card-text>
          <v-form ref="form" @submit.prevent="saveProduct">
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editedItem.name"
                  label="產品名稱"
                  :rules="[rules.required]"
                  variant="outlined"
                  required
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editedItem.sku"
                  label="SKU"
                  :rules="[rules.required]"
                  variant="outlined"
                  required
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="editedItem.category"
                  label="分類"
                  :items="categories"
                  item-title="name"
                  item-value="_id"
                  :rules="[rules.required]"
                  variant="outlined"
                  required
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model.number="editedItem.price"
                  label="價格"
                  type="number"
                  :rules="[rules.required, rules.min]"
                  variant="outlined"
                  required
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model.number="editedItem.stockQuantity"
                  label="庫存數量"
                  type="number"
                  :rules="[rules.required, rules.min]"
                  variant="outlined"
                  required
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editedItem.unit"
                  label="單位"
                  variant="outlined"
                />
              </v-col>
              <v-col cols="12">
                <v-textarea
                  v-model="editedItem.description"
                  label="產品描述"
                  variant="outlined"
                  rows="3"
                />
              </v-col>
              <v-col cols="12">
                <v-file-input
                  v-model="imageFile"
                  label="產品圖片"
                  accept="image/*"
                  variant="outlined"
                  prepend-icon="mdi-camera"
                  @change="handleImageChange"
                />
              </v-col>
              <v-col cols="12">
                <v-img
                  v-if="imagePreviewUrl"
                  :src="imagePreviewUrl"
                  max-width="200"
                  class="my-2"
                  cover
                ></v-img>
              </v-col>
              <v-col cols="12">
                <v-switch
                  v-model="editedItem.isActive"
                  label="啟用產品"
                  color="success"
                  hide-details
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
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
            :loading="saving"
            @click="saveProduct"
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
        <v-card-title class="text-h5">
          確認刪除
        </v-card-title>
        <v-card-text>
          您確定要刪除產品 <strong>{{ productToDelete?.name }}</strong> 嗎？此操作無法撤銷。
        </v-card-text>
        <v-card-actions>
          <v-spacer />
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
            :loading="deleting"
            @click="deleteProduct"
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
import { productsApi, categoriesApi } from '@/api';
import { useToast } from 'vue-toastification';

// Toast 通知
const toast = useToast();

// 表格配置
const headers = [
  { title: '圖片', key: 'image', sortable: false },
  { title: '產品名稱', key: 'name', sortable: true },
  { title: '分類', key: 'category', sortable: true },
  { title: '價格', key: 'price', sortable: true },
  { title: '庫存', key: 'stockQuantity', sortable: true },
  { title: '狀態', key: 'isActive', sortable: false },
  { title: '操作', key: 'actions', sortable: false, align: 'end' }
];

// 狀態
const products = ref([]);
const categories = ref([]);
const loading = ref(false);
const saving = ref(false);
const deleting = ref(false);
const dialog = ref(false);
const deleteDialog = ref(false);
const isEdit = ref(false);
const form = ref(null);
const search = ref('');
const categoryFilter = ref(null);
const statusFilter = ref(null);
const itemsPerPage = ref(10);
const totalProducts = ref(0);
const productToDelete = ref(null);
const imageFile = ref(null);
const page = ref(1);
const imagePreviewUrl = ref(null);
const isMobile = ref(false);

// 編輯項目
const defaultItem = {
  name: '',
  sku: '',
  description: '',
  price: 0,
  stockQuantity: 0,
  category: '',
  unit: '件',
  isActive: true
};
const editedItem = ref({ ...defaultItem });

// 選項
const statusOptions = [
  { title: '全部', value: null },
  { title: '啟用', value: true },
  { title: '停用', value: false }
];

// 驗證規則
const rules = {
  required: v => !!v || '此欄位為必填',
  min: v => v >= 0 || '數值不能小於 0'
};

// 方法
const fetchProducts = async (options = {}) => {
  loading.value = true;
  
  try {
    // 構建查詢參數
    const params = {
      page: options.page || page.value,
      limit: options.itemsPerPage || itemsPerPage.value,
      keyword: search.value,
      category: categoryFilter.value,
      isActive: statusFilter.value,
      sort: options.sortBy ? `${options.sortBy.key}:${options.sortBy.order === 'desc' ? 'desc' : 'asc'}` : undefined
    };

    // 調用 API
    const response = await productsApi.getAdminProducts(params);
    // 更新數據
    products.value = response.data.data;
    totalProducts.value = response.data.pagination.total;
    
  } catch (error) {
    console.error('獲取產品列表失敗:', error);
    toast.error('獲取產品列表失敗');
  } finally {
    loading.value = false;
  }
};

const fetchCategories = async () => {
  try {
    const response = await categoriesApi.getCategories();
    categories.value = response.data.data;
  } catch (error) {
    console.error('獲取分類失敗:', error);
    toast.error('獲取分類失敗');
  }
};

const handleTableUpdate = options => {
  const { page: newPage, itemsPerPage: newItemsPerPage, sortBy, sortDesc } = options;
  
  // 更新分頁設置
  page.value = newPage;
  itemsPerPage.value = newItemsPerPage;
  
  fetchProducts({
    page: newPage,
    itemsPerPage: newItemsPerPage,
    sortBy: sortBy[0],
    // sortDesc: sortDesc[0]
  });
};

const handleSearch = () => {
  page.value = 1;
  fetchProducts();
};

const handleFilter = () => {
  page.value = 1;
  fetchProducts();
};

const resetFilters = () => {
  search.value = '';
  categoryFilter.value = null;
  statusFilter.value = null;
  page.value = 1;
  fetchProducts();
};

const openCreateDialog = () => {
  isEdit.value = false;
  editedItem.value = { ...defaultItem };
  imageFile.value = null;
  dialog.value = true;
};

const editProduct = item => {
  isEdit.value = true;
  editedItem.value = { ...item };
  imageFile.value = null;
  dialog.value = true;
};

const closeDialog = () => {
  dialog.value = false;
  form.value?.reset();
  imagePreviewUrl.value = null;
};

const handleImageChange = file => {
  if (file) {
    const reader = new FileReader();
    reader.onload = e => {
      imagePreviewUrl.value = e.target.result;
    };
    reader.readAsDataURL(file);
  } else {
    imagePreviewUrl.value = null;
  }
};

const saveProduct = async () => {
  const { valid } = await form.value.validate();
  
  if (!valid) return;
  
  saving.value = true;
  
  try {
    if (isEdit.value) {
      // 更新產品
      await productsApi.updateProduct(editedItem.value._id, {
        name: editedItem.value.name,
        sku: editedItem.value.sku,
        description: editedItem.value.description,
        price: editedItem.value.price,
        stockQuantity: editedItem.value.stockQuantity,
        category: editedItem.value.category,
        unit: editedItem.value.unit,
        isActive: editedItem.value.isActive
      });

      // 如果有新圖片，上傳圖片
      if (imageFile.value) {
        const formData = new FormData();
        formData.append('image', imageFile.value);
        await productsApi.uploadImage(editedItem.value._id, formData);
      }

      toast.success('產品更新成功');
    } else {
      // 新增產品
      const response = await productsApi.createProduct({
        name: editedItem.value.name,
        sku: editedItem.value.sku,
        description: editedItem.value.description,
        price: editedItem.value.price,
        stockQuantity: editedItem.value.stockQuantity,
        category: editedItem.value.category,
        unit: editedItem.value.unit,
        isActive: editedItem.value.isActive
      });

      // 如果有圖片，上傳圖片
      if (imageFile.value) {
        const formData = new FormData();
        formData.append('image', imageFile.value);
        await productsApi.uploadImage(response.data.data._id, formData);
      }

      toast.success('產品創建成功');
    }
    
    closeDialog();
    fetchProducts();
    console.log('刷新頁面');
  } catch (error) {
    console.error('保存產品失敗:', error);
    toast.error(error.response?.data?.error || '保存產品失敗');
  } finally {
    saving.value = false;
  }
};

const confirmDelete = item => {
  productToDelete.value = item;
  deleteDialog.value = true;
};

const deleteProduct = async () => {
  if (!productToDelete.value) return;
  
  deleting.value = true;
  
  try {
    await productsApi.deleteProduct(productToDelete.value._id);
    
    toast.success('產品刪除成功');
    deleteDialog.value = false;
    productToDelete.value = null;
    fetchProducts();
  } catch (error) {
    console.error('刪除產品失敗:', error);
    toast.error(error.response?.data?.error || '刪除產品失敗');
  } finally {
    deleting.value = false;
  }
};

const toggleProductStatus = async item => {
  try {
    await productsApi.updateProduct(item._id, {
      isActive: item.isActive
    });
    
    toast.success(`產品已${item.isActive ? '啟用' : '停用'}`);
  } catch (error) {
    console.error('更新產品狀態失敗:', error);
    toast.error(error.response?.data?.error || '更新產品狀態失敗');
    // 恢復原狀態
    item.isActive = !item.isActive;
  }
};

const updateStock = async item => {
  try {
    await productsApi.updateProduct(item._id, {
      stockQuantity: item.stockQuantity
    });
    
    toast.success('庫存更新成功');
  } catch (error) {
    console.error('更新庫存失敗:', error);
    toast.error(error.response?.data?.error || '更新庫存失敗');
    // 重新獲取列表以恢復原庫存
    fetchProducts();
  }
};

const getProductImageUrl = item => `/api/products/${item._id}/image`;

// 生命週期鉤子
onMounted(() => {
  fetchProducts();
  fetchCategories();
  const check = () => { isMobile.value = window.innerWidth <= 700; };
  check();
  window.addEventListener('resize', check);
});
</script>

<style lang="scss" scoped>
.product-management {
  padding-bottom: 2rem;
}
@media (max-width: 700px) {
  .product-management .d-flex.align-center.justify-space-between.mb-6 {
    flex-direction: column;
    align-items: stretch;
    gap: 0;
    margin-bottom: 18px !important;
    h1 {
      text-align: center;
      font-size: 2rem;
      margin-bottom: 18px;
    }
    > .v-btn {
      width: 100%;
      margin-bottom: 16px;
      font-size: 1.1rem;
      justify-content: center;
    }
  }
  .product-management .v-card.mb-6 {
    border-radius: 16px;
    box-shadow: 0 2px 10px 0 rgba(60,60,60,0.07);
    margin-bottom: 18px;
    padding: 8px 0 8px 0;
  }
  .product-management .v-card-text > .v-row {
    flex-direction: column;
    gap: 0;
    > .v-col {
      width: 100%;
      max-width: 100%;
      margin-bottom: 10px;
    }
    .v-btn {
      width: 100%;
      margin: 0;
    }
  }
  .product-management .v-card {
    border-radius: 16px;
    box-shadow: 0 2px 10px 0 rgba(60,60,60,0.07);
    margin-bottom: 18px;
    overflow-x: auto;
  }
  .product-management .v-data-table-server {
    min-width: 650px;
    font-size: 0.92rem;
    th, td {
      padding: 6px 4px !important;
      line-height: 1.2;
    }
    th {
      font-size: 1.02rem;
      font-weight: 700;
      background: #fafbfc;
    }
    td {
      font-size: 0.98rem;
      vertical-align: middle;
    }
    .font-weight-medium {
      font-size: 1.08rem;
      font-weight: 700;
    }
    .v-text-field {
      font-size: 1rem;
      min-width: 60px;
    }
    .v-avatar {
      width: 32px !important;
      height: 32px !important;
    }
  }
  .rwd-product-card {
    border-radius: 16px;
    box-shadow: 0 2px 10px 0 rgba(60,60,60,0.07);
    padding: 14px 10px;
    margin-bottom: 18px;
  }
}
</style>
