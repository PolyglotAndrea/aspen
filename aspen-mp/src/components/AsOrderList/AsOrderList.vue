<template>
  <view class="as-order-list">
    <view v-if="loading" class="as-order-list__loading">
      <text>{{ loadingText }}</text>
    </view>

    <view v-else-if="!orders || orders.length === 0" class="as-order-list__empty">
      <text>{{ emptyText }}</text>
    </view>

    <view v-else class="as-order-list__content">
      <AsCard
        v-for="order in orders"
        :key="order.id"
        class="as-order-list__item"
        :clickable="clickable"
        @click="handleOrderClick(order)"
      >
        <template #header>
          <view class="order-header">
            <view class="order-id">
              <text class="label">订单号</text>
              <text class="value">{{ order.id }}</text>
            </view>
            <AsStatusTag :status="order.status" :config="statusConfig" />
          </view>
        </template>

        <view class="order-body">
          <view class="order-info">
            <view class="info-row">
              <text class="info-label">{{ dateLabel }}</text>
              <text class="info-value">{{ order.date }} {{ order.time || '' }}</text>
            </view>
            <view class="info-row">
              <text class="info-label">{{ guestsLabel }}</text>
              <text class="info-value">{{ order.guests }}{{ guestsUnit }}</text>
            </view>
            <view v-if="showPrice" class="info-row">
              <text class="info-label">{{ priceLabel }}</text>
              <text class="info-value price">{{ formatPrice(order.price) }}</text>
            </view>
          </view>
        </view>

        <template #footer>
          <view v-if="showActions" class="order-actions">
            <view
              v-for="action in getActions(order)"
              :key="action.key"
              class="action-btn"
              :class="action.type"
              @click.stop="handleAction(action, order)"
            >
              <text>{{ action.label }}</text>
            </view>
          </view>
        </template>
      </AsCard>
    </view>
  </view>
</template>

<script setup lang="ts">
import AsCard from '../AsCard/AsCard.vue';
import AsStatusTag from './AsStatusTag.vue';

interface Order {
  id: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  date: string;
  time?: string;
  guests: number;
  price?: number;
  [key: string]: any;
}

interface Action {
  key: string;
  label: string;
  type: 'primary' | 'default' | 'danger';
}

interface Props {
  /** 订单列表数据 */
  orders?: Order[];
  /** 是否加载中 */
  loading?: boolean;
  /** 加载文字 */
  loadingText?: string;
  /** 空状态文字 */
  emptyText?: string;
  /** 是否可点击 */
  clickable?: boolean;
  /** 是否显示价格 */
  showPrice?: boolean;
  /** 是否显示操作按钮 */
  showActions?: boolean;
  /** 日期标签 */
  dateLabel?: string;
  /** 人数标签 */
  guestsLabel?: string;
  /** 价格标签 */
  priceLabel?: string;
  /** 人数单位 */
  guestsUnit?: string;
  /** 自定义操作按钮配置 */
  actions?: Action[];
  /** 状态配置 */
  statusConfig?: Record<string, { label: string; color: string; bg: string }>;
}

const props = withDefaults(defineProps<Props>(), {
  orders: () => [],
  loading: false,
  loadingText: '加载中...',
  emptyText: '暂无订单',
  clickable: true,
  showPrice: false,
  showActions: true,
  dateLabel: '预约时间',
  guestsLabel: '用餐人数',
  priceLabel: '订单金额',
  guestsUnit: '人',
  actions: () => [],
  statusConfig: () => ({}),
});

const emit = defineEmits<{
  click: [order: Order];
  action: [action: Action, order: Order];
}>();

// 默认状态配置
const defaultStatusConfig: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: '待确认', color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.2)' },
  confirmed: { label: '已确认', color: '#4ade80', bg: 'rgba(74, 222, 128, 0.2)' },
  cancelled: { label: '已取消', color: '#f87171', bg: 'rgba(248, 113, 113, 0.2)' },
  completed: { label: '已完成', color: '#60a5fa', bg: 'rgba(96, 165, 250, 0.2)' },
};

const mergedStatusConfig = (): Record<string, { label: string; color: string; bg: string }> => {
  return { ...defaultStatusConfig, ...props.statusConfig };
};

const getActions = (order: Order): Action[] => {
  if (props.actions.length > 0) return props.actions;

  // 默认操作按钮
  const defaultActions: Action[] = [];
  if (order.status === 'pending') {
    defaultActions.push({ key: 'cancel', label: '取消预约', type: 'danger' });
  }
  if (order.status === 'confirmed') {
    defaultActions.push({ key: 'detail', label: '查看详情', type: 'default' });
  }
  return defaultActions;
};

const formatPrice = (price?: number) => {
  if (price === undefined || price === null) return '';
  return `¥${price}`;
};

const handleOrderClick = (order: Order) => {
  emit('click', order);
};

const handleAction = (action: Action, order: Order) => {
  emit('action', action, order);
};
</script>

<style lang="scss" scoped>
.as-order-list {
  &__loading,
  &__empty {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 300rpx;
    color: var(--as-text-secondary);
    font-size: var(--as-font-size-base);
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: var(--as-spacing-base);
  }

  &__item {
    margin-bottom: 0;
  }
}

.order {
  &-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &-id {
    .label {
      font-size: var(--as-font-size-xs);
      color: var(--as-text-secondary);
      margin-right: var(--as-spacing-xs);
    }

    .value {
      font-size: var(--as-font-size-sm);
      color: var(--as-text-muted);
      font-family: monospace;
    }
  }

  &-body {
    padding-top: var(--as-spacing-sm);
  }

  &-info {
    display: flex;
    flex-direction: column;
    gap: var(--as-spacing-xs);
  }

  &-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--as-spacing-sm);
  }
}

.info-row {
  display: flex;
  align-items: center;
  gap: var(--as-spacing-sm);

  .info-label {
    font-size: var(--as-font-size-sm);
    color: var(--as-text-secondary);
    min-width: 140rpx;
  }

  .info-value {
    font-size: var(--as-font-size-base);
    color: var(--as-text);

    &.price {
      color: var(--as-primary);
      font-weight: 600;
    }
  }
}

.action-btn {
  padding: var(--as-spacing-xs) var(--as-spacing-base);
  border-radius: var(--as-radius-full);
  font-size: var(--as-font-size-sm);
  transition: opacity 0.2s ease;

  &:active {
    opacity: 0.7;
  }

  &.primary {
    background: var(--as-primary);
    color: #fff;
  }

  &.default {
    background: var(--as-surface-glass);
    color: var(--as-text-muted);
    border: 1px solid var(--as-border);
  }

  &.danger {
    background: rgba(248, 113, 113, 0.15);
    color: #f87171;
  }
}
</style>
