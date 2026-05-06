<template>
  <view class="aspen-root">
    <video class="bg-video" src="/static/aspen-bg.mp4" autoplay loop muted :controls="false" object-fit="cover"></video>
    <view class="overlay">
      <view class="brand-header"><text class="title">ASPEN</text></view>
      <view class="slogan-section">
        <text class="cn">你见过白杨树吗</text>
        <text class="en">UNDER THE ASPEN</text>
      </view>
      <view class="dock">
        <view class="nav-btn">树下有火</view>
        <view class="nav-btn">服务</view>
        <view class="nav-btn">我的</view>
      </view>
    </view>
  </view>
</template>

<style scoped>
.aspen-root { height: 100vh; background: #000; position: relative; }
.bg-video { position: absolute; width: 100%; height: 100%; filter: brightness(0.6); }
.overlay { position: relative; z-index: 10; height: 100%; display: flex; flex-direction: column; justify-content: space-between; align-items: center; padding: 120rpx 0; }
.title { font-size: 36rpx; letter-spacing: 16rpx; color: #fff; opacity: 0.8; }
.cn { font-size: 52rpx; color: #fff; font-weight: 300; display: block; }
.en { font-size: 20rpx; color: rgba(255,255,255,0.5); letter-spacing: 4rpx; }
.dock { background: rgba(255,255,255,0.1); backdrop-filter: blur(20px); padding: 24rpx 60rpx; border-radius: 100rpx; display: flex; gap: 60rpx; border: 1px solid rgba(255,255,255,0.1); }
.nav-btn { color: #fff; font-size: 26rpx; }
</style>
