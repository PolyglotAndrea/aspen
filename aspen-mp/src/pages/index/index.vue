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
  filter: brightness(0.65) saturate(0.8);
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    180deg,
    rgba(5, 5, 5, 0.4) 0%,
    rgba(5, 5, 5, 0.2) 50%,
    rgba(5, 5, 5, 0.8) 100%
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
  margin-bottom: 80rpx;
  animation: fadeInDown 1.5s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.title {
  display: block;
  font-size: 88rpx;
  font-weight: 200;
  letter-spacing: 32rpx;
  background: linear-gradient(135deg, #ffffff 0%, var(--as-accent) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.2);
  margin-right: -32rpx; /* Compensation for letter-spacing on last character */
}

.subtitle {
  display: block;
  margin-top: 24rpx;
  font-size: 26rpx;
  color: var(--as-text-muted);
  letter-spacing: 8rpx;
  font-weight: 300;
}

.slogan-section {
  text-align: center;
  animation: fadeInUp 1.5s cubic-bezier(0.2, 0.8, 0.2, 1) 0.3s both;
}

.slogan-cn {
  display: block;
  font-size: 64rpx;
  font-weight: 300;
  color: var(--as-text);
  letter-spacing: 12rpx;
  text-shadow: 0 4rpx 16rpx rgba(0,0,0,0.4);
}

.slogan-en {
  display: block;
  margin-top: 24rpx;
  font-size: 24rpx;
  color: var(--as-accent);
  letter-spacing: 10rpx;
  font-weight: 400;
}

.stories-preview {
  margin-top: 100rpx;
  width: 100%;
  animation: fadeIn 2s ease 0.6s both;
}

.story-title {
  display: block;
  font-size: var(--as-font-size-lg);
  color: var(--as-accent);
  margin-bottom: 12rpx;
  font-weight: 400;
  letter-spacing: 4rpx;
}

.story-content {
  display: block;
  font-size: var(--as-font-size-sm);
  color: var(--as-text-secondary);
  line-height: 1.8;
  font-weight: 300;
}

.loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: var(--as-accent);
  font-size: var(--as-font-size-base);
  letter-spacing: 4rpx;
  font-weight: 300;
}

/* Animations */
@keyframes fadeInDown {
  from { opacity: 0; transform: translateY(-40rpx); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(40rpx); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
