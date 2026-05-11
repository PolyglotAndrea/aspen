<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useCartStore, type CartItem } from '@/stores/cart';
import { orderApi } from '@/utils/api';

const cartStore = useCartStore();
const loading = ref(true);
const submitting = ref(false);

const items = computed(() => cartStore.items);
const totalAmount = computed(() => cartStore.totalAmount);
const totalQuantity = computed(() => cartStore.totalQuantity);

const formatPrice = (price: number) => `¥${price.toFixed(2)}`;

const loadCart = async () => {
  try {
    loading.value = true;
    await cartStore.fetchCart();
  } catch (e: any) {
    uni.showToast({ title: e.message || '加载失败', icon: 'none' });
  } finally {
    loading.value = false;
  }
};

const handleQuantityChange = async (item: CartItem, delta: number) => {
  const newQty = item.quantity + delta;
  if (newQty < 1) return;
  if (newQty > item.stock) {
    uni.showToast({ title: '库存不足', icon: 'none' });
    return;
  }
  try {
    await cartStore.updateQuantity(item.productId, newQty, item.spec);
  } catch (e: any) {
    uni.showToast({ title: e.message || '更新失败', icon: 'none' });
  }
};

const handleRemove = async (item: CartItem) => {
  try {
    await cartStore.updateQuantity(item.productId, 0, item.spec);
    uni.showToast({ title: '已删除', icon: 'success' });
  } catch (e: any) {
    uni.showToast({ title: e.message || '删除失败', icon: 'none' });
  }
};

const goToMenu = () => {
  uni.switchTab({ url: '/pages/menu/index' });
};

const handleCheckout = async () => {
  if (items.value.length === 0) return;
  try {
    submitting.value = true;
    const order = await orderApi.createOrder({
      type: 'product',
      items: items.value.map(item => ({
        productId: item.productId,
        productName: item.productName,
        price: item.price,
        quantity: item.quantity,
        spec: item.spec,
      })),
    }) as any;
    await cartStore.clearCart();
    uni.redirectTo({
      url: `/pages/order/detail?id=${order.id}`,
    });
  } catch (e: any) {
    uni.showToast({ title: e.message || '下单失败', icon: 'none' });
  } finally {
    submitting.value = false;
  }
};

onMounted(loadCart);
</script>

<template>
  <view class="cart-page">
    <view class="header">
      <text class="title">购物车</text>
      <text class="subtitle" v-if="items.length > 0">{{ totalQuantity }}件商品</text>
    </view>

    <view v-if="loading" class="loading">
      <text>加载中...</text>
    </view>

    <view v-else-if="items.length === 0" class="empty">
      <text class="empty-icon">🛒</text>
      <text class="empty-text">购物车是空的</text>
      <text class="empty-hint">快去挑选心仪的商品吧</text>
      <button class="btn btn-primary" @click="goToMenu">
        去购物
      </button>
    </view>

    <template v-else>
      <scroll-view class="cart-list" scroll-y>
        <view class="cart-item" v-for="item in items" :key="item.id">
          <image 
            class="item-image" 
            :src="item.productImage || '/static/default-food.png'" 
            mode="aspectFill"
          />
          <view class="item-info">
            <text class="item-name">{{ item.productName }}</text>
            <text class="item-spec" v-if="item.spec">{{ item.spec }}</text>
            <view class="item-bottom">
              <text class="item-price">{{ formatPrice(item.price) }}</text>
              <view class="quantity-control">
                <text 
                  class="qty-btn" 
                  @click="handleQuantityChange(item, -1)"
                >-</text>
                <text class="qty-value">{{ item.quantity }}</text>
                <text 
                  class="qty-btn" 
                  :class="{ disabled: item.quantity >= item.stock }"
                  @click="handleQuantityChange(item, 1)"
                >+</text>
              </view>
            </view>
          </view>
          <view class="item-actions">
            <text class="remove-btn" @click="handleRemove(item)">删除</text>
          </view>
        </view>
      </scroll-view>

      <view class="checkout-bar">
        <view class="total-info">
          <text class="total-label">合计</text>
          <text class="total-amount">{{ formatPrice(totalAmount) }}</text>
        </view>
        <button 
          class="checkout-btn" 
          :disabled="submitting"
          @click="handleCheckout"
        >
          {{ submitting ? '提交中...' : '结算' }}
        </button>
      </view>
    </template>
  </view>
</template>

<style lang="scss" scoped>
.cart-page {
  min-height: 100vh;
  background: #1a1a1a;
  display: flex;
  flex-direction: column;
}

.header {
  padding: 40rpx 32rpx 24rpx;
  background: #242424;
  
  .title {
    font-size: 40rpx;
    color: #fff;
    font-weight: 600;
    display: block;
  }
  
  .subtitle {
    font-size: 26rpx;
    color: #999;
    margin-top: 8rpx;
    display: block;
  }
}

.loading, .empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #666;
}

.empty {
  padding: 100rpx 0;
  
  .empty-icon {
    font-size: 120rpx;
    margin-bottom: 24rpx;
  }
  
  .empty-text {
    font-size: 32rpx;
    color: #fff;
  }
  
  .empty-hint {
    font-size: 26rpx;
    color: #666;
    margin-top: 12rpx;
    margin-bottom: 40rpx;
  }
  
  .btn-primary {
    padding: 20rpx 60rpx;
    background: linear-gradient(135deg, #10b981, #059669);
    color: #fff;
    border-radius: 40rpx;
    font-size: 28rpx;
    border: none;
  }
}

.cart-list {
  flex: 1;
  padding: 24rpx;
}

.cart-item {
  display: flex;
  align-items: center;
  background: #242424;
  border-radius: 16rpx;
  padding: 20rpx;
  margin-bottom: 20rpx;
  
  .item-image {
    width: 160rpx;
    height: 160rpx;
    border-radius: 12rpx;
    background: #333;
    flex-shrink: 0;
  }
  
  .item-info {
    flex: 1;
    margin-left: 20rpx;
    min-width: 0;
  }
  
  .item-name {
    font-size: 28rpx;
    color: #fff;
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .item-spec {
    font-size: 24rpx;
    color: #999;
    display: block;
    margin-top: 8rpx;
  }
  
  .item-bottom {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 16rpx;
  }
  
  .item-price {
    font-size: 30rpx;
    color: #f59e0b;
    font-weight: 600;
  }
  
  .quantity-control {
    display: flex;
    align-items: center;
    gap: 16rpx;
  }
  
  .qty-btn {
    width: 48rpx;
    height: 48rpx;
    background: #333;
    border-radius: 8rpx;
    color: #fff;
    font-size: 32rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    
    &.disabled {
      opacity: 0.3;
    }
  }
  
  .qty-value {
    font-size: 28rpx;
    color: #fff;
    min-width: 48rpx;
    text-align: center;
  }
  
  .item-actions {
    padding-left: 20rpx;
  }
  
  .remove-btn {
    font-size: 24rpx;
    color: #ef4444;
  }
}

.checkout-bar {
  background: #242424;
  padding: 24rpx 32rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  
  .total-info {
    display: flex;
    align-items: baseline;
    gap: 8rpx;
  }
  
  .total-label {
    font-size: 26rpx;
    color: #999;
  }
  
  .total-amount {
    font-size: 40rpx;
    color: #f59e0b;
    font-weight: 600;
  }
  
  .checkout-btn {
    padding: 24rpx 60rpx;
    background: linear-gradient(135deg, #10b981, #059669);
    color: #fff;
    border-radius: 40rpx;
    font-size: 30rpx;
    border: none;
    
    &[disabled] {
      opacity: 0.5;
    }
  }
}
</style>