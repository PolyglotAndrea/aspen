/**
 * 支付模块类型定义
 * 支持微信支付 v3、支付宝 OpenAPI v3、银联
 */

// 支付渠道
export type PaymentChannelType = 'wechat' | 'alipay' | 'unionpay' | 'simulate';

// 创建支付参数
export interface CreatePaymentParams {
  orderId: string;
  orderNo: string;
  amount: number; // 单位: 分
  description: string;
  channel: PaymentChannelType;
  openid?: string; // 微信 JSAPI 需要
  notifyUrl?: string;
  returnUrl?: string; // 支付宝/银联 WAP 回跳
  clientIp?: string;
  extra?: Record<string, any>;
}

// 支付结果
export interface PaymentResult {
  success: boolean;
  transactionNo: string;
  channel: PaymentChannelType;
  // 微信 JSAPI 返回支付参数
  payParams?: {
    appId?: string;
    timeStamp?: string;
    nonceStr?: string;
    package?: string;
    signType?: string;
    paySign?: string;
  };
  // 支付宝/银联 WAP 返回表单或 URL
  payForm?: string; // HTML form (支付宝)
  payUrl?: string; // 跳转 URL (银联)
  // 模拟模式
  simulated?: boolean;
  error?: string;
}

// 支付状态
export type PaymentStatusType = 'pending' | 'success' | 'failed' | 'refunded' | 'closed';

export interface PaymentStatus {
  transactionNo: string;
  status: PaymentStatusType;
  paidAt?: string;
  amount?: number;
  channelData?: Record<string, any>;
}

// 退款参数
export interface RefundParams {
  transactionNo: string;
  refundNo: string;
  amount: number; // 单位: 分
  reason?: string;
}

// 退款结果
export interface RefundResult {
  success: boolean;
  refundNo: string;
  refundAmount: number;
  error?: string;
}

// Webhook 事件
export interface WebhookEvent {
  channel: PaymentChannelType;
  eventType: 'payment.success' | 'refund.success' | 'refund.failed';
  transactionNo: string;
  orderNo?: string;
  amount?: number;
  rawData: any;
}

// 支付渠道接口
export interface PaymentChannel {
  createPayment(params: CreatePaymentParams): Promise<PaymentResult>;
  queryPayment(transactionNo: string): Promise<PaymentStatus>;
  refund(params: RefundParams): Promise<RefundResult>;
  verifyWebhook(headers: Record<string, string>, body: string): Promise<WebhookEvent | null>;
}

// 分账接收方
export interface ProfitSharingReceiver {
  name: string; // "platform" | "store" | "agent"
  ratio: number; // 0-1, 比例
  receiverId: string; // 商户号或个人 openid
  receiverType: 'merchant' | 'personal';
  description?: string;
}

// 分账配置
export interface ProfitSharingConfig {
  enabled: boolean;
  receivers: ProfitSharingReceiver[];
}

// 分账订单
export interface ProfitSharingOrder {
  id: string;
  orderId: string;
  transactionNo: string;
  channel: PaymentChannelType;
  totalAmount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  receivers: {
    name: string;
    receiverId: string;
    amount: number;
    status: 'pending' | 'success' | 'failed';
  }[];
  createdAt: string;
  completedAt?: string;
}

// 租户支付配置
export interface TenantPaymentConfig {
  mode: 'simulate' | 'sandbox' | 'production';
  channels: {
    wechat?: {
      enabled: boolean;
      mchid: string;
      appId: string;
      apiV3Key: string;
      privateKeyPath: string;
      serialNo: string;
      notifyUrl?: string;
    };
    alipay?: {
      enabled: boolean;
      appId: string;
      privateKey: string;
      alipayPublicKey: string;
      notifyUrl?: string;
      returnUrl?: string;
    };
    unionpay?: {
      enabled: boolean;
      mid: string; // 商户号
      tid: string; // 终端号
      certPath: string;
      certPassword: string;
      notifyUrl?: string;
    };
  };
  profitSharing?: ProfitSharingConfig;
}
