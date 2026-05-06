<template>
  <view class="as-seat-selector">
    <text v-if="label" class="selector-label">{{ label }}</text>
    <scroll-view class="seat-scroll" scroll-x :scroll-into-view="scrollIntoId">
      <view class="seat-list">
        <view
          v-for="seat in seats"
          :key="seat.id"
          class="seat-item"
          :class="{
            'seat-item--active': modelValue === seat.id,
            'seat-item--disabled': seat.available === false
          }"
          :id="'seat-' + seat.id"
          @click="handleSelect(seat)"
        >
          <text class="seat-icon">{{ seat.icon || '🪑' }}</text>
          <text class="seat-name">{{ seat.name }}</text>
          <text v-if="seat.capacity" class="seat-capacity">{{ seat.capacity }}人</text>
          <text v-if="seat.available === false" class="seat-unavailable">已满</text>
        </view>
      </view>
    </scroll-view>

    <!-- 已选提示 -->
    <view v-if="selectedSeat" class="selected-hint">
      <text>已选: {{ selectedSeat.name }}</text>
      <text v-if="selectedSeat.capacity" class="hint-capacity">可容纳 {{ selectedSeat.capacity }} 人</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

interface Seat {
  id: string;
  name: string;
  icon?: string;
  capacity?: number;
  available?: boolean;
}

interface Props {
  modelValue?: string;
  label?: string;
  seats?: Seat[];
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  label: '选择桌位',
  seats: () => [],
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
  change: [seat: Seat];
}>();

const scrollIntoId = ref('');

const selectedSeat = computed(() => {
  return props.seats.find(s => s.id === props.modelValue);
});

const handleSelect = (seat: Seat) => {
  if (seat.available === false) {
    uni.showToast({ title: '该桌位已满', icon: 'none' });
    return;
  }

  emit('update:modelValue', seat.id);
  emit('change', seat);

  // 滚动到选中项
  scrollIntoId.value = 'seat-' + seat.id;
};
</script>

<style lang="scss" scoped>
.as-seat-selector {
  width: 100%;
}

.selector-label {
  display: block;
  font-size: var(--as-font-size-sm);
  color: var(--as-text-muted);
  margin-bottom: var(--as-spacing-sm);
}

.seat-scroll {
  width: 100%;
  white-space: nowrap;
}

.seat-list {
  display: inline-flex;
  gap: var(--as-spacing-sm);
  padding: 4rpx 0;
}

.seat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 140rpx;
  padding: var(--as-spacing-base);
  background: var(--as-surface);
  border: 1px solid var(--as-border);
  border-radius: var(--as-radius-base);
  transition: all 0.2s ease;

  &:active {
    transform: scale(0.98);
  }

  &--active {
    background: rgba(74, 156, 109, 0.15);
    border-color: var(--as-primary);

    .seat-name {
      color: var(--as-primary);
    }
  }

  &--disabled {
    opacity: 0.5;

    .seat-name {
      color: var(--as-text-secondary);
      text-decoration: line-through;
    }
  }
}

.seat-icon {
  font-size: 40rpx;
  margin-bottom: 8rpx;
}

.seat-name {
  font-size: var(--as-font-size-sm);
  color: var(--as-text);
  font-weight: 500;
}

.seat-capacity {
  font-size: var(--as-font-size-xs);
  color: var(--as-text-secondary);
  margin-top: 4rpx;
}

.seat-unavailable {
  font-size: var(--as-font-size-xs);
  color: var(--as-error);
  margin-top: 4rpx;
}

.selected-hint {
  display: flex;
  align-items: center;
  gap: var(--as-spacing-sm);
  margin-top: var(--as-spacing-sm);
  padding: var(--as-spacing-xs) var(--as-spacing-sm);
  background: var(--as-surface);
  border-radius: var(--as-radius-sm);

  text {
    font-size: var(--as-font-size-xs);
    color: var(--as-text-muted);
  }

  .hint-capacity {
    color: var(--as-primary);
  }
}
</style>
