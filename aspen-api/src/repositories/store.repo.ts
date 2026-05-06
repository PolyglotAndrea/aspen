import { db } from '../db';
import { stores, tables } from '../db/schema';
import { eq, and } from 'drizzle-orm';

export const storeRepo = {
  async findByTenant(tenantId: string) {
    return db.select().from(stores).where(eq(stores.tenantId, tenantId));
  },

  async findById(tenantId: string, storeId: string) {
    const rows = await db.select().from(stores).where(and(eq(stores.id, storeId), eq(stores.tenantId, tenantId))).limit(1);
    return rows[0] || null;
  },

  async create(data: typeof stores.$inferInsert) {
    await db.insert(stores).values(data);
    return data;
  },

  async update(tenantId: string, storeId: string, data: Partial<typeof stores.$inferInsert>) {
    await db.update(stores).set(data).where(and(eq(stores.id, storeId), eq(stores.tenantId, tenantId)));
  },

  async delete(tenantId: string, storeId: string) {
    // 先删桌位
    await db.delete(tables).where(and(eq(tables.storeId, storeId), eq(tables.tenantId, tenantId)));
    await db.delete(stores).where(and(eq(stores.id, storeId), eq(stores.tenantId, tenantId)));
  },

  // 桌位
  async findTables(tenantId: string, storeId: string) {
    return db.select().from(tables).where(and(eq(tables.storeId, storeId), eq(tables.tenantId, tenantId)));
  },

  async addTable(data: typeof tables.$inferInsert) {
    await db.insert(tables).values(data);
    return data;
  },

  async updateTable(tenantId: string, tableId: string, data: Partial<typeof tables.$inferInsert>) {
    await db.update(tables).set(data).where(and(eq(tables.id, tableId), eq(tables.tenantId, tenantId)));
  },

  async deleteTable(tenantId: string, tableId: string) {
    await db.delete(tables).where(and(eq(tables.id, tableId), eq(tables.tenantId, tenantId)));
  },
};
