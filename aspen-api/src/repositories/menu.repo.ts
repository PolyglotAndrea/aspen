import { db } from '../db';
import { menuItems } from '../db/schema';
import { eq, and } from 'drizzle-orm';

export const menuRepo = {
  async findByTenant(tenantId: string) {
    return db.select().from(menuItems).where(eq(menuItems.tenantId, tenantId));
  },

  async findById(tenantId: string, itemId: number) {
    const rows = await db.select().from(menuItems).where(and(eq(menuItems.id, itemId), eq(menuItems.tenantId, tenantId))).limit(1);
    return rows[0] || null;
  },

  async create(data: typeof menuItems.$inferInsert) {
    const result = await db.insert(menuItems).values(data).returning();
    return result[0];
  },

  async update(tenantId: string, itemId: number, data: Partial<typeof menuItems.$inferInsert>) {
    await db.update(menuItems).set(data).where(and(eq(menuItems.id, itemId), eq(menuItems.tenantId, tenantId)));
  },

  async delete(tenantId: string, itemId: number) {
    await db.delete(menuItems).where(and(eq(menuItems.id, itemId), eq(menuItems.tenantId, tenantId)));
  },
};
