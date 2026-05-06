/**
 * 菜单路由 (Menu Routes)
 * 模板化设计 - 支持多租户菜单隔离
 */

import { Elysia, t } from 'elysia';
import { getTenantConfig } from '../config/tenant.registry';
import { menuRepo } from '../repositories/menu.repo';

export const menuRoutes = new Elysia({ prefix: '/menu' })
  .get('/', async ({ headers, query }) => {
    const tenantId = headers['x-tenant-id'] || 'aspen';
    const config = getTenantConfig(tenantId);
    const tenantConfig = config || getTenantConfig('aspen')!;

    let menu = await menuRepo.findByTenant(tenantId);

    // 分类筛选
    if (query.category && query.category !== 'all') {
      menu = menu.filter((item: any) => {
        const tags = item.tags as string[] || [];
        return tags.includes(query.category!);
      });
    }

    // 上下架筛选
    if (query.available !== undefined) {
      menu = menu.filter((item: any) => item.available === (query.available === 'true'));
    }

    return {
      tenantId,
      brandName: tenantConfig.brandName,
      theme: tenantConfig.theme,
      total: menu.length,
      items: menu,
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

    return { ...item, tenantId, theme: tenantConfig.theme };
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
    return { success: true };
  });

export default menuRoutes;
