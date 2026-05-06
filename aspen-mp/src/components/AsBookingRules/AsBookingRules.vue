<template>
  <view class="as-booking-rules">
    <view class="rules-header">
      <text class="rules-title">{{ title }}</text>
    </view>
    <view class="rules-list">
      <view v-for="(rule, index) in rules" :key="index" class="rule-item">
        <text class="rule-dot">·</text>
        <text class="rule-text">{{ rule }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
interface Props {
  /** 标题 */
  title?: string;
  /** 规则列表 */
  rules: string[];
}

withDefaults(defineProps<Props>(), {
  title: '预约须知',
  rules: () => [],
});
</script>

<style lang="scss" scoped>
.as-booking-rules {
  padding: var(--as-spacing-base);
}

.rules-header {
  margin-bottom: var(--as-spacing-sm);
}

.rules-title {
  font-size: var(--as-font-size-sm);
  color: var(--as-text-muted);
  font-weight: 500;
}

.rules-list {
  display: flex;
  flex-direction: column;
  gap: var(--as-spacing-xs);
}

.rule-item {
  display: flex;
  align-items: flex-start;
  gap: var(--as-spacing-xs);
}

.rule-dot {
  color: var(--as-primary);
  font-weight: bold;
  line-height: 1.5;
}

.rule-text {
  font-size: var(--as-font-size-sm);
  color: var(--as-text-secondary);
  line-height: 1.5;
}
</style>
