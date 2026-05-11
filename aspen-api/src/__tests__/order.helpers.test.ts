/**
 * 单元测试 - 订单辅助函数
 * 运行: cd aspen-api && npx vitest run src/__tests__/order.helpers.test.ts
 */

import { describe, it, expect } from 'vitest';

// 动态导入以避免循环依赖
async function loadHelpers() {
  return import('../../src/modules/order/order.helpers');
}

describe('Order Helpers', () => {
  it('should generate order number with correct format', async () => {
    const { generateOrderNo } = await loadHelpers();
    const orderNo = generateOrderNo();
    expect(orderNo).toMatch(/^ORD\d{8}[A-Z0-9]{6}$/);
  });

  it('should generate verify code with correct length', async () => {
    const { generateVerifyCode } = await loadHelpers();
    const code = generateVerifyCode();
    expect(code).toMatch(/^[A-Z0-9]{6}$/);
  });

  it('should calculate order amount correctly', async () => {
    const { calculateOrderAmount } = await loadHelpers();
    const items = [
      { subtotal: 100 },
      { subtotal: 200 },
    ] as any;
    const result = calculateOrderAmount(items, 10, 5, 20, 0);
    expect(result.subtotal).toBe(300);
    expect(result.total).toBe(295); // 300 + 10 + 5 - 20 - 0
  });

  it('should validate status transitions correctly', async () => {
    const { canTransitionStatus } = await loadHelpers();
    expect(canTransitionStatus('pending', 'paid')).toBe(true);
    expect(canTransitionStatus('pending', 'confirmed')).toBe(false);
    expect(canTransitionStatus('paid', 'cancelled')).toBe(true);
    expect(canTransitionStatus('completed', 'cancelled')).toBe(false);
  });
});