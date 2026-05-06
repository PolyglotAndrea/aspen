/**
 * Admin API Key 验证
 */

const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'dev-admin-key-change-in-production';

export function validateAdminKey(key: string | undefined): boolean {
  return key === ADMIN_API_KEY;
}
