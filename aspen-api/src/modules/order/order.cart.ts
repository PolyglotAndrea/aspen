/**
 * 订单购物车操作 (Cart Operations)
 * 从 order/index.ts 拆分出的购物车相关路由
 */

import { Elysia, t } from 'elysia';
import { getTenantConfig } from '../../config/tenant.registry';
import { cartRepo } from '../../repositories/cart.repo';

/**
 * 计算购物车汇总
 */
function calcCartSummary(items: any[]) {
  const totalQuantity = items.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);
  const totalAmount = items.reduce((sum: number, item: any) => sum + (item.price || 0) * (item.quantity || 0), 0);
  return { totalQuantity, totalAmount };
}

export const cartRoutes = new Elysia({ prefix: '/orders' })

  // 获取购物车
  .get('/cart', async ({ headers }) => {
    const tenantId = headers['x-tenant-id'] || 'aspen';
    const memberId = headers['x-member-id'] as string || 'guest';

    const items = await cartRepo.findByMember(tenantId, memberId);
    const { totalQuantity, totalAmount } = calcCartSummary(items);

    return { tenantId, memberId, items, totalQuantity, totalAmount };
  })

  // 加入购物车
  .post('/cart', async ({ body, headers }) => {
    const tenantId = headers['x-tenant-id'] || 'aspen';
    const memberId = headers['x-member-id'] as string || 'guest';

    const { productId, productName, productImage, spec, price, quantity, stock } = body as any;

    await cartRepo.addItem({
      id: `${tenantId}:${memberId}_${Date.now()}`,
      tenantId,
      memberId,
      productId,
      productName,
      productImage,
      spec,
      price,
      quantity,
      stock,
    });

    const items = await cartRepo.findByMember(tenantId, memberId);
    const { totalQuantity, totalAmount } = calcCartSummary(items);

    return {
      success: true,
      cart: { tenantId, memberId, items, totalQuantity, totalAmount },
    };
  }, {
    body: t.Object({
      productId: t.String(),
      productName: t.String(),
      productImage: t.Optional(t.String()),
      spec: t.Optional(t.String()),
      price: t.Number(),
      quantity: t.Number({ minimum: 1 }),
      stock: t.Number(),
    }),
  })

  // 更新购物车项数量
  .patch('/cart/:productId', async ({ params: { productId }, body, headers }) => {
    const tenantId = headers['x-tenant-id'] || 'aspen';
    const memberId = headers['x-member-id'] as string || 'guest';

    const { quantity, spec } = body as any;

    await cartRepo.updateQuantity(tenantId, memberId, productId, quantity, spec);

    const items = await cartRepo.findByMember(tenantId, memberId);
    const { totalQuantity, totalAmount } = calcCartSummary(items);

    return {
      success: true,
      cart: { tenantId, memberId, items, totalQuantity, totalAmount },
    };
  })

  // 清空购物车
  .delete('/cart', async ({ headers }) => {
    const tenantId = headers['x-tenant-id'] || 'aspen';
    const memberId = headers['x-member-id'] as string || 'guest';

    await cartRepo.clear(tenantId, memberId);

    return { success: true, message: '购物车已清空' };
  });