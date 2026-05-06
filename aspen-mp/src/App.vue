<script setup lang="ts">
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
  --as-accent: #4a9c6d;
  --as-background: #000000;
  --as-surface: rgba(255, 255, 255, 0.05);
  --as-surface-glass: rgba(255, 255, 255, 0.08);
  --as-text: #ffffff;
  --as-text-muted: rgba(255, 255, 255, 0.6);
  --as-text-secondary: rgba(255, 255, 255, 0.4);
  --as-border: rgba(255, 255, 255, 0.1);
  --as-success: #4ade80;
  --as-warning: #fbbf24;
  --as-error: #f87171;
  --as-info: #60a5fa;

  /* Typography */
  --as-font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --as-font-size-xs: 20rpx;
  --as-font-size-sm: 24rpx;
  --as-font-size-base: 28rpx;
  --as-font-size-lg: 32rpx;
  --as-font-size-xl: 40rpx;
  --as-font-size-xxl: 52rpx;
  --as-letter-spacing: 2rpx;

  /* Spacing */
  --as-spacing-xs: 10rpx;
  --as-spacing-sm: 20rpx;
  --as-spacing-base: 30rpx;
  --as-spacing-lg: 40rpx;
  --as-spacing-xl: 60rpx;

  /* Border Radius */
  --as-radius-sm: 8rpx;
  --as-radius-base: 16rpx;
  --as-radius-lg: 24rpx;
  --as-radius-full: 9999rpx;

  /* Effects */
  --as-blur: 20rpx;
  --as-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.3);

  /* Global Styles */
  background-color: var(--as-background);
  color: var(--as-text);
  font-family: var(--as-font-family);
}

view,
text {
  box-sizing: border-box;
}

/* ==================== Theme Variants (for switching) ==================== */
/* Volcano Theme */
.theme-volcano {
  --as-primary: #dc2626;
  --as-primary-light: #ef4444;
  --as-primary-dark: #991b1b;
  --as-accent: #f97316;
  --as-background: #0a0a0a;
  --as-surface: rgba(255, 255, 255, 0.05);
  --as-surface-glass: rgba(255, 255, 255, 0.08);
  --as-text: #ffffff;
  --as-text-muted: rgba(255, 255, 255, 0.6);
  --as-text-secondary: rgba(255, 255, 255, 0.4);
  --as-border: rgba(255, 255, 255, 0.1);
  --as-success: #4ade80;
  --as-warning: #fbbf24;
  --as-error: #f87171;
  --as-info: #60a5fa;
  --as-shadow: 0 8rpx 32rpx rgba(220, 38, 38, 0.2);
}

/* Ocean Theme */
.theme-ocean {
  --as-primary: #0ea5e9;
  --as-primary-light: #38bdf8;
  --as-primary-dark: #0369a1;
  --as-accent: #06b6d4;
  --as-background: #0c1929;
  --as-surface: rgba(255, 255, 255, 0.05);
  --as-surface-glass: rgba(255, 255, 255, 0.08);
  --as-text: #ffffff;
  --as-text-muted: rgba(255, 255, 255, 0.6);
  --as-text-secondary: rgba(255, 255, 255, 0.4);
  --as-border: rgba(255, 255, 255, 0.1);
  --as-success: #4ade80;
  --as-warning: #fbbf24;
  --as-error: #f87171;
  --as-info: #60a5fa;
  --as-shadow: 0 8rpx 32rpx rgba(14, 165, 233, 0.2);
}

/* Gold Theme */
.theme-gold {
  --as-primary: #d4a853;
  --as-primary-light: #e8c97a;
  --as-primary-dark: #b8860b;
  --as-accent: #ffd700;
  --as-background: #0d0b06;
  --as-surface: rgba(255, 255, 255, 0.05);
  --as-surface-glass: rgba(255, 255, 255, 0.08);
  --as-text: #ffffff;
  --as-text-muted: rgba(255, 255, 255, 0.6);
  --as-text-secondary: rgba(255, 255, 255, 0.4);
  --as-border: rgba(255, 255, 255, 0.1);
  --as-success: #4ade80;
  --as-warning: #fbbf24;
  --as-error: #f87171;
  --as-info: #60a5fa;
  --as-shadow: 0 8rpx 32rpx rgba(212, 168, 83, 0.2);
}
</style>
