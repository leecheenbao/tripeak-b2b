<template>
  <v-container>
    <h1 class="text-h4 font-weight-bold mb-6">LINE 機器人通知設定</h1>
    <v-card class="pa-6 mb-4">
      <div class="mb-4">
        <v-chip :color="isBound ? 'success' : 'grey'">
          {{ isBound ? '已綁定 LINE 機器人' : '尚未綁定 LINE 機器人' }}
        </v-chip>
      </div>
      <div v-if="isBound" class="mb-4 d-flex align-center">
        <v-avatar size="48" class="mr-3">
          <v-img :src="userInfo.pictureUrl" />
        </v-avatar>
        <div>
          <div class="font-weight-bold">{{ userInfo.displayName }}</div>
          <div class="text-caption text-grey">{{ userInfo.userId }}</div>
        </div>
      </div>
      <div v-if="!isBound">
        <v-btn color="success" @click="goToLineLogin">
          綁定 LINE 機器人
        </v-btn>
      </div>
      <div v-else>
        <v-btn color="error" class="mr-2" @click="unbindLine">
          解除綁定
        </v-btn>
        <v-btn color="primary" @click="sendTest">
          發送測試訊息
        </v-btn>
      </div>
      <div v-if="lastMessage" class="mt-4">
        <div class="text-caption text-grey">最近一次通知：</div>
        <div>{{ lastMessage }}</div>
      </div>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useToast } from 'vue-toastification';
import { lineMessagesApi } from '@/api'; // 請根據實際 API 路徑調整

const isBound = ref(false);
const userInfo = ref({});
const lastMessage = ref('');
const toast = useToast();

// 查詢綁定狀態與用戶資訊
const fetchStatus = async () => {
  try {
    const res = await lineMessagesApi.getStatus();
    isBound.value = res.data.bound;
    userInfo.value = res.data.userInfo || {};
    lastMessage.value = res.data.lastMessage || '';
  } catch (e) {
    toast.error('查詢 LINE 綁定狀態失敗');
  }
};

// 綁定 LINE 機器人
const goToLineLogin = () => {
  // 請將 YOUR_CLIENT_ID, YOUR_REDIRECT_URI 換成實際值
  const clientId = '2004244055';
  const redirectUri = encodeURIComponent('https://localhost:8888/admin/line-notify');
  const state = Math.random().toString(36).substring(2, 15);
  const scope = 'profile openid';
  const url = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}&scope=${scope}`;
  window.location.href = url;
};

// 解除綁定
const unbindLine = async () => {
  try {
    await lineMessagesApi.unbind();
    toast.success('已解除綁定');
    fetchStatus();
  } catch (e) {
    toast.error('解除綁定失敗');
  }
};

// 發送測試訊息
const sendTest = async () => {
  try {
    await lineMessagesApi.sendTest();
    toast.success('測試訊息已發送');
    fetchStatus();
  } catch (e) {
    toast.error('發送失敗');
  }
};

onMounted(fetchStatus);
</script>
