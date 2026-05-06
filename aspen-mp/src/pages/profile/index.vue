<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();

const isLoggedIn = computed(() => authStore.isLoggedIn);
const userInfo = computed(() => ({
  name: authStore.memberName,
  phone: authStore.member?.phone ? authStore.member.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : '',
  avatar: authStore.member?.avatar || '',
  points: authStore.points,
  levelName: authStore.memberLevel,
}));

const menuItems = [
  { id: 'bookings', icon: '📅', title: '我的预约', arrow: true },
  { id: 'favorites', icon: '❤️', title: '收藏菜品', arrow: true },
  { id: 'history', icon: '📝', title: '历史记录', arrow: true },
  { id: 'settings', icon: '⚙️', title: '设置', arrow: true },
  { id: 'about', icon: 'ℹ️', title: '关于白杨', arrow: true },
];

const handleMenuClick = (id: string) => {
  uni.showToast({ title: `点击了${id}`, icon: 'none' });
};

const handleBenefitClick = (benefit: any) => {
  uni.showToast({ title: `点击了${benefit.label}`, icon: 'none' });
};

const handleLogin = () => {
  uni.showModal({
    title: '手机号登录',
    editable: true,
    placeholderText: '请输入手机号',
    success: async (res) => {
      if (res.confirm && res.content) {
        try {
          const phone = res.content.trim();
          if (!/^1\d{10}$/.test(phone)) {
            uni.showToast({ title: '请输入正确的手机号', icon: 'none' });
            return;
          }
          await authStore.loginPhone(phone);
          uni.showToast({ title: '登录成功', icon: 'success' });
        } catch (e: any) {
          uni.showToast({ title: e.message || '登录失败', icon: 'none' });
        }
      }
    },
  });
};

const handleLogout = () => {
  authStore.logout();
  uni.showToast({ title: '已退出登录', icon: 'none' });
};

onMounted(() => {
  if (authStore.isLoggedIn) {
    authStore.loadProfile();
  }
});
</script>

<template>
  <view class="aspen-profile">
    <!-- Header -->
    <view class="profile-header">
      <text class="header-title">我的</text>
      <text class="header-subtitle">PROFILE</text>
    </view>

    <!-- 会员状态卡片 - 使用 AsMemberStatus 组件 -->
    <view class="member-section">
      <AsMemberStatus
        v-if="isLoggedIn"
        :nickname="userInfo.name"
        :points="userInfo.points"
        :next-level-points="5000"
        :next-level-name="'金卡会员'"
        :level-name="userInfo.levelName"
        :show-balance="true"
        :balance="168.00"
        :coupons="3"
        :show-benefits="true"
        @benefit-click="handleBenefitClick"
      />

      <!-- 登录前显示 -->
      <AsCard v-else :opacity="0.05" :radius="'24rpx'" :padding="'40rpx'">
        <view class="login-prompt">
          <view class="login-avatar">
            <text class="avatar-text">游</text>
          </view>
          <view class="login-info">
            <text class="login-title">登录后享受更多服务</text>
            <text class="login-subtitle">预约、收藏、积分等功能</text>
          </view>
          <view class="login-btn" @click="handleLogin">
            <text>立即登录</text>
          </view>
        </view>
      </AsCard>
    </view>

    <!-- 快捷入口 -->
    <view class="quick-links">
      <AsCard :opacity="0.05" :radius="'16rpx'" :padding="'20rpx'">
        <view class="links-row">
          <view class="link-item" v-for="item in menuItems.slice(0, 4)" :key="item.id" @click="handleMenuClick(item.id)">
            <text class="link-icon">{{ item.icon }}</text>
            <text class="link-label">{{ item.title }}</text>
          </view>
        </view>
      </AsCard>
    </view>

    <!-- Menu List -->
    <view class="menu-section">
      <view class="menu-list">
        <AsCard
          v-for="item in menuItems"
          :key="item.id"
          :opacity="0.03"
          :radius="'0'"
          :border="'none'"
          :padding="'32rpx 30rpx'"
          :clickable="true"
          @click="handleMenuClick(item.id)"
        >
          <view class="menu-item">
            <view class="menu-left">
              <text class="menu-icon">{{ item.icon }}</text>
              <text class="menu-title">{{ item.title }}</text>
            </view>
            <text v-if="item.arrow" class="menu-arrow">›</text>
          </view>
        </AsCard>
      </view>
    </view>

    <!-- Footer -->
    <view class="footer">
      <text class="footer-text">白杨树 · UNDER THE ASPEN</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.aspen-profile {
  min-height: 100vh;
  background-color: var(--as-background);
  padding-bottom: 120rpx;
}

.profile-header {
  padding: 180rpx 40rpx 40rpx;
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

.member-section {
  padding: 0 40rpx;
}

.login-prompt {
  display: flex;
  align-items: center;
  gap: var(--as-spacing-base);
}

.login-avatar {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  background: var(--as-surface);
  display: flex;
  justify-content: center;
  align-items: center;
}

.avatar-text {
  font-size: 40rpx;
  color: var(--as-text-muted);
}

.login-info {
  flex: 1;
}

.login-title {
  display: block;
  font-size: var(--as-font-size-base);
  color: var(--as-text);
  font-weight: 500;
}

.login-subtitle {
  display: block;
  font-size: var(--as-font-size-sm);
  color: var(--as-text-secondary);
  margin-top: 4rpx;
}

.login-btn {
  padding: 16rpx 32rpx;
  background: var(--as-primary);
  border-radius: var(--as-radius-full);

  text {
    font-size: var(--as-font-size-sm);
    color: #fff;
    font-weight: 500;
  }
}

.quick-links {
  padding: var(--as-spacing-lg) 40rpx 0;
}

.links-row {
  display: flex;
  justify-content: space-around;
}

.link-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;

  &:active {
    opacity: 0.7;
  }
}

.link-icon {
  font-size: 40rpx;
}

.link-label {
  font-size: var(--as-font-size-xs);
  color: var(--as-text-muted);
}

.menu-section {
  padding: var(--as-spacing-lg) 40rpx 0;
}

.menu-list {
  display: flex;
  flex-direction: column;
}

.menu-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.menu-left {
  display: flex;
  align-items: center;
}

.menu-icon {
  font-size: var(--as-font-size-lg);
  margin-right: var(--as-spacing-sm);
}

.menu-title {
  font-size: var(--as-font-size-base);
  color: var(--as-text);
}

.menu-arrow {
  font-size: var(--as-font-size-lg);
  color: var(--as-text-secondary);
}

.footer {
  padding: 60rpx 40rpx;
  text-align: center;
}

.footer-text {
  font-size: var(--as-font-size-xs);
  color: var(--as-text-secondary);
}
</style>
