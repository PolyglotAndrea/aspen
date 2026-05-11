/**
 * 外卖模块 (Delivery Module) v2.0
 *
 * 支持外卖菜单(多规格/标签/富文本/销量)、配送配置、购物车
 * 对齐市面主流外卖小程序标准模型
 */

import { Elysia, t } from 'elysia';
import type { DeliveryConfig, DeliveryItem } from '../../config/tenant.types';
import { getTenantConfig } from '../../config/tenant.registry';
import { deliveryRepo } from '../../repositories/product.repo';

// ============================================
// 外卖路由
// ============================================

export const deliveryRoutes = new Elysia({ prefix: '/delivery' })

  // 获取外卖配置
  .get('/config', ({ headers }) => {
    const tenantId = headers['x-tenant-id'] || 'aspen';
    const config = getTenantConfig(tenantId);

    if (!config?.features.delivery) {
      return { enabled: false };
    }

    const { enabled, platforms, areas, timeConfig, minOrderAmount, deliveryFee, packagingFee, codEnabled } = config.delivery;

    return {
      enabled,
      platforms,
      areas: areas?.map(a => ({
        id: a.id,
        name: a.name,
        available: a.available,
        feeRule: a.feeRule,
      })),
      timeConfig,
      minOrderAmount,
      deliveryFee,
      packagingFee,
      codEnabled,
    };
  })

  // 计算配送费
  .post('/calc-fee', ({ body, headers }) => {
    const tenantId = headers['x-tenant-id'] || 'aspen';
    const config = getTenantConfig(tenantId);

    if (!config?.features.delivery) {
      throw new Error('外卖功能未启用');
    }

    const { distance, amount, areaId } = body as any;

    let deliveryFee = config.delivery.deliveryFee || 0;

    // 根据区域计算
    if (areaId && config.delivery.areas) {
      const area = config.delivery.areas.find(a => a.id === areaId);
      if (area?.feeRule) {
        const rule = area.feeRule;
        if (amount >= rule.freeThreshold) {
          deliveryFee = 0;
        } else {
          deliveryFee = rule.baseFee;
          if (distance > 1) {
            deliveryFee += Math.ceil(distance - 1) * rule.perKmFee;
          }
        }
      }
    }

    // 基础配送费模式
    if (!config.delivery.areas || config.delivery.areas.length === 0) {
      if (amount >= ((config.delivery as any).minOrderAmount || 0)) {
        deliveryFee = 0;
      }
    }

    return {
      distance,
      amount,
      deliveryFee,
      total: (amount || 0) + deliveryFee,
    };
  })

  // 获取外卖菜单 (含推荐/热销/新品)
  .get('/menu', async ({ headers, query }) => {
    const tenantId = headers['x-tenant-id'] || 'aspen';
    const config = getTenantConfig(tenantId);

    if (!config?.features.delivery) {
      throw new Error('外卖功能未启用');
    }

    const params: { category?: string; available?: boolean; isRecommend?: boolean; isNew?: boolean } = {};
    if (query.category) params.category = query.category as string;
    if (query.available === 'true') params.available = true;
    if (query.recommend === 'true') params.isRecommend = true;
    if (query.new === 'true') params.isNew = true;

    const menu = await deliveryRepo.findByTenant(tenantId, params);

    // 分类统计
    const categories = [...new Set(menu.map(m => m.category))];

    return {
      categories,
      items: menu.map(item => ({
        id: item.id,
        name: item.name,
        subtitle: item.subtitle,
        description: item.description,
        price: item.price,
        originalPrice: item.originalPrice,
        image: item.image,
        images: item.images,
        category: item.category,
        available: item.available,
        stock: item.stock,
        tags: item.tags,
        specs: item.specs,
        isRecommend: item.isRecommend,
        isNew: item.isNew,
        soldCount: item.soldCount,
        rating: item.rating,
      })),
    };
  })

  // 推荐菜品
  .get('/recommend', async ({ headers }) => {
    const tenantId = headers['x-tenant-id'] || 'aspen';
    const config = getTenantConfig(tenantId);

    if (!config?.features.delivery) {
      throw new Error('外卖功能未启用');
    }

    const menu = await deliveryRepo.findByTenant(tenantId, { isRecommend: true });

    return {
      items: menu.map(item => ({
        id: item.id,
        name: item.name,
        subtitle: item.subtitle,
        price: item.price,
        originalPrice: item.originalPrice,
        image: item.image,
        tags: item.tags,
        soldCount: item.soldCount,
        rating: item.rating,
      })),
    };
  })

  // 获取菜单分类 (带菜品数)
  .get('/categories', async ({ headers }) => {
    const tenantId = headers['x-tenant-id'] || 'aspen';
    const config = getTenantConfig(tenantId);

    if (!config?.features.delivery) {
      throw new Error('外卖功能未启用');
    }

    const categories = await deliveryRepo.getCategories(tenantId);
    const menu = await deliveryRepo.findByTenant(tenantId);

    return {
      categories: categories.map(cat => ({
        name: cat,
        count: menu.filter(m => m.category === cat).length,
      })),
    };
  })

  // 获取商品详情
  .get('/menu/:id', async ({ params: { id }, headers }) => {
    const tenantId = headers['x-tenant-id'] || 'aspen';
    const item = await deliveryRepo.findById(tenantId, id);

    if (!item) {
      throw new Error('商品不存在');
    }

    return {
      id: item.id,
      name: item.name,
      subtitle: item.subtitle,
      description: item.description,
      price: item.price,
      originalPrice: item.originalPrice,
      image: item.image,
      images: item.images,
      category: item.category,
      available: item.available,
      stock: item.stock,
      tags: item.tags,
      specs: item.specs,
      isRecommend: item.isRecommend,
      isNew: item.isNew,
      soldCount: item.soldCount,
      rating: item.rating,
    };
  })

  // 添加菜单项 (管理端)
  .post('/menu', async ({ body, headers }) => {
    const tenantId = headers['x-tenant-id'] || 'aspen';
    const config = getTenantConfig(tenantId);

    if (!config?.features.delivery) {
      throw new Error('外卖功能未启用');
    }

    const { name, subtitle, description, price, originalPrice, image, images, category, stock, tags, specs, isRecommend, isNew } = body as any;

    if (!name || !price || !category) {
      throw new Error('缺少必要参数');
    }

    const newItem = {
      id: `dm_${tenantId}_${Date.now()}`,
      tenantId,
      name,
      subtitle,
      description,
      price,
      originalPrice,
      image,
      images: images || [],
      category,
      available: true,
      stock: stock || 999,
      tags: tags || [],
      specs: specs || [],
      isRecommend: isRecommend || false,
      isNew: isNew || false,
      soldCount: 0,
      rating: 0,
      createdAt: new Date(),
    };

    await deliveryRepo.create(newItem);

    console.log(`[Delivery] Menu item added: ${name}`);

    return {
      success: true,
      item: newItem,
    };
  })

  // 更新菜单项
  .patch('/menu/:id', async ({ params: { id }, body, headers }) => {
    const tenantId = headers['x-tenant-id'] || 'aspen';

    const existing = await deliveryRepo.findById(tenantId, id);
    if (!existing) {
      throw new Error('商品不存在');
    }

    const updates = body as any;
    const allowedFields = ['name', 'subtitle', 'description', 'price', 'originalPrice', 'image', 'images', 'category', 'available', 'stock', 'tags', 'specs', 'isRecommend', 'isNew'];
    const updateData: Record<string, any> = {};

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field];
      }
    }

    await deliveryRepo.update(tenantId, id, updateData);

    const updated = await deliveryRepo.findById(tenantId, id);

    return {
      success: true,
      item: updated,
    };
  })

  // 删除菜单项
  .delete('/menu/:id', async ({ params: { id }, headers }) => {
    const tenantId = headers['x-tenant-id'] || 'aspen';

    const existing = await deliveryRepo.findById(tenantId, id);
    if (!existing) {
      throw new Error('商品不存在');
    }

    await deliveryRepo.delete(tenantId, id);

    return { success: true, message: '商品已删除' };
  })

  // 检查配送时间
  .get('/time-check', ({ headers, query }) => {
    const tenantId = headers['x-tenant-id'] || 'aspen';
    const config = getTenantConfig(tenantId);

    if (!config?.features.delivery) {
      throw new Error('外卖功能未启用');
    }

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const timeConfig = config.delivery.timeConfig;

    let canOrder = true;
    let message = '可以下单';
    let estimatedDeliveryTime = '';

    if (timeConfig) {
      // 检查是否在配送时间范围内
      const { dayStartTime, dayEndTime, breakTime, estimatedMinutes } = timeConfig;

      if (currentTime < dayStartTime || currentTime > dayEndTime) {
        canOrder = false;
        message = `配送时间为 ${dayStartTime} - ${dayEndTime}`;
      }

      // 检查休息时间
      if (breakTime && currentTime >= breakTime.start && currentTime <= breakTime.end) {
        canOrder = false;
        message = `当前为休息时间 (${breakTime.start} - ${breakTime.end})`;
      }

      if (canOrder) {
        estimatedDeliveryTime = `${estimatedMinutes}分钟`;
        if (currentTime < dayEndTime) {
          const [endH, endM] = dayEndTime.split(':').map(Number);
          const remainingMinutes = endH * 60 + endM - now.getHours() * 60 - now.getMinutes();
          if (remainingMinutes < estimatedMinutes) {
            canOrder = false;
            message = `已超过最晚下单时间，还需${estimatedMinutes}分钟送达`;
          }
        }
      }
    }

    return { canOrder, message, estimatedDeliveryTime, currentTime };
  })

  // 销量排行
  .get('/hot', async ({ headers, query }) => {
    const tenantId = headers['x-tenant-id'] || 'aspen';
    const limit = parseInt(query.limit as string) || 10;

    const menu = await deliveryRepo.findByTenant(tenantId, { available: true });
    const hotItems = menu
      .sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0))
      .slice(0, limit);

    return {
      items: hotItems.map(item => ({
        id: item.id,
        name: item.name,
        subtitle: item.subtitle,
        price: item.price,
        originalPrice: item.originalPrice,
        image: item.image,
        tags: item.tags,
        soldCount: item.soldCount,
        rating: item.rating,
      })),
    };
  });