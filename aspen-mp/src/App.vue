<script setup lang="ts">
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app';

// App lifecycle
onLaunch(() => {
  console.log('App Launch - Aspen');
});

onShow(() => {
  console.log('App Show');
});

onHide(() => {
  console.log('App Hide');
});
</script>

<style lang="scss">
@import '@/uni.scss';

/* ==================== Aspen Global Theme Variables ==================== */
page {
  /* Colors */
  --as-primary: #4a9c6d;
  --as-primary-light: #6bbd8a;
  --as-primary-dark: #2d5a3d;
  --as-accent: #d4a853; /* A sophisticated gold accent */
  --as-background: #050505; /* Deep, rich black */
  --as-surface: rgba(255, 255, 255, 0.03);
  --as-surface-glass: rgba(255, 255, 255, 0.06);
  --as-text: #f5f5f5; /* Off-white for less eye strain */
  --as-text-muted: rgba(255, 255, 255, 0.7);
  --as-text-secondary: rgba(255, 255, 255, 0.45);
  --as-border: rgba(255, 255, 255, 0.08);
  --as-border-light: rgba(255, 255, 255, 0.15);
  --as-success: #34d399;
  --as-warning: #fbbf24;
  --as-error: #f87171;
  --as-info: #60a5fa;

  /* Typography */
  --as-font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
  --as-font-size-xs: 22rpx;
  --as-font-size-sm: 26rpx;
  --as-font-size-base: 30rpx;
  --as-font-size-lg: 34rpx;
  --as-font-size-xl: 44rpx;
  --as-font-size-xxl: 60rpx;
  --as-letter-spacing: 2rpx;

  /* Spacing */
  --as-spacing-xs: 12rpx;
  --as-spacing-sm: 24rpx;
  --as-spacing-base: 32rpx;
  --as-spacing-lg: 48rpx;
  --as-spacing-xl: 72rpx;

  /* Border Radius */
  --as-radius-sm: 12rpx;
  --as-radius-base: 24rpx;
  --as-radius-lg: 32rpx;
  --as-radius-xl: 48rpx;
  --as-radius-full: 9999rpx;

  /* Effects */
  --as-blur: 30rpx;
  --as-shadow-sm: 0 4rpx 16rpx rgba(0, 0, 0, 0.4);
  --as-shadow: 0 12rpx 40rpx rgba(0, 0, 0, 0.6);
  --as-shadow-lg: 0 24rpx 60rpx rgba(0, 0, 0, 0.8);
  --as-glass-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.1);

  /* Global Styles */
  background-color: var(--as-background);
  color: var(--as-text);
  font-family: var(--as-font-family);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

view,
text,
image,
button {
  box-sizing: border-box;
}

/* ==================== Theme Variants (for switching) ==================== */
/* Volcano Theme */
.theme-volcano {
  --as-primary: #dc2626;
  --as-primary-light: #ef4444;
  --as-primary-dark: #991b1b;
  --as-accent: #f97316;
}

/* Ocean Theme */
.theme-ocean {
  --as-primary: #0ea5e9;
  --as-primary-light: #38bdf8;
  --as-primary-dark: #0369a1;
  --as-accent: #06b6d4;
}

/* Gold Theme */
.theme-gold {
  --as-primary: #d4a853;
  --as-primary-light: #e8c97a;
  --as-primary-dark: #b8860b;
  --as-accent: #ffd700;
}
</style>

