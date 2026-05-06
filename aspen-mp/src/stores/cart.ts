/**
 * 购物车 Store
 * 管理购物车状态，与服务端同步
 */

import { defineStore } from 'pinia';
import { orderApi } from '../utils/api';

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productImage?: string;
  spec?: string;
  price: number;
  quantity: number;
  stock: number;
}

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [] as CartItem[],
    totalQuantity: 0,
    totalAmount: 0,
  }),

  actions: {
    async fetchCart() {
      try {
        const cart = await orderApi.getCart() as any;
        this.items = cart.items || [];
        this.totalQuantity = cart.totalQuantity || 0;
        this.totalAmount = cart.totalAmount || 0;
      } catch (e) {
        console.error('Failed to fetch cart:', e);
      }
    },

    async addItem(product: { productId: string; productName: string; productImage?: string; spec?: string; price: number; quantity: number; stock: number }) {
      try {
        const res = await orderApi.addToCart(product) as any;
        if (res.cart) {
          this.items = res.cart.items;
          this.totalQuantity = res.cart.totalQuantity;
          this.totalAmount = res.cart.totalAmount;
        }
        return res;
      } catch (e) {
        console.error('Failed to add to cart:', e);
        throw e;
      }
    },

    async updateQuantity(productId: string, quantity: number, spec?: string) {
      try {
        const res = await orderApi.updateCartItem(productId, quantity, spec) as any;
        if (res.cart) {
          this.items = res.cart.items;
          this.totalQuantity = res.cart.totalQuantity;
          this.totalAmount = res.cart.totalAmount;
        }
      } catch (e) {
        console.error('Failed to update cart:', e);
        throw e;
      }
    },

    async removeItem(productId: string, spec?: string) {
      return this.updateQuantity(productId, 0, spec);
    },

    async clearCart() {
      try {
        await orderApi.clearCart();
        this.items = [];
        this.totalQuantity = 0;
        this.totalAmount = 0;
      } catch (e) {
        console.error('Failed to clear cart:', e);
      }
    },
  },

  persist: {
    key: 'aspen-cart',
    storage: {
      getItem: (key: string) => {
        try { return uni.getStorageSync(key); } catch { return null; }
      },
      setItem: (key: string, value: string) => {
        try { uni.setStorageSync(key, value); } catch {}
      },
      removeItem: (key: string) => {
        try { uni.removeStorageSync(key); } catch {}
      },
    },
  },
});
