<template>
  <v-container>
    <h1 class="text-h4 font-weight-bold mb-6">報表分析</h1>
    <v-row>
      <v-col cols="12" md="4">
        <v-card class="mb-4 pa-4">
          <div class="text-h6">總訂單數</div>
          <div class="text-h4 font-weight-bold">{{ totalOrders }}</div>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card class="mb-4 pa-4">
          <div class="text-h6">總銷售額</div>
          <div class="text-h4 font-weight-bold">NT$ {{ totalSales.toLocaleString() }}</div>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card class="mb-4 pa-4">
          <div class="text-h6">本月訂單數</div>
          <div class="text-h4 font-weight-bold">{{ currentMonthOrders }}</div>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="6">
        <v-card class="pa-4 mb-4">
          <div class="text-h6 mb-2">訂單狀態分布</div>
          <PieChart :data="statusChartData" />
        </v-card>
      </v-col>
      <v-col cols="12" md="6">
        <v-card class="pa-4 mb-4">
          <div class="text-h6 mb-2">月度銷售額</div>
          <LineChart :data="monthlySalesChartData" />
        </v-card>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12">
        <v-card class="pa-4 mb-4">
          <div class="text-h6 mb-2">月度訂單數</div>
          <BarChart :data="monthlyOrdersChartData" />
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { ordersApi } from '@/api';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import PieChart from '@/components/PieChart.vue';
import LineChart from '@/components/LineChart.vue';
import BarChart from '@/components/BarChart.vue';

const orders = ref([]);

const fetchOrders = async () => {
  const res = await ordersApi.getOrders();
  orders.value = res.data.data;
};

onMounted(fetchOrders);

// 總訂單數
const totalOrders = computed(() => orders.value.length);

// 總銷售額
const totalSales = computed(() =>
  orders.value.reduce((sum, o) => sum + (o.totalAmount || 0), 0)
);

// 本月訂單數
const currentMonthOrders = computed(() => {
  const now = new Date();
  return orders.value.filter(o => {
    const d = new Date(o.createdAt);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;
});

// 狀態分布
const statusChartData = computed(() => {
  const statusMap = {};
  orders.value.forEach(o => {
    statusMap[o.status] = (statusMap[o.status] || 0) + 1;
  });
  return {
    labels: Object.keys(statusMap).map(s => statusText(s)),
    datasets: [{ data: Object.values(statusMap), backgroundColor: ['#fbc02d', '#1976d2', '#43a047', '#0288d1', '#e53935', '#8e24aa'] }]
  };
});

function statusText(status) {
  const map = {
    pending: '待處理',
    paid: '已收款',
    shipped: '已出貨',
    delivered: '已送達',
    completed: '已完成',
    cancelled: '已取消'
  };
  return map[status] || status;
}

// 月度銷售額
const monthlySalesChartData = computed(() => {
  const map = {};
  orders.value.forEach(o => {
    const key = format(new Date(o.createdAt), 'yyyy-MM');
    map[key] = (map[key] || 0) + (o.totalAmount || 0);
  });
  const labels = Object.keys(map).sort();
  return {
    labels,
    datasets: [{ label: '銷售額', data: labels.map(l => map[l]), borderColor: '#1976d2', backgroundColor: '#90caf9' }]
  };
});

// 月度訂單數
const monthlyOrdersChartData = computed(() => {
  const map = {};
  orders.value.forEach(o => {
    const key = format(new Date(o.createdAt), 'yyyy-MM');
    map[key] = (map[key] || 0) + 1;
  });
  const labels = Object.keys(map).sort();
  return {
    labels,
    datasets: [{ label: '訂單數', data: labels.map(l => map[l]), backgroundColor: '#43a047' }]
  };
});
</script>
