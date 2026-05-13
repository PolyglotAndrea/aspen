/**
 * 支付路由
 * 处理支付创建、回调、查询、退款
 */

import { Elysia, t } from 'elysia';
import { getPaymentChannel, getDefaultChannel, createSharingOrder, settleSharingOrder, querySharingStatus } from '../payment';
import type { PaymentChannelType, TenantPaymentConfig } from '../payment/types';
import { orderRepo } from '../repositories/order.repo';
import { transactionRepo } from '../repositories/transaction.repo';
import { profitSharingRepo } from '../repositories/profit-sharing.repo';
import { getTenantConfig } from '../config/tenant.registry';
import type { PaymentConfig } from '../config/tenant.types';

// Bridge our simple PaymentConfig to what the payment code expects
type BridgePaymentConfig = PaymentConfig extends TenantPaymentConfig ? PaymentConfig : TenantPaymentConfig;

function generateTransactionId(): string {
  return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
}

function generateRefundNo(): string {
  return `ref_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
}

export const paymentRoutes = new Elysia({ prefix: '/payment' })

  // 创建支付意图
  .post('/orders/:id/pay', async ({ params, body, headers }) => {
    const tenantId = headers['x-tenant-id'] || 'aspen';
    const config = getTenantConfig(tenantId);

    const order = await orderRepo.findById(tenantId, params.id);
    if (!order) throw new Error('订单不存在');

    if (order.status !== 'pending') {
      throw new Error(`订单状态不正确: ${order.status}`);
    }

    const { paymentMethod } = body as any;
    const channel: PaymentChannelType = paymentMethod || getDefaultChannel(config?.payment);

    // 创建支付
    const paymentChannel = getPaymentChannel(channel, config?.payment);
    const result = await paymentChannel.createPayment({
      orderId: order.id,
      orderNo: order.orderNo,
      amount: Math.round(order.total * 100), // 转为分
      description: `订单 ${order.orderNo}`,
      channel,
      notifyUrl: channel !== 'simulate' ? config?.payment?.channels?.[channel]?.notifyUrl : undefined,
    });

    if (!result.success) {
      throw new Error(result.error || '创建支付失败');
    }

    // 记录交易
    await transactionRepo.create({
      id: generateTransactionId(),
      tenantId,
      orderId: order.id,
      transactionNo: result.transactionNo,
      channel,
      amount: Math.round(order.total * 100),
      status: 'pending',
      type: 'pay',
    });

    // 更新订单支付信息
    await orderRepo.update(tenantId, order.id, {
      paymentMethod: channel,
      paymentNo: result.transactionNo,
    } as any);

    return {
      success: true,
      transactionNo: result.transactionNo,
      channel,
      payParams: result.payParams,
      payForm: result.payForm,
      payUrl: result.payUrl,
      simulated: result.simulated,
    };
  })

  // 模拟支付确认 (仅开发环境)
  .post('/confirm/:transactionNo', async ({ params, headers }) => {
    const tenantId = headers['x-tenant-id'] || 'aspen';
    const config = getTenantConfig(tenantId);

    if ((config as any)?.payment?.mode !== 'simulate') {
      throw new Error('仅模拟模式支持手动确认');
    }

    const channel = getPaymentChannel('simulate');
    const confirmed = await (channel as any).confirmPayment(params.transactionNo);

    if (!confirmed) {
      throw new Error('交易不存在');
    }

    // 查找并更新订单状态
    const tx = await transactionRepo.findByTransactionNo(tenantId, params.transactionNo);
    if (tx) {
      await transactionRepo.update(tenantId, tx.id, { status: 'success' });
      await orderRepo.update(tenantId, tx.orderId, {
        status: 'paid',
      } as any);
    }

    return { success: true, message: '支付已确认' };
  })

  // 微信支付回调
  .post('/notify/wechat', async ({ headers, body }) => {
    const rawBody = typeof body === 'string' ? body : JSON.stringify(body);
    const channel = getPaymentChannel('wechat');
    const event = await channel.verifyWebhook(headers as Record<string, string>, rawBody);

    if (!event) {
      return { code: 'FAIL', message: '验证失败' };
    }

    if (event.eventType === 'payment.success') {
      const tx = await transactionRepo.findByTransactionNoAnyTenant(event.transactionNo);
      if (tx) {
        const { tenantId } = tx;
        await transactionRepo.update(tenantId, tx.id, { status: 'success' });
        await orderRepo.update(tenantId, tx.orderId, { status: 'paid' } as any);

        // 自动分账
        const tenantConfig = getTenantConfig(tenantId);
        const profitConfig = (tenantConfig?.payment as any)?.profitSharing;
        if (profitConfig?.enabled) {
          await createSharingOrder(tenantId, tx.orderId, tx.id, 'wechat', event.amount || 0, profitConfig);
        }
      }
    }

    return { code: 'SUCCESS', message: '成功' };
  })

  // 支付宝回调
.post('/notify/alipay', async ({ headers, body }) => {
    const tx = await transactionRepo.findByTransactionNoAnyTenant((body as any)?.transactionNo || '');
    const config = tx ? getTenantConfig(tx.tenantId) : null;
    const channel = getPaymentChannel('alipay', config?.payment);
    const event = await channel.verifyWebhook(headers as Record<string, string>, typeof body === 'string' ? body : JSON.stringify(body));

    if (!event) {
      return 'failure';
    }

    if (event.eventType === 'payment.success' && tx) {
      await transactionRepo.update(tx.tenantId, tx.id, { status: 'success' });
      await orderRepo.update(tx.tenantId, tx.orderId, { status: 'paid' } as any);
    }

    return 'success';
  })

  // 银联回调
  .post('/notify/unionpay', async ({ headers, body }) => {
    const rawBody = typeof body === 'string' ? body : JSON.stringify(body);
    const channel = getPaymentChannel('unionpay');
    const event = await channel.verifyWebhook(headers as Record<string, string>, rawBody);

    if (!event) {
      return { respCode: '99', respMsg: '验证失败' };
    }

    if (event.eventType === 'payment.success') {
      const tx = await transactionRepo.findByTransactionNoAnyTenant(event.transactionNo);
      if (tx) {
        const { tenantId } = tx;
        await transactionRepo.update(tenantId, tx.id, { status: 'success' });
        await orderRepo.update(tenantId, tx.orderId, { status: 'paid' } as any);
      }
    }

    return { respCode: '00', respMsg: '成功' };
  })

  // 查询支付状态
  .get('/orders/:id/status', async ({ params, headers }) => {
    const tenantId = headers['x-tenant-id'] || 'aspen';
    const order = await orderRepo.findById(tenantId, params.id);
    if (!order) throw new Error('订单不存在');

    const tx = await transactionRepo.findByOrderId(tenantId, order.id);
    if (!tx) {
      return { status: 'unpaid', order: { id: order.id, status: order.status } };
    }

    return {
      status: tx.status,
      transactionNo: tx.transactionNo,
      channel: tx.channel,
      order: { id: order.id, status: order.status },
    };
  })

  // 发起退款
  .post('/orders/:id/refund', async ({ params, body, headers }) => {
    const tenantId = headers['x-tenant-id'] || 'aspen';
    const config = getTenantConfig(tenantId);

    const order = await orderRepo.findById(tenantId, params.id);
    if (!order) throw new Error('订单不存在');

    if (!order.status || !['paid', 'confirmed', 'preparing', 'completed'].includes(order.status)) {
      throw new Error(`订单状态不允许退款: ${order.status}`);
    }

    const tx = await transactionRepo.findByOrderId(tenantId, order.id);
    if (!tx || !tx.transactionNo) throw new Error('无支付记录');

    const { reason, amount } = body as any;
    const refundAmount = amount || tx.amount;
    const refundNo = generateRefundNo();

    const channel = getPaymentChannel((tx.channel || 'simulate') as PaymentChannelType, config?.payment);
    const result = await channel.refund({
      transactionNo: tx.transactionNo,
      refundNo,
      amount: refundAmount,
      reason: reason || '用户申请退款',
    });

    if (!result.success) {
      throw new Error(result.error || '退款失败');
    }

    // 记录退款交易
    await transactionRepo.create({
      id: generateTransactionId(),
      tenantId,
      orderId: order.id,
      transactionNo: refundNo,
      channel: tx.channel,
      amount: refundAmount,
      status: 'success',
      type: 'refund',
    });

    // 更新订单状态
    await orderRepo.update(tenantId, order.id, {
      status: 'refunded',
    } as any);

    return {
      success: true,
      refundNo,
      refundAmount,
      message: '退款成功',
    };
  })

  // 查询分账状态
  .get('/orders/:id/profit-sharing', async ({ params, headers }) => {
    const tenantId = headers['x-tenant-id'] || 'aspen';
    const sharing = await querySharingStatus(tenantId, params.id);
    return { profitSharing: sharing };
  })

  // 手动触发分账结算
  .post('/profit-sharing/:id/settle', async ({ params, headers }) => {
    const tenantId = headers['x-tenant-id'] || 'aspen';
    const result = await settleSharingOrder(tenantId, params.id);
    return { success: true, profitSharing: result };
  })

  // 交易流水列表
  .get('/transactions', async ({ query, headers }) => {
    const tenantId = headers['x-tenant-id'] || 'aspen';
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 20;
    const channel = query.channel as string | undefined;
    const status = query.status as string | undefined;

    const result = await transactionRepo.findByTenant(tenantId, { page, pageSize, channel, status });

    return {
      transactions: result.transactions,
      total: result.total,
      page,
      pageSize,
    };
  });

export default paymentRoutes;
