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
  padding: 160rpx 40rpx 40rpx;
  text-align: center;
  animation: fadeInDown 1s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.header-title {
  display: block;
  font-size: 60rpx;
  font-weight: 200;
  color: var(--as-text);
  letter-spacing: 12rpx;
  margin-right: -12rpx;
}

.header-subtitle {
  display: block;
  margin-top: 16rpx;
  font-size: 24rpx;
  color: var(--as-accent);
  letter-spacing: 8rpx;
  font-weight: 300;
}

.member-section {
  padding: 0 40rpx;
  animation: fadeIn 1.2s ease 0.2s both;
}

.login-prompt {
  display: flex;
  align-items: center;
  gap: var(--as-spacing-lg);
}

.login-avatar {
  width: 110rpx;
  height: 110rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.02) 100%);
  border: 1px solid var(--as-border-light);
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 8rpx 20rpx rgba(0,0,0,0.4);
}

.avatar-text {
  font-size: 44rpx;
  color: var(--as-text-muted);
  font-weight: 300;
}

.login-info {
  flex: 1;
}

.login-title {
  display: block;
  font-size: var(--as-font-size-lg);
  color: var(--as-text);
  font-weight: 400;
  letter-spacing: 2rpx;
}

.login-subtitle {
  display: block;
  font-size: var(--as-font-size-sm);
  color: var(--as-text-muted);
  margin-top: 8rpx;
  font-weight: 300;
}

.login-btn {
  padding: 16rpx 40rpx;
  background: linear-gradient(135deg, var(--as-accent) 0%, #b8860b 100%);
  border-radius: var(--as-radius-full);
  box-shadow: 0 4rpx 16rpx rgba(212, 168, 83, 0.4);
  transition: transform 0.2s;

  &:active {
    transform: scale(0.95);
  }

  text {
    font-size: var(--as-font-size-sm);
    color: #000;
    font-weight: 500;
    letter-spacing: 2rpx;
  }
}

.quick-links {
  padding: var(--as-spacing-xl) 40rpx 0;
  animation: fadeIn 1.2s ease 0.3s both;
}

.links-row {
  display: flex;
  justify-content: space-around;
  padding: 10rpx 0;
}

.link-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
  transition: transform 0.3s;

  &:active {
    transform: scale(0.9);
    opacity: 0.8;
  }
}

.link-icon {
  font-size: 44rpx;
  filter: drop-shadow(0 2rpx 4rpx rgba(0,0,0,0.3));
}

.link-label {
  font-size: var(--as-font-size-xs);
  color: var(--as-text-muted);
  font-weight: 300;
  letter-spacing: 2rpx;
}

.menu-section {
  padding: var(--as-spacing-xl) 40rpx 0;
  animation: fadeIn 1.2s ease 0.4s both;
}

.menu-list {
  display: flex;
  flex-direction: column;
  border-radius: var(--as-radius-lg);
  overflow: hidden;
  border: 1px solid var(--as-border-light);
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
  font-size: 36rpx;
  margin-right: var(--as-spacing-base);
}

.menu-title {
  font-size: var(--as-font-size-base);
  color: var(--as-text);
  font-weight: 400;
  letter-spacing: 2rpx;
}

.menu-arrow {
  font-size: 40rpx;
  color: var(--as-text-secondary);
  font-weight: 200;
}

.footer {
  padding: 80rpx 40rpx;
  text-align: center;
  animation: fadeIn 1.5s ease 0.6s both;
}

.footer-text {
  font-size: 20rpx;
  color: var(--as-text-secondary);
  letter-spacing: 6rpx;
  font-weight: 300;
}

/* Animations */
@keyframes fadeInDown {
  from { opacity: 0; transform: translateY(-30rpx); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
