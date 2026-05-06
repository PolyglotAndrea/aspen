<template>
  <view class="as-stepper">
    <text v-if="label" class="as-stepper__label">{{ label }}</text>
    <view class="as-stepper__wrapper">
      <view
        class="as-stepper__btn as-stepper__btn--minus"
        :class="{ 'as-stepper__btn--disabled': modelValue <= min }"
        @click="handleMinus"
      >
        <text>-</text>
      </view>
      <view class="as-stepper__value">
        <text>{{ modelValue }}</text>
        <text v-if="unit" class="as-stepper__unit">{{ unit }}</text>
      </view>
      <view
        class="as-stepper__btn as-stepper__btn--plus"
        :class="{ 'as-stepper__btn--disabled': modelValue >= max }"
        @click="handlePlus"
      >
        <text>+</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
interface Props {
  modelValue?: number;
  label?: string;
  min?: number;
  max?: number;
  unit?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: 1,
  min: 1,
  max: 20,
  unit: '',
});

const emit = defineEmits<{
  'update:modelValue': [value: number];
}>();

const handleMinus = () => {
  if (props.modelValue > props.min) {
    emit('update:modelValue', props.modelValue - 1);
  }
};

const handlePlus = () => {
  if (props.modelValue < props.max) {
    emit('update:modelValue', props.modelValue + 1);
  }
};
</script>

<style lang="scss" scoped>
.as-stepper {
  &__label {
    display: block;
    font-size: var(--as-font-size-sm);
    color: var(--as-text-muted);
    margin-bottom: var(--as-spacing-xs);
  }

  &__wrapper {
    display: flex;
    align-items: center;
    background: var(--as-surface);
    border: 1px solid var(--as-border);
    border-radius: var(--as-radius-base);
    overflow: hidden;
  }

  &__btn {
    width: 100rpx;
    height: 88rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 40rpx;
    color: var(--as-text);
    transition: opacity 0.2s ease;

    &:active:not(&--disabled) {
      opacity: 0.6;
    }

    &--disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }
  }

  &__value {
    flex: 1;
    text-align: center;
    font-size: var(--as-font-size-lg);
    color: var(--as-text);
    font-weight: 500;
  }

  &__unit {
    font-size: var(--as-font-size-sm);
    color: var(--as-text-secondary);
    margin-left: 4rpx;
  }
}
</style>
