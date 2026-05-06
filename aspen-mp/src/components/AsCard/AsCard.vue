<template>
  <view
    class="as-card"
    :class="{ 'as-card--clickable': clickable }"
    :style="cardStyle"
    @click="handleClick"
  >
    <!-- Header Slot -->
    <view v-if="$slots.header" class="as-card__header">
      <slot name="header"></slot>
    </view>

    <!-- Default Body Slot -->
    <view class="as-card__body" :class="{ 'as-card__body--no-padding': noPadding }">
      <slot></slot>
    </view>

    <!-- Footer Slot -->
    <view v-if="$slots.footer" class="as-card__footer">
      <slot name="footer"></slot>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  /** 背景透明度 (0-1) */
  opacity?: number;
  /** 模糊度 */
  blur?: string;
  /** 背景色 (覆盖默认) */
  bg?: string;
  /** 圆角 */
  radius?: string;
  /** 边框 */
  border?: string;
  /** 内边距 */
  padding?: string;
  /** 外边距 */
  margin?: string;
  /** 是否无内边距 */
  noPadding?: boolean;
  /** 是否可点击 */
  clickable?: boolean;
  /** 自定义样式对象 */
  customStyle?: Record<string, string>;
}

const props = withDefaults(defineProps<Props>(), {
  opacity: 0.08,
  blur: '20rpx',
  bg: '',
  radius: '24rpx',
  border: '1px solid var(--as-border)',
  padding: '30rpx',
  margin: '',
  noPadding: false,
  clickable: false,
  customStyle: () => ({}),
});

const emit = defineEmits<{
  click: [event: any];
}>();

const cardStyle = computed(() => {
  const baseStyle: Record<string, string> = {
    borderRadius: props.radius,
    border: props.border,
    padding: props.padding,
    margin: props.margin,
    ...props.customStyle,
  };

  // 背景处理
  if (props.bg) {
    baseStyle.backgroundColor = props.bg;
  } else {
    baseStyle.backgroundColor = `rgba(255, 255, 255, ${props.opacity})`;
  }

  // 模糊效果
  if (props.blur) {
    baseStyle.backdropFilter = `blur(${props.blur})`;
    baseStyle.webkitBackdropFilter = `blur(${props.blur})`;
  }

  return baseStyle;
});

const handleClick = (e: any) => {
  if (props.clickable) {
    emit('click', e);
  }
};
</script>

<style lang="scss" scoped>
.as-card {
  position: relative;
  background: var(--as-surface);
  border: var(--as-border);
  border-radius: var(--as-radius-lg);
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &--clickable {
    cursor: pointer;

    &:active {
      transform: scale(0.98);
    }
  }

  &__header {
    padding-bottom: var(--as-spacing-sm);
    margin-bottom: var(--as-spacing-sm);
    border-bottom: 1px solid var(--as-border);
  }

  &__body {
    padding: 0;

    &--no-padding {
      padding: 0;
    }
  }

  &__footer {
    margin-top: var(--as-spacing-sm);
    padding-top: var(--as-spacing-sm);
    border-top: 1px solid var(--as-border);
  }
}
</style>
