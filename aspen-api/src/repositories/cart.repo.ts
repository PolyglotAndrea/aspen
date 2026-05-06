import { db } from '../db';
import { cartItems } from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';

export const cartRepo = {
  async findByMember(tenantId: string, memberId: string) {
    return db.select().from(cartItems).where(and(eq(cartItems.tenantId, tenantId), eq(cartItems.memberId, memberId)));
  },

  async addItem(data: typeof cartItems.$inferInsert) {
    // 尝试查找已有项
    const existing = await db.select().from(cartItems).where(
      and(
        eq(cartItems.tenantId, data.tenantId),
        eq(cartItems.memberId, data.memberId),
        eq(cartItems.productId, data.productId),
        data.spec ? eq(cartItems.spec, data.spec) : sql`${cartItems.spec} IS NULL`,
      )
    ).limit(1);

    if (existing[0]) {
      // 更新数量
      await db.update(cartItems).set({
        quantity: (existing[0].quantity || 0) + (data.quantity || 1),
      }).where(eq(cartItems.id, existing[0].id));
      return existing[0].id;
    }

    await db.insert(cartItems).values(data);
    return data.id;
  },

  async updateQuantity(tenantId: string, memberId: string, productId: string, quantity: number, spec?: string) {
    if (quantity <= 0) {
      await this.removeItem(tenantId, memberId, productId, spec);
      return;
    }
    const conditions = [eq(cartItems.tenantId, tenantId), eq(cartItems.memberId, memberId), eq(cartItems.productId, productId)];
    if (spec) conditions.push(eq(cartItems.spec, spec));
    await db.update(cartItems).set({ quantity }).where(and(...conditions));
  },

  async removeItem(tenantId: string, memberId: string, productId: string, spec?: string) {
    const conditions = [eq(cartItems.tenantId, tenantId), eq(cartItems.memberId, memberId), eq(cartItems.productId, productId)];
    if (spec) conditions.push(eq(cartItems.spec, spec));
    await db.delete(cartItems).where(and(...conditions));
  },

  async clear(tenantId: string, memberId: string) {
    await db.delete(cartItems).where(and(eq(cartItems.tenantId, tenantId), eq(cartItems.memberId, memberId)));
  },
};
