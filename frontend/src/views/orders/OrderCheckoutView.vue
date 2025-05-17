<template>
  <v-container>
    <h1 class="text-h4 font-weight-bold mb-6">結帳</h1>
    <v-card class="mb-6" color="grey-lighten-4" v-if="!orderCreated">
      <v-card-title class="text-subtitle-1 font-weight-medium">訂單明細</v-card-title>
      <v-divider></v-divider>
      <v-card-text>
        <v-list>
          <v-list-item
            v-for="item in cartStore.items"
            :key="item._id"
          >
            <v-list-item-title>
              {{ item.name }}
            </v-list-item-title>
            <v-list-item-subtitle>
              {{ item.quantity }} x NT$ {{ item.price.toLocaleString() }}
            </v-list-item-subtitle>
            <template #append>
              <div class="text-right font-weight-bold">
                NT$ {{ (item.price * item.quantity).toLocaleString() }}
              </div>
            </template>
          </v-list-item>
        </v-list>
        <v-divider class="my-2"></v-divider>
        <div class="d-flex justify-space-between">
          <span>商品總數</span>
          <span>{{ cartStore.totalItems }} 件</span>
        </div>
        <div class="d-flex justify-space-between font-weight-bold">
          <span>總金額</span>
          <span class="text-primary">NT$ {{ cartStore.formattedTotalAmount }}</span>
        </div>
      </v-card-text>
    </v-card>
    <v-card class="pa-6" v-if="!orderCreated">
      <v-form @submit.prevent="submitOrder" ref="form">
        <v-text-field
          v-model="recipient.name"
          label="收件人姓名"
          required
          class="mb-4"
        />
        <v-text-field
          v-model="recipient.phone"
          label="聯絡電話"
          required
          class="mb-4"
        />
        <v-text-field
          v-model="recipient.address"
          label="收件地址"
          required
          class="mb-4"
        />
        <v-text-field
          v-model="recipient.email"
          label="電子郵件"
          required
          class="mb-4"
        />
        <v-btn type="submit" color="primary" :loading="submitting">送出訂單</v-btn>
      </v-form>
    </v-card>
    <v-card class="pa-6" v-else>
      <div class="text-h5 mb-2">請匯款至以下帳戶：</div>
      <div>銀行：台灣銀行 123-4567890</div>
      <div>戶名：三峰股份有限公司</div>
      <div>金額：NT$ {{ orderAmount }}</div>
      <div class="mt-4 text-grey">請於匯款後通知客服，管理員確認後會安排出貨。</div>
      <v-btn class="mt-6" color="primary" to="/orders">查看我的訂單</v-btn>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useCartStore } from '@/stores/cart';
import { useUserStore } from '@/stores/user';
import { useRouter } from 'vue-router';
import { useToast } from 'vue-toastification';
import { ordersApi } from '@/api';

const cartStore = useCartStore();
const userStore = useUserStore();
const router = useRouter();
const toast = useToast();

const recipient = ref({
  name: '',
  phone: '',
  address: '',
  email: ''
});
const submitting = ref(false);
const orderCreated = ref(false);
const orderAmount = computed(() => cartStore.totalAmount);
const form = ref(null);

onMounted(async () => {
  if (!userStore.user) {
    await userStore.fetchMe();
  }
  if (userStore.user) {
    recipient.value.name = userStore.user.contactName || '';
    recipient.value.phone = userStore.user.phone || '';
    recipient.value.address = userStore.user.address || '';
    recipient.value.email = userStore.user.email || '';
  }
});

const submitOrder = async () => {
  if (!cartStore.items.length) {
    toast.error('購物車是空的');
    return;
  }
  submitting.value = true;
  try {
    await ordersApi.createOrder({
      recipient: recipient.value,
      items: cartStore.items,
      amount: orderAmount.value
    });
    orderCreated.value = true;
    cartStore.clearCart();
    toast.success('訂單已送出，請依匯款資訊完成付款');
  } catch (e) {
    toast.error('訂單送出失敗');
  } finally {
    submitting.value = false;
  }
};
</script> 