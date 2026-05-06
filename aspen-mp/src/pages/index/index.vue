<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { brandApi } from '@/utils/api';

interface Story {
  id: string;
  title: string;
  content: string;
}

const brandVideoUrl = ref('');
const stories = ref<Story[]>([]);
const isLoading = ref(true);

onMounted(async () => {
  try {
    const data = await brandApi.get();
    brandVideoUrl.value = data.videoUrl;
    stories.value = data.stories;
  } catch (e) {
    console.error('Failed to fetch brand data:', e);
    brandVideoUrl.value = 'https://cdn.aspen.com/brand-bg.mp4';
    stories.value = [
      { id: 'origin', title: 'UNDER THE ASPEN', content: '白杨树下的静谧与火焰...' }
    ];
  } finally {
    isLoading.value = false;
  }
});

const goToMenu = () => {
  uni.switchTab({ url: '/pages/menu/index' });
};

const goToBooking = () => {
  uni.switchTab({ url: '/pages/booking/index' });
};

const goToAbout = () => {
  uni.showToast({ title: '关于白杨树', icon: 'none' });
};
</script>

<template>
  <view class="aspen-home">
    <!-- Background Video -->
    <video
      class="bg-video"
      :src="brandVideoUrl"
      autoplay
      loop
      muted
      :controls="false"
      object-fit="cover"
      :show-center-play-btn="false"
    ></video>

    <!-- Overlay -->
    <view class="overlay"></view>

    <!-- Content -->
    <view class="content">
      <!-- Brand Header -->
      <view class="brand-header">
        <text class="title">ASPEN</text>
        <text class="subtitle">白杨树下的静谧与火焰</text>
      </view>

      <!-- Slogan -->
      <view class="slogan-section">
        <text class="slogan-cn">你见过白杨树吗</text>
        <text class="slogan-en">UNDER THE ASPEN</text>
      </view>

      <!-- Stories Preview - 使用 AsCard 组件 -->
      <view v-if="stories.length > 0" class="stories-preview">
        <AsCard
          v-for="story in stories"
          :key="story.id"
          :opacity="0.05"
          :radius="'16rpx'"
          :padding="'30rpx'"
        >
          <template #header>
            <text class="story-title">{{ story.title }}</text>
          </template>
          <text class="story-content">{{ story.content }}</text>
        </AsCard>
      </view>
    </view>

    <!-- Bottom Dock -->
    <view class="dock">
      <view class="dock-item" @tap="goToMenu">
        <text class="dock-icon">🔥</text>
        <text class="dock-text">树下有火</text>
      </view>
      <view class="dock-item" @tap="goToBooking">
        <text class="dock-icon">📅</text>
        <text class="dock-text">预约</text>
      </view>
      <view class="dock-item" @tap="goToAbout">
        <text class="dock-icon">ℹ️</text>
        <text class="dock-text">关于</text>
      </view>
    </view>

    <!-- Loading -->
    <view v-if="isLoading" class="loading">
      <text>加载中...</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.aspen-home {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background-color: var(--as-background);
}

.bg-video {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  filter: brightness(0.5);
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    180deg,
    rgba(0, 0, 0, 0.3) 0%,
    rgba(0, 0, 0, 0.1) 50%,
    rgba(0, 0, 0, 0.6) 100%
  );
}

.content {
  position: relative;
  z-index: 10;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 120rpx 60rpx;
}

.brand-header {
  text-align: center;
  margin-bottom: 60rpx;
}

.title {
  display: block;
  font-size: 72rpx;
  font-weight: 300;
  letter-spacing: 24rpx;
  color: var(--as-text);
  opacity: 0.9;
}

.subtitle {
  display: block;
  margin-top: 20rpx;
  font-size: 24rpx;
  color: var(--as-text-secondary);
  letter-spacing: 4rpx;
}

.slogan-section {
  text-align: center;
}

.slogan-cn {
  display: block;
  font-size: 56rpx;
  font-weight: 300;
  color: var(--as-text);
  letter-spacing: 8rpx;
}

.slogan-en {
  display: block;
  margin-top: 16rpx;
  font-size: 24rpx;
  color: var(--as-text-secondary);
  letter-spacing: 8rpx;
}

.stories-preview {
  margin-top: 80rpx;
  width: 100%;
}

.story-title {
  display: block;
  font-size: var(--as-font-size-base);
  color: var(--as-text-muted);
  margin-bottom: 10rpx;
}

.story-content {
  display: block;
  font-size: var(--as-font-size-sm);
  color: var(--as-text-secondary);
  line-height: 1.6;
}

.dock {
  position: absolute;
  bottom: 60rpx;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 60rpx;
  padding: 24rpx 60rpx;
  background: var(--as-surface-glass);
  backdrop-filter: blur(var(--as-blur));
  border-radius: 100rpx;
  border: 1px solid var(--as-border);
  z-index: 20;
}

.dock-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}

.dock-icon {
  font-size: 32rpx;
}

.dock-text {
  font-size: 22rpx;
  color: var(--as-text-muted);
}

.loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: var(--as-text-secondary);
  font-size: var(--as-font-size-base);
}
</style>
