/**
 * 订单辅助函数 (Order Helpers)
 * 从 order/index.ts 中提取的工具函数，保持主路由文件简洁
 */

import type { OrderItem, OrderStatus } from '../../config/tenant.types';

/**
 * 生成订单号
 */
export function generateOrderNo(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substr(2, 6).toUpperCase();
  return `ORD${dateStr}${random}`;
}

/**
 * 生成核销码
 */
export function generateVerifyCode(): string {
  return Math.random().toString(36).substr(2, 6).toUpperCase();
}

/**
 * 计算订单金额
 */
export function calculateOrderAmount(
  items: OrderItem[],
  deliveryFee?: number,
  packagingFee?: number,
  discount = 0,
  pointsAmount = 0,
): { subtotal: number; total: number } {
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const total = subtotal + (deliveryFee || 0) + (packagingFee || 0) - discount - pointsAmount;
  return { subtotal, total: Math.max(0, total) };
}

/**
 * 验证订单状态转换是否合法
 */
export function canTransitionStatus(current: OrderStatus, target: OrderStatus): boolean {
  const validTransitions: Record<OrderStatus, OrderStatus[]> = {
    pending: ['paid', 'cancelled'],
    paid: ['confirmed', 'cancelled', 'refunded'],
    confirmed: ['preparing', 'cancelled'],
    preparing: ['ready', 'cancelled'],
    ready: ['delivering', 'completed'],
    delivering: ['completed'],
    completed: [],
    cancelled: [],
    refunded: [],
  };
  return validTransitions[current]?.includes(target) || false;
}