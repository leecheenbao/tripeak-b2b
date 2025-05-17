import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

// 路由組件 - 公共頁面
const Login = () => import('@/views/auth/LoginView.vue');
const Register = () => import('@/views/auth/RegisterView.vue');
const ForgotPassword = () => import('@/views/auth/ForgotPasswordView.vue');
const NotFound = () => import('@/views/NotFoundView.vue');

// 路由組件 - 需要認證的頁面
const Dashboard = () => import('@/views/DashboardView.vue');
const Profile = () => import('@/views/ProfileView.vue');

// 產品相關
const ProductList = () => import('@/views/products/ProductListView.vue');
const ProductDetail = () => import('@/views/products/ProductDetailView.vue');

// 訂單相關
const OrderList = () => import('@/views/orders/OrderListView.vue');
const OrderDetail = () => import('@/views/orders/OrderDetailView.vue');
const OrderCheckout = () => import('@/views/orders/OrderCheckoutView.vue');

// 管理員頁面
const AdminUserList = () => import('@/views/admin/users/UserListView.vue');
const AdminProductList = () => import('@/views/admin/products/ProductListView.vue');
const AdminCategoryList = () => import('@/views/admin/categories/CategoryListView.vue');
const AdminOrderList = () => import('@/views/admin/orders/OrderAdminListView.vue');
const AdminReports = () => import('@/views/admin/reports/ReportsView.vue');
const AdminLineNotify = () => import('@/views/admin/line/LineNotifyView.vue');

// 路由配置
const routes = [
  // 公共路由
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { requiresAuth: false, title: '登入' }
  },
  {
    path: '/register',
    name: 'Register',
    component: Register,
    meta: { requiresAuth: false, title: '註冊' }
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: ForgotPassword,
    meta: { requiresAuth: false, title: '忘記密碼' }
  },
  
  // 經銷商路由
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
    meta: { requiresAuth: true, title: '儀表板' }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile,
    meta: { requiresAuth: true, title: '個人資料' }
  },
  // 產品相關路由
  {
    path: '/products',
    name: 'Products',
    component: ProductList,
    meta: { requiresAuth: true, title: '產品目錄' }
  },
  {
    path: '/products/:id',
    name: 'ProductDetail',
    component: ProductDetail,
    meta: { requiresAuth: true, title: '產品詳情' }
  },

  // 訂單相關路由
  {
    path: '/orders',
    name: 'Orders',
    component: OrderList,
    meta: { requiresAuth: true, title: '我的訂單' }
  },
  {
    path: '/orders/:id',
    name: 'OrderDetail',
    component: OrderDetail,
    meta: { requiresAuth: true, title: '訂單詳情' }
  },
  {
    path: '/checkout',
    name: 'Checkout',
    component: OrderCheckout,
    meta: { requiresAuth: true, title: '結帳' }
  },
  // 用戶管理
  {
    path: '/admin/users',
    name: 'AdminUsers',
    component: AdminUserList,
    meta: { requiresAuth: true, requiresAdmin: true, title: '用戶管理' }
  },
  // 產品管理
  {
    path: '/admin/products',
    name: 'AdminProducts',
    component: AdminProductList,
    meta: { requiresAuth: true, requiresAdmin: true, title: '產品管理' }
  },
  // 分類管理
  {
    path: '/admin/categories',
    name: 'AdminCategories',
    component: AdminCategoryList,
    meta: { requiresAuth: true, requiresAdmin: true, title: '分類管理' }
  },
  // 訂單管理
  {
    path: '/admin/orders',
    name: 'AdminOrders',
    component: AdminOrderList,
    meta: { requiresAuth: true, requiresAdmin: true, title: '訂單管理' }
  },
  // 報表分析
  {
    path: '/admin/reports',
    name: 'AdminReports',
    component: AdminReports,
    meta: { requiresAuth: true, requiresAdmin: true, title: '報表分析' }
  },
  // LINE消息管理
  {
    path: '/admin/line-notify',
    name: 'AdminLineNotify',
    component: AdminLineNotify,
    meta: { requiresAuth: true, requiresAdmin: true, title: 'LINE 通知設定' }
  },
  
  // 購物車頁面
  {
    path: '/cart',
    name: 'Cart',
    component: () => import('@/views/CartView.vue'),
    meta: {
      requiresAuth: true
    }
  },
  
  // 404 路由
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFound,
    meta: { title: '頁面未找到' }
  }
];

// 創建路由
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    } else {
      return { top: 0 };
    }
  }
});

// 導航守衛
router.beforeEach(async (to, from, next) => {
  // 設置頁面標題
  document.title = `${to.meta.title || '首頁'} - TRiPEAK B2B 經銷商下單平台`;
  
  const authStore = useAuthStore();
  
  // 檢查路由是否需要認證
  if (to.meta.requiresAuth) {
    // 用戶未登入，重定向到登入頁面
    if (!authStore.isLoggedIn) {
      return next({ name: 'Login', query: { redirect: to.fullPath } });
    }
    
    // 獲取用戶資訊（如果尚未獲取）
    if (!authStore.user && authStore.token) {
      try {
        await authStore.fetchCurrentUser();
      } catch (error) {
        authStore.logout();
        return next({ name: 'Login', query: { redirect: to.fullPath } });
      }
    }
    
    // 檢查是否需要管理員權限
    if (to.meta.requiresAdmin && authStore.user?.data?.role !== 'admin') {
      return next({ name: 'Dashboard' });
    }
  } else if (authStore.isLoggedIn && (to.name === 'Login' || to.name === 'Register' || to.name === 'ForgotPassword')) {
    // 如果已登入，嘗試訪問登入/註冊頁面，則重定向到儀表板
    return next({ name: 'Dashboard' });
  }
  
  next();
});

export default router; 