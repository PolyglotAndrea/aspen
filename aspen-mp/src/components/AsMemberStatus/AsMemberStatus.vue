<template>
  <AsCard
    :bg="backgroundStyle"
    :blur="blur"
    :radius="radius"
    class="as-member-status"
  >
    <!-- 头部: 头像 + 等级 -->
    <view class="member-header">
      <view class="avatar-section">
        <view class="avatar" :style="avatarStyle">
          <text class="avatar-text">{{ displayName }}</text>
        </view>
        <view v-if="levelName" class="level-badge">
          <text>{{ levelName }}</text>
        </view>
      </view>

      <view class="user-info">
        <text class="nickname">{{ nickname || '访客' }}</text>
        <text v-if="memberId" class="member-id">No.{{ memberId }}</text>
      </view>

      <view v-if="showArrow" class="arrow">
        <text>›</text>
      </view>
    </view>

    <!-- 会员权益快捷入口 -->
    <view v-if="showBenefits" class="benefits-row">
      <view
        v-for="benefit in benefits"
        :key="benefit.key"
        class="benefit-item"
        @click="handleBenefitClick(benefit)"
      >
        <text class="benefit-icon">{{ benefit.icon }}</text>
        <text class="benefit-label">{{ benefit.label }}</text>
      </view>
    </view>

    <!-- 积分进度条 -->
    <view v-if="showPoints" class="points-section">
      <view class="points-header">
        <text class="points-label">{{ pointsLabel }}</text>
        <text class="points-value">{{ formatPoints(points) }}</text>
      </view>
      <view class="points-progress">
        <view class="progress-bar">
          <view
            class="progress-fill"
            :style="{ width: progressPercent + '%' }"
          ></view>
        </view>
        <text v-if="nextLevelPoints" class="progress-hint">
          {{ formatPoints(nextLevelPoints - points) }} 升级
        </text>
      </view>
      <view v-if="showNextLevel" class="next-level">
        <text class="next-level-label">下一级:</text>
        <text class="next-level-name">{{ nextLevelName }}</text>
      </view>
    </view>

    <!-- 余额展示 (可选) -->
    <view v-if="showBalance" class="balance-section">
      <view class="balance-item">
        <text class="balance-label">{{ balanceLabel }}</text>
        <text class="balance-value">¥{{ balance }}</text>
      </view>
      <view class="balance-item">
        <text class="balance-label">{{ couponsLabel }}</text>
        <text class="balance-value">{{ coupons }}张</text>
      </view>
    </view>

    <!-- Slot for custom content -->
    <slot></slot>
  </AsCard>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import AsCard from '../AsCard/AsCard.vue';

interface Benefit {
  key: string;
  icon: string;
  label: string;
}

interface Props {
  /** 用户昵称 */
  nickname?: string;
  /** 头像图片 */
  avatar?: string;
  /** 头像背景色 */
  avatarBg?: string;
  /** 会员等级名称 */
  levelName?: string;
  /** 会员ID */
  memberId?: string;
  /** 当前积分 */
  points?: number;
  /** 下一级所需积分 */
  nextLevelPoints?: number;
  /** 下一级名称 */
  nextLevelName?: string;
  /** 当前等级 */
  currentLevel?: number;
  /** 总等级数 */
  totalLevels?: number;
  /** 余额 */
  balance?: number;
  /** 优惠券数量 */
  coupons?: number;
  /** 是否显示箭头 */
  showArrow?: boolean;
  /** 是否显示权益入口 */
  showBenefits?: boolean;
  /** 是否显示积分 */
  showPoints?: boolean;
  /** 是否显示余额 */
  showBalance?: boolean;
  /** 是否显示下一级信息 */
  showNextLevel?: boolean;
  /** 背景样式 */
  backgroundStyle?: string;
  /** 模糊度 */
  blur?: string;
  /** 圆角 */
  radius?: string;
  // Labels
  pointsLabel?: string;
  balanceLabel?: string;
  couponsLabel?: string;
  /** 权益配置 */
  benefits?: Benefit[];
}

const props = withDefaults(defineProps<Props>(), {
  nickname: '',
  avatar: '',
  avatarBg: '',
  levelName: '',
  memberId: '',
  points: 0,
  nextLevelPoints: 0,
  nextLevelName: '',
  currentLevel: 0,
  totalLevels: 4,
  balance: 0,
  coupons: 0,
  showArrow: true,
  showBenefits: true,
  showPoints: true,
  showBalance: false,
  showNextLevel: true,
  backgroundStyle: '',
  blur: '20rpx',
  radius: '24rpx',
  pointsLabel: '我的积分',
  balanceLabel: '余额',
  couponsLabel: '优惠券',
  benefits: () => [
    { key: 'orders', icon: '📅', label: '预约' },
    { key: 'favorites', icon: '❤️', label: '收藏' },
    { key: 'history', icon: '📝', label: '记录' },
    { key: 'settings', icon: '⚙️', label: '设置' },
  ],
});

const emit = defineEmits<{
  click: [key: string];
  benefitClick: [benefit: Benefit];
}>();

// Computed
const displayName = computed(() => {
  if (props.nickname) return props.nickname.charAt(0);
  return '游';
});

const avatarStyle = computed(() => {
  if (props.avatar) {
    return { backgroundImage: `url(${props.avatar})`, backgroundSize: 'cover' };
  }
  if (props.avatarBg) {
    return { background: props.avatarBg };
  }
  return { background: 'linear-gradient(135deg, var(--as-primary) 0%, var(--as-primary-dark) 100%)' };
});

const progressPercent = computed(() => {
  if (!props.nextLevelPoints || props.nextLevelPoints <= 0) return 0;
  const percent = (props.points / props.nextLevelPoints) * 100;
  return Math.min(100, Math.max(0, percent));
});

// Methods
const formatPoints = (value: number) => {
  if (value >= 10000) {
    return (value / 10000).toFixed(1) + 'w';
  }
  return value.toString();
};

const handleBenefitClick = (benefit: Benefit) => {
  emit('benefitClick', benefit);
  emit('click', benefit.key);
};
</script>

<style lang="scss" scoped>
.as-member-status {
  // Header styles
  .member-header {
    display: flex;
    align-items: center;
    gap: var(--as-spacing-base);
  }

  .avatar-section {
    position: relative;
  }

  .avatar {
    width: 100rpx;
    height: 100rpx;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .avatar-text {
    font-size: 40rpx;
    color: #fff;
    font-weight: 600;
  }

  .level-badge {
    position: absolute;
    bottom: -8rpx;
    left: 50%;
    transform: translateX(-50%);
    padding: 4rpx 12rpx;
    background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
    border-radius: var(--as-radius-full);
    font-size: 18rpx;
    color: #000;
    font-weight: 600;
    white-space: nowrap;
  }

  .user-info {
    flex: 1;
  }

  .nickname {
    display: block;
    font-size: var(--as-font-size-lg);
    font-weight: 600;
    color: var(--as-text);
  }

  .member-id {
    display: block;
    font-size: var(--as-font-size-xs);
    color: var(--as-text-secondary);
    margin-top: 4rpx;
    font-family: monospace;
  }

  .arrow {
    font-size: 40rpx;
    color: var(--as-text-secondary);
  }

  // Benefits row
  .benefits-row {
    display: flex;
    justify-content: space-around;
    margin-top: var(--as-spacing-lg);
    padding-top: var(--as-spacing-base);
    border-top: 1px solid var(--as-border);
  }

  .benefit-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8rpx;

    &:active {
      opacity: 0.7;
    }
  }

  .benefit-icon {
    font-size: 36rpx;
  }

  .benefit-label {
    font-size: var(--as-font-size-xs);
    color: var(--as-text-muted);
  }

  // Points section
  .points-section {
    margin-top: var(--as-spacing-base);
  }

  .points-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--as-spacing-xs);
  }

  .points-label {
    font-size: var(--as-font-size-sm);
    color: var(--as-text-secondary);
  }

  .points-value {
    font-size: var(--as-font-size-lg);
    font-weight: 600;
    color: var(--as-primary);
  }

  .points-progress {
    position: relative;
  }

  .progress-bar {
    height: 8rpx;
    background: var(--as-surface);
    border-radius: 4rpx;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--as-primary) 0%, var(--as-primary-light) 100%);
    border-radius: 4rpx;
    transition: width 0.3s ease;
  }

  .progress-hint {
    display: block;
    font-size: var(--as-font-size-xs);
    color: var(--as-text-secondary);
    margin-top: 8rpx;
    text-align: right;
  }

  .next-level {
    display: flex;
    align-items: center;
    gap: var(--as-spacing-xs);
    margin-top: var(--as-spacing-xs);
  }

  .next-level-label {
    font-size: var(--as-font-size-xs);
    color: var(--as-text-secondary);
  }

  .next-level-name {
    font-size: var(--as-font-size-xs);
    color: var(--as-primary);
    font-weight: 500;
  }

  // Balance section
  .balance-section {
    display: flex;
    gap: var(--as-spacing-xl);
    margin-top: var(--as-spacing-base);
    padding-top: var(--as-spacing-base);
    border-top: 1px solid var(--as-border);
  }

  .balance-item {
    flex: 1;
  }

  .balance-label {
    display: block;
    font-size: var(--as-font-size-xs);
    color: var(--as-text-secondary);
    margin-bottom: 4rpx;
  }

  .balance-value {
    display: block;
    font-size: var(--as-font-size-lg);
    font-weight: 600;
    color: var(--as-text);
  }
}
</style>
