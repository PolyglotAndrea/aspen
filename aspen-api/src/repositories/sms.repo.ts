import { db } from '../db';
import { smsCodes } from '../db/schema';
import { eq, and, gt, sql } from 'drizzle-orm';

export const smsRepo = {
  async create(data: { tenantId: string; phone: string; code: string; type: string; purpose?: string; expiresAt: Date }) {
    const result = await db.insert(smsCodes).values({
      tenantId: data.tenantId,
      phone: data.phone,
      code: data.code,
      type: data.type,
      purpose: data.purpose || 'login',
      expiresAt: data.expiresAt,
    }).returning();
    return result[0];
  },

  async findValidCode(tenantId: string, phone: string, code: string, purpose?: string) {
    const now = new Date();
    const conditions = [
      eq(smsCodes.tenantId, tenantId),
      eq(smsCodes.phone, phone),
      eq(smsCodes.code, code),
      eq(smsCodes.used, false),
      gt(smsCodes.expiresAt, now),
    ];
    if (purpose) conditions.push(eq(smsCodes.purpose, purpose));
    const rows = await db.select().from(smsCodes).where(and(...conditions)).orderBy(sql`${smsCodes.createdAt} DESC`).limit(1);
    return rows[0] || null;
  },

  async markUsed(codeId: number) {
    await db.update(smsCodes).set({ used: true }).where(eq(smsCodes.id, codeId));
  },

  async cleanup() {
    // 删除过期验证码（可定期调用）
    const now = new Date();
    await db.delete(smsCodes).where(sql`${smsCodes.expiresAt} < ${now}`);
  },
};
