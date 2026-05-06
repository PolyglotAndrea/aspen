/**
 * 品牌路由 (Brand Routes)
 * 模板化设计 - 所有租户共享逻辑，但返回各自的主题配置
 */

import { Elysia, t } from 'elysia';
import { getTenantConfig } from '../config/tenant.registry';
import { brandRepo } from '../repositories/brand.repo';

export const brandRoutes = new Elysia({ prefix: '/brand' })
  .get('/', async ({ headers }) => {
    const tenantId = headers['x-tenant-id'] || 'aspen';
    const config = getTenantConfig(tenantId);
    const tenantConfig = config || getTenantConfig('aspen')!;

    const brandData = await brandRepo.findByTenant(tenantId);

    return {
      videoUrl: brandData?.videoUrl || '',
      tagline: brandData?.tagline || '',
      stories: brandData?.stories || [],
      tenantId,
      brandName: tenantConfig.brandName,
      brandNameEn: tenantConfig.brandNameEn,
      theme: tenantConfig.theme,
    };
  })
  .get('/stories', async ({ headers }) => {
    const tenantId = headers['x-tenant-id'] || 'aspen';
    const brandData = await brandRepo.findByTenant(tenantId);
    return brandData?.stories || [];
  })
  .get('/theme', ({ headers }) => {
    const tenantId = headers['x-tenant-id'] || 'aspen';
    const config = getTenantConfig(tenantId);
    const tenantConfig = config || getTenantConfig('aspen')!;
    return { tenantId, theme: tenantConfig.theme };
  })
  .patch('/', async ({ body, headers }) => {
    const tenantId = headers['x-tenant-id'] || 'aspen';
    await brandRepo.upsert(tenantId, body as any);
    return { success: true, message: '品牌信息已更新' };
  }, {
    body: t.Object({
      videoUrl: t.Optional(t.String()),
      tagline: t.Optional(t.String()),
      stories: t.Optional(t.Array(t.Any())),
    }),
  });

export default brandRoutes;
