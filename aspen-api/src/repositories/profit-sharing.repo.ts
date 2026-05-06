import { db } from '../db';
import { profitSharingOrders } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';

export const profitSharingRepo = {
  async findById(tenantId: string, sharingOrderId: string) {
    const rows = await db.select().from(profitSharingOrders).where(and(eq(profitSharingOrders.id, sharingOrderId), eq(profitSharingOrders.tenantId, tenantId))).limit(1);
    return rows[0] || null;
  },

  async findByOrder(tenantId: string, orderId: string) {
    const rows = await db.select().from(profitSharingOrders).where(and(eq(profitSharingOrders.orderId, orderId), eq(profitSharingOrders.tenantId, tenantId))).orderBy(desc(profitSharingOrders.createdAt));
    return rows;
  },

  async findByOrderId(tenantId: string, orderId: string) {
    const rows = await db.select().from(profitSharingOrders).where(and(eq(profitSharingOrders.orderId, orderId), eq(profitSharingOrders.tenantId, tenantId))).orderBy(desc(profitSharingOrders.createdAt)).limit(1);
    return rows[0] || null;
  },

  async create(data: typeof profitSharingOrders.$inferInsert) {
    await db.insert(profitSharingOrders).values(data);
    return data;
  },

  async update(tenantId: string, sharingOrderId: string, data: Partial<typeof profitSharingOrders.$inferInsert>) {
    await db.update(profitSharingOrders).set(data).where(and(eq(profitSharingOrders.id, sharingOrderId), eq(profitSharingOrders.tenantId, tenantId)));
  },

  async settle(sharingOrderId: string) {
    await db.update(profitSharingOrders).set({ status: 'settled', settledAt: new Date() }).where(eq(profitSharingOrders.id, sharingOrderId));
  },
};
