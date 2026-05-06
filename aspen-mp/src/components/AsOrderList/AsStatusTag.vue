<template>
  <view class="as-status-tag" :style="tagStyle">
    <text class="as-status-tag__text">{{ displayLabel }}</text>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  /** 状态值 */
  status: string;
  /** 自定义配置 */
  config?: Record<string, { label: string; color: string; bg: string }>;
}

const props = withDefaults(defineProps<Props>(), {
  config: () => ({}),
});

// 默认配置
const defaultConfig: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: '待确认', color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.2)' },
  confirmed: { label: '已确认', color: '#4ade80', bg: 'rgba(74, 222, 128, 0.2)' },
  cancelled: { label: '已取消', color: '#f87171', bg: 'rgba(248, 113, 113, 0.2)' },
  completed: { label: '已完成', color: '#60a5fa', bg: 'rgba(96, 165, 250, 0.2)' },
  success: { label: '成功', color: '#4ade80', bg: 'rgba(74, 222, 128, 0.2)' },
  processing: { label: '处理中', color: '#60a5fa', bg: 'rgba(96, 165, 250, 0.2)' },
};

const mergedConfig = computed(() => {
  return { ...defaultConfig, ...props.config };
});

const currentConfig = computed(() => {
  return mergedConfig.value[props.status] || {
    label: props.status,
    color: 'var(--as-text-muted)',
    bg: 'var(--as-surface-glass)',
  };
});

const displayLabel = computed(() => currentConfig.value.label);

const tagStyle = computed(() => ({
  color: currentConfig.value.color,
  backgroundColor: currentConfig.value.bg,
}));
</script>

<style lang="scss" scoped>
.as-status-tag {
  display: inline-flex;
  align-items: center;
  padding: 6rpx 16rpx;
  border-radius: var(--as-radius-full);
  font-size: var(--as-font-size-xs);
  font-weight: 500;

  &__text {
    line-height: 1.2;
  }
}
</style>
