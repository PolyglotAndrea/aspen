<template>
  <view class="as-theme-provider">
    <slot></slot>
  </view>
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue';
import themeConfig from '../theme.json';

interface Theme {
  colors: Record<string, string>;
  typography: Record<string, string>;
  spacing: Record<string, string>;
  borderRadius: Record<string, string>;
  effects: Record<string, string>;
}

interface Props {
  /** 主题名称 */
  theme?: string;
}

const props = withDefaults(defineProps<Props>(), {
  theme: 'aspen',
});

// Get current theme
const getTheme = (): Theme => {
  const themes = themeConfig.themes as Record<string, Theme>;
  return themes[props.theme] || themes.aspen;
};

// Apply theme to CSS variables
const applyTheme = (theme: Theme) => {
  const root = uni?.getSystemInfoSync?.() ? document : null;
  if (!root) return;

  // Colors
  Object.entries(theme.colors).forEach(([key, value]) => {
    document.documentElement.style.setProperty(`--as-${key}`, value);
  });

  // Typography
  Object.entries(theme.typography).forEach(([key, value]) => {
    document.documentElement.style.setProperty(`--as-font-${key.replace('fontSize', 'size')}`, value);
  });

  // Spacing
  Object.entries(theme.spacing).forEach(([key, value]) => {
    document.documentElement.style.setProperty(`--as-spacing-${key}`, value);
  });

  // Border radius
  Object.entries(theme.borderRadius).forEach(([key, value]) => {
    document.documentElement.style.setProperty(`--as-radius-${key}`, value);
  });

  // Effects
  Object.entries(theme.effects).forEach(([key, value]) => {
    document.documentElement.style.setProperty(`--as-${key}`, value);
  });

  // Also set for小程序
  uni?.setStorageSync('currentTheme', props.theme);
};

// Initialize theme on mount
onMounted(() => {
  applyTheme(getTheme());
});

// Watch theme changes
watch(() => props.theme, (newTheme) => {
  const themes = themeConfig.themes as Record<string, Theme>;
  applyTheme(themes[newTheme] || themes.aspen);
});

// Expose theme switching method
const setTheme = (themeName: string) => {
  const themes = themeConfig.themes as Record<string, Theme>;
  if (themes[themeName]) {
    applyTheme(themes[themeName]);
  }
};

defineExpose({ setTheme, getTheme });
</script>

<style lang="scss">
/* Theme CSS Variables - These will be set dynamically */
.as-theme-provider {
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
}
</style>
