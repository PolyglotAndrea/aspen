/**
 * 模拟支付渠道
 * 开发环境默认使用，所有操作立即成功
 */

import type { PaymentChannel, CreatePaymentParams, PaymentResult, PaymentStatus, RefundParams, RefundResult, WebhookEvent } from './types';

export class SimulatePayment implements PaymentChannel {
  private transactions = new Map<string, PaymentStatus>();

  async createPayment(params: CreatePaymentParams): Promise<PaymentResult> {
    const transactionNo = `SIM_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;

    this.transactions.set(transactionNo, {
      transactionNo,
      status: 'pending',
      amount: params.amount,
    });

    console.log(`[Payment:Simulate] Created: ${transactionNo} for order ${params.orderNo}, amount: ¥${(params.amount / 100).toFixed(2)}`);

    return {
      success: true,
      transactionNo,
      channel: 'simulate',
      simulated: true,
    };
  }

  async queryPayment(transactionNo: string): Promise<PaymentStatus> {
    const tx = this.transactions.get(transactionNo);
    if (!tx) {
      return { transactionNo, status: 'pending' };
    }
    return tx;
  }

  // 模拟支付确认 (外部调用，模拟回调)
  async confirmPayment(transactionNo: string): Promise<boolean> {
    const tx = this.transactions.get(transactionNo);
    if (!tx) return false;

    tx.status = 'success';
    tx.paidAt = new Date().toISOString();
    this.transactions.set(transactionNo, tx);

    console.log(`[Payment:Simulate] Confirmed: ${transactionNo}`);
    return true;
  }

  async refund(params: RefundParams): Promise<RefundResult> {
    const tx = this.transactions.get(params.transactionNo);
    if (tx) {
      tx.status = 'refunded';
      this.transactions.set(params.transactionNo, tx);
    }

    console.log(`[Payment:Simulate] Refunded: ${params.refundNo}, amount: ¥${(params.amount / 100).toFixed(2)}`);

    return {
      success: true,
      refundNo: params.refundNo,
      refundAmount: params.amount,
    };
  }

  async verifyWebhook(_headers: Record<string, string>, _body: string): Promise<WebhookEvent | null> {
    // 模拟渠道不使用 webhook
    return null;
  }
}

// 单例
export const simulatePayment = new SimulatePayment();
