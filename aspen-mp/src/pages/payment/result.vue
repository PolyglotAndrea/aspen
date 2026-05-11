<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { orderApi } from '@/utils/api';

interface OrderInfo {
  id: string;
  orderNo: string;
  total: number;
  status: string;
}

const order = ref<OrderInfo | null>(null);
const loading = ref(true);

const formatPrice = (price: number) => `¥${price.toFixed(2)}`;

const loadResult = async () => {
  try {
    const pages = getCurrentPages();
    const page = pages[pages.length - 1];
    const options = (page as any).options || {};
    const orderId = options.id || '';
    const status = options.status || '';
    
    if (!orderId) {
      uni.showToast({ title: '订单ID不存在', icon: 'none' });
      return;
    }
    
    loading.value = true;
    const data = await orderApi.getOrderDetail(orderId) as any;
    order.value = {
      id: data.id,
      orderNo: data.orderNo,
      total: data.total,
      status: status || data.status,
    };
  } catch (e: any) {
    uni.showToast({ title: e.message || '加载失败', icon: 'none' });
  } finally {
    loading.value = false;
  }
};

const isSuccess = () => {
  return order.value?.status === 'paid' || order.value?.status === 'confirmed';
};

const goToOrderDetail = () => {
  if (order.value?.id) {
    uni.redirectTo({
      url: `/pages/order/detail?id=${order.value.id}`,
    });
  }
};

const goToHome = () => {
  uni.switchTab({
    url: '/pages/index/index',
  });
};

onMounted(loadResult);
</script>

<template>
  <view class="payment-result">
    <view v-if="loading" class="loading">
      <text>加载中...</text>
    </view>

    <template v-else-if="order">
      <!-- Status Icon -->
      <view class="status-icon">
        <text v-if="isSuccess()" class="icon success">✓</text>
        <text v-else class="icon fail">×</text>
      </view>

      <text class="status-text">
        {{ isSuccess() ? '支付成功' : '支付失败' }}
      </text>

      <text class="order-no">订单号：{{ order.orderNo }}</text>

      <view class="amount-card">
        <text class="label">支付金额</text>
        <text class="amount">{{ formatPrice(order.total) }}</text>
      </view>

      <view class="actions">
        <button class="btn btn-primary" @click="goToOrderDetail">
          查看订单
        </button>
        <button class="btn btn-default" @click="goToHome">
          返回首页
        </button>
      </view>
    </template>
  </view>
</template>

<style lang="scss" scoped>
.payment-result {
  min-height: 100vh;
  background: #1a1a1a;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80rpx 32rpx;
}

.loading {
  color: #666;
}

.status-icon {
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 32rpx;
  
  .icon {
    font-size: 80rpx;
    font-weight: bold;
    
    &.success {
      color: #10b981;
    }
    
    &.fail {
      color: #ef4444;
    }
  }
}

.status-text {
  font-size: 40rpx;
  color: #fff;
  font-weight: 600;
  margin-bottom: 16rpx;
}

.order-no {
  font-size: 26rpx;
  color: #666;
  margin-bottom: 48rpx;
}

.amount-card {
  background: #242424;
  border-radius: 16rpx;
  padding: 40rpx 80rpx;
  text-align: center;
  width: 100%;
  margin-bottom: 60rpx;
  
  .label {
    font-size: 26rpx;
    color: #999;
    display: block;
    margin-bottom: 12rpx;
  }
  
  .amount {
    font-size: 56rpx;
    color: #f59e0b;
    font-weight: 600;
  }
}

.actions {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  
  .btn {
    height: 88rpx;
    border-radius: 44rpx;
    font-size: 30rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    
    &.btn-primary {
      background: linear-gradient(135deg, #10b981, #059669);
      color: #fff;
      border: none;
    }
    
    &.btn-default {
      background: #333;
      color: #fff;
      border: 1px solid #444;
    }
  }
}
</style>