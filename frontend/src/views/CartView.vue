<template>
  <div class="cart-page">
    <v-container>
      <div class="d-flex align-center justify-space-between mb-6">
        <h1 class="text-h4 font-weight-bold">
          購物車
        </h1>
        <v-btn
          v-if="cartStore.items.length"
          color="error"
          variant="text"
          @click="clearCart"
        >
          清空購物車
        </v-btn>
      </div>

      <!-- 購物車為空 -->
      <v-sheet
        v-if="!cartStore.items.length"
        class="text-center py-10"
      >
        <v-icon
          size="64"
          color="grey-lighten-1"
          class="mb-3"
        >
          mdi-cart-outline
        </v-icon>
        <div class="text-h6 text-grey mb-4">
          購物車是空的
        </div>
        <v-btn
          color="primary"
          to="/products"
        >
          繼續購物
        </v-btn>
      </v-sheet>

      <!-- 購物車內容 -->
      <v-row v-else>
        <v-col cols="12" md="8">
          <v-card>
            <v-list>
              <v-list-item
                v-for="item in cartStore.items"
                :key="item._id"
                class="cart-item"
              >
                <template #prepend>
                  <v-avatar
                    size="80"
                    rounded
                    class="me-4"
                  >
                    <v-img
                      :src="getProductImageUrl(item)"
                      cover
                      @error="event => event.target.src = '/images/no-image.jpg'"
                    />
                  </v-avatar>
                </template>

                <v-list-item-title class="text-subtitle-1 font-weight-medium mb-1">
                  {{ item.name }}
                </v-list-item-title>
                <v-list-item-subtitle>
                  {{ item.category.name }} | {{ item.sku }}
                </v-list-item-subtitle>

                <template #append>
                  <div class="d-flex align-center">
                    <div class="text-subtitle-1 font-weight-bold primary--text me-4">
                      NT$ {{ (item.price * item.quantity).toLocaleString() }}
                    </div>
                    <v-btn
                      icon
                      variant="text"
                      color="error"
                      @click="removeItem(item._id)"
                    >
                      <v-icon>mdi-delete</v-icon>
                    </v-btn>
                  </div>
                </template>
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>

        <!-- 訂單摘要 -->
        <v-col cols="12" md="4">
          <v-card>
            <v-card-title class="text-subtitle-1 font-weight-medium">
              訂單摘要
            </v-card-title>
            <v-divider />
            <v-card-text>
              <div class="d-flex justify-space-between mb-2">
                <span>商品總數</span>
                <span>{{ cartStore.totalItems }} 件</span>
              </div>
              <div class="d-flex justify-space-between mb-2">
                <span>商品總額</span>
                <span class="text-primary font-weight-bold">
                  NT$ {{ cartStore.formattedTotalAmount }}
                </span>
              </div>
            </v-card-text>
            <v-divider />
            <v-card-actions>
              <v-btn
                color="primary"
                block
                :to="{ name: 'Checkout' }"
              >
                前往結帳
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- 確認對話框 -->
    <v-dialog
      v-model="showConfirmDialog"
      max-width="400px"
    >
      <v-card>
        <v-card-title class="text-h5">
          確認清空購物車
        </v-card-title>
        <v-card-text>
          您確定要清空購物車嗎？此操作無法撤銷。
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="grey-darken-1"
            variant="text"
            @click="showConfirmDialog = false"
          >
            取消
          </v-btn>
          <v-btn
            color="error"
            variant="text"
            @click="confirmClearCart"
          >
            確認清空
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useCartStore } from '@/stores/cart';
import { useToast } from 'vue-toastification';

const cartStore = useCartStore();
const toast = useToast();
const showConfirmDialog = ref(false);

// 移除商品
const removeItem = productId => {
  cartStore.removeItem(productId);
  toast.success('商品已從購物車移除');
};

// 清空購物車
const clearCart = () => {
  showConfirmDialog.value = true;
};

// 確認清空購物車
const confirmClearCart = () => {
  cartStore.clearCart();
  showConfirmDialog.value = false;
  toast.success('購物車已清空');
};

const getProductImageUrl = item => {
  return item && item._id ? `/api/products/${item._id}/image` : '/images/no-image.jpg';
};
</script>

<style lang="scss" scoped>
.cart-page {
  padding-bottom: 2rem;
}

.cart-item {
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
  
  &:last-child {
    border-bottom: none;
  }
}
</style>
