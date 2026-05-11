<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { menuApi } from '@/utils/api';
import { useTenantStore } from '@/stores/tenant';

interface MenuItem {
  id: number;
  categoryId?: string;
  name: string;
  subtitle?: string;
  description?: string;
  price: number;
  originalPrice?: number;
  tags: string[];
  imageUrl?: string;
  images: string[];
  available: boolean;
  isRecommend: boolean;
  isNew: boolean;
  isHot: boolean;
  soldCount: number;
  rating: number;
}

interface MenuCategory {
  id: string;
  name: string;
  icon?: string;
  image?: string;
  count: number;
}

interface MenuResponse {
  total: number;
  items: MenuItem[];
}

interface CategoryResponse {
  categories: MenuCategory[];
}

const menuItems = ref<MenuItem[]>([]);
const categories = ref<MenuCategory[]>([]);
const isLoading = ref(true);
const activeCategory = ref('all');
const keyword = ref('');
const tenantStore = useTenantStore();

const fullCategories = computed(() => [
  { id: 'all', name: '全部', icon: '🍽️', count: menuItems.value.length },
  ...categories.value,
]);

const filteredMenu = computed(() => {
  let items = menuItems.value;
  if (activeCategory.value !== 'all') {
    items = items.filter(item => item.categoryId === activeCategory.value);
  }
  if (keyword.value) {
    items = items.filter(item =>
      item.name.includes(keyword.value) ||
      (item.subtitle && item.subtitle.includes(keyword.value))
    );
  }
  return items;
});

const formatPrice = (price: number) => {
  return `¥${price.toFixed(2)}`;
};

const loadMenu = async () => {
  try {
    isLoading.value = true;
    const [menuRes, catRes] = await Promise.all([
      menuApi.list() as Promise<MenuResponse>,
      menuApi.categories() as Promise<CategoryResponse>,
    ]);
    menuItems.value = menuRes.items || [];
    categories.value = catRes.categories || [];
  } catch (e) {
    console.error('Failed to fetch menu:', e);
    menuItems.value = [];
    categories.value = [];
  } finally {
    isLoading.value = false;
  }
};

const handleAddToCart = (item: MenuItem) => {
  (uni as any).showToast({ title: `已加入: ${item.name}`, icon: 'none' });
};

const showCartToast = () => {
  (uni as any).showToast({ title: '打开购物车', icon: 'none' });
};

onMounted(loadMenu);
</script>

<template>
  <view class="aspen-menu">
    <!-- Header -->
    <view class="menu-header">
      <text class="header-title">菜单</text>
      <text class="header-subtitle">{{ tenantStore.brandName }}</text>
    </view>

    <!-- Search -->
    <view class="search-bar">
      <input
        v-model="keyword"
        placeholder="搜索菜品..."
        class="search-input"
      />
    </view>

    <!-- Category Tabs -->
    <scroll-view class="category-tabs" scroll-x>
      <view
        v-for="cat in fullCategories"
        :key="cat.id"
        class="tab-item"
        :class="{ active: activeCategory === cat.id }"
        @tap="activeCategory = cat.id"
      >
        <text class="tab-label">{{ cat.name }}</text>
        <text v-if="cat.count > 0" class="tab-count">{{ cat.count }}</text>
      </view>
    </scroll-view>

    <!-- Menu List -->
    <scroll-view class="menu-list" scroll-y @scrolltolower="loadMenu">
      <view v-if="isLoading" class="loading">
        <text>加载中...</text>
      </view>

      <view v-else-if="filteredMenu.length === 0" class="empty">
        <text>暂无菜品</text>
      </view>

      <view v-else class="menu-items">
        <!-- 推荐标签 -->
        <view v-if="filteredMenu.some(i => i.isRecommend)" class="section-label">
          <text class="section-icon">⭐</text>
          <text>主厨推荐</text>
        </view>

        <AsCard
          v-for="item in filteredMenu"
          :key="item.id"
          :opacity="0.03"
          :radius="'16rpx'"
          :padding="'24rpx'"
          :clickable="true"
          :class="{ 'menu-item--unavailable': !item.available }"
          @click="handleAddToCart(item)"
        >
          <template #header>
            <view class="item-header">
              <!-- 标签 -->
              <view class="item-tags">
                <span v-if="item.isNew" class="tag tag-new">NEW</span>
                <span v-if="item.isHot" class="tag tag-hot">HOT</span>
                <span v-if="item.isRecommend" class="tag tag-recommend">推荐</span>
                <span v-for="tag in item.tags" :key="tag" class="tag tag-custom">{{ tag }}</span>
              </view>
              <!-- 名称与描述 -->
              <view class="item-info">
                <text class="item-name">{{ item.name }}</text>
                <text v-if="item.subtitle" class="item-subtitle">{{ item.subtitle }}</text>
                <text v-if="item.description" class="item-desc">{{ item.description }}</text>
              </view>
            </view>
          </template>

          <!-- 图片 -->
          <template #body>
            <view v-if="item.images && item.images.length > 0" class="item-images">
              <image
                v-for="(img, idx) in item.images.slice(0, 3)"
                :key="idx"
                :src="img"
                class="item-image"
                mode="aspectFill"
              />
            </view>
          </template>

          <!-- 价格与评分 -->
          <template #footer>
            <view class="item-footer">
              <view class="price-section">
                <text class="price-current">{{ formatPrice(item.price) }}</text>
                <text v-if="item.originalPrice" class="price-original">¥{{ item.originalPrice.toFixed(2) }}</text>
                <text v-if="item.soldCount" class="sold-count">已售{{ item.soldCount }}</text>
              </view>
              <view v-if="item.rating > 0" class="rating-section">
                <text class="rating-stars">⭐ {{ item.rating.toFixed(1) }}</text>
              </view>
            </view>
          </template>
        </AsCard>
      </view>
    </scroll-view>

    <!-- Add to Cart FAB -->
    <view v-if="filteredMenu.length > 0" class="fab-cart" @click="showCartToast">
      <text class="fab-icon">🛒</text>
      <text class="fab-text">购物车</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.aspen-menu {
  min-height: 100vh;
  background: var(--as-background, #f5f5f5);
}

.menu-header {
  padding: 30rpx;
  text-align: center;

  .header-title {
    font-size: 40rpx;
    font-weight: bold;
    color: var(--as-text-primary, #333);
  }

  .header-subtitle {
    font-size: 24rpx;
    color: var(--as-text-secondary, #999);
    margin-top: 8rpx;
  }
}

.search-bar {
  padding: 0 30rpx 20rpx;

  .search-input {
    background: #fff;
    border-radius: 40rpx;
    padding: 20rpx 30rpx;
    font-size: 28rpx;
    color: #999;
  }
}

.category-tabs {
  display: flex;
  padding: 0 20rpx;
  background: #fff;
  white-space: nowrap;
  border-bottom: 1rpx solid #eee;

  .tab-item {
    display: inline-flex;
    align-items: center;
    padding: 20rpx 28rpx;
    position: relative;
    flex-shrink: 0;

    &.active {
      color: var(--as-primary, #333);
      font-weight: bold;

      &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 40rpx;
        height: 6rpx;
        background: var(--as-primary, #333);
        border-radius: 3rpx;
      }
    }
  }

  .tab-label {
    font-size: 28rpx;
    margin-right: 8rpx;
  }

  .tab-count {
    font-size: 20rpx;
    color: #999;
    background: #f0f0f0;
    border-radius: 20rpx;
    padding: 2rpx 12rpx;
  }
}

.section-label {
  display: flex;
  align-items: center;
  gap: 10rpx;
  padding: 20rpx 30rpx 10rpx;
  font-size: 30rpx;
  font-weight: bold;
  color: var(--as-text-primary, #333);

  .section-icon {
    font-size: 32rpx;
  }
}

.menu-items {
  padding: 20rpx 30rpx;
}

.menu-item--unavailable {
  opacity: 0.5;
}

.item-header {
  flex: 1;
  min-width: 0;
}

.item-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
  margin-bottom: 8rpx;

  .tag {
    font-size: 20rpx;
    padding: 2rpx 10rpx;
    border-radius: 6rpx;
    line-height: 1.4;
  }

  .tag-new {
    background: #ff6b6b;
    color: #fff;
  }

  .tag-hot {
    background: #ff4757;
    color: #fff;
  }

  .tag-recommend {
    background: #ffa502;
    color: #fff;
  }

  .tag-custom {
    background: #e8f5e9;
    color: #2e7d32;
  }
}

.item-info {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.item-name {
  font-size: 30rpx;
  font-weight: bold;
  color: var(--as-text-primary, #333);
}

.item-subtitle {
  font-size: 24rpx;
  color: var(--as-text-secondary, #999);
}

.item-desc {
  font-size: 22rpx;
  color: #999;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.item-images {
  display: flex;
  gap: 12rpx;
  margin-top: 16rpx;

  .item-image {
    width: 160rpx;
    height: 160rpx;
    border-radius: 12rpx;
    object-fit: cover;
  }
}

.item-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid #f0f0f0;
}

.price-section {
  display: flex;
  align-items: baseline;
  gap: 12rpx;

  .price-current {
    font-size: 32rpx;
    font-weight: bold;
    color: var(--as-primary, #e74c3c);
  }

  .price-original {
    font-size: 22rpx;
    color: #999;
    text-decoration: line-through;
  }

  .sold-count {
    font-size: 20rpx;
    color: #999;
  }
}

.rating-section {
  .rating-stars {
    font-size: 24rpx;
    color: #ffa502;
  }
}

.fab-cart {
  position: fixed;
  bottom: 40rpx;
  right: 40rpx;
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  background: var(--as-primary, #333);
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.3);

  .fab-icon {
    font-size: 40rpx;
    line-height: 1;
  }

  .fab-text {
    font-size: 20rpx;
    margin-top: 4rpx;
  }
}
</style>