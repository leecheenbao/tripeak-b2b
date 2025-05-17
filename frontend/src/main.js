import { createApp } from 'vue';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import App from './App.vue';
import router from './router';
import Toast from 'vue-toastification';
import 'vue-toastification/dist/index.css';

// Vuetify
import 'vuetify/styles';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { aliases, mdi } from 'vuetify/iconsets/mdi';
import '@mdi/font/css/materialdesignicons.css';

// 自定義樣式
import './assets/styles/main.scss';

// 建立 Vuetify 實例
const vuetify = createVuetify({
  components,
  directives,
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi,
    },
  },
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        dark: false,
        colors: {
          primary: '#2E7D32', // 深綠色，代表 TRiPEAK 品牌
          'primary-darken-1': '#1B5E20',
          secondary: '#FF6F00', // 橙色，代表活力和熱情
          'secondary-darken-1': '#E65100',
          error: '#D32F2F',
          info: '#0288D1',
          success: '#388E3C',
          warning: '#FFC107',
          background: '#F5F5F5',
        },
      },
      dark: {
        dark: true,
        colors: {
          primary: '#4CAF50',
          'primary-darken-1': '#2E7D32',
          secondary: '#FFA726',
          'secondary-darken-1': '#FF6F00',
          error: '#EF5350',
          info: '#29B6F6',
          success: '#66BB6A',
          warning: '#FFCA28',
          background: '#212121',
        },
      },
    },
  },
});

// 建立 Pinia 實例
const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

// Toast 通知配置
const toastOptions = {
  position: 'top-right',
  timeout: 3000,
  closeOnClick: true,
  pauseOnFocusLoss: true,
  pauseOnHover: true,
  draggable: true,
  draggablePercent: 0.6,
  showCloseButtonOnHover: false,
  hideProgressBar: false,
  closeButton: 'button',
  icon: true,
  rtl: false,
};

// 創建應用程序
const app = createApp(App);

// 註冊 API 客戶端
import { setupApi } from './api';
setupApi();

app.use(pinia)
  .use(router)
  .use(vuetify)
  .use(Toast, toastOptions);

// 全局錯誤處理
app.config.errorHandler = (err, vm, info) => {
  console.error(err, vm, info);
};

// 掛載應用
app.mount('#app'); 