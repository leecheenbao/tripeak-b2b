<template>
  <div class="dashboard">
    <v-container>
      <h1 class="text-h4 font-weight-bold mb-6">儀表板</h1>
      
      <!-- 歡迎卡片 -->
      <v-card
        class="mb-6 welcome-card"
        color="primary"
        theme="dark"
      >
        <v-card-text class="d-flex align-center">
          <div>
            <div class="text-h6 font-weight-bold">歡迎回來，{{ userDisplayName }}</div>
            <div class="text-subtitle-2 mt-1">今天是 {{ formattedDate }}</div>
          </div>
          <v-spacer></v-spacer>
          <v-btn
            variant="tonal"
            color="white"
            :to="{ name: 'Products' }"
          >
            瀏覽產品
            <v-icon end>mdi-arrow-right</v-icon>
          </v-btn>
        </v-card-text>
      </v-card>
      
      <!-- 統計卡片 -->
      <v-row>
        <v-col
          cols="12"
          sm="6"
          md="3"
        >
          <v-card class="stat-card">
            <v-card-text class="d-flex flex-column align-center">
              <v-icon 
                color="primary" 
                size="48" 
                class="mb-2"
              >
                mdi-clipboard-list
              </v-icon>
              <div class="text-h5 font-weight-bold">{{ stats.totalOrders }}</div>
              <div class="text-subtitle-2 text-center">總訂單數</div>
            </v-card-text>
          </v-card>
        </v-col>
        
        <v-col
          cols="12"
          sm="6"
          md="3"
        >
          <v-card class="stat-card">
            <v-card-text class="d-flex flex-column align-center">
              <v-icon 
                color="warning" 
                size="48" 
                class="mb-2"
              >
                mdi-clock-outline
              </v-icon>
              <div class="text-h5 font-weight-bold">{{ stats.pendingOrders }}</div>
              <div class="text-subtitle-2 text-center">待處理訂單</div>
            </v-card-text>
          </v-card>
        </v-col>
        
        <v-col
          cols="12"
          sm="6"
          md="3"
        >
          <v-card class="stat-card">
            <v-card-text class="d-flex flex-column align-center">
              <v-icon 
                color="success" 
                size="48" 
                class="mb-2"
              >
                mdi-truck-delivery
              </v-icon>
              <div class="text-h5 font-weight-bold">{{ stats.shippedOrders }}</div>
              <div class="text-subtitle-2 text-center">已出貨訂單</div>
            </v-card-text>
          </v-card>
        </v-col>
        
        <v-col
          cols="12"
          sm="6"
          md="3"
        >
          <v-card class="stat-card">
            <v-card-text class="d-flex flex-column align-center">
              <v-icon 
                color="info" 
                size="48" 
                class="mb-2"
              >
                mdi-shopping
              </v-icon>
              <div class="text-h5 font-weight-bold">{{ stats.totalProducts }}</div>
              <div class="text-subtitle-2 text-center">可訂購產品數</div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
      
      <!-- 購物車摘要 -->
      <h2 class="text-h5 font-weight-bold mt-6 mb-4">購物車摘要</h2>
      <v-card>
        <v-card-text>
          <div v-if="cartStore.items.length === 0" class="text-center py-4">
            <v-icon
              size="48"
              color="grey-lighten-1"
              class="mb-2"
            >mdi-cart-outline</v-icon>
            <div class="text-subtitle-1 text-grey">購物車是空的</div>
          </div>
          <div v-else>
            <v-list>
              <v-list-item
                v-for="item in cartStore.items.slice(0, 3)"
                :key="item._id"
                class="cart-item"
              >
                <template v-slot:prepend>
                  <v-avatar
                    size="40"
                    rounded
                    class="me-3"
                  >
                    <v-img
                      :src="getProductImageUrl(item)"
                      cover
                      @error="onImgError"
                    ></v-img>
                  </v-avatar>
                </template>
                <v-list-item-title class="text-subtitle-2">
                  {{ item.name }}
                </v-list-item-title>
                <template v-slot:append>
                  <div class="text-subtitle-2">
                    {{ item.quantity }} x NT$ {{ item.price.toLocaleString() }}
                  </div>
                </template>
              </v-list-item>
            </v-list>
            <v-divider class="my-2"></v-divider>
            <div class="d-flex justify-space-between align-center mt-2">
              <div class="text-subtitle-1 font-weight-medium">
                共 {{ cartStore.totalItems }} 件商品
              </div>
              <div class="text-subtitle-1 font-weight-bold primary--text">
                NT$ {{ cartStore.formattedTotalAmount }}
              </div>
            </div>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            variant="text"
            :to="{ name: 'Cart' }"
          >
            查看購物車
            <v-icon end>mdi-chevron-right</v-icon>
          </v-btn>
        </v-card-actions>
      </v-card>
      
      <!-- 最近訂單 -->
      <h2 class="text-h5 font-weight-bold mt-6 mb-4">最近訂單</h2>
      <v-card>
        <v-table>
          <thead>
            <tr>
              <th>訂單編號</th>
              <th>狀態</th>
              <th>總金額</th>
              <th>建立日期</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="recentOrders.length === 0">
              <td colspan="5" class="text-center text-grey">暫無最近訂單</td>
            </tr>
            <tr v-for="item in recentOrders" :key="item._id">
              <td>{{ item.orderNumber }}</td>
              <td>
                <v-chip :color="getStatusColor(item.status)" size="small">
                  {{ getStatusText(item.status) }}
                </v-chip>
              </td>
              <td>NT$ {{ item.totalAmount?.toLocaleString?.() ?? item.total?.toLocaleString?.() ?? 0 }}</td>
              <td>{{ formatDate(item.createdAt) }}</td>
              <td>
                <v-btn
                  icon
                  size="small"
                  variant="text"
                  :to="{ name: 'OrderDetail', params: { id: item._id || item.id } }"
                >
                  <v-icon>mdi-eye</v-icon>
                </v-btn>
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-card>
      
      <!-- 快速訪問 -->
      <h2 class="text-h5 font-weight-bold mt-6 mb-4">快速訪問</h2>
      <v-row>
        <v-col
          v-for="action in quickActions"
          :key="action.title"
          cols="12"
          sm="6"
          md="3"
        >
          <v-card
            class="quick-action-card"
            :to="action.to"
            hover
          >
            <v-card-text class="d-flex flex-column align-center text-center">
              <v-icon
                :color="action.color"
                size="large"
                class="mb-2"
              >
                {{ action.icon }}
              </v-icon>
              <div class="text-body-2 font-weight-medium">{{ action.title }}</div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useCartStore } from '@/stores/cart';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { ordersApi } from '@/api';
import { useToast } from 'vue-toastification';


// Store
const authStore = useAuthStore();
const cartStore = useCartStore();
const user = computed(() => authStore.user || {});
const userDisplayName = computed(() => user.value.data?.contactName || '用戶');
const toast = useToast();
const orders = ref([]);

// 格式化當前日期
const formattedDate = computed(() => {
  return format(new Date(), 'PPP', { locale: zhTW });
});

// 數據加載狀態
const loading = ref(false);

// 統計數據
const stats = ref({
  totalOrders: 0,
  pendingOrders: 0,
  shippedOrders: 0,
  totalProducts: 0
});

// 最近訂單（取前5筆，依建立日期新到舊排序）
const recentOrders = computed(() => {
  if (!orders.value || orders.value.length === 0) return [];
  return [...orders.value]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);
});

// 快速訪問項目
const quickActions = [
  { title: '瀏覽產品', icon: 'mdi-shopping', color: 'primary', to: { name: 'Products' } },
  { title: '購物車', icon: 'mdi-cart', color: 'info', to: { name: 'Cart' } },
  { title: '我的訂單', icon: 'mdi-clipboard-list', color: 'success', to: { name: 'Orders' } },
  { title: '個人資料', icon: 'mdi-account', color: 'warning', to: { name: 'Profile' } },
  { title: '聯絡我們', icon: 'mdi-headset', color: 'error', to: '#' }
];

// 訂單狀態處理
const getStatusColor = (status) => {
  const statusMap = {
    'pending': 'warning',
    'processing': 'info',
    'shipped': 'success',
    'delivered': 'primary',
    'completed': 'success',
    'cancelled': 'error'
  };
  return statusMap[status] || 'grey';
};

const getStatusText = (status) => {
  const statusMap = {
    'pending': '待處理',
    'processing': '處理中',
    'shipped': '已出貨',
    'delivered': '已送達',
    'completed': '已完成',
    'cancelled': '已取消'
  };
  return statusMap[status] || '未知';
};

// 格式化日期
const formatDate = (dateStr) => {
  return format(new Date(dateStr), 'yyyy/MM/dd', { locale: zhTW });
};

const fetchOrders = async () => {
  loading.value = true;
  try {
    const response = await ordersApi.getOrders();
    orders.value = response.data.data;
  } catch (error) {
    toast.error('獲取訂單失敗');
  } finally {
    loading.value = false;
  }
};

// 初始化页面数据
const fetchDashboardData = async () => {
  loading.value = true;
  
  try {
    // 獲取當前用戶資料
    await authStore.fetchCurrentUser();
    
    setTimeout(() => {
      // 最近訂單
      fetchOrders();

      loading.value = false;
    }, 1000);
    
  } catch (error) {
    console.error('獲取儀表板數據失敗:', error);
    loading.value = false;
  }
};

// 生命週期钩子
onMounted(() => {
  fetchDashboardData();
});

// 取得商品圖片 API 路徑
const getProductImageUrl = (item) => {
  return item && item._id ? `/api/products/${item._id}/image` : '/images/no-image.jpg';
};

const onImgError = event => {
  // 確保 event 與 event.target 存在
  if (event && event.target) {
    event.target.src = '/images/no-image.jpg';
  }
};
</script>

<style lang="scss" scoped>
.welcome-card {
  transition: transform 0.3s;
  
  &:hover {
    transform: translateY(-5px);
  }
}

.stat-card {
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  }
}

.quick-action-card {
  cursor: pointer;
  transition: all 0.3s ease;
  height: 100%;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
  }
}
</style> 