import { db } from '../db';
import { products, productCategories, productSkus, menuItems, menuCategories, deliveryMenuItems } from '../db/schema';
import { eq, and, sql, or, ilike } from 'drizzle-orm';

export const productRepo = {
  async findByTenant(tenantId: string, params?: { category?: string; status?: string; keyword?: string; isRecommend?: boolean; isNew?: boolean; isHot?: boolean }) {
    const conditions = [eq(products.tenantId, tenantId)];
    if (params?.category) conditions.push(eq(products.categoryId, params.category));
    if (params?.status) conditions.push(eq(products.status, params.status));
    if (params?.keyword) {
      const keyword = `%${params.keyword}%`;
      // Use sql to handle nullable columns
      conditions.push(
        sql`(${products.name} ILIKE ${keyword} OR ${products.subtitle} ILIKE ${keyword})`
      );
    }
    if (params?.isRecommend !== undefined) conditions.push(eq(products.isRecommend, params.isRecommend));
    if (params?.isNew !== undefined) conditions.push(eq(products.isNew, params.isNew));
    if (params?.isHot !== undefined) conditions.push(eq(products.isHot, params.isHot));
    return db.select().from(products).where(and(...conditions)).orderBy(products.sort);
  },

  async findById(tenantId: string, productId: string) {
    const rows = await db.select().from(products).where(and(eq(products.id, productId), eq(products.tenantId, tenantId))).limit(1);
    return rows[0] || null;
  },

  /**
   * 创建商品 (含规格)
   */
  async createWithSkus(data: typeof products.$inferInsert & { skus?: typeof productSkus.$inferInsert[] }) {
    const product = data as typeof products.$inferInsert;
    await db.insert(products).values(product);
    if (data.skus && data.skus.length > 0) {
      await db.insert(productSkus).values(data.skus);
    }
    return product;
  },

  async update(tenantId: string, productId: string, data: Partial<typeof products.$inferInsert>) {
    await db.update(products).set({ ...data, updatedAt: new Date() }).where(and(eq(products.id, productId), eq(products.tenantId, tenantId)));
  },

  async delete(tenantId: string, productId: string) {
    // 级联删除SKU
    await db.delete(productSkus).where(eq(productSkus.productId, productId));
    await db.delete(products).where(and(eq(products.id, productId), eq(products.tenantId, tenantId)));
  },

  // 增加销量
  async incrementSales(productId: string, amount: number = 1) {
    await db.update(products).set({ soldCount: sql`${products.soldCount} + ${amount}` }).where(eq(products.id, productId));
  },

  // 分类
  async findCategories(tenantId: string) {
    return db.select().from(productCategories).where(eq(productCategories.tenantId, tenantId)).orderBy(productCategories.sort);
  },

  async createCategory(data: typeof productCategories.$inferInsert) {
    await db.insert(productCategories).values(data);
    return data;
  },

  async updateCategory(tenantId: string, categoryId: string, data: Partial<typeof productCategories.$inferInsert>) {
    await db.update(productCategories).set(data).where(and(eq(productCategories.id, categoryId), eq(productCategories.tenantId, tenantId)));
  },

  async deleteCategory(tenantId: string, categoryId: string) {
    await db.delete(productCategories).where(and(eq(productCategories.id, categoryId), eq(productCategories.tenantId, tenantId)));
  },

  // SKU
  async findSkus(productId: string) {
    return db.select().from(productSkus).where(eq(productSkus.productId, productId)).orderBy(productSkus.sort);
  },

  async createSku(data: typeof productSkus.$inferInsert) {
    await db.insert(productSkus).values(data);
    return data;
  },

  async updateSku(skuId: string, data: Partial<typeof productSkus.$inferInsert>) {
    await db.update(productSkus).set(data).where(eq(productSkus.id, skuId));
  },

  async deleteSku(skuId: string) {
    await db.delete(productSkus).where(eq(productSkus.id, skuId));
  },

  async deleteSkusByProductId(productId: string) {
    await db.delete(productSkus).where(eq(productSkus.productId, productId));
  },
};

// 堂食菜单仓库
export const menuRepo = {
  async findByTenant(tenantId: string, params?: { category?: string; keyword?: string; available?: boolean }) {
    const conditions = [eq(menuItems.tenantId, tenantId)];
    if (params?.category) conditions.push(eq(menuItems.categoryId, params.category));
    if (params?.available !== undefined) conditions.push(eq(menuItems.available, params.available));
    if (params?.keyword) {
      const keyword = `%${params.keyword}%`;
      conditions.push(
        sql`(${menuItems.name} ILIKE ${keyword} OR ${menuItems.description} ILIKE ${keyword})`
      );
    }
    return db.select().from(menuItems).where(and(...conditions)).orderBy(menuItems.sort);
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

  // 菜单分类
  async findCategories(tenantId: string) {
    return db.select().from(menuCategories).where(eq(menuCategories.tenantId, tenantId)).orderBy(menuCategories.sort);
  },

  async createCategory(data: typeof menuCategories.$inferInsert) {
    await db.insert(menuCategories).values(data);
    return data;
  },

  async updateCategory(tenantId: string, categoryId: number, data: Partial<typeof menuCategories.$inferInsert>) {
    await db.update(menuCategories).set(data).where(and(eq(menuCategories.id, categoryId), eq(menuCategories.tenantId, tenantId)));
  },

  async deleteCategory(tenantId: string, categoryId: number) {
    await db.delete(menuCategories).where(and(eq(menuCategories.id, categoryId), eq(menuCategories.tenantId, tenantId)));
  },
};

// 外卖菜单仓库
export const deliveryRepo = {
  async findByTenant(tenantId: string, params?: { category?: string; available?: boolean; keyword?: string; isRecommend?: boolean }) {
    const conditions = [eq(deliveryMenuItems.tenantId, tenantId)];
    if (params?.category) conditions.push(eq(deliveryMenuItems.category, params.category));
    if (params?.available !== undefined) conditions.push(eq(deliveryMenuItems.available, params.available));
    if (params?.keyword) {
      const keyword = `%${params.keyword}%`;
      conditions.push(
        sql`(${deliveryMenuItems.name} ILIKE ${keyword} OR ${deliveryMenuItems.subtitle} ILIKE ${keyword})`
      );
    }
    if (params?.isRecommend !== undefined) conditions.push(eq(deliveryMenuItems.isRecommend, params.isRecommend));
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

  // 增加销量
  async incrementSales(itemId: string, amount: number = 1) {
    await db.update(deliveryMenuItems).set({ soldCount: sql`${deliveryMenuItems.soldCount} + ${amount}` }).where(eq(deliveryMenuItems.id, itemId));
  },
};