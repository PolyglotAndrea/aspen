import { db } from '../db';
import { pointsRecords } from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';

export const pointsRepo = {
  async findByMember(tenantId: string, memberId: string, type?: string) {
    const conditions = [eq(pointsRecords.tenantId, tenantId), eq(pointsRecords.memberId, memberId)];
    if (type) conditions.push(eq(pointsRecords.type, type));
    return db.select().from(pointsRecords).where(and(...conditions)).orderBy(sql`${pointsRecords.createdAt} DESC`);
  },

  async create(data: typeof pointsRecords.$inferInsert) {
    await db.insert(pointsRecords).values(data);
    return data;
  },

  async findByTenant(tenantId: string, params?: { memberId?: string; type?: string; page?: number; pageSize?: number }) {
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 50;
    const conditions = [eq(pointsRecords.tenantId, tenantId)];
    if (params?.memberId) conditions.push(eq(pointsRecords.memberId, params.memberId));
    if (params?.type) conditions.push(eq(pointsRecords.type, params.type));
    const where = and(...conditions);
    const rows = await db.select().from(pointsRecords).where(where).orderBy(sql`${pointsRecords.createdAt} DESC`).limit(pageSize).offset((page - 1) * pageSize);
    const countResult = await db.select({ count: sql<number>`count(*)` }).from(pointsRecords).where(where);
    return { records: rows, total: Number(countResult[0]?.count || 0) };
  },
};
