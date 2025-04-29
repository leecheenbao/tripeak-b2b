import { defineStore } from 'pinia';

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [],
    loading: false
  }),

  getters: {
    totalItems: (state) => state.items.reduce((total, item) => total + item.quantity, 0),
    
    totalAmount: (state) => state.items.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0),

    formattedTotalAmount: (state) => {
      return state.items.reduce((total, item) => {
        return total + (item.price * item.quantity);
      }, 0).toLocaleString();
    }
  },

  actions: {
    // 添加商品到購物車
    addItem(product, quantity = 1) {
      const existingItem = this.items.find(item => item._id === product._id);
      
      if (existingItem) {
        // 如果商品已存在，更新數量
        existingItem.quantity += quantity;
      } else {
        // 如果商品不存在，添加新商品
        this.items.push({
          _id: product._id,
          name: product.name,
          price: product.price,
          imageUrl: product.imageUrl,
          quantity: quantity,
          sku: product.sku,
          category: product.category,
          unit: product.unit
        });
      }

      // 保存到 localStorage
      this.saveToLocalStorage();
    },

    // 更新商品數量
    updateQuantity(productId, quantity) {
      const item = this.items.find(item => item._id === productId);
      if (item) {
        item.quantity = quantity;
        this.saveToLocalStorage();
      }
    },

    // 移除商品
    removeItem(productId) {
      this.items = this.items.filter(item => item._id !== productId);
      this.saveToLocalStorage();
    },

    // 清空購物車
    clearCart() {
      this.items = [];
      this.saveToLocalStorage();
    },

    // 保存到 localStorage
    saveToLocalStorage() {
      localStorage.setItem('cart', JSON.stringify(this.items));
    },

    // 從 localStorage 載入
    loadFromLocalStorage() {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        this.items = JSON.parse(savedCart);
      }
    }
  }
});
