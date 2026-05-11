/**
 * 支付流程测试
 * 验证创建支付、模拟确认、退款流程
 */

import { describe, it, expect } from 'vitest';

interface PaymentTransaction {
  id: string;
  orderId: string;
  amount: number;
  status: 'pending' | 'paid' | 'refunded' | 'failed';
  channel: string;
  createdAt: Date;
}

interface PaymentFlow {
  createPayment(orderId: string, amount: number): PaymentTransaction;
  confirmPayment(transactionId: string): boolean;
  refundPayment(transactionId: string): boolean;
  queryStatus(transactionId: string): PaymentTransaction;
}

// 模拟支付流程
class SimulatedPaymentFlow implements PaymentFlow {
  private transactions: Map<string, PaymentTransaction> = new Map();

  createPayment(orderId: string, amount: number): PaymentTransaction {
    const transaction: PaymentTransaction = {
      id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      orderId,
      amount,
      status: 'pending',
      channel: 'simulate',
      createdAt: new Date(),
    };
    this.transactions.set(transaction.id, transaction);
    return transaction;
  }

  confirmPayment(transactionId: string): boolean {
    const txn = this.transactions.get(transactionId);
    if (!txn || txn.status !== 'pending') return false;
    txn.status = 'paid';
    return true;
  }

  refundPayment(transactionId: string): boolean {
    const txn = this.transactions.get(transactionId);
    if (!txn || txn.status !== 'paid') return false;
    txn.status = 'refunded';
    return true;
  }

  queryStatus(transactionId: string): PaymentTransaction {
    const txn = this.transactions.get(transactionId);
    if (!txn) throw new Error('交易不存在');
    return txn;
  }
}

describe('Payment Flow', () => {
  const paymentFlow = new SimulatedPaymentFlow();

  describe('Create Payment', () => {
    it('should create payment with correct amount', () => {
      const orderId = 'order_123';
      const amount = 10000; // 分
      const txn = paymentFlow.createPayment(orderId, amount);

      expect(txn.orderId).toBe(orderId);
      expect(txn.amount).toBe(amount);
      expect(txn.status).toBe('pending');
      expect(txn.channel).toBe('simulate');
      expect(txn.id).toMatch(/^txn_/);
    });

    it('should generate unique transaction ID', () => {
      const txn1 = paymentFlow.createPayment('order_1', 1000);
      const txn2 = paymentFlow.createPayment('order_2', 2000);

      expect(txn1.id).not.toBe(txn2.id);
    });
  });

  describe('Confirm Payment (Simulate)', () => {
    it('should confirm pending payment', () => {
      const txn = paymentFlow.createPayment('order_123', 5000);
      const result = paymentFlow.confirmPayment(txn.id);

      expect(result).toBe(true);
      
      const updated = paymentFlow.queryStatus(txn.id);
      expect(updated.status).toBe('paid');
    });

    it('should not confirm non-pending payment', () => {
      const txn = paymentFlow.createPayment('order_123', 5000);
      paymentFlow.confirmPayment(txn.id);
      
      // 再次确认应该失败
      const result = paymentFlow.confirmPayment(txn.id);
      expect(result).toBe(false);
    });

    it('should not confirm non-existent payment', () => {
      const result = paymentFlow.confirmPayment('non_existent');
      expect(result).toBe(false);
    });
  });

  describe('Refund Payment', () => {
    it('should refund paid payment', () => {
      const txn = paymentFlow.createPayment('order_123', 5000);
      paymentFlow.confirmPayment(txn.id);
      
      const result = paymentFlow.refundPayment(txn.id);
      expect(result).toBe(true);
      
      const updated = paymentFlow.queryStatus(txn.id);
      expect(updated.status).toBe('refunded');
    });

    it('should not refund pending payment', () => {
      const txn = paymentFlow.createPayment('order_123', 5000);
      
      const result = paymentFlow.refundPayment(txn.id);
      expect(result).toBe(false);
    });

    it('should not refund already refunded payment', () => {
      const txn = paymentFlow.createPayment('order_123', 5000);
      paymentFlow.confirmPayment(txn.id);
      paymentFlow.refundPayment(txn.id);
      
      const result = paymentFlow.refundPayment(txn.id);
      expect(result).toBe(false);
    });
  });

  describe('Query Status', () => {
    it('should return correct status', () => {
      const txn = paymentFlow.createPayment('order_123', 5000);
      
      let status = paymentFlow.queryStatus(txn.id);
      expect(status.status).toBe('pending');
      
      paymentFlow.confirmPayment(txn.id);
      status = paymentFlow.queryStatus(txn.id);
      expect(status.status).toBe('paid');
      
      paymentFlow.refundPayment(txn.id);
      status = paymentFlow.queryStatus(txn.id);
      expect(status.status).toBe('refunded');
    });

    it('should throw for non-existent transaction', () => {
      expect(() => paymentFlow.queryStatus('non_existent')).toThrow('交易不存在');
    });
  });

  describe('Complete Payment Lifecycle', () => {
    it('should complete full flow: create -> confirm -> query', () => {
      // 1. 创建支付
      const orderId = 'order_full_flow';
      const amount = 19900;
      const txn = paymentFlow.createPayment(orderId, amount);
      
      expect(txn.status).toBe('pending');
      
      // 2. 模拟确认支付
      const confirmed = paymentFlow.confirmPayment(txn.id);
      expect(confirmed).toBe(true);
      
      // 3. 查询状态验证
      const status = paymentFlow.queryStatus(txn.id);
      expect(status.status).toBe('paid');
      expect(status.orderId).toBe(orderId);
      expect(status.amount).toBe(amount);
    });

    it('should support refund after payment', () => {
      const txn = paymentFlow.createPayment('order_refund', 10000);
      paymentFlow.confirmPayment(txn.id);
      
      // 退款
      const refunded = paymentFlow.refundPayment(txn.id);
      expect(refunded).toBe(true);
      
      // 验证退款后状态
      const status = paymentFlow.queryStatus(txn.id);
      expect(status.status).toBe('refunded');
    });
  });
});