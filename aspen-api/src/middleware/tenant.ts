/**
 * 租户中间件 (Tenant Middleware)
 *
 * 自动从请求头提取租户信息并注入到请求上下文
 */

import { Elysia, type t } from 'elysia';
import type { TenantContext, TenantApiResponse } from '../config/tenant.types';
import {
  getTenantConfig,
  isTenantActive,
  getActiveTenants,
  createTenant,
  updateTenant,
  deleteTenant,
} from '../config/tenant.registry';

/**
 * 租户插件选项
 */
export interface TenantPluginOptions {
  /** 是否允许租户不存在时创建 (开发模式) */
  allowDevCreation?: boolean;
  /** 默认租户 ID (当请求头未指定时) */
  defaultTenant?: string;
}

/**
 * 获取租户上下文
 */
async function getTenantContext(headers: Record<string, string>, options: TenantPluginOptions): Promise<TenantContext> {
  const { allowDevCreation = false, defaultTenant = 'aspen' } = options;

  // 1. 从请求头获取租户 ID
  const tenantId = headers['x-tenant-id'] || defaultTenant;

  // 2. 获取租户配置
  const config = getTenantConfig(tenantId);

  // 3. 验证租户
  if (!config) {
    // 开发模式：自动创建租户
    if (allowDevCreation) {
      const newTenant = await createTenant({ id: tenantId, brandName: tenantId });
      return {
        config: newTenant,
      };
    }
    throw new Error(`租户不存在: ${tenantId}`);
  }

  if (!isTenantActive(tenantId)) {
    throw new Error(`租户已停用: ${tenantId}`);
  }

  // 4. 返回租户上下文
  return {
    config,
  };
}

/**
 * 租户插件
 */
export function tenantPlugin(options: TenantPluginOptions = {}) {
  const pluginOptions = options;

  return (app: Elysia) =>
    app
      .derive(async ({ headers }) => {
        const ctx = await getTenantContext(headers as Record<string, string>, pluginOptions);
        return { tenant: ctx };
      })
      .onBeforeHandle(({ tenant, set, headers, path }) => {
        // 跳过健康检查和 Swagger 路由
        if (path === '/health' || path.startsWith('/swagger') || path.startsWith('/tenants')) {
          return;
        }

        // 检查租户上下文是否存在
        if (!tenant || !tenant.config) {
          const tenantId = headers['x-tenant-id'] || 'aspen';
          const config = getTenantConfig(tenantId);

          if (!config) {
            set.status = 403;
            return { success: false, error: `租户不存在: ${tenantId}` };
          }

          if (!isTenantActive(tenantId)) {
            set.status = 403;
            return { success: false, error: `租户已停用: ${tenantId}` };
          }
        }
      });
}

/**
 * 生成 API 响应中的租户信息
 */
export function getTenantApiResponse(tenantId: string): TenantApiResponse | null {
  const config = getTenantConfig(tenantId);
  if (!config) return null;

  return {
    success: true,
    tenantId: config.id,
    brandName: config.brandName,
    brandNameEn: config.brandNameEn,
    theme: config.theme,
    features: config.features,
  };
}

/**
 * 租户管理路由
 */
export function tenantManagementRoutes(app: Elysia) {
  return app
    .group('/tenants', (app) =>
      app
        // 获取所有活跃租户
        .get('/', () => {
          const tenants = getActiveTenants();
          return {
            total: tenants.length,
            tenants: tenants.map((t) => ({
              id: t.id,
              brandName: t.brandName,
              brandNameEn: t.brandNameEn,
              status: t.status,
              features: t.features,
            })),
          };
        })

        // 获取指定租户信息
        .get('/:id', ({ params: { id } }) => {
          const config = getTenantConfig(id);
          if (!config) {
            throw new Error(`租户不存在: ${id}`);
          }
          return getTenantApiResponse(id);
        })

        // 创建新租户
        .post('/', ({ body }) => {
          const { id, brandName, brandNameEn, theme } = body as any;

          if (!id || !brandName) {
            throw new Error('缺少必要参数: id, brandName');
          }

          try {
            const newTenant = createTenant({
              id,
              brandName,
              brandNameEn,
              theme,
            });
            return {
              success: true,
              tenant: getTenantApiResponse(id),
            };
          } catch (error: any) {
            throw new Error(error.message);
          }
        })

        // 更新租户配置
        .patch('/:id', ({ params: { id }, body }) => {
          const updated = updateTenant(id, body as any);
          if (!updated) {
            throw new Error(`租户不存在: ${id}`);
          }
          return {
            success: true,
            tenant: getTenantApiResponse(id),
          };
        })

        // 删除租户
        .delete('/:id', ({ params: { id } }) => {
          const deleted = deleteTenant(id);
          if (!deleted) {
            throw new Error(`租户不存在: ${id}`);
          }
          return { success: true, message: `租户 ${id} 已删除` };
        })
    );
}
