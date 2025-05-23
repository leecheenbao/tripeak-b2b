<template>
  <v-container>
    <h1 class="text-h4 font-weight-bold mb-6">訂單管理</h1>
    <v-card>
      <v-card-text>
        <v-row>
          <v-col cols="12" sm="4">
            <v-select
              v-model="statusFilter"
              :items="statusOptions"
              label="訂單狀態"
              clearable
              @update:model-value="fetchOrders"
            />
          </v-col>
        </v-row>
      </v-card-text>
      <!-- 桌機 datatable -->
      <v-data-table
        v-if="!isMobile"
        :headers="headers"
        :items="orders"
        :loading="loading"
        item-value="_id"
        class="elevation-0"
      >
        <template #item.status="{ item }">
          <v-chip :color="getStatusColor(item.status)" size="small">
            {{ getStatusText(item.status) }}
          </v-chip>
        </template>
        <template #item.totalAmount="{ item }">
          NT$ {{ item.totalAmount.toLocaleString() }}
        </template>
        <template #item.createdAt="{ item }">
          {{ formatDate(item.createdAt) }}
        </template>
        <template #item.actions="{ item }">
          <v-btn
            icon
            size="small"
            variant="text"
            :to="{ name: 'OrderDetail', params: { id: item._id } }"
          >
            <v-icon>mdi-eye</v-icon>
          </v-btn>
        </template>
      </v-data-table>
      <!-- 手機卡片式 -->
      <div v-else>
        <v-card
          v-for="item in orders"
          :key="item._id"
          class="mb-3 rwd-order-card"
        >
          <div class="font-weight-bold mb-1">訂單編號：{{ item.orderNumber }}</div>
          <div class="mb-1">經銷商：{{ item.dealerName }}</div>
          <div class="mb-1">
            狀態：<v-chip :color="getStatusColor(item.status)" size="small">{{ getStatusText(item.status) }}</v-chip>
          </div>
          <div class="mb-1">總金額：<span class="text-primary">NT$ {{ item.totalAmount.toLocaleString() }}</span></div>
          <div class="mb-1">建立日期：{{ formatDate(item.createdAt) }}</div>
          <div class="mt-2">
            <v-btn
              icon
              size="small"
              variant="text"
              :to="{ name: 'OrderDetail', params: { id: item._id } }"
            >
              <v-icon>mdi-eye</v-icon>
            </v-btn>
          </div>
        </v-card>
      </div>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ordersApi } from '@/api';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { useToast } from 'vue-toastification';

const orders = ref([]);
const loading = ref(false);
const toast = useToast();
const statusFilter = ref(null);
const isMobile = ref(false);

const headers = [
  { title: '訂單編號', key: 'orderNumber', sortable: false },
  { title: '經銷商', key: 'dealerName', sortable: false },
  { title: '狀態', key: 'status', sortable: false },
  { title: '總金額', key: 'totalAmount', sortable: false },
  { title: '建立日期', key: 'createdAt', sortable: false },
  { title: '操作', key: 'actions', sortable: false, align: 'end' }
];

const statusOptions = [
  { title: '全部', value: null },
  { title: '待匯款', value: 'pending' },
  { title: '已收款', value: 'paid' },
  { title: '已出貨', value: 'shipped' },
  { title: '已送達', value: 'delivered' },
  { title: '已完成', value: 'completed' },
  { title: '已取消', value: 'cancelled' }
];

const getStatusColor = status => {
  const statusMap = {
    pending: 'warning',
    paid: 'success',
    shipped: 'info',
    delivered: 'primary',
    completed: 'success',
    cancelled: 'error'
  };
  return statusMap[status] || 'grey';
};

const getStatusText = status => {
  const statusMap = {
    pending: '待匯款',
    paid: '已收款',
    shipped: '已出貨',
    delivered: '已送達',
    completed: '已完成',
    cancelled: '已取消'
  };
  return statusMap[status] || '未知';
};

const formatDate = (dateStr) => {
  return format(new Date(dateStr), 'yyyy/MM/dd', { locale: zhTW });
};

const fetchOrders = async () => {
  loading.value = true;
  try {
    const params = {};
    if (statusFilter.value) params.status = statusFilter.value;
    const response = await ordersApi.getOrders(params);
    orders.value = response.data.data.map(order => ({
      ...order,
      dealerName: order.dealer?.companyName || '-'
    }));
  } catch (error) {
    toast.error('獲取訂單失敗');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  const check = () => { isMobile.value = window.innerWidth <= 700; };
  check();
  window.addEventListener('resize', check);
  fetchOrders();
});
</script>

<style scoped>
@media (max-width: 700px) {
  .rwd-order-card {
    border-radius: 16px;
    box-shadow: 0 2px 10px 0 rgba(60,60,60,0.07);
    padding: 16px 12px;
    margin-bottom: 18px;
  }
}
</style> 