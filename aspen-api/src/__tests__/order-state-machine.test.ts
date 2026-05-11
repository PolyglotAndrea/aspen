/**
 * 订单状态机测试
 * 验证非法状态转换被正确拒绝
 */

import { describe, it, expect } from 'vitest';

type OrderStatus = 'pending' | 'paid' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';

// 状态转换规则定义
const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['paid', 'cancelled'],
  paid: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['completed'],
  completed: [], // 终态，不能转换到其他状态
  cancelled: [], // 终态，不能转换到其他状态
};

function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

function validateTransition(from: OrderStatus, to: OrderStatus): { valid: boolean; error?: string } {
  if (from === to) {
    return { valid: false, error: '状态未改变' };
  }
  
  if (!ALLOWED_TRANSITIONS[from]) {
    return { valid: false, error: `未知状态: ${from}` };
  }
  
  if (ALLOWED_TRANSITIONS[from].includes(to)) {
    return { valid: true };
  }
  
  return { valid: false, error: `不允许从 ${from} 转换到 ${to}` };
}

describe('Order State Machine', () => {
  describe('Valid Transitions', () => {
    it('should allow pending -> paid', () => {
      expect(canTransition('pending', 'paid')).toBe(true);
      expect(validateTransition('pending', 'paid').valid).toBe(true);
    });

    it('should allow pending -> cancelled', () => {
      expect(canTransition('pending', 'cancelled')).toBe(true);
      expect(validateTransition('pending', 'cancelled').valid).toBe(true);
    });

    it('should allow paid -> confirmed', () => {
      expect(canTransition('paid', 'confirmed')).toBe(true);
      expect(validateTransition('paid', 'confirmed').valid).toBe(true);
    });

    it('should allow confirmed -> preparing', () => {
      expect(canTransition('confirmed', 'preparing')).toBe(true);
    });

    it('should allow preparing -> ready', () => {
      expect(canTransition('preparing', 'ready')).toBe(true);
    });

    it('should allow ready -> completed', () => {
      expect(canTransition('ready', 'completed')).toBe(true);
    });
  });

  describe('Invalid Transitions', () => {
    it('should reject pending -> confirmed directly', () => {
      expect(canTransition('pending', 'confirmed')).toBe(false);
      const result = validateTransition('pending', 'confirmed');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('不允许');
    });

    it('should reject completed -> cancelled', () => {
      expect(canTransition('completed', 'cancelled')).toBe(false);
      const result = validateTransition('completed', 'cancelled');
      expect(result.valid).toBe(false);
    });

    it('should reject cancelled -> paid', () => {
      expect(canTransition('cancelled', 'paid')).toBe(false);
      const result = validateTransition('cancelled', 'paid');
      expect(result.valid).toBe(false);
    });

    it('should reject ready -> preparing (reverse)', () => {
      expect(canTransition('ready', 'preparing')).toBe(false);
    });

    it('should reject completed -> ready (reverse)', () => {
      expect(canTransition('completed', 'ready')).toBe(false);
    });

    it('should reject paid -> ready (skipping steps)', () => {
      expect(canTransition('paid', 'ready')).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should reject same state transition', () => {
      const result = validateTransition('pending', 'pending');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('状态未改变');
    });

    it('should reject unknown source state', () => {
      const result = validateTransition('unknown' as any, 'paid');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('未知状态');
    });

    it('completed is terminal state', () => {
      expect(canTransition('completed', 'pending')).toBe(false);
      expect(canTransition('completed', 'cancelled')).toBe(false);
      expect(canTransition('completed', 'paid')).toBe(false);
    });

    it('cancelled is terminal state', () => {
      expect(canTransition('cancelled', 'pending')).toBe(false);
      expect(canTransition('cancelled', 'paid')).toBe(false);
      expect(canTransition('cancelled', 'completed')).toBe(false);
    });
  });

  describe('Complete Flow', () => {
    it('should follow complete order lifecycle', () => {
      // 正常流程: pending -> paid -> confirmed -> preparing -> ready -> completed
      const flow: OrderStatus[] = ['pending', 'paid', 'confirmed', 'preparing', 'ready', 'completed'];
      
      for (let i = 0; i < flow.length - 1; i++) {
        expect(canTransition(flow[i], flow[i + 1])).toBe(true);
      }
    });

    it('should allow cancellation at any pre-completed state', () => {
      const cancellableStates: OrderStatus[] = ['pending', 'paid', 'confirmed', 'preparing'];
      
      for (const state of cancellableStates) {
        expect(canTransition(state, 'cancelled')).toBe(true);
      }
    });
  });
});