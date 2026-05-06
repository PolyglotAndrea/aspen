<script setup lang="ts">
import { ref } from 'vue';
import { bookingApi } from '@/utils/api';

const formData = ref({
  name: '',
  phone: '',
  date: '',
  time: '',
  guests: 2,
});

const isSubmitting = ref(false);
const showModal = ref(false);
const bookingResult = ref<{ success: boolean; message: string } | null>(null);

const validateForm = () => {
  if (!formData.value.name.trim()) {
    uni.showToast({ title: '请输入姓名', icon: 'none' });
    return false;
  }
  if (!formData.value.phone.trim() || !/^1\d{10}$/.test(formData.value.phone)) {
    uni.showToast({ title: '请输入正确的手机号', icon: 'none' });
    return false;
  }
  if (!formData.value.date) {
    uni.showToast({ title: '请选择日期', icon: 'none' });
    return false;
  }
  if (!formData.value.time) {
    uni.showToast({ title: '请选择时间', icon: 'none' });
    return false;
  }
  return true;
};

const submitBooking = async () => {
  if (!validateForm()) return;

  isSubmitting.value = true;

  try {
    await bookingApi.create({
      items: [],
      bookingInfo: {
        date: formData.value.date,
        time: formData.value.time,
        guests: formData.value.guests,
        name: formData.value.name,
        phone: formData.value.phone,
      },
    });

    bookingResult.value = { success: true, message: '预约成功' };
    uni.showModal({
      title: '预约成功',
      content: `您已成功预约\n${formData.value.date} ${formData.value.time}\n${formData.value.guests}人`,
      showCancel: false,
    });
    resetForm();
    showModal.value = false;
  } catch (e: any) {
    console.error('Booking error:', e);
    bookingResult.value = { success: false, message: e.message || '预约失败' };
    uni.showToast({ title: e.message || '预约失败', icon: 'none' });
  } finally {
    isSubmitting.value = false;
  }
};

const resetForm = () => {
  formData.value = { name: '', phone: '', date: '', time: '', guests: 2 };
};

const handleConfirm = (data: any) => {
  formData.value = { ...data };
  submitBooking();
};

const openBookingModal = () => {
  showModal.value = true;
};
</script>

<template>
  <view class="aspen-booking">
    <!-- Header -->
    <view class="booking-header">
      <text class="header-title">预约</text>
      <text class="header-subtitle">RESERVATION</text>
    </view>

    <!-- 快捷预约卡片 -->
    <view class="booking-intro">
      <AsCard :opacity="0.05" :radius="'24rpx'" :padding="'40rpx'" :clickable="true" @click="openBookingModal">
        <view class="intro-content">
          <text class="intro-icon">📅</text>
          <view class="intro-text">
            <text class="intro-title">在线预约</text>
            <text class="intro-desc">提前预约，尊享专属座位</text>
          </view>
          <text class="intro-arrow">›</text>
        </view>
      </AsCard>

      <AsCard :opacity="0.05" :radius="'24rpx'" :padding="'40rpx'" class="intro-card">
        <view class="intro-content">
          <text class="intro-icon">📱</text>
          <view class="intro-text">
            <text class="intro-title">电话预约</text>
            <text class="intro-desc">400-888-8888</text>
          </view>
        </view>
      </AsCard>
    </view>

    <!-- 营业时间 -->
    <view class="hours-section">
      <AsCard :opacity="0.05" :radius="'16rpx'" :padding="'30rpx'">
        <template #header>
          <text class="section-title">营业时间</text>
        </template>
        <view class="hours-list">
          <view class="hours-item">
            <text class="hours-day">午餐</text>
            <text class="hours-time">11:30 - 14:00</text>
          </view>
          <view class="hours-item">
            <text class="hours-day">晚餐</text>
            <text class="hours-time">17:30 - 22:00</text>
          </view>
        </view>
      </AsCard>
    </view>

    <!-- 使用 AsBookingModal 预约模态框 -->
    <AsBookingModal
      v-model:visible="showModal"
      :loading="isSubmitting"
      :time-slots="['11:30', '12:00', '12:30', '13:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00']"
      @confirm="handleConfirm"
      @close="showModal = false"
    />
  </view>
</template>

<style lang="scss" scoped>
.aspen-booking {
  min-height: 100vh;
  background-color: var(--as-background);
  padding-bottom: 120rpx;
}

.booking-header {
  padding: 180rpx 40rpx 60rpx;
  text-align: center;
}

.header-title {
  display: block;
  font-size: var(--as-font-size-xl);
  font-weight: 300;
  color: var(--as-text);
  letter-spacing: 8rpx;
}

.header-subtitle {
  display: block;
  margin-top: 10rpx;
  font-size: var(--as-font-size-sm);
  color: var(--as-text-secondary);
  letter-spacing: 4rpx;
}

.booking-intro {
  padding: 0 40rpx;
  display: flex;
  flex-direction: column;
  gap: var(--as-spacing-base);
}

.intro-card {
  margin-top: var(--as-spacing-base);
}

.intro-content {
  display: flex;
  align-items: center;
  gap: var(--as-spacing-base);
}

.intro-icon {
  font-size: 48rpx;
}

.intro-text {
  flex: 1;
}

.intro-title {
  display: block;
  font-size: var(--as-font-size-base);
  color: var(--as-text);
  font-weight: 500;
}

.intro-desc {
  display: block;
  font-size: var(--as-font-size-sm);
  color: var(--as-text-secondary);
  margin-top: 4rpx;
}

.intro-arrow {
  font-size: 40rpx;
  color: var(--as-text-secondary);
}

.hours-section {
  padding: var(--as-spacing-lg) 40rpx 0;
}

.section-title {
  font-size: var(--as-font-size-base);
  color: var(--as-text);
  font-weight: 500;
}

.hours-list {
  margin-top: var(--as-spacing-xs);
}

.hours-item {
  display: flex;
  justify-content: space-between;
  padding: var(--as-spacing-xs) 0;
}

.hours-day {
  font-size: var(--as-font-size-sm);
  color: var(--as-text-muted);
}

.hours-time {
  font-size: var(--as-font-size-sm);
  color: var(--as-text);
}
</style>
