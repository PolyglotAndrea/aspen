/**
 * 管理员认证模块
 * 提供管理员登录、信息查询、超管平台管理等端点
 */

import { Elysia, t } from 'elysia';
import { db } from '../../db';
import { admins, tenants } from '../../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { signToken, verifyToken, type JWTPayload } from '../../auth/jwt';
import { verifyPassword } from '../../auth/password';
import { getActiveTenants, updateTenant, getTenantConfig } from '../../config/tenant.registry';

export const adminAuthRoutes = new Elysia({ prefix: '/admin' })

  // 管理员登录
  .post('/login', async ({ body, headers }) => {
    const tenantId = headers['x-tenant-id'] || 'aspen';
    const { username, password } = body as { username: string; password: string };

    if (!username || !password) {
      throw new Error('请输入用户名和密码');
    }

    // 超管可以不带 tenantId 或用 '*' 登录
    const queryConditions = username === 'superadmin'
      ? and(eq(admins.username, username), eq(admins.role, 'super_admin'))
      : and(eq(admins.tenantId, tenantId), eq(admins.username, username));

    const rows = await db.select().from(admins).where(queryConditions).limit(1);

    const admin = rows[0];
    if (!admin) {
      throw new Error('用户名或密码错误');
    }

    if (admin.status !== 'active') {
      throw new Error('账号已被禁用');
    }

    const valid = await verifyPassword(password, admin.passwordHash);
    if (!valid) {
      throw new Error('用户名或密码错误');
    }

    // 更新最后登录时间
    await db.update(admins).set({ lastLoginAt: new Date() }).where(eq(admins.id, admin.id));

    const adminRole = admin.role === 'super_admin' ? 'super_admin' : 'admin';

    const token = await signToken({
      sub: admin.id,
      tenantId: admin.tenantId || '',
      phone: '',
      role: adminRole,
    });

    return {
      success: true,
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        displayName: admin.displayName,
        role: adminRole,
        tenantId: admin.tenantId,
      },
    };
  }, {
    body: t.Object({
      username: t.String(),
      password: t.String(),
    }),
  })

  // 获取当前管理员信息
  .get('/me', async ({ headers }) => {
    const authHeader = headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new Error('未登录');
    }

    const token = authHeader.slice(7);
    let payload: JWTPayload;
    try {
      payload = await verifyToken(token);
    } catch {
      throw new Error('登录已过期，请重新登录');
    }

    if (payload.role !== 'admin' && payload.role !== 'super_admin') {
      throw new Error('无管理员权限');
    }

    const rows = await db.select().from(admins).where(eq(admins.id, payload.sub)).limit(1);
    const admin = rows[0];
    if (!admin || admin.status !== 'active') {
      throw new Error('账号不存在或已被禁用');
    }

    return {
      admin: {
        id: admin.id,
        username: admin.username,
        displayName: admin.displayName,
        role: admin.role,
        tenantId: admin.tenantId,
      },
    };
  })

  // ===== 超管专用 API =====

  // 获取平台统计（超管）
  .get('/stats', async ({ headers }) => {
    const authHeader = headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) throw new Error('未登录');
    const payload = await verifyToken(authHeader.slice(7));
    if (payload.role !== 'super_admin') throw new Error('需要超管权限');

    const allTenants = getActiveTenants();
    const adminCount = await db.select({ count: sql<number>`count(*)` }).from(admins);

    return {
      tenantCount: allTenants.length,
      adminCount: Number(adminCount[0]?.count || 0),
      tenants: allTenants.map(t => ({
        id: t.id,
        brandName: t.brandName,
        brandNameEn: t.brandNameEn,
        status: t.status,
        features: t.features,
      })),
    };
  })

  // 获取所有租户列表（超管）
  .get('/tenants', async ({ headers }) => {
    const authHeader = headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) throw new Error('未登录');
    const payload = await verifyToken(authHeader.slice(7));
    if (payload.role !== 'super_admin') throw new Error('需要超管权限');

    const allTenants = getActiveTenants();
    return {
      tenants: allTenants.map(t => ({
        id: t.id,
        brandName: t.brandName,
        brandNameEn: t.brandNameEn,
        status: t.status,
        theme: t.theme,
        features: t.features,
        createdAt: t.createdAt,
      })),
    };
  })

  // 启用/停用租户
  .patch('/tenants/:id/status', async ({ params: { id }, body, headers }) => {
    const authHeader = headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) throw new Error('未登录');
    const payload = await verifyToken(authHeader.slice(7));
    if (payload.role !== 'super_admin') throw new Error('需要超管权限');

    const { status } = body as any;
    if (!['active', 'inactive', 'pending'].includes(status)) {
      throw new Error('无效的状态');
    }

    const updated = await updateTenant(id, { status } as any);
    if (!updated) throw new Error('租户不存在');

    return { success: true, tenant: { id: updated.id, status: updated.status } };
  })

  // 获取租户数据概览
  .get('/tenants/:id/stats', async ({ params: { id }, headers }) => {
    const authHeader = headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) throw new Error('未登录');
    const payload = await verifyToken(authHeader.slice(7));
    if (payload.role !== 'super_admin') throw new Error('需要超管权限');

    const config = getTenantConfig(id);
    if (!config) throw new Error('租户不存在');

    // TODO: 从数据库查询实际统计数据
    // 暂时返回模拟数据，后续完善
    return {
      tenantId: id,
      brandName: config.brandName,
      stats: {
        totalOrders: 0,
        totalMembers: 0,
        totalRevenue: 0,
        todayOrders: 0,
        todayRevenue: 0,
      },
    };
  });

export default adminAuthRoutes;
