<template>
  <view class="as-time-picker">
    <text v-if="label" class="as-time-picker__label">{{ label }}</text>
    <view class="as-time-picker__grid">
      <view
        v-for="slot in slots"
        :key="slot"
        class="as-time-picker__slot"
        :class="{ 'as-time-picker__slot--active': modelValue === slot }"
        @click="handleSelect(slot)"
      >
        <text>{{ slot }}</text>
      </view>
    </view>
    <text v-if="error" class="as-time-picker__error">{{ error }}</text>
  </view>
</template>

<script setup lang="ts">
interface Props {
  modelValue?: string;
  label?: string;
  slots?: string[];
  error?: string;
}

withDefaults(defineProps<Props>(), {
  modelValue: '',
  slots: () => ['11:30', '12:00', '12:30', '13:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'],
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const handleSelect = (slot: string) => {
  emit('update:modelValue', slot);
};
</script>

<style lang="scss" scoped>
.as-time-picker {
  &__label {
    display: block;
    font-size: var(--as-font-size-sm);
    color: var(--as-text-muted);
    margin-bottom: var(--as-spacing-xs);
  }

  &__grid {
    display: flex;
    flex-wrap: wrap;
    gap: var(--as-spacing-sm);
  }

  &__slot {
    width: calc(25% - var(--as-spacing-sm) * 3 / 4);
    height: 72rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--as-surface);
    border: 1px solid var(--as-border);
    border-radius: var(--as-radius-sm);
    font-size: var(--as-font-size-sm);
    color: var(--as-text-muted);
    transition: all 0.2s ease;

    &:active {
      opacity: 0.7;
    }

    &--active {
      background: rgba(74, 156, 109, 0.15);
      border-color: var(--as-primary);
      color: var(--as-primary);
    }
  }

  &__error {
    display: block;
    font-size: var(--as-font-size-xs);
    color: var(--as-error);
    margin-top: var(--as-spacing-xs);
  }
}
</style>
