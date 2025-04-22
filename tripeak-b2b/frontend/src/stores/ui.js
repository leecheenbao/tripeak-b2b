import { defineStore } from 'pinia';

export const useUiStore = defineStore('ui', {
  state: () => ({
    // 側邊欄狀態
    sidebar: {
      isOpen: true,
      miniVariant: false
    },
    
    // 全局加載狀態
    loading: {
      isLoading: false,
      message: ''
    },
    
    // 主題設置
    theme: {
      mode: localStorage.getItem('themeMode') || 'light', // 'light' 或 'dark'
    },
    
    // 購物車狀態
    cart: {
      items: [],
      total: 0
    },
    
    // 全局過濾器
    filters: {
      category: null,
      searchQuery: '',
      priceRange: [0, 100000],
      sortBy: 'displayOrder'
    }
  }),
  
  getters: {
    isDarkMode: (state) => state.theme.mode === 'dark',
    cartItemCount: (state) => state.cart.items.length,
    cartTotalAmount: (state) => {
      return state.cart.items.reduce((total, item) => {
        return total + (item.price * item.quantity);
      }, 0);
    }
  },
  
  actions: {
    // 側邊欄相關
    toggleSidebar() {
      this.sidebar.isOpen = !this.sidebar.isOpen;
    },
    
    setMiniVariant(value) {
      this.sidebar.miniVariant = value;
    },
    
    // 加載狀態相關
    startLoading(message = '載入中...') {
      this.loading.isLoading = true;
      this.loading.message = message;
    },
    
    stopLoading() {
      this.loading.isLoading = false;
      this.loading.message = '';
    },
    
    // 主題相關
    setThemeMode(mode) {
      this.theme.mode = mode;
      localStorage.setItem('themeMode', mode);
    },
    
    toggleTheme() {
      const newMode = this.theme.mode === 'light' ? 'dark' : 'light';
      this.setThemeMode(newMode);
    },
    
    // 購物車相關
    addToCart(product, quantity = 1) {
      const existingItem = this.cart.items.find(item => item.id === product.id);
      
      if (existingItem) {
        // 增加現有商品的數量
        existingItem.quantity += quantity;
      } else {
        // 添加新商品到購物車
        this.cart.items.push({
          id: product.id,
          name: product.name,
          price: product.price,
          quantity,
          imageUrl: product.imageUrl,
          unit: product.unit || '件'
        });
      }
      
      // 更新總計
      this.updateCartTotal();
    },
    
    updateCartItemQuantity(productId, quantity) {
      const item = this.cart.items.find(item => item.id === productId);
      
      if (item) {
        item.quantity = quantity;
        
        // 如果數量為 0，刪除該商品
        if (quantity <= 0) {
          this.removeFromCart(productId);
          return;
        }
        
        // 更新總計
        this.updateCartTotal();
      }
    },
    
    removeFromCart(productId) {
      this.cart.items = this.cart.items.filter(item => item.id !== productId);
      
      // 更新總計
      this.updateCartTotal();
    },
    
    clearCart() {
      this.cart.items = [];
      this.cart.total = 0;
    },
    
    updateCartTotal() {
      this.cart.total = this.cartTotalAmount;
    },
    
    // 過濾器相關
    setFilter(filterType, value) {
      this.filters[filterType] = value;
    },
    
    resetFilters() {
      this.filters = {
        category: null,
        searchQuery: '',
        priceRange: [0, 100000],
        sortBy: 'displayOrder'
      };
    }
  },
  
  persist: {
    key: 'tripeak-ui',
    storage: localStorage,
    paths: ['cart', 'theme.mode']
  }
});