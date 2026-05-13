/**
 * 订单主路由 (Order Routes)
 * 从原 order/index.ts 拆分 - 仅保留核心订单 CRUD 路由
 * 购物车相关路由已移至 order.cart.ts
 * 辅助函数已移至 order.helpers.ts
 */

import { Elysia, t } from 'elysia';
import type { OrderType, OrderStatus } from '../../config/tenant.types';
import { getTenantConfig } from '../../config/tenant.registry';
import { orderRepo } from '../../repositories/order.repo';
import { cartRepo } from '../../repositories/cart.repo';
import { generateOrderNo, generateVerifyCode, calculateOrderAmount, canTransitionStatus } from './order.helpers';

export const orderRoutes = new Elysia({ prefix: '/orders' })

  // 获取订单配置
  .get('/config', ({ headers }) => {
    const tenantId = headers['x-tenant-id'] || 'aspen';
    const config = getTenantConfig(tenantId);

    return {
      tenantId,
      features: config?.features,
      delivery: config?.delivery,
      booking: config?.booking,
    };
  })

  // 创建订单
  .post('/', async ({ body, headers, auth }: any) => {
    const tenantId = headers['x-tenant-id'] || 'aspen';
    const memberId = auth?.memberId;
    if (!memberId) {
      throw new Error('未登录');
    }
    const config = getTenantConfig(tenantId);

    const {
      type,
      storeId,
      items,
      deliveryFee = 0,
      packagingFee = 0,
      discount = 0,
      pointsUsed = 0,
      pointsAmount = 0,
      bookingInfo,
      deliveryInfo,
      remarks,
    } = body as any;

    // 验证订单类型
    if (!['booking', 'delivery', 'product'].includes(type)) {
      throw new Error('无效的订单类型');
    }

    // 验证功能开关
    if (type === 'delivery' && !config?.features.delivery) {
      throw new Error('该租户未启用外卖功能');
    }
    if (type === 'product' && !config?.features.product) {
      throw new Error('该租户未启用周边商品功能');
    }
    if (type === 'booking' && !config?.features.booking) {
      throw new Error('该租户未启用预约功能');
    }

    // 验证商品
    if (!items || items.length === 0) {
      throw new Error('订单商品不能为空');
    }

    // 构建订单项
    const orderItems = items.map((item: any, index: number) => ({
      id: `${Date.now()}_${index}`,
      productId: item.productId,
      productName: item.productName,
      productImage: item.productImage,
      spec: item.spec,
      price: item.price,
      quantity: item.quantity,
      subtotal: item.price * item.quantity,
    }));

    // 计算金额
    const { subtotal, total } = calculateOrderAmount(
      orderItems,
      deliveryFee,
      packagingFee,
      discount,
      pointsAmount
    );

    // 生成订单ID
    const orderId = `${tenantId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 创建订单数据
    const orderData = {
      id: orderId,
      tenantId,
      type: type as OrderType,
      orderNo: generateOrderNo(),
      memberId,
      storeId,
      status: 'pending' as OrderStatus,
      subtotal,
      deliveryFee: type === 'delivery' ? deliveryFee : undefined,
      packagingFee: type === 'delivery' ? packagingFee : undefined,
      discount,
      pointsUsed,
      pointsAmount,
      total,
      bookingInfo: type === 'booking' ? {
        ...bookingInfo,
        verifyCode: generateVerifyCode(),
      } : undefined,
      deliveryInfo: type === 'delivery' ? deliveryInfo : undefined,
      remarks,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // 构建订单项数据
    const orderItemsData = orderItems.map((item: any) => ({
      id: item.id,
      orderId,
      productId: item.productId,
      productName: item.productName,
      productImage: item.productImage,
      spec: item.spec,
      price: item.price,
      quantity: item.quantity,
      subtotal: item.subtotal,
    }));

    const newOrder = await orderRepo.create(orderData, orderItemsData);

    // 清理购物车
    if (memberId) {
      await cartRepo.clear(tenantId, memberId);
    }

    console.log(`[Order] Created: ${orderData.orderNo} (${type})`);

    return {
      success: true,
      order: { ...orderData, items: orderItems },
      message: type === 'booking'
        ? '预约成功'
        : type === 'delivery'
        ? '订单已创建，请尽快支付'
        : '订单已创建',
    };
  }, {
    body: t.Object({
      type: t.Union([t.Literal('booking'), t.Literal('delivery'), t.Literal('product')]),
      storeId: t.Optional(t.String()),
      items: t.Array(t.Object({
        productId: t.String(),
        productName: t.String(),
        productImage: t.Optional(t.String()),
        spec: t.Optional(t.String()),
        price: t.Number(),
        quantity: t.Number({ minimum: 1 }),
      })),
      deliveryFee: t.Optional(t.Number()),
      packagingFee: t.Optional(t.Number()),
      discount: t.Optional(t.Number()),
      pointsUsed: t.Optional(t.Number()),
      pointsAmount: t.Optional(t.Number()),
      bookingInfo: t.Optional(t.Object({
        date: t.String(),
        time: t.String(),
        guests: t.Number(),
        tableId: t.Optional(t.String()),
        tableName: t.Optional(t.String()),
      })),
      deliveryInfo: t.Optional(t.Object({
        address: t.String(),
        contactName: t.String(),
        contactPhone: t.String(),
      })),
      remarks: t.Optional(t.String()),
    }),
  })

  // 获取订单列表
  .get('/', async ({ headers, query, auth }: any) => {
    const tenantId = headers['x-tenant-id'] || 'aspen';
    const memberId = auth?.memberId;
    if (!memberId) {
      throw new Error('未登录');
    }

    const page = parseInt(query.page as string) || 1;
    const pageSize = parseInt(query.pageSize as string) || 20;

    const filters: any = { page, pageSize };
    if (query.type && query.type !== 'all') {
      filters.type = query.type;
    }
    if (query.status && query.status !== 'all') {
      filters.status = query.status;
    }
    filters.memberId = memberId;
    if (query.storeId) {
      filters.storeId = query.storeId;
    }

    const { orders, total } = await orderRepo.findByTenant(tenantId, filters);

    return {
      total,
      page,
      pageSize,
      orders,
    };
  })

  // 获取订单详情
  .get('/:id', async ({ params: { id }, headers }) => {
    const tenantId = headers['x-tenant-id'] || 'aspen';

    const order = await orderRepo.findById(tenantId, id);

    if (!order) {
      throw new Error('订单不存在');
    }

    return order;
  })

  // 更新订单状态
  .patch('/:id', async ({ params: { id }, body, headers }) => {
    const tenantId = headers['x-tenant-id'] || 'aspen';

    const order = await orderRepo.findById(tenantId, id);

    if (!order) {
      throw new Error('订单不存在');
    }

    const updates = body as any;

    // 验证状态转换
    if (updates.status && !canTransitionStatus(order.status as OrderStatus, updates.status)) {
      throw new Error(`无效的状态转换: ${order.status} -> ${updates.status}`);
    }

    // 只允许更新白名单字段，防止覆写 id/tenantId/total 等内部字段
    const allowedFields = ['status', 'notes', 'bookingInfo', 'deliveryInfo', 'remarks'];
    const updateData: any = {};
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field];
      }
    }

    await orderRepo.update(tenantId, id, updateData);

    // Fetch updated order
    const updatedOrder = await orderRepo.findById(tenantId, id);

    return {
      success: true,
      order: updatedOrder,
    };
  })

  // 取消订单
  .post('/:id/cancel', async ({ params: { id }, headers }) => {
    const tenantId = headers['x-tenant-id'] || 'aspen';

    const order = await orderRepo.findById(tenantId, id);

    if (!order) {
      throw new Error('订单不存在');
    }

    if (!canTransitionStatus(order.status as OrderStatus, 'cancelled')) {
      throw new Error('当前状态不允许取消');
    }

    await orderRepo.updateStatus(tenantId, id, 'cancelled');

    const updatedOrder = await orderRepo.findById(tenantId, id);

    return {
      success: true,
      order: updatedOrder,
      message: '订单已取消',
    };
  })

  // 核销订单 (预订到店核销)
  .post('/:id/verify', async ({ params: { id }, body, headers }) => {
    const tenantId = headers['x-tenant-id'] || 'aspen';

    const order = await orderRepo.findById(tenantId, id);

    if (!order) {
      throw new Error('订单不存在');
    }

    // 验证订单类型
    if (order.type !== 'booking') {
      throw new Error('只有预订订单支持核销');
    }

    // 验证状态
    if (order.status !== 'confirmed' && order.status !== 'ready') {
      throw new Error('订单状态不允许核销');
    }

    // 验证核销码
    const { verifyCode } = body as any;
    const bookingData = order.bookingInfo as any;
    if (verifyCode && bookingData?.verifyCode) {
      if (verifyCode !== bookingData.verifyCode) {
        throw new Error('核销码错误');
      }
    }

    await orderRepo.updateStatus(tenantId, id, 'completed');

    console.log(`[Verify] Order ${order.orderNo} verified`);

    const updatedOrder = await orderRepo.findById(tenantId, id);

    return {
      success: true,
      order: updatedOrder,
      message: '核销成功',
    };
  })

  // 支付订单 (模拟)
  .post('/:id/pay', async ({ params: { id }, body, headers }) => {
    const tenantId = headers['x-tenant-id'] || 'aspen';

    const order = await orderRepo.findById(tenantId, id);

    if (!order) {
      throw new Error('订单不存在');
    }

    if (order.status !== 'pending') {
      throw new Error('订单状态不允许支付');
    }

    const { paymentMethod = 'wechat' } = body as any;

    let newStatus: OrderStatus = 'paid';

    // 如果是自动确认的配置，直接确认
    const config = getTenantConfig(tenantId);
    if (config?.bookingConfig?.autoConfirm && order.type === 'booking') {
      newStatus = 'confirmed';
    }

    await orderRepo.update(tenantId, id, {
      status: newStatus,
      paymentMethod,
      paidAt: new Date(),
      paidAmount: order.total,
    });

    const updatedOrder = await orderRepo.findById(tenantId, id);

    return {
      success: true,
      order: updatedOrder,
      message: '支付成功',
    };
  })

  // 删除订单
  .delete('/:id', async ({ params: { id }, headers }) => {
    const tenantId = headers['x-tenant-id'] || 'aspen';

    const order = await orderRepo.findById(tenantId, id);

    if (!order) {
      throw new Error('订单不存在');
    }

    // 只有已取消或已完成的订单可以删除
    if (order.status !== 'cancelled' && order.status !== 'completed') {
      throw new Error('只有已取消或已完成的订单可以删除');
    }

    await orderRepo.delete(tenantId, id);

    return { success: true, message: '订单已删除' };
  });
