<template>
  <view class="as-date-picker">
    <text v-if="label" class="as-date-picker__label">{{ label }}</text>
    <picker
      mode="date"
      :start="start"
      :end="end"
      :value="modelValue"
      @change="handleChange"
    >
      <view class="as-date-picker__wrapper" :class="{ 'as-date-picker__wrapper--empty': !modelValue }">
        <text :class="{ 'placeholder': !modelValue }">
          {{ modelValue || placeholder }}
        </text>
        <text class="as-date-picker__icon">📅</text>
      </view>
    </picker>
    <text v-if="error" class="as-date-picker__error">{{ error }}</text>
  </view>
</template>

<script setup lang="ts">
interface Props {
  modelValue?: string;
  label?: string;
  placeholder?: string;
  start?: string;
  end?: string;
  error?: string;
}

withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: '请选择日期',
  start: '',
  end: '2099-12-31',
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const handleChange = (e: any) => {
  emit('update:modelValue', e.detail.value);
};
</script>

<style lang="scss" scoped>
.as-date-picker {
  &__label {
    display: block;
    font-size: var(--as-font-size-sm);
    color: var(--as-text-muted);
    margin-bottom: var(--as-spacing-xs);
  }

  &__wrapper {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 88rpx;
    padding: 0 var(--as-spacing-base);
    background: var(--as-surface);
    border: 1px solid var(--as-border);
    border-radius: var(--as-radius-base);
    font-size: var(--as-font-size-base);
    color: var(--as-text);

    .placeholder {
      color: var(--as-text-secondary);
    }
  }

  &__icon {
    font-size: 32rpx;
  }

  &__error {
    display: block;
    font-size: var(--as-font-size-xs);
    color: var(--as-error);
    margin-top: var(--as-spacing-xs);
  }
}
</style>
