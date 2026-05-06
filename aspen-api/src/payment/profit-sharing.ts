/**
 * 分账服务 (Profit Sharing)
 * 支持多级分账，按订单灵活配置
 */

import type { ProfitSharingConfig, ProfitSharingReceiver, PaymentChannelType } from './types';
import { profitSharingRepo } from '../repositories/profit-sharing.repo';

function generateSharingId(): string {
  return `ps_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
}

/**
 * 验证分账配置
 */
function validateConfig(config: ProfitSharingConfig): void {
  if (!config.enabled) return;
  if (!config.receivers || config.receivers.length === 0) {
    throw new Error('分账配置至少需要一个接收方');
  }

  const totalRatio = config.receivers.reduce((sum, r) => sum + r.ratio, 0);
  if (Math.abs(totalRatio - 1.0) > 0.001) {
    throw new Error(`分账比例总和必须为 1.0，当前为 ${totalRatio.toFixed(4)}`);
  }

  for (const receiver of config.receivers) {
    if (receiver.ratio <= 0 || receiver.ratio > 1) {
      throw new Error(`分账比例必须在 0-1 之间: ${receiver.name}`);
    }
    if (!receiver.receiverId) {
      throw new Error(`分账接收方 ID 不能为空: ${receiver.name}`);
    }
  }
}

/**
 * 创建分账订单
 */
export async function createSharingOrder(
  tenantId: string,
  orderId: string,
  transactionId: string,
  channel: PaymentChannelType,
  totalAmount: number,
  config: ProfitSharingConfig,
): Promise<any> {
  validateConfig(config);

  const sharingId = generateSharingId();

  // 计算各方金额
  const receiverDetails = config.receivers.map((r: ProfitSharingReceiver) => ({
    name: r.name,
    receiverId: r.receiverId,
    amount: Math.round(totalAmount * r.ratio),
    status: 'pending' as const,
  }));

  // 修正尾差
  const calculatedTotal = receiverDetails.reduce((sum, r) => sum + r.amount, 0);
  const diff = totalAmount - calculatedTotal;
  if (diff !== 0 && receiverDetails.length > 0) {
    receiverDetails[receiverDetails.length - 1].amount += diff;
  }

  // 存储配置 (包含接收方明细)
  const storedConfig = {
    ...config,
    receiverDetails,
  };

  await profitSharingRepo.create({
    id: sharingId,
    tenantId,
    orderId,
    transactionId,
    totalAmount,
    config: storedConfig,
    status: 'pending',
  });

  console.log(`[ProfitSharing] Created: ${sharingId} for order ${orderId}, total: ¥${(totalAmount / 100).toFixed(2)}`);

  return {
    id: sharingId,
    orderId,
    transactionId,
    totalAmount,
    status: 'pending',
    receivers: receiverDetails,
    createdAt: new Date().toISOString(),
  };
}

/**
 * 执行分账 (调用支付渠道 API)
 * 在模拟模式下自动成功
 */
export async function settleSharingOrder(
  tenantId: string,
  sharingOrderId: string,
): Promise<any> {
  const order = await profitSharingRepo.findById(tenantId, sharingOrderId);
  if (!order) throw new Error('分账订单不存在');

  if (order.status !== 'pending') {
    throw new Error(`分账订单状态不正确: ${order.status}`);
  }

  // 模拟分账成功
  await profitSharingRepo.settle(sharingOrderId);

  console.log(`[ProfitSharing] Settled: ${sharingOrderId}`);

  return {
    ...order,
    status: 'settled',
    settledAt: new Date().toISOString(),
  };
}

/**
 * 查询分账状态
 */
export async function querySharingStatus(
  tenantId: string,
  orderId: string,
): Promise<any | null> {
  return profitSharingRepo.findByOrderId(tenantId, orderId);
}

/**
 * 取消分账
 */
export async function cancelSharingOrder(
  tenantId: string,
  sharingOrderId: string,
): Promise<void> {
  const order = await profitSharingRepo.findById(tenantId, sharingOrderId);
  if (!order) throw new Error('分账订单不存在');

  if (order.status === 'settled') {
    throw new Error('已结算的分账不能取消');
  }

  await profitSharingRepo.update(tenantId, sharingOrderId, { status: 'failed' });
  console.log(`[ProfitSharing] Cancelled: ${sharingOrderId}`);
}
