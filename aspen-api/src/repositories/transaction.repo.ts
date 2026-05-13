import { db } from '../db';
import { transactions } from '../db/schema';
import { eq, and, sql, desc } from 'drizzle-orm';

export const transactionRepo = {
  async findById(tenantId: string, transactionId: string) {
    const rows = await db.select().from(transactions).where(and(eq(transactions.id, transactionId), eq(transactions.tenantId, tenantId))).limit(1);
    return rows[0] || null;
  },

  async findByOrder(tenantId: string, orderId: string) {
    return db.select().from(transactions).where(and(eq(transactions.orderId, orderId), eq(transactions.tenantId, tenantId))).orderBy(desc(transactions.createdAt));
  },

  async findByOrderId(tenantId: string, orderId: string) {
    const rows = await db.select().from(transactions).where(and(eq(transactions.orderId, orderId), eq(transactions.tenantId, tenantId))).orderBy(desc(transactions.createdAt)).limit(1);
    return rows[0] || null;
  },

  async findByTransactionNo(tenantId: string, transactionNo: string) {
    const rows = await db.select().from(transactions).where(and(eq(transactions.transactionNo, transactionNo), eq(transactions.tenantId, tenantId))).limit(1);
    return rows[0] || null;
  },

  async findByTransactionNoAnyTenant(transactionNo: string) {
    const rows = await db.select().from(transactions).where(eq(transactions.transactionNo, transactionNo)).limit(1);
    return rows[0] || null;
  },

  async findByTenant(tenantId: string, params?: { orderId?: string; channel?: string; status?: string; page?: number; pageSize?: number }) {
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 50;
    const conditions = [eq(transactions.tenantId, tenantId)];
    if (params?.orderId) conditions.push(eq(transactions.orderId, params.orderId));
    if (params?.channel) conditions.push(eq(transactions.channel, params.channel));
    if (params?.status) conditions.push(eq(transactions.status, params.status));
    const where = and(...conditions);
    const rows = await db.select().from(transactions).where(where).orderBy(desc(transactions.createdAt)).limit(pageSize).offset((page - 1) * pageSize);
    const countResult = await db.select({ count: sql<number>`count(*)` }).from(transactions).where(where);
    return { transactions: rows, total: Number(countResult[0]?.count || 0) };
  },

  async create(data: typeof transactions.$inferInsert) {
    await db.insert(transactions).values(data);
    return data;
  },

  async update(tenantId: string, transactionId: string, data: Partial<typeof transactions.$inferInsert>) {
    await db.update(transactions).set(data).where(and(eq(transactions.id, transactionId), eq(transactions.tenantId, tenantId)));
  },
};
