/**
 * 菜单路由 (Menu Routes) v2.0
 *
 * 堂食菜单 - 支持分类、多图、标签、推荐/新品/热销标记
 */

import { Elysia, t } from 'elysia';
import { getTenantConfig } from '../config/tenant.registry';
import { menuRepo } from '../repositories/product.repo';

export const menuRoutes = new Elysia({ prefix: '/menu' })
  .get('/', async ({ headers, query }) => {
    const tenantId = headers['x-tenant-id'] || 'aspen';
    const config = getTenantConfig(tenantId);
    const tenantConfig = config || getTenantConfig('aspen')!;

    const params: { category?: string; keyword?: string } = {};
    if (query.category && query.category !== 'all') {
      params.category = query.category as string;
    }
    if (query.keyword) {
      params.keyword = query.keyword as string;
    }

    let menu = await menuRepo.findByTenant(tenantId, params);

    // 排序：推荐 > 新品 > 热销 > 默认
    menu = menu.sort((a: any, b: any) => {
      const scoreA = (a.isRecommend ? 1000 : 0) + (a.isNew ? 500 : 0) + (a.isHot ? 200 : 0);
      const scoreB = (b.isRecommend ? 1000 : 0) + (b.isNew ? 500 : 0) + (b.isHot ? 200 : 0);
      return scoreB - scoreA;
    });

    return {
      tenantId,
      brandName: tenantConfig.brandName,
      theme: tenantConfig.theme,
      total: menu.length,
      items: menu.map((item: any) => ({
        id: item.id,
        categoryId: item.categoryId,
        name: item.name,
        subtitle: item.subtitle,
        description: item.description,
        tags: item.tags || [],
        imageUrl: item.imageUrl,
        images: item.images || [],
        price: item.price,
        originalPrice: item.originalPrice,
        available: item.available,
        isRecommend: item.isRecommend,
        isNew: item.isNew,
        isHot: item.isHot,
        soldCount: item.soldCount,
        rating: item.rating,
        sort: item.sort,
      })),
    };
  })
  .get('/:id', async ({ params: { id }, headers }) => {
    const tenantId = headers['x-tenant-id'] || 'aspen';
    const config = getTenantConfig(tenantId);
    const tenantConfig = config || getTenantConfig('aspen')!;

    const item = await menuRepo.findById(tenantId, Number(id));
    if (!item) {
      throw new Error('菜品不存在');
    }

    return {
      ...item,
      tenantId,
      theme: tenantConfig.theme,
    };
  })
  .get('/categories', async ({ headers }) => {
    const tenantId = headers['x-tenant-id'] || 'aspen';
    const config = getTenantConfig(tenantId);

    const categories = await menuRepo.findCategories(tenantId);
    const menu = await menuRepo.findByTenant(tenantId, { available: true });

    return {
      categories: categories.map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        icon: cat.icon,
        image: cat.image,
        description: cat.description,
        count: menu.filter((m: any) => m.categoryId === cat.id).length,
      })),
    };
  })
  .post('/', async ({ body, headers }) => {
    const tenantId = headers['x-tenant-id'] || 'aspen';
    const newItem = await menuRepo.create({
      tenantId,
      ...(body as any),
      available: true,
    });
    return { success: true, item: newItem };
  }, {
    body: t.Object({
      name: t.String(),
      price: t.Number(),
      description: t.Optional(t.String()),
      tags: t.Array(t.String()),
      imageUrl: t.Optional(t.String()),
      images: t.Optional(t.Array(t.String())),
      categoryId: t.Optional(t.String()),
      isRecommend: t.Optional(t.Boolean()),
      isNew: t.Optional(t.Boolean()),
      isHot: t.Optional(t.Boolean()),
    }),
  })
  .patch('/:id', async ({ params: { id }, body, headers }) => {
    const tenantId = headers['x-tenant-id'] || 'aspen';
    const existing = await menuRepo.findById(tenantId, Number(id));
    if (!existing) {
      throw new Error('菜品不存在');
    }
    await menuRepo.update(tenantId, Number(id), body as any);
    const updated = await menuRepo.findById(tenantId, Number(id));
    return { success: true, item: updated };
  })
  .delete('/:id', async ({ params: { id }, headers }) => {
    const tenantId = headers['x-tenant-id'] || 'aspen';
    const existing = await menuRepo.findById(tenantId, Number(id));
    if (!existing) {
      throw new Error('菜品不存在');
    }
    await menuRepo.delete(tenantId, Number(id));
    return { success: true, message: '菜品已删除' };
  });