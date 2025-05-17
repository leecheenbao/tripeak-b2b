<!-- eslint-disable max-len -->
<template>
  <div class="products-page">
    <v-container>
      <div class="d-flex align-center justify-space-between mb-6">
        <h1 class="text-h4 font-weight-bold">
          產品目錄
        </h1>
        <div class="d-flex align-center">
          <v-text-field
            v-model="searchQuery"
            prepend-inner-icon="mdi-magnify"
            placeholder="搜尋產品..."
            density="compact"
            variant="outlined"
            hide-details
            class="mr-2"
            style="width: 220px;"
            @update:model-value="handleSearch"
          />
          <v-btn
            color="primary"
            variant="text"
            :loading="loading"
            @click="refreshProducts"
          >
            <v-icon>mdi-refresh</v-icon>
          </v-btn>
          <v-btn-toggle
            v-model="viewMode"
            density="comfortable"
            mandatory
            rounded="lg"
            color="primary"
          >
            <v-btn icon value="grid">
              <v-icon>mdi-view-grid</v-icon>
            </v-btn>
            <v-btn icon value="list">
              <v-icon>mdi-view-list</v-icon>
            </v-btn>
          </v-btn-toggle>
        </div>
      </div>

      <v-row>
        <!-- 左側篩選器 -->
        <v-col
          cols="12"
          md="3"
          class="d-none d-md-block"
        >
          <v-card>
            <v-card-title class="text-subtitle-1 font-weight-bold">
              分類
            </v-card-title>
            <v-divider />
            <v-list>
              <v-list-item
                v-for="category in categories"
                :key="category.id"
                :value="category.id"
                :active="selectedCategory === category.id"
                active-color="primary"
                @click="selectCategory(category.id)"
              >
                <v-list-item-title>{{ category.name }}</v-list-item-title>
                <template #append>
                  <v-badge
                    :content="category.productCount"
                    color="primary"
                    inline
                  />
                </template>
              </v-list-item>
            </v-list>

            <v-divider class="my-2" />
            
            <v-card-title class="text-subtitle-1 font-weight-bold">
              價格區間
            </v-card-title>
            <v-card-text>
              <div class="price-range-container">
                <div class="d-flex align-center mb-10" />
                <v-range-slider
                  v-model="priceRange"
                  :min="0"
                  :max="10000"
                  :step="100"
                  color="primary"
                  track-color="grey-lighten-3"
                  thumb-label="always"
                  thumb-size="24"
                  class="mb-4"
                  @update:model-value="handlePriceFilter"
                >
                  <template #prepend />
                  <template #append />
                </v-range-slider>
              </div>
            </v-card-text>

            <v-divider class="my-2" />
            
            <v-card-actions>
              <v-btn
                color="primary"
                variant="text"
                block
                @click="resetFilters"
              >
                重置篩選
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>

        <!-- 產品列表內容 -->
        <v-col
          cols="12"
          md="9"
        >
          <!-- 行動裝置篩選器開關 -->
          <v-sheet
            class="d-flex d-md-none mb-4 align-center justify-space-between"
            rounded
            elevation="1"
            color="grey-lighten-4"
            style="padding: 12px;"
          >
            <div class="text-body-1 font-weight-medium">
              共 {{ products.length }} 件商品
            </div>
            <v-btn
              prepend-icon="mdi-filter-variant"
              color="primary"
              variant="text"
              @click="showFilterDialog = true"
            >
              篩選
            </v-btn>
          </v-sheet>

          <!-- 載入中 -->
          <v-sheet v-if="loading" class="text-center py-10">
            <v-progress-circular
              indeterminate
              size="50"
              color="primary"
              class="mb-3"
            />
            <div>載入產品資訊...</div>
          </v-sheet>
          
          <!-- 無產品時顯示 -->
          <v-sheet v-else-if="!products.length" class="text-center py-10">
            <v-icon
              size="64"
              color="grey-lighten-1"
              class="mb-3"
            >
              mdi-shopping-outline
            </v-icon>
            <div class="text-h6 text-grey">
              沒有找到符合條件的產品
            </div>
          </v-sheet>
          
          <!-- 網格視圖 -->
          <v-row v-else-if="viewMode === 'grid'">
            <v-col
              v-for="product in products"
              :key="product.id"
              cols="12"
              sm="6"
              lg="4"
            >
              <v-card
                class="product-card"
                :to="{ name: 'ProductDetail', params: { id: product.id } }"
              >
                <v-img
                  :src="getProductImageUrl(product)"
                  height="200"
                  cover
                  class="align-end"
                  @error="event => event.target.src = '/default-image.png'"
                >
                  <v-chip
                    v-if="product.discount"
                    color="error"
                    size="small"
                    class="ma-2"
                  >
                    特價
                  </v-chip>
                </v-img>
                <v-card-title class="text-subtitle-1 font-weight-medium">
                  {{ product.name }}
                </v-card-title>
                <v-card-subtitle>
                  {{ product.categoryName }}
                </v-card-subtitle>
                <v-card-text>
                  <v-row align="center" class="mx-0">
                    <div class="text-subtitle-1 font-weight-bold primary--text">
                      NT$ {{ product.price.toLocaleString() }}
                    </div>
                    <v-spacer />
                    <v-rating
                      :model-value="product.rating"
                      color="amber"
                      density="compact"
                      size="small"
                      readonly
                      half-increments
                    />
                  </v-row>
                </v-card-text>
                <v-divider />
                <v-card-actions>
                  <v-btn
                    variant="text"
                    color="primary"
                    @click.stop="addToCart(product)"
                  >
                    加入購物車
                  </v-btn>
                  <v-spacer />
                  <v-btn
                    icon
                    variant="text"
                    :to="{ name: 'ProductDetail', params: { id: product.id } }"
                    @click.stop
                  >
                    <v-icon>mdi-eye</v-icon>
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-col>
          </v-row>
          
          <!-- 列表視圖 -->
          <v-card v-else>
            <v-list lines="two">
              <v-list-item
                v-for="product in products"
                :key="product.id"
                :to="{ name: 'ProductDetail', params: { id: product.id } }"
              >
                <template #prepend>
                  <v-avatar
                    size="80"
                    rounded
                    class="me-4"
                  >
                    <v-img :src="getProductImageUrl(product)" cover />
                  </v-avatar>
                </template>
                <v-list-item-title class="text-subtitle-1 font-weight-medium mb-1">
                  {{ product.name }}
                </v-list-item-title>
                <v-list-item-subtitle>
                  分類: {{ product.categoryName }} | 
                  評分: {{ product.rating }}
                  <v-icon 
                    color="amber" 
                    size="small"
                  >
                    mdi-star
                  </v-icon>
                </v-list-item-subtitle>
                <template #append>
                  <div class="d-flex flex-column align-end">
                    <div class="text-subtitle-1 font-weight-bold primary--text mb-2">
                      NT$ {{ product.price.toLocaleString() }}
                    </div>
                    <v-btn
                      density="compact"
                      icon
                      variant="text"
                      color="primary"
                      @click.stop="addToCart(product)"
                    >
                      <v-icon>mdi-cart-plus</v-icon>
                    </v-btn>
                  </div>
                </template>
              </v-list-item>
            </v-list>
          </v-card>
          
          <!-- 分頁 -->
          <div class="d-flex justify-center mt-6">
            <v-pagination
              v-model="page"
              :length="totalPages"
              :total-visible="7"
              rounded="circle"
              @update:model-value="fetchProducts"
            />
          </div>
        </v-col>
      </v-row>
    </v-container>
    
    <!-- 行動裝置篩選器對話框 -->
    <v-dialog
      v-model="showFilterDialog"
      fullscreen
      transition="dialog-bottom-transition"
    >
      <v-card>
        <v-toolbar color="primary">
          <v-btn
            icon
            @click="showFilterDialog = false"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
          <v-toolbar-title>篩選產品</v-toolbar-title>
          <v-spacer />
          <v-toolbar-items>
            <v-btn
              variant="text"
              @click="resetFilters"
            >
              重置
            </v-btn>
          </v-toolbar-items>
        </v-toolbar>
        <v-list>
          <v-list-subheader>分類</v-list-subheader>
          <v-list-item
            v-for="category in categories"
            :key="category.id"
            :value="category.id"
            :active="selectedCategory === category.id"
            active-color="primary"
            @click="selectCategory(category.id)"
          >
            <template #prepend>
              <v-checkbox-btn
                :model-value="selectedCategory === category.id"
                color="primary"
              />
            </template>
            <v-list-item-title>{{ category.name }}</v-list-item-title>
            <template #append>
              <v-badge
                :content="category.productCount"
                color="primary"
                inline
              />
            </template>
          </v-list-item>
          <v-divider />
          <v-list-subheader>價格區間111</v-list-subheader>
          <v-list-item>
            <v-card-text>
              <div class="price-range-container">
                <div class="d-flex align-center mb-2">
                  <span class="text-subtitle-2">價格區間</span>
                  <v-spacer />
                  <span class="text-caption text-grey">
                    NT$ {{ priceRange[0].toLocaleString() }} - NT$ {{ priceRange[1].toLocaleString() }}
                  </span>
                </div>
                <v-range-slider
                  v-model="priceRange"
                  :min="0"
                  :max="10000"
                  :step="100"
                  color="primary"
                  track-color="grey-lighten-3"
                  thumb-label="always"
                  thumb-size="24"
                  class="mb-4"
                  @update:model-value="handlePriceFilter"
                >
                  <template #prepend>
                    <v-text-field
                      v-model="priceRange[0]"
                      type="number"
                      density="compact"
                      style="width: 100px"
                      hide-details
                      single-line
                      variant="outlined"
                      prefix="NT$"
                      class="price-input"
                      @update:model-value="setPriceRange"
                    />
                  </template>
                  <template #append>
                    <v-text-field
                      v-model="priceRange[1]"
                      type="number"
                      density="compact"
                      style="width: 100px"
                      hide-details
                      single-line
                      variant="outlined"
                      prefix="NT$"
                      class="price-input"
                      @update:model-value="setPriceRange"
                    />
                  </template>
                </v-range-slider>
              </div>
            </v-card-text>
          </v-list-item>
        </v-list>
        <v-divider />
        <v-card-actions>
          <v-btn
            color="primary"
            block
            class="mb-4"
            @click="showFilterDialog = false"
          >
            套用篩選
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 加入購物車通知 -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      timeout="3000"
    >
      {{ snackbar.text }}
      <template #actions>
        <v-btn
          variant="text"
          icon="mdi-close"
          @click="snackbar.show = false"
        />
      </template>
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useUiStore } from '@/stores/ui';
import { productsApi, categoriesApi } from '@/api';
import { useToast } from 'vue-toastification';

// Store
const uiStore = useUiStore();
const toast = useToast();

// 狀態
const products = ref([]);
const categories = ref([]);
const loading = ref(true);
const viewMode = ref('grid');
const page = ref(1);
const totalPages = ref(1);
const itemsPerPage = ref(9);
const selectedCategory = ref(null);
const searchQuery = ref('');
const priceRange = ref([0, 10000]);
const showFilterDialog = ref(false);

// 通知提示
const snackbar = reactive({
  show: false,
  text: '',
  color: 'success'
});

// 方法
const fetchProducts = async (options = {}) => {
  loading.value = true;
  
  try {
    // 構建查詢參數
    const params = {
      page: options.page || page.value,
      limit: options.itemsPerPage || itemsPerPage.value,
      keyword: searchQuery.value,
      category_id: selectedCategory.value,
      min_price: priceRange.value[0],
      max_price: priceRange.value[1]
    };

    // 處理排序
    if (options.sortBy && options.sortBy.length > 0) {
      const sortField = options.sortBy[0];
      const sortOrder = options.sortDesc[0] ? 'desc' : 'asc';
      params.sort = `${sortField}:${sortOrder}`;
    }

    // 調用 API
    const response = await productsApi.getProducts(params);
    
    // 更新數據
    products.value = response.data.data;
    totalPages.value = Math.ceil(response.data.pagination.total / itemsPerPage.value);
    
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
    // 統計全部產品數量
    const totalCount = response.data.data.reduce((sum, cat) => sum + (cat.productCount || 0), 0);
    categories.value = [
      { id: 'all', name: '全部產品', productCount: totalCount },
      ...response.data.data.map(category => ({
        id: category._id,
        name: category.name,
        productCount: category.productCount || 0
      }))
    ];
  } catch (error) {
    console.error('獲取分類失敗:', error);
    toast.error('獲取分類失敗');
  }
};

const selectCategory = categoryId => {
  selectedCategory.value = categoryId === 'all' ? null : categoryId;
  page.value = 1; // 重置頁碼
  fetchProducts({
    page: 1,
    itemsPerPage: itemsPerPage.value
  });
};

const handleSearch = () => {
  page.value = 1; // 重置頁碼
  fetchProducts();
};

const handlePriceFilter = () => {
  page.value = 1; // 重置頁碼
  fetchProducts();
};

const setPriceRange = () => {
  // 確保最大值大於最小值
  if (priceRange.value[0] > priceRange.value[1]) {
    priceRange.value = [priceRange.value[1], priceRange.value[0]];
  }
  page.value = 1; // 重置頁碼
  fetchProducts();
};

const resetFilters = () => {
  selectedCategory.value = null;
  searchQuery.value = '';
  priceRange.value = [0, 10000];
  page.value = 1; // 重置頁碼
  fetchProducts();
  
  if (showFilterDialog.value) {
    showFilterDialog.value = false;
  }
};

const refreshProducts = () => {
  fetchProducts();
};

const addToCart = product => {
  uiStore.addToCart(product);
  
  snackbar.text = `已將 ${product.name} 加入購物車`;
  snackbar.color = 'success';
  snackbar.show = true;
};

const getProductImageUrl = product => {
  return product._id ? `/api/products/${product._id}/image` : '/default-image.png';
};

// 生命週期鉤子
onMounted(() => {
  fetchProducts();
  fetchCategories();
});
</script>

<style lang="scss" scoped>
.product-card {
  height: 100%;
  transition: transform 0.3s, box-shadow 0.3s;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  }
}

.price-range-container {
  padding: 8px 0;
  
  .price-input {
    :deep(.v-field__input) {
      padding-top: 0;
      padding-bottom: 0;
    }
  }
  
  :deep(.v-slider-thumb__label) {
    background-color: primary;
    color: white;
    font-size: 12px;
  }
  
  :deep(.v-slider-track__background) {
    opacity: 0.3;
  }
  
  :deep(.v-slider-track__fill) {
    opacity: 1;
  }
}
</style> 