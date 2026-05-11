<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { memberApi } from '@/utils/api';

interface PointsRecord {
  id: string;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
}

interface PointsData {
  points: number;
  totalPoints: number;
  records: PointsRecord[];
}

const data = ref<PointsData | null>(null);
const loading = ref(true);
const signing = ref(false);
const activeTab = ref<'all' | 'earn' | 'use'>('all');

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

const loadPoints = async () => {
  try {
    loading.value = true;
    const result = await memberApi.getPoints() as any;
    data.value = result;
  } catch (e: any) {
    uni.showToast({ title: e.message || '加载失败', icon: 'none' });
  } finally {
    loading.value = false;
  }
};

const handleSignin = async () => {
  if (signing.value) return;
  try {
    signing.value = true;
    const result = await memberApi.signin() as any;
    uni.showToast({ title: `签到成功，获得 ${result.pointsEarned} 积分`, icon: 'success' });
    loadPoints();
  } catch (e: any) {
    uni.showToast({ title: e.message || '签到失败', icon: 'none' });
  } finally {
    signing.value = false;
  }
};

const filteredRecords = () => {
  if (!data.value?.records) return [];
  if (activeTab.value === 'all') return data.value.records;
  return data.value.records.filter(r => 
    activeTab.value === 'earn' ? r.amount > 0 : r.amount < 0
  );
};

onMounted(loadPoints);
</script>

<template>
  <view class="points-page">
    <view class="header">
      <text class="title">我的积分</text>
    </view>

    <!-- Points Card -->
    <view class="points-card">
      <view class="points-main">
        <text class="points-value">{{ data?.points || 0 }}</text>
        <text class="points-label">当前积分</text>
      </view>
      <view class="points-info">
        <view class="info-item">
          <text class="info-value">{{ data?.totalPoints || 0 }}</text>
          <text class="info-label">累计积分</text>
        </view>
        <button 
          class="signin-btn" 
          :disabled="signing"
          @click="handleSignin"
        >
          {{ signing ? '签到中...' : '签到' }}
        </button>
      </view>
    </view>

    <!-- Tabs -->
    <view class="tabs">
      <text 
        class="tab" 
        :class="{ active: activeTab === 'all' }"
        @click="activeTab = 'all'"
      >全部</text>
      <text 
        class="tab" 
        :class="{ active: activeTab === 'earn' }"
        @click="activeTab = 'earn'"
      >收入</text>
      <text 
        class="tab" 
        :class="{ active: activeTab === 'use' }"
        @click="activeTab = 'use'"
      >支出</text>
    </view>

    <view v-if="loading" class="loading">
      <text>加载中...</text>
    </view>

    <view v-else-if="filteredRecords().length === 0" class="empty">
      <text class="empty-text">暂无积分记录</text>
    </view>

    <view v-else class="records-list">
      <view class="record-item" v-for="record in filteredRecords()" :key="record.id">
        <view class="record-info">
          <text class="record-desc">{{ record.description }}</text>
          <text class="record-time">{{ formatDate(record.createdAt) }}</text>
        </view>
        <text 
          class="record-amount" 
          :class="record.amount > 0 ? 'positive' : 'negative'"
        >
          {{ record.amount > 0 ? '+' : '' }}{{ record.amount }}
        </text>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.points-page {
  min-height: 100vh;
  background: #1a1a1a;
}

.header {
  padding: 40rpx 32rpx 24rpx;
  
  .title {
    font-size: 40rpx;
    color: #fff;
    font-weight: 600;
  }
}

.points-card {
  background: linear-gradient(135deg, #10b981, #059669);
  margin: 0 24rpx 32rpx;
  border-radius: 24rpx;
  padding: 40rpx;
}

.points-main {
  text-align: center;
  margin-bottom: 32rpx;
}

.points-value {
  font-size: 80rpx;
  color: #fff;
  font-weight: bold;
  display: block;
}

.points-label {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 8rpx;
}

.points-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-item {
  display: flex;
  flex-direction: column;
}

.info-value {
  font-size: 36rpx;
  color: #fff;
  font-weight: 600;
}

.info-label {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.7);
}

.signin-btn {
  padding: 16rpx 40rpx;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  border-radius: 32rpx;
  font-size: 28rpx;
  border: none;
  
  &[disabled] {
    opacity: 0.5;
  }
}

.tabs {
  display: flex;
  padding: 0 24rpx;
  border-bottom: 1px solid #333;
}

.tab {
  flex: 1;
  text-align: center;
  padding: 24rpx 0;
  font-size: 28rpx;
  color: #999;
  position: relative;
  
  &.active {
    color: #10b981;
    
    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 48rpx;
      height: 4rpx;
      background: #10b981;
      border-radius: 2rpx;
    }
  }
}

.loading, .empty {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 100rpx 0;
  color: #666;
}

.empty-text {
  color: #666;
}

.records-list {
  padding: 0 24rpx;
}

.record-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 1px solid #333;
  
  &:last-child {
    border-bottom: none;
  }
}

.record-info {
  flex: 1;
}

.record-desc {
  font-size: 28rpx;
  color: #fff;
  display: block;
}

.record-time {
  font-size: 24rpx;
  color: #666;
  margin-top: 8rpx;
  display: block;
}

.record-amount {
  font-size: 32rpx;
  font-weight: 600;
  
  &.positive {
    color: #10b981;
  }
  
  &.negative {
    color: #f59e0b;
  }
}
</style>