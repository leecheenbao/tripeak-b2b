<!-- frontend/src/views/orders/OrderListView.vue -->
<template>
    <v-container>
      <h1 class="text-h4 font-weight-bold mb-6">我的訂單</h1>
      <v-card>
        <v-data-table
          :headers="headers"
          :items="orders"
          :loading="loading"
          item-value="id"
          class="elevation-0"
        >
          <template #item.status="{ item }">
            <v-chip :color="getStatusColor(item.status)" size="small">
              {{ getStatusText(item.status) }}
            </v-chip>
          </template>
          <template #item.total="{ item }">
            NT$ {{ item.totalAmount }}
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
  
const headers = [
  { title: '訂單編號', key: 'orderNumber', sortable: false },
  { title: '狀態', key: 'status', sortable: false },
  { title: '總金額', key: 'total', sortable: false },
  { title: '建立日期', key: 'createdAt', sortable: false },
  { title: '操作', key: 'actions', sortable: false, align: 'end' }
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
    const response = await ordersApi.getOrders();
    orders.value = response.data.data;
  } catch (error) {
    toast.error('獲取訂單失敗');
  } finally {
    loading.value = false;
  }
};
  
onMounted(() => {
  fetchOrders();
});
</script>