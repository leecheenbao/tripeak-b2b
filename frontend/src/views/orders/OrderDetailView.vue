<template>
  <v-container>
    <v-card class="pa-6">
      <h1 class="text-h4 font-weight-bold mb-6">訂單資訊</h1>
      <div v-if="loading">載入中...</div>
      <div v-else-if="order">
        <v-row class="mb-4">
          <v-col cols="12" md="12">
            <div class="mb-3">
              <span class="font-weight-medium">訂單編號：</span>
              <span>{{ order.orderNumber }}</span>
            </div>
            <div class="mb-3">
              <span class="font-weight-medium">狀態：</span>
              <v-chip :color="getStatusColor(order.status)" size="small" class="ml-1">
                {{ getStatusText(order.status) }}
              </v-chip>
            </div>
            <div class="mb-3">
              <span class="font-weight-medium">建立日期：</span>
              <span>{{ formatDate(order.createdAt) }}</span>
            </div>
            <div class="mb-3">
              <span class="font-weight-medium">總金額：</span>
              <span class="text-primary font-weight-bold">NT$ {{ order.totalAmount.toLocaleString() }}</span>
            </div>
          </v-col>
          <v-col v-if="order.dealer" cols="12" md="6">
            <div class="mb-3">
              <span class="font-weight-medium">公司名稱：</span>
              <span>{{ order.dealer.companyName }}</span>
            </div>
            <div class="mb-3">
              <span class="font-weight-medium">Email：</span>
              <span>{{ order.dealer.email }}</span>
            </div>
            <div class="mb-3">
              <span class="font-weight-medium">電話：</span>
              <span>{{ order.dealer.phone }}</span>
            </div>
            <div class="mb-3">
              <span class="font-weight-medium">地址：</span>
              <span>{{ order.dealer.address }}</span>
            </div>
          </v-col>
        </v-row>
        <v-divider class="my-4">
          訂單明細
        </v-divider>
        <v-table>
          <thead>
            <tr>
              <th>商品名稱</th>
              <th>數量</th>
              <th>單價</th>
              <th>小計</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in order.items" :key="item._id">
              <td>{{ item.name }}</td>
              <td>{{ item.quantity }}</td>
              <td>NT$ {{ item.price.toLocaleString() }}</td>
              <td>NT$ {{ (item.price * item.quantity).toLocaleString() }}</td>
            </tr>
          </tbody>
        </v-table>
        <div class="d-flex justify-end mt-4">
          <span class="text-h6 font-weight-bold">總金額：</span>
          <span class="text-h6 text-primary font-weight-bold ml-2">NT$ {{ order.totalAmount.toLocaleString() }}</span>
        </div>
        <v-btn
          v-if="isAdmin && order.status !== 'cancelled'"
          class="mt-4"
          color="primary"
          :disabled="order.status !== 'pending'"
          @click="confirmPayment"
          block
        >
          確認訂單
        </v-btn>
        <v-btn
          v-if="isAdmin && order.status === 'paid'"
          class="mt-2"
          color="info"
          @click="markAsShipped"
          block
        >
          標記為已出貨
        </v-btn>
        <v-btn
          v-if="isAdmin && order.status === 'shipped'"
          class="mt-2"
          color="info"
          @click="markAsCompleted"
          block
        >
          標記為完成訂單
        </v-btn>
        <v-btn
          v-if="isOwner && order.status === 'pending'"
          class="mt-4"
          color="error"
          @click="showCancelDialog = true"
          block
        >
          取消訂單
        </v-btn>
        <v-dialog v-model="showCancelDialog" max-width="400">
          <v-card>
            <v-card-title class="text-h6">確認取消訂單</v-card-title>
            <v-card-text>您確定要取消這筆訂單嗎？此操作無法復原。</v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn variant="text" @click="showCancelDialog = false">關閉</v-btn>
              <v-btn color="error"
                variant="text"
                @click="cancelOrder"
                :loading="cancelling"
              >確認取消</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
        <v-btn
          v-if="isAdmin"
          class="mt-6"
          color="primary"
          to="/admin/orders"
          block
        >
          回到訂單管理
        </v-btn>
        <v-btn
          v-else
          class="mt-6"
          color="primary"
          to="/orders"
          block
        >
          回到我的訂單
        </v-btn>
      </div>
      <div v-else>
        找不到訂單
      </div>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ordersApi } from '@/api';
import { format } from 'date-fns';
import { id, zhTW } from 'date-fns/locale';
import { useToast } from 'vue-toastification';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const router = useRouter();
const order = ref(null);
const loading = ref(true);
const showCancelDialog = ref(false);
const cancelling = ref(false);
const toast = useToast();
const authStore = useAuthStore();
const user = computed(() => authStore.user?.data || authStore.user);

const isAdmin = computed(() => user.value && user.value.role === 'admin');
const isOwner = computed(() => user.value && order.value && order.value.dealer && user.value._id === order.value.dealer._id);

const getStatusColor = status => {
  const statusMap = {
    pending: 'warning',
    paid: 'success',
    shipped: 'info',
    delivered: 'primary',
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
    cancelled: '已取消'
  };
  return statusMap[status] || '未知';
};

const formatDate = (dateStr) => {
  return format(new Date(dateStr), 'yyyy/MM/dd', { locale: zhTW });
};

const fetchOrder = async () => {
  loading.value = true;
  try {
    const response = await ordersApi.getOrder(route.params.id);
    order.value = response.data.data;
  } catch (e) {
    order.value = null;
  } finally {
    loading.value = false;
  }
};

const cancelOrder = async () => {
  cancelling.value = true;
  try {
    await ordersApi.cancelOrder(order.value._id);
    toast.success('訂單已取消');
    showCancelDialog.value = false;
    await fetchOrder();
  } catch (e) {
    toast.error('取消訂單失敗');
  } finally {
    cancelling.value = false;
  }
};

// 管理員確認收款並修改訂單狀態
const confirmPayment = async () => {
  try {
    if (!order.value) {
      toast.error('訂單不存在');
      return;
    }
    if (order.value.status !== 'pending') {
      toast.error('訂單狀態不允許確認收款');
      return;
    }
    const status = 'paid';
    await ordersApi.updateOrderStatus(order.value._id, status);
    toast.success('訂單已確認收款');
    await fetchOrder();
  } catch (e) {
    toast.error('確認收款失敗');
  }
};

// 管理員標記訂單為已出貨
const markAsShipped = async () => {
  try {
    if (!order.value) {
      toast.error('訂單不存在');
      return;
    }
    if (order.value.status !== 'paid') {
      toast.error('只有已付款的訂單才能標記為已出貨');
      return;
    }
    await ordersApi.updateOrderStatus(order.value._id, 'shipped');
    toast.success('訂單已標記為已出貨');
    await fetchOrder();
  } catch (e) {
    toast.error('標記出貨失敗');
  }
};

// 管理員標記訂單為完成
const markAsCompleted = async () => {
  try {
    if (!order.value) {
      toast.error('訂單不存在');
      return;
    }
    if (order.value.status !== 'shipped') {
      toast.error('只有已出貨的訂單才能標記為完成');
      return;
    }
    await ordersApi.updateOrderStatus(order.value._id, 'completed');
    toast.success('訂單已標記為完成');
    await fetchOrder();
  } catch (e) {
    toast.error('標記完成失敗');
  }
};

onMounted(() => {
  fetchOrder();
});
</script>
