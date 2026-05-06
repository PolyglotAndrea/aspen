/**
 * 周边商品模块 (Product Module)
 *
 * 支持周边商品、分类、购物车
 */

import { Elysia, t } from 'elysia';
import type { Product, ProductCategory } from '../../config/tenant.types';
import { getTenantConfig } from '../../config/tenant.registry';
import { productRepo } from '../../repositories/product.repo';

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

    const { name, icon } = body as any;

    if (!name) {
      throw new Error('缺少分类名称');
    }

    const existingCategories = await productRepo.findCategories(tenantId);

    const newCategory = {
      id: `cat_${tenantId}_${Date.now()}`,
      tenantId,
      name,
      icon,
      sort: existingCategories.length + 1,
      enabled: true,
    };

    await productRepo.createCategory(newCategory);

    return {
      success: true,
      category: newCategory,
    };
  })

  // 获取商品列表
  .get('/', async ({ headers, query }) => {
    const tenantId = headers['x-tenant-id'] || 'aspen';
    const config = getTenantConfig(tenantId);

    if (!config?.features.product) {
      throw new Error('周边商品功能未启用');
    }

    const params: { category?: string; status?: string } = {};
    if (query.category) {
      params.category = query.category;
    }
    if (query.status) {
      params.status = query.status;
    } else {
      params.status = 'active';
    }

    const products = await productRepo.findByTenant(tenantId, params);

    return {
      products: products.map(p => ({
        id: p.id,
        categoryId: p.categoryId,
        name: p.name,
        description: p.description,
        images: p.images,
        price: p.price,
        originalPrice: p.originalPrice,
        stock: p.stock,
        unit: p.unit,
        status: p.status,
      })),
    };
  })

  // 获取商品详情
  .get('/:id', async ({ params: { id }, headers }) => {
    const tenantId = headers['x-tenant-id'] || 'aspen';
    const product = await productRepo.findById(tenantId, id);

    if (!product) {
      throw new Error('商品不存在');
    }

    return product;
  })

  // 添加商品
  .post('/', async ({ body, headers }) => {
    const tenantId = headers['x-tenant-id'] || 'aspen';
    const config = getTenantConfig(tenantId);

    if (!config?.features.product) {
      throw new Error('周边商品功能未启用');
    }

    const { categoryId, name, description, images, price, originalPrice, stock, unit, specs, sort } = body as any;

    if (!categoryId || !name || !price) {
      throw new Error('缺少必要参数');
    }

    const existingProducts = await productRepo.findByTenant(tenantId);

    const newProduct = {
      id: `prod_${tenantId}_${Date.now()}`,
      tenantId,
      categoryId,
      name,
      description,
      images: images || [],
      price,
      originalPrice,
      stock: stock ?? 999,
      unit,
      specs,
      status: 'active',
      sort: sort || existingProducts.length + 1,
      createdAt: new Date(),
    };

    await productRepo.create(newProduct);

    console.log(`[Product] Added: ${name}`);

    return {
      success: true,
      product: newProduct,
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
    const allowedFields = ['categoryId', 'name', 'description', 'images', 'price', 'originalPrice', 'stock', 'unit', 'specs', 'status', 'sort'];
    const updateData: Record<string, any> = {};

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field];
      }
    }

    await productRepo.update(tenantId, id, updateData);

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

export default productRoutes;
