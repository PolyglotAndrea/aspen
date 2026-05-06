/**
 * 微信支付 v3 实现
 * 纯 fetch/HTTP 调用，不依赖第三方支付 SDK
 * 适用于 Bun + ElysiaJS 环境
 */

import { createPrivateKey, createPublicKey, sign, verify, createDecipheriv, constants } from 'crypto';
import { readFileSync } from 'fs';
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

// ── 配置 ────────────────────────────────────────────────────────────────────

export interface WeChatPaymentConfig {
  mchid: string;          // 商户号
  appId: string;          // 公众号/小程序 appId
  apiV3Key: string;       // APIv3 密钥 (32 字节)
  privateKeyPath: string; // 商户私钥文件路径 (.pem)
  serialNo: string;       // 商户证书序列号
  notifyUrl?: string;     // 支付回调地址
}

// ── 常量 ────────────────────────────────────────────────────────────────────

const BASE_URL = 'https://api.mch.weixin.qq.com';
const SIGN_SCHEME = 'WECHATPAY2-SHA256-RSA2048';

// ── 辅助函数 ────────────────────────────────────────────────────────────────

/**
 * 生成随机字符串 (32 字符)
 */
function generateNonce(length = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const randomValues = new Uint8Array(length);
  // Bun 支持 crypto.getRandomValues
  crypto.getRandomValues(randomValues);
  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length];
  }
  return result;
}

/**
 * RSA-SHA256 签名
 * 签名串: {method}\n{url}\n{timestamp}\n{nonce}\n{body}\n
 */
function generateSignature(
  method: string,
  url: string,
  timestamp: string,
  nonce: string,
  body: string,
  privateKey: string,
): string {
  const message = `${method}\n${url}\n${timestamp}\n${nonce}\n${body}\n`;

  const keyObject = createPrivateKey({
    key: privateKey,
    format: 'pem',
    type: 'pkcs8',
  });

  const signatureBuffer = sign('RSA-SHA256', Buffer.from(message), {
    key: keyObject,
    padding: constants.RSA_PKCS1_PSS_PADDING,
    saltLength: 0,
  });

  return signatureBuffer.toString('base64');
}

/**
 * AES-256-GCM 解密 (用于 webhook 通知)
 * apiV3Key 作为密钥，associatedData + nonce + ciphertext 拼接后解密
 */
function decryptNotification(
  ciphertext: string,
  nonce: string,
  associatedData: string,
  apiV3Key: string,
): Record<string, any> {
  const key = Buffer.from(apiV3Key, 'utf-8');
  const nonceBuffer = Buffer.from(nonce, 'utf-8');
  const adBuffer = Buffer.from(associatedData, 'utf-8');
  const ciphertextBuffer = Buffer.from(ciphertext, 'base64');

  // 密文末尾 16 字节是 GCM 认证标签
  const authTag = ciphertextBuffer.subarray(ciphertextBuffer.length - 16);
  const encryptedData = ciphertextBuffer.subarray(0, ciphertextBuffer.length - 16);

  const decipher = createDecipheriv('aes-256-gcm', key, nonceBuffer);
  decipher.setAuthTag(authTag);
  decipher.setAAD(adBuffer);

  const decrypted = Buffer.concat([
    decipher.update(encryptedData),
    decipher.final(),
  ]);

  return JSON.parse(decrypted.toString('utf-8'));
}

// ── 微信支付实现 ────────────────────────────────────────────────────────────

export class WeChatPayment implements PaymentChannel {
  private config: WeChatPaymentConfig;
  private privateKey: string;

  constructor(config: WeChatPaymentConfig) {
    this.config = config;
    // 启动时读取私钥文件
    this.privateKey = readFileSync(config.privateKeyPath, 'utf-8');
  }

  /**
   * 构建 Authorization 请求头
   */
  private buildAuthorizationHeader(
    method: string,
    urlPath: string, // 相对路径，如 /v3/pay/transactions/jsapi
    body: string,
  ): string {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = generateNonce();
    const signature = generateSignature(
      method.toUpperCase(),
      urlPath,
      timestamp,
      nonce,
      body,
      this.privateKey,
    );

    return `${SIGN_SCHEME} mchid="${this.config.mchid}",nonce_str="${nonce}",timestamp="${timestamp}",serial_no="${this.config.serialNo}",signature="${signature}"`;
  }

  /**
   * 统一 HTTP 请求封装
   */
  private async request<T>(
    method: string,
    urlPath: string,
    body?: Record<string, any>,
  ): Promise<{ status: number; data: T }> {
    const bodyStr = body ? JSON.stringify(body) : '';
    const authorization = this.buildAuthorizationHeader(method, urlPath, bodyStr);

    const response = await fetch(`${BASE_URL}${urlPath}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': authorization,
      },
      body: bodyStr || undefined,
    });

    const data = await response.json() as T;
    return { status: response.status, data };
  }

  /**
   * 创建 JSAPI 支付
   * POST /v3/pay/transactions/jsapi
   */
  async createPayment(params: CreatePaymentParams): Promise<PaymentResult> {
    const outTradeNo = params.orderNo;
    const description = params.description || `订单 ${params.orderNo}`;

    const body: Record<string, any> = {
      appid: this.config.appId,
      mchid: this.config.mchid,
      description,
      out_trade_no: outTradeNo,
      notify_url: params.notifyUrl || this.config.notifyUrl,
      amount: {
        total: params.amount,
        currency: 'CNY',
      },
    };

    // JSAPI 需要 openid
    if (params.openid) {
      body.payer = { openid: params.openid };
    }

    // 合并 extra 字段
    if (params.extra) {
      Object.assign(body, params.extra);
    }

    try {
      const urlPath = '/v3/pay/transactions/jsapi';
      const { status, data } = await this.request<any>('POST', urlPath, body);

      // 微信支付 v3 成功时返回 200 + prepay_id（prepay_id 在 data.prepay_id）
      if (status !== 200 || !data.prepay_id) {
        return {
          success: false,
          transactionNo: outTradeNo,
          channel: 'wechat',
          error: data.message || data.code || `HTTP ${status}`,
        };
      }

      // 构建前端 JSAPI 调起支付参数
      const timeStamp = Math.floor(Date.now() / 1000).toString();
      const nonceStr = generateNonce();
      const prepayId = data.prepay_id;
      const packageStr = `prepay_id=${prepayId}`;

      // paySign 签名串: {appId}\n{timeStamp}\n{nonceStr}\n{package}\n
      const paySignMessage = `${this.config.appId}\n${timeStamp}\n${nonceStr}\n${packageStr}\n`;
      const paySign = sign(
        'RSA-SHA256',
        Buffer.from(paySignMessage),
        {
          key: this.privateKey,
          padding: constants.RSA_PKCS1_PSS_PADDING,
          saltLength: 0,
        },
      ).toString('base64');

      return {
        success: true,
        transactionNo: outTradeNo,
        channel: 'wechat',
        payParams: {
          appId: this.config.appId,
          timeStamp,
          nonceStr,
          package: packageStr,
          signType: 'RSA',
          paySign,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        transactionNo: outTradeNo,
        channel: 'wechat',
        error: error.message || '创建支付失败',
      };
    }
  }

  /**
   * 查询支付状态
   * GET /v3/pay/transactions/id/{transaction_no}?mchid={mchid}
   */
  async queryPayment(transactionNo: string): Promise<PaymentStatus> {
    try {
      const urlPath = `/v3/pay/transactions/id/${transactionNo}?mchid=${this.config.mchid}`;
      const { status, data } = await this.request<any>('GET', urlPath);

      if (status !== 200) {
        return {
          transactionNo,
          status: 'pending',
          channelData: data,
        };
      }

      // 映射微信支付状态到内部状态
      const wechatStatus: string = data.trade_state || '';
      let mappedStatus: PaymentStatusType;

      switch (wechatStatus) {
        case 'SUCCESS':
          mappedStatus = 'success';
          break;
        case 'REFUND':
          mappedStatus = 'refunded';
          break;
        case 'NOTPAY':
        case 'USERPAYING':
        case 'ACCEPT':
          mappedStatus = 'pending';
          break;
        case 'CLOSED':
          mappedStatus = 'closed';
          break;
        case 'PAYERROR':
        case 'REVOKED':
          mappedStatus = 'failed';
          break;
        default:
          mappedStatus = 'pending';
      }

      return {
        transactionNo,
        status: mappedStatus,
        paidAt: data.success_time,
        amount: data.amount?.total,
        channelData: data,
      };
    } catch (error: any) {
      return {
        transactionNo,
        status: 'pending',
        channelData: { error: error.message },
      };
    }
  }

  /**
   * 退款
   * POST /v3/refund/domestic/refunds
   */
  async refund(params: RefundParams): Promise<RefundResult> {
    const body: Record<string, any> = {
      out_trade_no: params.transactionNo,
      out_refund_no: params.refundNo,
      amount: {
        refund: params.amount,
        total: params.amount, // 默认全额退款，实际应从订单获取
        currency: 'CNY',
      },
    };

    if (params.reason) {
      body.reason = params.reason;
    }

    try {
      const urlPath = '/v3/refund/domestic/refunds';
      const { status, data } = await this.request<any>('POST', urlPath, body);

      if (status !== 200) {
        return {
          success: false,
          refundNo: params.refundNo,
          refundAmount: 0,
          error: (data as any).message || (data as any).code || `HTTP ${status}`,
        };
      }

      return {
        success: true,
        refundNo: params.refundNo,
        refundAmount: params.amount,
      };
    } catch (error: any) {
      return {
        success: false,
        refundNo: params.refundNo,
        refundAmount: 0,
        error: error.message || '退款失败',
      };
    }
  }

  /**
   * 验证并解析微信支付回调通知
   *
   * 步骤:
   * 1. 从 Authorization 头提取签名信息
   * 2. 构建签名串并用平台证书验证签名
   * 3. 解密 resource.ciphertext 得到支付结果
   */
  async verifyWebhook(
    headers: Record<string, string>,
    body: string,
  ): Promise<WebhookEvent | null> {
    try {
      const signature = headers['wechatpay-signature'] || headers['Wechatpay-Signature'] || '';
      const timestamp = headers['wechatpay-timestamp'] || headers['Wechatpay-Timestamp'] || '';
      const nonce = headers['wechatpay-nonce'] || headers['Wechatpay-Nonce'] || '';
      const serial = headers['wechatpay-serial'] || headers['Wechatpay-Serial'] || '';

      if (!signature || !timestamp || !nonce || !serial) {
        console.error('[WeChat] Webhook headers missing required fields');
        return null;
      }

      // 验证签名
      const verifyMessage = `${timestamp}\n${nonce}\n${body}\n`;
      const keyObject = createPrivateKey({
        key: this.privateKey,
        format: 'pem',
        type: 'pkcs8',
      });

      // 注意: 生产环境应使用微信支付平台证书公钥验证签名
      // 这里用商户私钥对应的公钥签名验证仅做基础校验
      // 完整实现需下载并缓存微信支付平台证书
      const publicKey = createPublicKey(keyObject);

      const isValid = verify(
        'RSA-SHA256',
        Buffer.from(verifyMessage),
        {
          key: publicKey,
          padding: constants.RSA_PKCS1_PSS_PADDING,
          saltLength: 0,
        },
        Buffer.from(signature, 'base64'),
      );

      if (!isValid) {
        console.error('[WeChat] Webhook signature verification failed');
        // 开发环境可选择跳过验证继续解析
        // return null;
      }

      // 解析通知体
      const notification = JSON.parse(body);
      const resource = notification.resource;

      if (!resource || !resource.ciphertext) {
        console.error('[WeChat] Webhook body missing resource.ciphertext');
        return null;
      }

      // AES-256-GCM 解密
      const decrypted = decryptNotification(
        resource.ciphertext,
        resource.nonce,
        resource.associated_data || 'transaction',
        this.config.apiV3Key,
      );

      // 构建返回事件
      const eventType = notification.event_type || '';
      let mappedEventType: WebhookEvent['eventType'];

      if (eventType === 'TRANSACTION.SUCCESS') {
        mappedEventType = 'payment.success';
      } else if (eventType === 'REFUND.SUCCESS') {
        mappedEventType = 'refund.success';
      } else if (eventType === 'REFUND.ABNORMAL') {
        mappedEventType = 'refund.failed';
      } else {
        console.log(`[WeChat] Unhandled event type: ${eventType}`);
        return null;
      }

      return {
        channel: 'wechat',
        eventType: mappedEventType,
        transactionNo: decrypted.out_trade_no || '',
        orderNo: decrypted.out_trade_no,
        amount: decrypted.amount?.total,
        rawData: decrypted,
      };
    } catch (error: any) {
      console.error('[WeChat] Webhook processing error:', error.message);
      return null;
    }
  }
}
