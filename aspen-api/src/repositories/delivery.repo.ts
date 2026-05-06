import { db } from '../db';
import { deliveryMenuItems } from '../db/schema';
import { eq, and } from 'drizzle-orm';

export const deliveryRepo = {
  async findByTenant(tenantId: string, params?: { category?: string; available?: boolean }) {
    const conditions = [eq(deliveryMenuItems.tenantId, tenantId)];
    if (params?.category) conditions.push(eq(deliveryMenuItems.category, params.category));
    if (params?.available !== undefined) conditions.push(eq(deliveryMenuItems.available, params.available));
    return db.select().from(deliveryMenuItems).where(and(...conditions));
  },

  async findById(tenantId: string, itemId: string) {
    const rows = await db.select().from(deliveryMenuItems).where(and(eq(deliveryMenuItems.id, itemId), eq(deliveryMenuItems.tenantId, tenantId))).limit(1);
    return rows[0] || null;
  },

  async create(data: typeof deliveryMenuItems.$inferInsert) {
    await db.insert(deliveryMenuItems).values(data);
    return data;
  },

  async update(tenantId: string, itemId: string, data: Partial<typeof deliveryMenuItems.$inferInsert>) {
    await db.update(deliveryMenuItems).set(data).where(and(eq(deliveryMenuItems.id, itemId), eq(deliveryMenuItems.tenantId, tenantId)));
  },

  async delete(tenantId: string, itemId: string) {
    await db.delete(deliveryMenuItems).where(and(eq(deliveryMenuItems.id, itemId), eq(deliveryMenuItems.tenantId, tenantId)));
  },

  async getCategories(tenantId: string) {
    const items = await db.select({ category: deliveryMenuItems.category }).from(deliveryMenuItems).where(eq(deliveryMenuItems.tenantId, tenantId));
    const unique = [...new Set(items.map(i => i.category))];
    return unique;
  },
};
