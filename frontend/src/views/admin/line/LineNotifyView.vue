<template>
  <v-container>
    <h1 class="text-h4 font-weight-bold mb-6">LINE 機器人通知設定</h1>
    
    <v-card class="pa-6 mb-4">
      <div class="mb-4">
        <v-chip :color="isBound ? 'success' : 'grey'">
          {{ isBound ? '已綁定 LINE 機器人' : '尚未綁定 LINE 機器人' }}
        </v-chip>
      </div>
      
      <!-- 已綁定狀態 -->
      <div v-if="isBound" class="mb-4">
        <div class="d-flex align-center mb-4">
          <v-icon class="mr-2" color="success">mdi-check-circle</v-icon>
          <div>
            <div class="font-weight-bold">LINE ID: {{ currentLineId }}</div>
            <div class="text-caption text-grey">綁定時間：{{ bindTime }}</div>
          </div>
        </div>
        
        <div class="d-flex gap-2">
          <v-btn color="error" @click="showUnbindDialog = true">
            解除綁定
          </v-btn>
          <v-btn color="primary" @click="sendTest" :loading="sendingTest">
            發送測試訊息
          </v-btn>
        </div>
      </div>
      
      <!-- 未綁定狀態 -->
      <div v-else>
        <v-form ref="bindForm" v-model="formValid">
          <v-text-field
            v-model="lineId"
            label="LINE User ID"
            placeholder="請輸入您的 LINE User ID"
            hint="LINE User ID 可在 LINE 設定中查看"
            persistent-hint
            :rules="lineIdRules"
            required
            class="mb-4"
          >
            <template v-slot:append-inner>
              <v-btn 
                icon="mdi-information" 
                size="small" 
                variant="text"
                @click="showHelpDialog = true"
              ></v-btn>
            </template>
          </v-text-field>
          
          <v-btn 
            color="success" 
            @click="bindLine" 
            :loading="binding"
            :disabled="!formValid"
            block
          >
            綁定 LINE 機器人
          </v-btn>
        </v-form>
      </div>
      
      <v-divider class="my-4"></v-divider>
      
      <!-- 最近通知 -->
      <div v-if="lastMessage" class="mt-4">
        <div class="text-caption text-grey mb-2">最近一次通知：</div>
        <v-alert type="info" variant="tonal" class="mb-0">
          {{ lastMessage }}
        </v-alert>
      </div>
    </v-card>
    
    <!-- 解除綁定確認對話框 -->
    <v-dialog v-model="showUnbindDialog" max-width="400">
      <v-card>
        <v-card-title>確認解除綁定</v-card-title>
        <v-card-text>
          您確定要解除 LINE 機器人綁定嗎？解除後將無法接收 LINE 通知。
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="showUnbindDialog = false">取消</v-btn>
          <v-btn color="error" @click="confirmUnbind">確認解除</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- LINE ID 說明對話框 -->
    <v-dialog v-model="showHelpDialog" max-width="600">
      <v-card>
        <v-card-title>
          <v-icon class="mr-2">mdi-information</v-icon>
          如何取得 LINE User ID？
        </v-card-title>
        <v-card-text>
          <v-alert type="info" class="mb-4">
            <div class="font-weight-bold mb-2">重要說明：</div>
            <p class="mb-2">LINE 個人資料中顯示的「用戶ID」（如電話號碼或 LINE ID）<strong>不是</strong> Messaging API 需要的 User ID。</p>
            <p>Messaging API 需要的 User ID 是 33 個字符的字母數字組合（例如：<code>U1234567890abcdef1234567890abcdef</code>）</p>
          </v-alert>
          
          <div class="mb-4">
            <div class="font-weight-bold mb-2">📌 正確的獲取方式：</div>
            <ol class="ml-4">
              <li>確保機器人的 webhook 已啟用（在 LINE Developers Console 中）</li>
              <li>用 LINE 加機器人為好友（掃描 QR Code 或搜尋機器人 ID）</li>
              <li>向機器人發送任意訊息（例如："測試"）</li>
              <li>查看後端日誌，您會看到類似這樣的日誌：</li>
            </ol>
            <v-sheet class="mt-2 pa-2 bg-grey-darken-4" rounded>
              <code class="text-caption">收到 LINE 訊息，User ID: U1234567890abcdef1234567890abcdef</code>
            </v-sheet>
            <p class="mt-2">這串 33 個字符的就是您需要的 LINE User ID</p>
          </div>
          
          <div>
            <div class="font-weight-bold mb-2">📖 或者從 LINE Developers Console 查看：</div>
            <ol class="ml-4">
              <li>訪問 <a href="https://developers.line.biz/console/" target="_blank">LINE Developers Console</a></li>
              <li>進入您的機器人 Channel</li>
              <li>點擊左側選單「Messaging API」</li>
              <li>找到「Webhook settings」下方的「Connected users」</li>
              <li>加機器人好友後，這裡會顯示用戶列表和對應的 User ID</li>
            </ol>
          </div>
          
          <v-alert type="warning" class="mt-4">
            <div class="font-weight-bold">注意：必須先加機器人為好友並互動，才能獲取 User ID</div>
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="showHelpDialog = false">我知道了</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useToast } from 'vue-toastification';
import axios from 'axios';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const toast = useToast();

// 狀態管理
const isBound = ref(false);
const currentLineId = ref('');
const bindTime = ref('');
const lastMessage = ref('');
const binding = ref(false);
const sendingTest = ref(false);
const showUnbindDialog = ref(false);
const showHelpDialog = ref(false);

// 表單狀態
const lineId = ref('');
const formValid = ref(false);
const bindForm = ref(null);

// 驗證規則
const lineIdRules = [
  v => !!v || '請輸入 LINE User ID',
  v => (v && v.length === 33) || 'LINE User ID 長度必須為 33 個字元',
  v => {
    if (!v) return true;
    // LINE User ID 通常是 33 個字符，以字母數字組成，可能包含底線或連字符
    return /^[a-zA-Z0-9_-]{33}$/.test(v) || 'LINE User ID 格式不正確（必須為 33 個字母數字字符）';
  }
];

// 查詢綁定狀態
const fetchStatus = async () => {
  try {
    const response = await axios.get('/api/auth/me', {
      headers: { Authorization: `Bearer ${authStore.token}` }
    });
    
    const userData = response.data.data || response.data;
    isBound.value = !!userData.lineId;
    currentLineId.value = userData.lineId || '';
    bindTime.value = userData.updatedAt ? new Date(userData.updatedAt).toLocaleString('zh-TW') : '';
    
    // 查詢最近通知（如果有的話）
    // lastMessage.value = '2024/01/15 10:30 - 訂單 ABC123 已創建';
  } catch (error) {
    console.error('查詢綁定狀態失敗:', error);
    toast.error('查詢 LINE 綁定狀態失敗');
  }
};

// 綁定 LINE 機器人
const bindLine = async () => {
  // if (!formValid.value) return;
  
  binding.value = true;
  try {
    const _response = await axios.put('/api/auth/me', 
      { lineId: lineId.value },
      { headers: { Authorization: `Bearer ${authStore.token}` } }
    );
    
    // 更新 auth store 中的用戶資訊
    if (_response.data && _response.data.data) {
      authStore.user = { ...authStore.user, ..._response.data.data };
    }
    
    console.log(_response);
    toast.success('LINE 綁定成功！');
    binding.value = false;
    
    // 重新獲取用戶資訊
    await fetchStatus();
    
    // 重置表單
    lineId.value = '';
    bindForm.value?.reset();
  } catch (error) {
    console.error('綁定失敗:', error);
    binding.value = false;
    toast.error(error.response?.data?.error || '綁定失敗');
  }
};

// 確認解除綁定
const confirmUnbind = async () => {
  try {
    const _response = await axios.put('/api/auth/me',
      { lineId: null },
      { headers: { Authorization: `Bearer ${authStore.token}` } }
    );
    
    // 更新 auth store 中的用戶資訊
    if (_response.data && _response.data.data) {
      authStore.user = { ...authStore.user, ..._response.data.data };
    }
    
    toast.success('已解除綁定');
    showUnbindDialog.value = false;
    
    // 重置所有綁定相關的狀態
    isBound.value = false;
    currentLineId.value = '';
    bindTime.value = '';
    
    // 重新獲取狀態以確保數據同步
    await fetchStatus();
  } catch (error) {
    console.error('解除綁定失敗:', error);
    toast.error('解除綁定失敗');
  }
};

// 發送測試訊息
const sendTest = async () => {
  if (!isBound.value) {
    toast.error('請先綁定 LINE User ID');
    return;
  }
  
  sendingTest.value = true;
  try {
    // 發送測試消息
    const _response = await axios.post('/api/line/test-message',
      { lineId: currentLineId.value },
      { headers: { Authorization: `Bearer ${authStore.token}` } }
    );
    
    toast.success('測試訊息已發送！');
    lastMessage.value = `測試訊息已發送 - ${new Date().toLocaleString('zh-TW')}`;
  } catch (error) {
    console.error('發送失敗:', error);
    toast.error(error.response?.data?.error || '發送失敗');
  } finally {
    sendingTest.value = false;
  }
};

onMounted(fetchStatus);
</script>
