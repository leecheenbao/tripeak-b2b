<template>
  <v-app :theme="themeMode">
    <v-navigation-drawer
      v-model="drawer"
      :rail="miniVariant"
      permanent
      :temporary="isMobile"
      @click="handleDrawerClick"
      v-if="isLoggedIn"
    >
      <div class="d-flex flex-column fill-height">
        <!-- 品牌 Logo -->
        <div class="d-flex align-center justify-center py-4">
          <div v-if="!miniVariant" class="text-h5 font-weight-bold text-primary">
            {{ MERCHANT_NAME }}
          </div>
          <v-avatar v-else color="primary" size="40">
            <span class="text-h6 white--text">TP</span>
          </v-avatar>
        </div>

        <v-divider></v-divider>

        <!-- 導航選單 -->
        <v-list nav>
          <v-list-item
            v-for="item in menuItems"
            :key="item.title"
            :prepend-icon="item.icon"
            :title="miniVariant ? '' : item.title"
            :to="item.to"
            :disabled="item.disabled"
            :value="item.title"
          >
          </v-list-item>
        </v-list>

        <v-spacer></v-spacer>

        <!-- 底部選單 -->
        <v-list nav>
          <!-- <v-list-item
            prepend-icon="mdi-cog"
            :title="miniVariant ? '' : '設定'"
            to="/settings"
            value="settings"
          ></v-list-item> -->
          <v-list-item
            prepend-icon="mdi-account"
            :title="miniVariant ? '' : '個人資料'"
            to="/profile"
            value="profile"
          ></v-list-item>
          <v-list-item
            prepend-icon="mdi-logout"
            :title="miniVariant ? '' : '登出'"
            @click="logout"
            value="logout"
          ></v-list-item>
        </v-list>

        <!-- 摺疊按鈕 -->
        <div class="d-flex justify-center pa-2">
          <v-btn 
            icon 
            @click.stop="toggleMiniVariant" 
            variant="text" 
            size="small"
          >
            <v-icon>{{ miniVariant ? 'mdi-chevron-right' : 'mdi-chevron-left' }}</v-icon>
          </v-btn>
        </div>
      </div>
    </v-navigation-drawer>

    <!-- 應用程式頂欄 -->
    <v-app-bar :elevation="1" color="background" v-if="isLoggedIn">
      <!-- 手機版選單按鈕 -->
      <v-app-bar-nav-icon 
        v-if="isMobile" 
        @click.stop="drawer = !drawer"
      ></v-app-bar-nav-icon>
      
      <v-spacer></v-spacer>
      
      <CartIcon class="mr-2" />
      
      <!-- 使用者選單 -->
      <v-menu min-width="200px" rounded>
        <template v-slot:activator="{ props }">
          <v-btn
            variant="text"
            v-bind="props"
          >
            <v-avatar size="40" color="primary" class="mr-2">
              <span class="text-h6 white--text">{{ userInitials }}</span>
            </v-avatar>
            {{ userDisplayName }}
            <v-icon right>mdi-chevron-down</v-icon>
          </v-btn>
        </template>
        <v-card>
          <v-card-title class="text-h6">
            {{ user?.name || '使用者' }}
          </v-card-title>
          <v-card-subtitle>{{ user?.email }}</v-card-subtitle>
          <v-divider></v-divider>
          <v-list>
            <v-list-item to="/profile">
              <template v-slot:prepend>
                <v-icon>mdi-account</v-icon>
              </template>
              <v-list-item-title>個人資料</v-list-item-title>
            </v-list-item>
            <v-list-item @click="toggleTheme">
              <template v-slot:prepend>
                <v-icon>{{ themeIcon }}</v-icon>
              </template>
              <v-list-item-title>{{ themeMode === 'dark' ? '淺色模式' : '深色模式' }}</v-list-item-title>
            </v-list-item>
            <v-list-item @click="logout">
              <template v-slot:prepend>
                <v-icon>mdi-logout</v-icon>
              </template>
              <v-list-item-title>登出</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card>
      </v-menu>
    </v-app-bar>

    <!-- 主內容區域 -->
    <v-main>
      <v-container fluid :class="{ 'pa-0': fullscreenRoute }">
        <router-view />
      </v-container>
    </v-main>

    <!-- 頁尾 -->
    <v-footer v-if="isLoggedIn && !fullscreenRoute" app class="d-flex flex-column">
      <div class="w-100 text-center">
        <span class="text-caption">
          &copy; {{ new Date().getFullYear() }} TRiPEAK B2B 經銷商下單平台
        </span>
      </div>
    </v-footer>

    <!-- 全局加載器 -->
    <v-overlay 
      :model-value="loading.isLoading" 
      class="align-center justify-center" 
    >
      <v-progress-circular 
        :size="70" 
        :width="7" 
        color="primary" 
        indeterminate
      ></v-progress-circular>
      <div class="text-center mt-4">
        {{ loading.message || '載入中...' }}
      </div>
    </v-overlay>
  </v-app>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useUiStore } from '@/stores/ui';
import { useCartStore } from '@/stores/cart';
import { useDisplay, useTheme } from 'vuetify';
import { MERCHANT_NAME } from '@/config';
import CartIcon from '@/components/CartIcon.vue';

// 存取 Store
const authStore = useAuthStore();
const uiStore = useUiStore();
const cartStore = useCartStore();
const router = useRouter();
const route = useRoute();
const { mobile } = useDisplay();
const theme = useTheme();

// 狀態
const drawer = ref(true);
const miniVariant = ref(false);

// 計算屬性
const user = computed(() => authStore.user);
const isLoggedIn = computed(() => authStore.isLoggedIn);
const loading = computed(() => uiStore.loading);
const themeMode = computed(() => uiStore.theme.mode);
const themeIcon = computed(() => 
  themeMode.value === 'dark' ? 'mdi-weather-sunny' : 'mdi-weather-night'
);
const userInitials = computed(() => {
  const name = user.value?.name || '';
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
});
const userDisplayName = computed(() => {
  return user.value.data?.contactName || '用戶';
});
const isMobile = computed(() => mobile.value);
const fullscreenRoute = computed(() => {
  return ['/login', '/register', '/forgot-password'].includes(route.path);
});

// 菜單項目
const menuItems = computed(() => {
  const isAdmin = user.value.data?.role === 'admin';
  // 基本菜單項目（所有用戶）
  const items = [
    { title: '儀表板', icon: 'mdi-view-dashboard', to: '/dashboard' },
    { title: '產品目錄', icon: 'mdi-shopping', to: '/products' },
    { title: '我的訂單', icon: 'mdi-clipboard-list', to: '/orders' },
    { title: '購物車', icon: 'mdi-cart', to: '/cart' },
  ];
  
  // 管理員特有項目
  if (isAdmin) {
    items.push(
      { title: '用戶管理', icon: 'mdi-account-group', to: '/admin/users' },
      { title: '產品管理', icon: 'mdi-package-variant-closed', to: '/admin/products' },
      { title: '訂單管理', icon: 'mdi-cart', to: '/admin/orders' },
      { title: '分類管理', icon: 'mdi-shape', to: '/admin/categories' },
      { title: '報表分析', icon: 'mdi-chart-bar', to: '/admin/reports' },
      { title: 'LINE 通知', icon: 'mdi-message-text', to: '/admin/line-notify' }
    );
  }
  
  return items;
});

// 監聽器
watch(mobile, (newValue) => {
  if (newValue) {
    drawer.value = false;
    miniVariant.value = false;
  } else {
    drawer.value = true;
  }
});

// 生命週期函數
onMounted(async () => {
  cartStore.loadFromLocalStorage();
  // 設定主題
  theme.global.name.value = themeMode.value;
  
  // 檢查是否有存儲的 token
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (token) {
    try {
      await authStore.fetchCurrentUser();
    } catch (error) {
      console.error('自動登入失敗:', error);
      authStore.logout();
    }
  }
});

// 方法
const toggleMiniVariant = () => {
  miniVariant.value = !miniVariant.value;
  uiStore.setMiniVariant(miniVariant.value);
};

const handleDrawerClick = () => {
  if (isMobile.value) {
    drawer.value = false;
  }
};

const toggleTheme = () => {
  const newTheme = themeMode.value === 'dark' ? 'light' : 'dark';
  uiStore.setThemeMode(newTheme);
  theme.global.name.value = newTheme;
};

const logout = async () => {
  await authStore.logout();
  router.push('/login');
};
</script>

<style lang="scss" scoped>
.v-app {
  // 防止內容被縮放時的晃動
  overflow-x: hidden;
}
</style> 