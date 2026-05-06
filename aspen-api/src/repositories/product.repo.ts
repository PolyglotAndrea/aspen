import { db } from '../db';
import { products, productCategories } from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';

export const productRepo = {
  async findByTenant(tenantId: string, params?: { category?: string; status?: string }) {
    const conditions = [eq(products.tenantId, tenantId)];
    if (params?.category) conditions.push(eq(products.categoryId, params.category));
    if (params?.status) conditions.push(eq(products.status, params.status));
    return db.select().from(products).where(and(...conditions)).orderBy(products.sort);
  },

  async findById(tenantId: string, productId: string) {
    const rows = await db.select().from(products).where(and(eq(products.id, productId), eq(products.tenantId, tenantId))).limit(1);
    return rows[0] || null;
  },

  async create(data: typeof products.$inferInsert) {
    await db.insert(products).values(data);
    return data;
  },

  async update(tenantId: string, productId: string, data: Partial<typeof products.$inferInsert>) {
    await db.update(products).set(data).where(and(eq(products.id, productId), eq(products.tenantId, tenantId)));
  },

  async delete(tenantId: string, productId: string) {
    await db.delete(products).where(and(eq(products.id, productId), eq(products.tenantId, tenantId)));
  },

  // 分类
  async findCategories(tenantId: string) {
    return db.select().from(productCategories).where(eq(productCategories.tenantId, tenantId)).orderBy(productCategories.sort);
  },

  async createCategory(data: typeof productCategories.$inferInsert) {
    await db.insert(productCategories).values(data);
    return data;
  },

  async deleteCategory(tenantId: string, categoryId: string) {
    await db.delete(productCategories).where(and(eq(productCategories.id, categoryId), eq(productCategories.tenantId, tenantId)));
  },
};
