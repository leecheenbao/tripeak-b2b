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
                    <v-img :src="item.imageUrl" cover></v-img>
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
        <v-data-table-server
          :headers="headers"
          :items="recentOrders"
          :items-per-page="5"
          :loading="loading"
          item-value="id"
          class="elevation-0"
        >
          <template v-slot:item.status="{ item }">
            <v-chip
              :color="getStatusColor(item.status)"
              size="small"
              class="text-caption"
            >
              {{ getStatusText(item.status) }}
            </v-chip>
          </template>
          
          <template v-slot:item.total="{ item }">
            NT$ {{ item.total.toLocaleString() }}
          </template>
          
          <template v-slot:item.createdAt="{ item }">
            {{ formatDate(item.createdAt) }}
          </template>
          
          <template v-slot:item.actions="{ item }">
            <v-btn
              icon
              size="small"
              variant="text"
              :to="{ name: 'OrderDetail', params: { id: item.id } }"
            >
              <v-icon>mdi-eye</v-icon>
            </v-btn>
          </template>
        </v-data-table-server>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            color="primary"
            :to="{ name: 'Orders' }"
          >
            查看所有訂單
            <v-icon end>mdi-chevron-right</v-icon>
          </v-btn>
        </v-card-actions>
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

// Store
const authStore = useAuthStore();
const cartStore = useCartStore();
const user = computed(() => authStore.user || {});
const userDisplayName = computed(() => user.value.data?.contactName || '用戶');

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

// 最近訂單
const recentOrders = ref([]);
const headers = [
  { title: '訂單編號', key: 'orderNumber', sortable: false },
  { title: '狀態', key: 'status', sortable: false },
  { title: '總金額', key: 'total', sortable: false },
  { title: '建立日期', key: 'createdAt', sortable: false },
  { title: '操作', key: 'actions', sortable: false, align: 'end' }
];

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
    'cancelled': '已取消'
  };
  return statusMap[status] || '未知';
};

// 格式化日期
const formatDate = (dateStr) => {
  return format(new Date(dateStr), 'yyyy/MM/dd', { locale: zhTW });
};

// 初始化页面数据
const fetchDashboardData = async () => {
  loading.value = true;
  
  try {
    // 獲取當前用戶資料
    await authStore.fetchCurrentUser();
    console.log(user.value.data.companyName);

    
    // 模擬 API 調用
    setTimeout(() => {
      // TODO: 統計數據
      // TODO: 最近訂單
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