<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { orderApi } from '@/utils/api';

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage?: string;
  spec?: string;
  price: number;
  quantity: number;
  subtotal: number;
}

interface OrderDetail {
  id: string;
  orderNo: string;
  type: string;
  status: string;
  subtotal: number;
  deliveryFee?: number;
  packagingFee?: number;
  discount?: number;
  total: number;
  paidAmount?: number;
  paymentMethod?: string;
  paidAt?: string;
  createdAt: string;
  bookingInfo?: {
    date: string;
    time: string;
    guests: number;
  };
  deliveryInfo?: {
    address: string;
    phone: string;
    name: string;
  };
  items: OrderItem[];
}

const order = ref<OrderDetail | null>(null);
const loading = ref(true);
const processing = ref(false);

const statusMap: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: '待支付', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
  paid: { label: '已支付', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
  confirmed: { label: '已确认', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
  preparing: { label: '制作中', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' },
  ready: { label: '已完成', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
  completed: { label: '已完成', color: '#6b7280', bg: 'rgba(107, 114, 128, 0.1)' },
  cancelled: { label: '已取消', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },
};

const formatPrice = (price: number) => `¥${price.toFixed(2)}`;

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleString('zh-CN', { 
    month: '2-digit', 
    day: '2-digit', 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

const loadOrderDetail = async () => {
  try {
    const pages = getCurrentPages();
    const page = pages[pages.length - 1];
    const options = (page as any).options || {};
    const orderId = options.id || '';
    
    if (!orderId) {
      uni.showToast({ title: '订单ID不存在', icon: 'none' });
      return;
    }
    
    loading.value = true;
    const data = await orderApi.getOrderDetail(orderId);
    order.value = data as OrderDetail;
  } catch (e: any) {
    uni.showToast({ title: e.message || '加载失败', icon: 'none' });
  } finally {
    loading.value = false;
  }
};

const handlePay = async () => {
  if (!order.value || processing.value) return;
  try {
    processing.value = true;
    await orderApi.payOrder(order.value.id, 'simulate');
    uni.showToast({ title: '支付成功', icon: 'success' });
    loadOrderDetail();
  } catch (e: any) {
    uni.showToast({ title: e.message || '支付失败', icon: 'none' });
  } finally {
    processing.value = false;
  }
};

const handleCancel = async () => {
  if (!order.value || processing.value) return;
  try {
    processing.value = true;
    await orderApi.cancelOrder(order.value.id);
    uni.showToast({ title: '取消成功', icon: 'success' });
    loadOrderDetail();
  } catch (e: any) {
    uni.showToast({ title: e.message || '取消失败', icon: 'none' });
  } finally {
    processing.value = false;
  }
};

const handleVerify = async () => {
  if (!order.value) return;
  uni.showModal({
    title: '核销',
    placeholderText: '请输入核销码',
    editable: true,
    success: async (res) => {
      if (res.confirm && res.content) {
        try {
          processing.value = true;
          await orderApi.verifyOrder(order.value!.id, res.content);
          uni.showToast({ title: '核销成功', icon: 'success' });
          loadOrderDetail();
        } catch (e: any) {
          uni.showToast({ title: e.message || '核销失败', icon: 'none' });
        } finally {
          processing.value = false;
        }
      }
    },
  });
};

const goBack = () => {
  uni.navigateBack();
};

onMounted(loadOrderDetail);
</script>

<template>
  <view class="order-detail">
    <view v-if="loading" class="loading">
      <text>加载中...</text>
    </view>

    <view v-else-if="!order" class="empty">
      <text>订单不存在</text>
    </view>

    <template v-else>
      <!-- Status Header -->
      <view class="status-header" :style="{ backgroundColor: statusMap[order.status]?.bg }">
        <text class="status-text" :style="{ color: statusMap[order.status]?.color }">
          {{ statusMap[order.status]?.label || order.status }}
        </text>
      </view>

      <!-- Order Info -->
      <view class="section">
        <view class="section-title">订单信息</view>
        <view class="info-row">
          <text class="label">订单号</text>
          <text class="value">{{ order.orderNo }}</text>
        </view>
        <view class="info-row">
          <text class="label">创建时间</text>
          <text class="value">{{ formatDate(order.createdAt) }}</text>
        </view>
        <view class="info-row" v-if="order.paymentMethod">
          <text class="label">支付方式</text>
          <text class="value">{{ order.paymentMethod === 'wechat' ? '微信支付' : order.paymentMethod === 'alipay' ? '支付宝' : order.paymentMethod }}</text>
        </view>
        <view class="info-row" v-if="order.paidAt">
          <text class="label">支付时间</text>
          <text class="value">{{ formatDate(order.paidAt) }}</text>
        </view>
      </view>

      <!-- Booking/Delivery Info -->
      <view class="section" v-if="order.type === 'booking' && order.bookingInfo">
        <view class="section-title">预约信息</view>
        <view class="info-row">
          <text class="label">预约日期</text>
          <text class="value">{{ order.bookingInfo.date }}</text>
        </view>
        <view class="info-row">
          <text class="label">预约时间</text>
          <text class="value">{{ order.bookingInfo.time }}</text>
        </view>
        <view class="info-row">
          <text class="label">用餐人数</text>
          <text class="value">{{ order.bookingInfo.guests }}人</text>
        </view>
      </view>

      <view class="section" v-if="order.type === 'delivery' && order.deliveryInfo">
        <view class="section-title">配送信息</view>
        <view class="info-row">
          <text class="label">收货人</text>
          <text class="value">{{ order.deliveryInfo.name }}</text>
        </view>
        <view class="info-row">
          <text class="label">电话</text>
          <text class="value">{{ order.deliveryInfo.phone }}</text>
        </view>
        <view class="info-row">
          <text class="label">地址</text>
          <text class="value">{{ order.deliveryInfo.address }}</text>
        </view>
      </view>

      <!-- Items -->
      <view class="section">
        <view class="section-title">商品清单</view>
        <view class="items">
          <view class="item" v-for="item in order.items" :key="item.id">
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
                <text class="item-quantity">x{{ item.quantity }}</text>
              </view>
            </view>
            <text class="item-subtotal">{{ formatPrice(item.subtotal) }}</text>
          </view>
        </view>
      </view>

      <!-- Summary -->
      <view class="section">
        <view class="section-title">金额明细</view>
        <view class="info-row">
          <text class="label">商品小计</text>
          <text class="value">{{ formatPrice(order.subtotal) }}</text>
        </view>
        <view class="info-row" v-if="order.deliveryFee">
          <text class="label">配送费</text>
          <text class="value">{{ formatPrice(order.deliveryFee) }}</text>
        </view>
        <view class="info-row" v-if="order.packagingFee">
          <text class="label">包装费</text>
          <text class="value">{{ formatPrice(order.packagingFee) }}</text>
        </view>
        <view class="info-row" v-if="order.discount">
          <text class="label">优惠</text>
          <text class="value discount">-{{ formatPrice(order.discount) }}</text>
        </view>
        <view class="info-row total">
          <text class="label">合计</text>
          <text class="value">{{ formatPrice(order.total) }}</text>
        </view>
      </view>

      <!-- Actions -->
      <view class="actions">
        <button 
          v-if="order.status === 'pending'"
          class="btn btn-primary" 
          :disabled="processing"
          @click="handlePay"
        >
          {{ processing ? '处理中...' : '立即支付' }}
        </button>
        <button 
          v-if="order.status === 'pending'"
          class="btn btn-default" 
          :disabled="processing"
          @click="handleCancel"
        >
          取消订单
        </button>
        <button 
          v-if="order.status === 'paid' || order.status === 'confirmed'"
          class="btn btn-primary" 
          @click="handleVerify"
        >
          核销
        </button>
        <button class="btn btn-default" @click="goBack">
          返回
        </button>
      </view>
    </template>
  </view>
</template>

<style lang="scss" scoped>
.order-detail {
  min-height: 100vh;
  background: #1a1a1a;
  padding-bottom: 120rpx;
}

.loading, .empty {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400rpx;
  color: #666;
}

.status-header {
  padding: 40rpx 32rpx;
  display: flex;
  align-items: center;
}

.status-text {
  font-size: 36rpx;
  font-weight: 600;
}

.section {
  background: #242424;
  margin: 0 24rpx 24rpx;
  border-radius: 16rpx;
  padding: 24rpx;
}

.section-title {
  font-size: 28rpx;
  color: #fff;
  font-weight: 600;
  margin-bottom: 20rpx;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 12rpx 0;
  font-size: 26rpx;
  
  .label {
    color: #999;
  }
  
  .value {
    color: #fff;
  }
  
  &.total {
    padding-top: 20rpx;
    margin-top: 10rpx;
    border-top: 1px solid #333;
    
    .value {
      color: #f59e0b;
      font-size: 32rpx;
      font-weight: 600;
    }
  }
  
  .discount {
    color: #f59e0b;
  }
}

.items {
  .item {
    display: flex;
    align-items: center;
    padding: 16rpx 0;
    border-bottom: 1px solid #333;
    
    &:last-child {
      border-bottom: none;
    }
  }
  
  .item-image {
    width: 120rpx;
    height: 120rpx;
    border-radius: 12rpx;
    background: #333;
    flex-shrink: 0;
  }
  
  .item-info {
    flex: 1;
    margin-left: 20rpx;
  }
  
  .item-name {
    font-size: 28rpx;
    color: #fff;
    display: block;
  }
  
  .item-spec {
    font-size: 24rpx;
    color: #999;
    display: block;
    margin-top: 4rpx;
  }
  
  .item-bottom {
    display: flex;
    justify-content: space-between;
    margin-top: 8rpx;
  }
  
  .item-price {
    font-size: 26rpx;
    color: #f59e0b;
  }
  
  .item-quantity {
    font-size: 24rpx;
    color: #999;
  }
  
  .item-subtotal {
    font-size: 28rpx;
    color: #fff;
    min-width: 100rpx;
    text-align: right;
  }
}

.actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 24rpx 32rpx;
  background: #1a1a1a;
  display: flex;
  gap: 20rpx;
  
  .btn {
    flex: 1;
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
    
    &[disabled] {
      opacity: 0.5;
    }
  }
}
</style>