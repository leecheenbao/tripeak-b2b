<template>
  <div class="product-detail">
    <v-container>
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

      <!-- 產品不存在 -->
      <v-sheet v-else-if="!product" class="text-center py-10">
        <v-icon
          size="64"
          color="grey-lighten-1"
          class="mb-3"
        >
          mdi-alert-circle-outline
        </v-icon>
        <div class="text-h6 text-grey">
          找不到產品
        </div>
        <v-btn
          color="primary"
          class="mt-4"
          to="/products"
        >
          返回產品列表
        </v-btn>
      </v-sheet>

      <!-- 產品詳情 -->
      <v-row v-else>
        <!-- 左側圖片區 -->
        <v-col cols="12" md="6">
          <v-card class="product-images">
            <v-img
              :src="getProductImageUrl(product)"
              height="400"
              cover
              class="align-end"
              @error="onImgError"
            />
          </v-card>
        </v-col>

        <!-- 右側產品資訊 -->
        <v-col cols="12" md="6">
          <div class="product-info">
            <h1 class="text-h4 font-weight-bold mb-2">
              {{ product.name }}
            </h1>
            <!-- <div class="text-subtitle-1 text-grey mb-4">{{ product.category.name }}</div> -->
            
            <!-- 價格 -->
            <div class="price-section mb-6">
              <div class="text-h5 font-weight-bold primary--text">
                NT$ {{ product.price }}
              </div>
            </div>

            <!-- 數量選擇 -->
            <div class="quantity-section mb-6">
              <div class="text-subtitle-1 font-weight-medium mb-2">
                數量
              </div>
              <div class="d-flex align-center">
                <v-btn
                  icon
                  variant="text"
                  :disabled="quantity <= 1"
                  @click="quantity--"
                >
                  <v-icon>mdi-minus</v-icon>
                </v-btn>
                <v-text-field
                  v-model.number="quantity"
                  type="number"
                  density="compact"
                  hide-details
                  class="mx-2"
                  style="width: 80px"
                  :min="1"
                  :max="product.stockQuantity"
                />
                <v-btn
                  icon
                  variant="text"
                  :disabled="quantity >= product.stockQuantity"
                  @click="quantity++"
                >
                  <v-icon>mdi-plus</v-icon>
                </v-btn>
                <span class="text-caption text-grey ml-2">
                  庫存: {{ product.stockQuantity }} {{ product.unit }}
                </span>
              </div>
            </div>

            <!-- 加入購物車按鈕 -->
            <div class="action-buttons">
              <v-btn
                color="primary"
                size="large"
                block
                :loading="addingToCart"
                :disabled="quantity <= 0"
                @click="addToCart"
              >
                <v-icon start>
                  mdi-cart-plus
                </v-icon>
                加入購物車
              </v-btn>
            </div>

            <!-- 前往結帳 -->
            <v-btn
              color="blue"
              size="large"
              block
              to="/cart"
              @click="addToCart"
            >
              前往結帳
            </v-btn>


            <!-- 產品描述 -->
            <v-expansion-panels class="mt-6">
              <v-expansion-panel>
                <v-expansion-panel-title>產品描述</v-expansion-panel-title>
                <v-expansion-panel-text>
                  {{ product.description }}
                </v-expansion-panel-text>
              </v-expansion-panel>
              <v-expansion-panel>
                <v-expansion-panel-title>產品資訊</v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-list>
                    <v-list-item>
                      <template #prepend>
                        <v-icon>mdi-barcode</v-icon>
                      </template>
                      <v-list-item-title>商品編號</v-list-item-title>
                      <template #append>
                        {{ product.sku }}
                      </template>
                    </v-list-item>
                    <v-list-item>
                      <template #prepend>
                        <v-icon>mdi-package-variant</v-icon>
                      </template>
                      <v-list-item-title>單位</v-list-item-title>
                      <template #append>
                        {{ product.unit }}
                      </template>
                    </v-list-item>
                    <v-list-item>
                      <template #prepend>
                        <v-icon>mdi-calendar</v-icon>
                      </template>
                      <v-list-item-title>上架日期</v-list-item-title>
                      <template #append>
                        {{ new Date(product.createdAt).toLocaleDateString() }}
                      </template>
                    </v-list-item>
                  </v-list>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </div>
        </v-col>
      </v-row>
    </v-container>

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
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { productsApi } from '@/api';
import { useCartStore } from '@/stores/cart';
import { useToast } from 'vue-toastification';

const route = useRoute();
const router = useRouter();
const cartStore = useCartStore();
const toast = useToast();

// 狀態
const product = ref(null);
const loading = ref(true);
const quantity = ref(1);
const addingToCart = ref(false);

// 通知提示
const snackbar = ref({
  show: false,
  text: '',
  color: 'success'
});

// 獲取產品詳情
const fetchProduct = async () => {
  loading.value = true;
  try {
    const response = await productsApi.getProduct(route.params.id);
    product.value = response.data.data;
  } catch (error) {
    console.error('獲取產品詳情失敗:', error);
    toast.error('獲取產品詳情失敗');
    router.push('/products');
  } finally {
    loading.value = false;
  }
};

const addToCart = () => {
  if (!product.value) return;
  addingToCart.value = true;
  cartStore.addItem(product.value, quantity.value);
  toast.success(`已將 ${product.value.name} 加入購物車`);
  addingToCart.value = false;
};

const getProductImageUrl = product => {
  return product && product._id ? `/api/products/${product._id}/image` : '/images/no-image.jpg';
};

const onImgError = event => {
  // 確保 event 與 event.target 存在
  if (event && event.target) {
    event.target.src = '/images/no-image.jpg';
  }
};

onMounted(() => {
  fetchProduct();
});
</script>

<style lang="scss" scoped>
.product-detail {
  padding-bottom: 2rem;
}

.price-section {
  .text-decoration-line-through {
    text-decoration: line-through;
  }
}

.quantity-section {
  :deep(.v-field__input) {
    text-align: center;
  }
}
</style>
