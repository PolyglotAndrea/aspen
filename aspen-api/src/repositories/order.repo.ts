import { db } from '../db';
import { orders, orderItems } from '../db/schema';
import { eq, and, sql, desc } from 'drizzle-orm';

export const orderRepo = {
  async findById(tenantId: string, orderId: string) {
    const rows = await db.select().from(orders).where(and(eq(orders.id, orderId), eq(orders.tenantId, tenantId))).limit(1);
    if (!rows[0]) return null;
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
    return { ...rows[0], items };
  },

  async findByTenant(tenantId: string, params?: { type?: string; status?: string; memberId?: string; storeId?: string; page?: number; pageSize?: number }) {
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 20;
    const conditions = [eq(orders.tenantId, tenantId)];
    if (params?.type) conditions.push(eq(orders.type, params.type));
    if (params?.status) conditions.push(eq(orders.status, params.status));
    if (params?.memberId) conditions.push(eq(orders.memberId, params.memberId));
    if (params?.storeId) conditions.push(eq(orders.storeId, params.storeId));

    const where = and(...conditions);
    const rows = await db.select().from(orders).where(where).orderBy(desc(orders.createdAt)).limit(pageSize).offset((page - 1) * pageSize);
    const countResult = await db.select({ count: sql<number>`count(*)` }).from(orders).where(where);
    return { orders: rows, total: Number(countResult[0]?.count || 0) };
  },

  async create(data: typeof orders.$inferInsert, items: Array<typeof orderItems.$inferInsert>) {
    await db.insert(orders).values(data);
    if (items.length > 0) {
      await db.insert(orderItems).values(items);
    }
    return { ...data, items };
  },

  async update(tenantId: string, orderId: string, data: Partial<typeof orders.$inferInsert>) {
    await db.update(orders).set({ ...data, updatedAt: new Date() }).where(and(eq(orders.id, orderId), eq(orders.tenantId, tenantId)));
  },

  async updateStatus(tenantId: string, orderId: string, status: string) {
    const updateData: any = { status, updatedAt: new Date() };
    if (status === 'completed') updateData.completedAt = new Date();
    await db.update(orders).set(updateData).where(and(eq(orders.id, orderId), eq(orders.tenantId, tenantId)));
  },

  async delete(tenantId: string, orderId: string) {
    await db.delete(orderItems).where(eq(orderItems.orderId, orderId));
    await db.delete(orders).where(and(eq(orders.id, orderId), eq(orders.tenantId, tenantId)));
  },
};
