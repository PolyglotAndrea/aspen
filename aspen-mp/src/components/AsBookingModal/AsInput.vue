<template>
  <view class="as-input">
    <text v-if="label" class="as-input__label">{{ label }}</text>
    <view class="as-input__wrapper" :class="{ 'as-input__wrapper--error': error }">
      <input
        class="as-input__field"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :placeholder-style="placeholderStyle"
        :maxlength="maxlength"
        :disabled="disabled"
        @input="handleInput"
        @blur="handleBlur"
      />
    </view>
    <text v-if="error" class="as-input__error">{{ error }}</text>
  </view>
</template>

<script setup lang="ts">
interface Props {
  modelValue?: string | number;
  label?: string;
  placeholder?: string;
  type?: string;
  error?: string;
  maxlength?: number;
  disabled?: boolean;
}

withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: '',
  type: 'text',
  maxlength: -1,
  disabled: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const placeholderStyle = 'color: var(--as-text-secondary)';

const handleInput = (e: any) => {
  emit('update:modelValue', e.detail.value);
};

const handleBlur = () => {
  // Optional: add blur handling
};
</script>

<style lang="scss" scoped>
.as-input {
  &__label {
    display: block;
    font-size: var(--as-font-size-sm);
    color: var(--as-text-muted);
    margin-bottom: var(--as-spacing-xs);
  }

  &__wrapper {
    background: var(--as-surface);
    border: 1px solid var(--as-border);
    border-radius: var(--as-radius-base);
    overflow: hidden;
    transition: border-color 0.2s ease;

    &--error {
      border-color: var(--as-error);
    }
  }

  &__field {
    width: 100%;
    height: 88rpx;
    padding: 0 var(--as-spacing-base);
    font-size: var(--as-font-size-base);
    color: var(--as-text);
    background: transparent;
  }

  &__error {
    display: block;
    font-size: var(--as-font-size-xs);
    color: var(--as-error);
    margin-top: var(--as-spacing-xs);
  }
}
</style>
