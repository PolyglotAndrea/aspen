/**
 * 支付宝 OpenAPI v3 支付渠道
 * 支持 WAP 支付、订单查询、退款、回调验签
 */

import { createPrivateKey, createPublicKey, sign, verify } from 'crypto';
import type {
  PaymentChannel,
  CreatePaymentParams,
  PaymentResult,
  PaymentStatus,
  PaymentStatusType,
  RefundParams,
  RefundResult,
  WebhookEvent,
} from './types';

// ─── 配置 ────────────────────────────────────────────────────────────────────

export interface AlipayConfig {
  appId: string;
  privateKey: string;        // PKCS8 私钥 (带 BEGIN/END 标记)
  alipayPublicKey: string;   // 支付宝公钥 (带 BEGIN/END 标记)
  notifyUrl?: string;
  returnUrl?: string;
  sandbox?: boolean;         // 默认 true
}

// ─── 常量 ────────────────────────────────────────────────────────────────────

const GATEWAY_PRODUCTION = 'https://openapi.alipay.com/gateway.do';
const GATEWAY_SANDBOX = 'https://openapi-sandbox.dl.alipaydev.com/gateway.do';

// ─── 辅助函数 ────────────────────────────────────────────────────────────────

/**
 * 将参数按 key 的 ASCII 升序排列，拼接为 key=value&key=value 字符串。
 * 跳过 sign、空值和嵌套对象中不应参与签名的字段。
 */
function buildSignString(params: Record<string, string>): string {
  return Object.keys(params)
    .filter((key) => key !== 'sign' && params[key] !== '' && params[key] !== undefined && params[key] !== null)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');
}

/**
 * 使用 RSA2 (SHA256WithRSA) 对参数字符串进行签名，返回 Base64 编码结果。
 */
function signParams(params: Record<string, string>, privateKey: string): string {
  const content = buildSignString(params);
  const key = createPrivateKey(privateKey);
  const signature = sign('sha256', Buffer.from(content, 'utf-8'), key);
  return signature.toString('base64');
}

/**
 * 使用支付宝公钥验证 RSA2 签名。
 */
function verifySign(params: Record<string, string>, alipayPublicKey: string): boolean {
  const signValue = params['sign'];
  if (!signValue) return false;

  const paramsWithoutSign: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (key !== 'sign' && key !== 'sign_type') {
      paramsWithoutSign[key] = value;
    }
  }

  const content = buildSignString(paramsWithoutSign);
  const key = createPublicKey(alipayPublicKey);
  return verify('sha256', Buffer.from(content, 'utf-8'), key, Buffer.from(signValue, 'base64'));
}

/**
 * 生成自动提交的 HTML 表单，用于 WAP 支付跳转。
 */
function generatePayForm(
  bizContent: Record<string, any>,
  config: AlipayConfig,
): string {
  const gateway = config.sandbox ? GATEWAY_SANDBOX : GATEWAY_PRODUCTION;
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

  const params: Record<string, string> = {
    app_id: config.appId,
    method: 'alipay.trade.wap.pay',
    format: 'JSON',
    return_url: config.returnUrl || '',
    charset: 'utf-8',
    sign_type: 'RSA2',
    timestamp,
    version: '1.0',
    notify_url: config.notifyUrl || '',
    biz_content: JSON.stringify(bizContent),
  };

  // 删除空值字段
  for (const key of Object.keys(params)) {
    if (params[key] === '' || params[key] === undefined) {
      delete params[key];
    }
  }

  const signature = signParams(params, config.privateKey);
  params['sign'] = signature;

  const formFields = Object.entries(params)
    .map(([key, value]) => {
      const escaped = value
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      return `<input type="hidden" name="${key}" value="${escaped}" />`;
    })
    .join('\n    ');

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>支付宝支付</title></head>
<body>
  <form id="alipay_form" action="${gateway}" method="POST">
    ${formFields}
  </form>
  <script>document.getElementById('alipay_form').submit();</script>
</body>
</html>`;
}

// ─── 交易状态映射 ─────────────────────────────────────────────────────────────

function mapTradeStatus(tradeStatus: string): PaymentStatusType {
  switch (tradeStatus) {
    case 'TRADE_SUCCESS':
    case 'TRADE_FINISHED':
      return 'success';
    case 'WAIT_BUYER_PAY':
      return 'pending';
    case 'TRADE_CLOSED':
      return 'closed';
    default:
      return 'failed';
  }
}

// ─── AlipayPayment 类 ────────────────────────────────────────────────────────

export class AlipayPayment implements PaymentChannel {
  private config: AlipayConfig;
  private gateway: string;

  constructor(config: AlipayConfig) {
    this.config = config;
    this.gateway = config.sandbox !== false ? GATEWAY_SANDBOX : GATEWAY_PRODUCTION;
  }

  // ── 统一请求 ──────────────────────────────────────────────────────────────

  private async request(method: string, bizContent: Record<string, any>): Promise<any> {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    const params: Record<string, string> = {
      app_id: this.config.appId,
      method,
      format: 'JSON',
      charset: 'utf-8',
      sign_type: 'RSA2',
      timestamp,
      version: '1.0',
      biz_content: JSON.stringify(bizContent),
    };

    const signature = signParams(params, this.config.privateKey);
    params['sign'] = signature;

    const formBody = Object.entries(params)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');

    const response = await fetch(this.gateway, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formBody,
    });

    const json = await response.json();

    // 支付宝响应顶层键为 method 去掉前缀的驼峰形式，例如 alipay.trade.query -> alipay_trade_query_response
    const responseKey = method.replace(/\./g, '_') + '_response';
    const result = json[responseKey] || json;

    if (result.code && result.code !== '10000') {
      throw new Error(`Alipay API error [${result.code}]: ${result.sub_msg || result.msg}`);
    }

    return result;
  }

  // ── 创建支付 (WAP) ───────────────────────────────────────────────────────

  async createPayment(params: CreatePaymentParams): Promise<PaymentResult> {
    try {
      const bizContent: Record<string, any> = {
        out_trade_no: params.orderNo,
        total_amount: (params.amount / 100).toFixed(2), // 分转元
        subject: params.description || `订单 ${params.orderNo}`,
        product_code: 'QUICK_WAP_WAY',
      };

      if (params.notifyUrl || this.config.notifyUrl) {
        // notifyUrl 已在 generatePayForm 中处理
      }

      const payForm = generatePayForm(bizContent, {
        ...this.config,
        notifyUrl: params.notifyUrl || this.config.notifyUrl,
        returnUrl: params.returnUrl || this.config.returnUrl,
      });

      // WAP 支付采用同步返回表单方式，transactionNo 暂用 orderNo
      return {
        success: true,
        transactionNo: params.orderNo,
        channel: 'alipay',
        payForm,
      };
    } catch (err: any) {
      return {
        success: false,
        transactionNo: params.orderNo,
        channel: 'alipay',
        error: err.message,
      };
    }
  }

  // ── 查询订单 ─────────────────────────────────────────────────────────────

  async queryPayment(transactionNo: string): Promise<PaymentStatus> {
    const result = await this.request('alipay.trade.query', {
      out_trade_no: transactionNo,
    });

    return {
      transactionNo,
      status: mapTradeStatus(result.trade_status || ''),
      paidAt: result.send_pay_date || undefined,
      amount: result.total_amount ? Math.round(parseFloat(result.total_amount) * 100) : undefined,
      channelData: result,
    };
  }

  // ── 退款 ─────────────────────────────────────────────────────────────────

  async refund(params: RefundParams): Promise<RefundResult> {
    try {
      const result = await this.request('alipay.trade.refund', {
        out_trade_no: params.transactionNo,
        refund_amount: (params.amount / 100).toFixed(2),
        out_request_no: params.refundNo,
        refund_reason: params.reason || '',
      });

      return {
        success: result.code === '10000',
        refundNo: params.refundNo,
        refundAmount: params.amount,
      };
    } catch (err: any) {
      return {
        success: false,
        refundNo: params.refundNo,
        refundAmount: params.amount,
        error: err.message,
      };
    }
  }

  // ── 回调验签 ─────────────────────────────────────────────────────────────

  async verifyWebhook(
    headers: Record<string, string>,
    body: string,
  ): Promise<WebhookEvent | null> {
    try {
      // 支付宝回调参数以 form-urlencoded 形式放在 body 中
      const params: Record<string, string> = {};
      const searchParams = new URLSearchParams(body);
      searchParams.forEach((value, key) => {
        params[key] = value;
      });

      // 验签
      const isValid = verifySign(params, this.config.alipayPublicKey);
      if (!isValid) {
        console.error('[Payment:Alipay] Webhook signature verification failed');
        return null;
      }

      const tradeStatus = params['trade_status'];

      let eventType: WebhookEvent['eventType'];
      if (tradeStatus === 'TRADE_SUCCESS' || tradeStatus === 'TRADE_FINISHED') {
        eventType = 'payment.success';
      } else {
        // 支付宝异步通知不直接推送退款成功，退款走单独接口
        return null;
      }

      return {
        channel: 'alipay',
        eventType,
        transactionNo: params['out_trade_no'] || '',
        orderNo: params['out_trade_no'] || undefined,
        amount: params['total_amount'] ? Math.round(parseFloat(params['total_amount']) * 100) : undefined,
        rawData: params,
      };
    } catch (err) {
      console.error('[Payment:Alipay] Webhook processing error:', err);
      return null;
    }
  }
}
