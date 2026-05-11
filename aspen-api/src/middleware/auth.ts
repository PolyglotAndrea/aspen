/**
 * 认证中间件
 * Elysia 插件，提取 JWT token 并注入 auth 上下文
 */

import { Elysia } from 'elysia';
import { verifyToken, type JWTPayload } from '../auth/jwt';
import { validateAdminKey } from '../auth/admin';

export interface AuthContext {
  memberId: string;
  tenantId: string;
  phone: string;
  role: 'member' | 'admin' | 'super_admin';
}

/**
 * 认证插件 - 解析 JWT token 并注入 auth 上下文
 */
export const authPlugin = new Elysia({ name: 'auth' })
  .derive({ as: 'scoped' }, async ({ headers }) => {
    let auth: AuthContext | null = null;

    const authHeader = headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      try {
        const payload = await verifyToken(token);
        auth = {
          memberId: payload.sub,
          tenantId: payload.tenantId,
          phone: payload.phone,
          role: payload.role,
        };
      } catch {
        // token 无效，auth 保持 null
      }
    }

    return { auth };
  });

/**
 * Admin 守卫 - 检查 x-admin-key header
 */
export function adminGuard(headers: Record<string, string | undefined>): void {
  const adminKey = headers['x-admin-key'];
  if (!validateAdminKey(adminKey)) {
    throw new Error('管理员认证失败');
  }
}
