/**
 * 周边商品模块 (Product Module) v2.0
 *
 * 支持SKU系统、营销标签(推荐/新品/热销)、销量统计、富文本、分类层级
 * 对齐市面主流电商小程序商品标准模型
 */

import { Elysia, t } from 'elysia';
import type { Product, ProductCategory, ProductDetail, ProductSKU } from '../../config/tenant.types';
import { getTenantConfig } from '../../config/tenant.registry';
import { productRepo } from '../../repositories/product.repo';
import { products } from '../../db/schema';

// ============================================
// 商品路由
// ============================================

export const productRoutes = new Elysia({ prefix: '/products' })

  // 获取商品配置
  .get('/config', ({ headers }) => {
    const tenantId = headers['x-tenant-id'] || 'aspen';
    const config = getTenantConfig(tenantId);

    if (!config?.features.product) {
      return { enabled: false };
    }

    return {
      enabled: true,
      deliverySupported: config.product.deliverySupported,
      pickupSupported: config.product.pickupSupported,
      categories: config.product.categories,
    };
  })

  // 获取分类列表
  .get('/categories', async ({ headers }) => {
    const tenantId = headers['x-tenant-id'] || 'aspen';
    const config = getTenantConfig(tenantId);

    if (!config?.features.product) {
      throw new Error('周边商品功能未启用');
    }

    // 使用配置中的分类或数据库中的分类
    let categories = config.product.categories?.length > 0
      ? config.product.categories
      : await productRepo.findCategories(tenantId);

    return {
      categories: categories
        .filter(c => c.enabled)
        .map(c => ({
          id: c.id,
          name: c.name,
          icon: c.icon,
          image: c.image,
          description: c.description,
          parentId: c.parentId,
          sort: c.sort,
        })),
    };
  })

  // 创建分类
  .post('/categories', async ({ body, headers }) => {
    const tenantId = headers['x-tenant-id'] || 'aspen';
    const config = getTenantConfig(tenantId);

    if (!config?.features.product) {
      throw new Error('周边商品功能未启用');
    }

    const { name, icon, image, description, parentId } = body as any;

    if (!name) {
      throw new Error('缺少分类名称');
    }

    const existingCategories = await productRepo.findCategories(tenantId);

    const newCategory = {
      id: `cat_${tenantId}_${Date.now()}`,
      tenantId,
      name,
      icon,
      image,
      description,
      parentId,
      sort: existingCategories.length + 1,
      enabled: true,
    };

    await productRepo.createCategory(newCategory);

    return {
      success: true,
      category: newCategory,
    };
  })

  // 获取商品列表 (支持搜索/筛选/排序)
  .get('/', async ({ headers, query }) => {
    const tenantId = headers['x-tenant-id'] || 'aspen';
    const config = getTenantConfig(tenantId);

    if (!config?.features.product) {
      throw new Error('周边商品功能未启用');
    }

    const params: {
      category?: string;
      status?: string;
      keyword?: string;
      isRecommend?: boolean;
      isNew?: boolean;
      isHot?: boolean;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    } = {};

    if (query.category && query.category !== 'all') {
      params.category = query.category as string;
    }
    if (query.status) params.status = query.status as string;
    if (query.keyword) params.keyword = query.keyword as string;
    if (query.recommend === 'true') params.isRecommend = true;
    if (query.new === 'true') params.isNew = true;
    if (query.hot === 'true') params.isHot = true;
    if (query.sortBy) params.sortBy = query.sortBy as string;
    if (query.sortOrder) params.sortOrder = query.sortOrder as 'asc' | 'desc';

    const products = await productRepo.findByTenant(tenantId, params);

    return {
      products: products.map(p => ({
        id: p.id,
        categoryId: p.categoryId,
        name: p.name,
        subtitle: p.subtitle,
        description: p.description,
        images: p.images,
        videoUrl: p.videoUrl,
        price: p.price,
        originalPrice: p.originalPrice,
        stock: p.stock,
        unit: p.unit,
        specs: p.specs,
        tags: p.tags,
        isRecommend: p.isRecommend,
        isNew: p.isNew,
        isHot: p.isHot,
        soldCount: p.soldCount,
        rating: p.rating,
        ratingCount: p.ratingCount,
        status: p.status,
        sort: p.sort,
      })),
    };
  })

  // 获取商品详情 (含SKU、同类推荐)
  .get('/:id', async ({ params: { id }, headers }) => {
    const tenantId = headers['x-tenant-id'] || 'aspen';
    const product = await productRepo.findById(tenantId, id);

    if (!product) {
      throw new Error('商品不存在');
    }

    // 获取SKU
    const skus = await productRepo.findSkus(id);

    // 获取同类推荐 (同分类)
    const recommends = await productRepo.findByTenant(tenantId, {
      category: product.categoryId,
      status: 'active',
    });

    const detail: ProductDetail = {
      ...product,
      status: (product.status === 'active' || product.status === 'inactive' || product.status === 'offline') ? product.status : 'active',
      skus: skus.map((s: any): ProductSKU => ({
        id: s.id,
        name: s.name,
        price: s.price,
        stock: s.stock ?? 0,
        specIds: [],
      })),
      recommends: recommends
        .filter(r => r.id !== id)
        .slice(0, 6)
        .map((r: any): Product => ({
          id: r.id,
          categoryId: r.categoryId,
          name: r.name,
          subtitle: r.subtitle,
          description: r.description,
          images: r.images || [],
          videoUrl: r.videoUrl,
          price: r.price,
          originalPrice: r.originalPrice,
          stock: r.stock ?? 0,
          unit: r.unit,
          specs: r.specs || [],
          tags: r.tags || [],
          isRecommend: r.isRecommend ?? false,
          isNew: r.isNew ?? false,
          isHot: r.isHot ?? false,
          sort: r.sort ?? 0,
          status: r.status || 'active',
          soldCount: r.soldCount ?? 0,
          rating: r.rating ?? 0,
          ratingCount: r.ratingCount ?? 0,
          createdAt: r.createdAt?.toISOString() || '',
          updatedAt: r.updatedAt?.toISOString() || '',
        })),
    };

    return detail;
  })

  // 添加商品 (含SKU)
  .post('/', async ({ body, headers }) => {
    const tenantId = headers['x-tenant-id'] || 'aspen';
    const config = getTenantConfig(tenantId);

    if (!config?.features.product) {
      throw new Error('周边商品功能未启用');
    }

    const {
      categoryId, name, subtitle, description, images, videoUrl,
      price, originalPrice, stock, unit, specs, tags,
      isRecommend, isNew, isHot, sort, status,
      skus,
    } = body as any;

    if (!categoryId || !name || !price) {
      throw new Error('缺少必要参数');
    }

    const existingProducts = await productRepo.findByTenant(tenantId);

    const productData: typeof products.$inferInsert = {
      id: `prod_${tenantId}_${Date.now()}`,
      tenantId,
      categoryId,
      name,
      subtitle,
      description,
      images: images || [],
      videoUrl,
      price,
      originalPrice,
      stock: stock ?? 999,
      unit,
      specs: specs || [],
      tags: tags || [],
      isRecommend: isRecommend || false,
      isNew: isNew || false,
      isHot: isHot || false,
      status: status || 'active',
      sort: sort || existingProducts.length + 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      soldCount: 0,
      rating: 0,
      ratingCount: 0,
    };

    // SKU数据
    const skuData = skus
      ? skus.map((s: any) => ({
          id: `sku_${tenantId}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          tenantId,
          productId: productData.id,
          name: s.name,
          price: s.price,
          stock: s.stock ?? 999,
          sort: s.sort || 0,
          createdAt: new Date(),
        }))
      : [];

    await productRepo.createWithSkus({ ...productData, skus: skuData });

    console.log(`[Product] Added: ${name}`);

    return {
      success: true,
      product: productData,
    };
  })

  // 更新商品
  .patch('/:id', async ({ params: { id }, body, headers }) => {
    const tenantId = headers['x-tenant-id'] || 'aspen';

    const existing = await productRepo.findById(tenantId, id);
    if (!existing) {
      throw new Error('商品不存在');
    }

    const updates = body as any;
    const allowedFields = [
      'categoryId', 'name', 'subtitle', 'description',
      'images', 'videoUrl', 'price', 'originalPrice',
      'stock', 'unit', 'specs', 'tags',
      'isRecommend', 'isNew', 'isHot', 'sort', 'status',
    ];
    const updateData: Record<string, any> = {};
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field];
      }
    }

    await productRepo.update(tenantId, id, updateData);

    // 更新SKU
    if (updates.skus) {
      // 删除旧SKU
      await productRepo.deleteSkusByProductId(id);
      // 创建新SKU
      for (const sku of updates.skus) {
        await productRepo.createSku({
          ...sku,
          tenantId,
          productId: id,
        });
      }
    }

    const updated = await productRepo.findById(tenantId, id);

    return {
      success: true,
      product: updated,
    };
  })

  // 删除商品
  .delete('/:id', async ({ params: { id }, headers }) => {
    const tenantId = headers['x-tenant-id'] || 'aspen';

    const existing = await productRepo.findById(tenantId, id);
    if (!existing) {
      throw new Error('商品不存在');
    }

    await productRepo.delete(tenantId, id);

    return { success: true, message: '商品已删除' };
  });