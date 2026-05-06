<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { menuApi } from '@/utils/api';

interface MenuItem {
  id: number;
  name: string;
  price: number;
  description?: string;
  tags: string[];
  available: boolean;
}

const menuItems = ref<MenuItem[]>([]);
const isLoading = ref(true);
const activeCategory = ref('all');

const categories = [
  { key: 'all', label: '全部' },
  { key: '招牌', label: '招牌' },
  { key: '主菜', label: '主菜' },
  { key: '清爽', label: '饮品' },
  { key: '汤品', label: '汤品' },
];

onMounted(async () => {
  try {
    menuItems.value = await menuApi.list();
  } catch (e) {
    console.error('Failed to fetch menu:', e);
    menuItems.value = [];
  } finally {
    isLoading.value = false;
  }
});

const filteredMenu = () => {
  if (activeCategory.value === 'all') {
    return menuItems.value;
  }
  return menuItems.value.filter(item => item.tags.includes(activeCategory.value));
};

const setCategory = (key: string) => {
  activeCategory.value = key;
};

const formatPrice = (price: number) => {
  return `¥${price}`;
};

const handleAddToCart = (item: MenuItem) => {
  uni.showToast({ title: `已加入: ${item.name}`, icon: 'none' });
};
</script>

<template>
  <view class="aspen-menu">
    <!-- Header -->
    <view class="menu-header">
      <text class="header-title">菜单</text>
      <text class="header-subtitle">MENU</text>
    </view>

    <!-- Category Tabs -->
    <view class="category-tabs">
      <view
        v-for="cat in categories"
        :key="cat.key"
        class="tab-item"
        :class="{ active: activeCategory === cat.key }"
        @tap="setCategory(cat.key)"
      >
        <text>{{ cat.label }}</text>
      </view>
    </view>

    <!-- Menu List -->
    <scroll-view class="menu-list" scroll-y>
      <view v-if="isLoading" class="loading">
        <text>加载中...</text>
      </view>

      <view v-else-if="filteredMenu().length === 0" class="empty">
        <text>暂无菜品</text>
      </view>

      <view v-else class="menu-items">
        <!-- 使用 AsCard 组件重构菜单项 -->
        <AsCard
          v-for="item in filteredMenu()"
          :key="item.id"
          :opacity="0.03"
          :radius="'16rpx'"
          :padding="'30rpx'"
          :clickable="true"
          :class="{ 'menu-item--unavailable': !item.available }"
          @click="handleAddToCart(item)"
        >
          <template #header>
            <view class="item-header">
              <text class="item-name">{{ item.name }}</text>
              <text class="item-price">{{ formatPrice(item.price) }}</text>
            </view>
          </template>

          <text v-if="item.description" class="item-desc">{{ item.description }}</text>

          <template #footer>
            <view class="item-tags">
              <text v-for="tag in item.tags" :key="tag" class="tag">{{ tag }}</text>
            </view>
            <view v-if="!item.available" class="unavailable-tag">
              <text>已售罄</text>
            </view>
          </template>
        </AsCard>
      </view>
    </scroll-view>
  </view>
</template>

<style lang="scss" scoped>
.aspen-menu {
  min-height: 100vh;
  background-color: var(--as-background);
  padding-bottom: 120rpx;
}

.menu-header {
  padding: 180rpx 40rpx 40rpx;
  text-align: center;
}

.header-title {
  display: block;
  font-size: var(--as-font-size-xl);
  font-weight: 300;
  color: var(--as-text);
  letter-spacing: 8rpx;
}

.header-subtitle {
  display: block;
  margin-top: 10rpx;
  font-size: var(--as-font-size-sm);
  color: var(--as-text-secondary);
  letter-spacing: 4rpx;
}

.category-tabs {
  display: flex;
  padding: 0 20rpx;
  gap: 20rpx;
  overflow-x: auto;
  margin-bottom: 30rpx;
}

.tab-item {
  flex-shrink: 0;
  padding: 16rpx 32rpx;
  border-radius: var(--as-radius-full);
  background: var(--as-surface);
  border: 1px solid var(--as-border);

  text {
    font-size: var(--as-font-size-sm);
    color: var(--as-text-muted);
  }

  &.active {
    background: var(--as-surface-glass);
    border-color: var(--as-border);

    text {
      color: var(--as-text);
    }
  }
}

.menu-list {
  height: calc(100vh - 400rpx);
  padding: 0 40rpx;
}

.loading,
.empty {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300rpx;
  color: var(--as-text-secondary);
  font-size: var(--as-font-size-base);
}

.menu-items {
  display: flex;
  flex-direction: column;
  gap: var(--as-spacing-base);
}

.menu-item--unavailable {
  opacity: 0.5;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}

.item-name {
  font-size: var(--as-font-size-lg);
  color: var(--as-text);
  font-weight: 500;
}

.item-price {
  font-size: var(--as-font-size-lg);
  color: var(--as-primary);
  font-weight: 600;
}

.item-desc {
  display: block;
  font-size: var(--as-font-size-sm);
  color: var(--as-text-muted);
  margin-bottom: var(--as-spacing-sm);
  line-height: 1.5;
}

.item-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: var(--as-spacing-xs);
}

.tag {
  font-size: var(--as-font-size-xs);
  color: var(--as-text-secondary);
  padding: 6rpx 16rpx;
  background: var(--as-surface);
  border-radius: var(--as-radius-sm);
}

.unavailable-tag {
  position: absolute;
  top: 30rpx;
  right: 30rpx;
  padding: 8rpx 16rpx;
  background: rgba(255, 100, 100, 0.2);
  border-radius: var(--as-radius-base);

  text {
    font-size: var(--as-font-size-xs);
    color: var(--as-error);
  }
}
</style>
