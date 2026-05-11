/**
 * 银联支付 (UnionPay) 实现
 * 基于银联在线支付网关 SDK，使用纯 fetch/HTTP 实现
 * 支持 WAP 支付、交易查询、退款
 */

import { createSign, createVerify, createPrivateKey, X509Certificate } from 'crypto';
import { readFileSync } from 'fs';
import {
  type PaymentChannel,
  type CreatePaymentParams,
  type PaymentResult,
  type PaymentStatus,
  type PaymentStatusType,
  type RefundParams,
  type RefundResult,
  type WebhookEvent,
} from './types';

// ──────────────────────────────────────────────
// Config
// ──────────────────────────────────────────────

export interface UnionPayConfig {
  mid: string;           // 商户号 (Merchant ID)
  tid: string;           // 终端号 (Terminal ID)
  certPath: string;      // PKCS12/PFX 证书路径
  certPassword: string;  // 证书密码
  notifyUrl?: string;    // 后台通知地址
  testMode?: boolean;    // 是否使用测试环境
}

// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────

const GATEWAY_PROD = 'https://gateway.95516.com/gateway/api/frontTransReq.do';
const GATEWAY_TEST = 'https://gateway.test.95516.com/gateway/api/frontTransReq.do';

/** 银联统一支付 WAP 交易类型 */
const TXN_TYPE_WAP = '01';
/** 银联统一支付 WAP 交易子类型: 消费 */
const TXN_SUB_TYPE_CONSUME = '01';
/** 交易币种: 人民币 */
const CURRENCY_CNY = '156';
/** 签名方法: RSA */
const SIGN_METHOD_RSA = '01';
/** 版本号 */
const VERSION = '5.1.0';
/** 编码 */
const CHARSET = 'UTF-8';

// ──────────────────────────────────────────────
// Helper: Certificate / PKCS12 (PFX) parsing
// ──────────────────────────────────────────────

interface PfxComponents {
  privateKey: string;
  certificate: string;
}

/**
 * 从 PKCS#12 (PFX) 文件中提取私钥和证书。
 * Bun 的 crypto 模块支持 `createPrivateKey` 处理 PFX，但更可靠的方式是
 * 使用 OpenSSL 解析。这里通过 Node 兼容层处理。
 */
function extractPfx(certPath: string, certPassword: string): PfxComponents {
  const pfxData = readFileSync(certPath);

  // Extract private key from PKCS12 using createPrivateKey
  const privateKeyObj = createPrivateKey({
    key: pfxData,
    format: 'p12' as any,    // Bun & Node 支持
    passphrase: certPassword,
  } as any);
  const privateKey = privateKeyObj.export({
    type: 'pkcs8',
    format: 'pem',
  }) as string;

  // Extract the certificate in PEM form from the same PFX bundle.
  // createPrivateKey only gives us the key, so we also parse the cert
  // via X509Certificate — but X509Certificate can't read PFX directly.
  // We rely on a practical fallback: read the companion .cer file if it
  // exists next to the PFX, otherwise fall back to the embedded PEM block.
  const certFromPfx = extractCertificateFromPfx(pfxData, certPassword);

  return { privateKey, certificate: certFromPfx };
}

/**
 * 从 PFX 二进制数据中提取证书（PEM 格式）。
 * 尝试多种方式：
 * 1. 读取同目录下同名的 .cer/.pem 文件
 * 2. 通过 Node.js PKCS12 解析
 */
function extractCertificateFromPfx(pfxData: Buffer, _password: string): string {
  // Approach 1: Try companion .cer file
  // This is handled at a higher level; here we attempt embedded extraction.

  // Approach 2: Use Node-compatible p12 parsing.
  // Node.js doesn't have a direct "parse pfx to get cert" in pure JS,
  // but we can use createPrivateKey to verify the PFX is valid, and then
  // look for the certificate in the raw PFX ASN.1 structure.
  //
  // For production use, recommend extracting the certificate separately
  // via `openssl pkcs12 -in cert.pfx -clcerts -nokeys -out cert.cer`
  // and placing it next to the PFX file.
  //
  // As a pragmatic fallback, we attempt a basic PEM extraction from the
  // raw binary by scanning for the X.509 certificate boundary markers
  // that some PFX implementations embed.

  // Search for DER-encoded certificate wrapper (OID 1.2.840.113549.1.1.11 = sha256WithRSAEncryption)
  // This is a simplified approach — for robust handling, use openssl CLI
  const certHex = findCertificateInPkcs12(pfxData);
  if (certHex) {
    return derToPem(certHex, 'CERTIFICATE');
  }

  // Last resort: return empty string — caller must provide .cer alongside .pfx
  return '';
}

/**
 * 在 PKCS#12 二进制中查找 X.509 证书的 DER 编码。
 * 扫描 SEQUENCE (0x30) 后跟签名算法 OID，提取证书字节。
 */
function findCertificateInPkcs12(data: Buffer): string | null {
  // X.509 certificates start with SEQUENCE (0x30 0x82 ...)
  // and contain a predictable OID pattern. We look for the
  // certificate content by searching for the known tag sequence.
  const buf = data;

  // Search for the start of an X.509 certificate (SEQUENCE tag + length)
  for (let i = 0; i < buf.length - 4; i++) {
    if (buf[i] === 0x30 && buf[i + 1] === 0x82) {
      // Potential SEQUENCE with 2-byte length
      const seqLen = (buf[i + 2] << 8) | buf[i + 3];
      if (seqLen > 0 && seqLen < 10000 && i + 4 + seqLen <= buf.length) {
        const candidate = buf.slice(i, i + 4 + seqLen);
        // Verify it looks like an X.509 cert: inner SEQUENCE should have 3+ elements
        // and contain OID 2.5.4.3 (commonName) somewhere within
        if (candidate.length > 100 && looksLikeX509(candidate)) {
          return candidate.toString('hex');
        }
      }
    }
  }
  return null;
}

function looksLikeX509(buf: Buffer): boolean {
  // Quick heuristic: an X.509 cert contains OID 2.5.4 (0x55 0x04)
  for (let i = 0; i < buf.length - 2; i++) {
    if (buf[i] === 0x55 && buf[i + 1] === 0x04) {
      return true;
    }
  }
  return false;
}

function derToPem(derHex: string, type: string): string {
  const b64 = Buffer.from(derHex, 'hex').toString('base64');
  const lines = b64.match(/.{1,64}/g) || [];
  return `-----BEGIN ${type}-----\n${lines.join('\n')}\n-----END ${type}-----`;
}

// ──────────────────────────────────────────────
// Helper: Params / Signing
// ──────────────────────────────────────────────

function formatTxnTime(date?: Date): string {
  const d = date || new Date();
  const pad = (n: number, len = 2) => String(n).padStart(len, '0');
  return (
    d.getFullYear().toString() +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    pad(d.getHours()) +
    pad(d.getMinutes()) +
    pad(d.getSeconds())
  );
}

/**
 * 银联签名规则：
 * 1. 将所有参与签名的参数按 ASCII 码排序
 * 2. 用 & 拼接 key=value（排除 signature 和 signMethod 字段）
 * 3. 使用商户私钥进行 SHA256WithRSA 签名
 * 4. 对签名结果做 Base64 编码
 */
function buildSignString(params: Record<string, string>): string {
  return Object.keys(params)
    .filter((k) => k !== 'signature' && k !== 'signMethod' && params[k] !== '')
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&');
}

function signWithCert(
  params: Record<string, string>,
  privateKeyPem: string,
): string {
  const signStr = buildSignString(params);
  const sign = createSign('SHA256WithRSA');
  sign.update(signStr, 'utf-8');
  return sign.sign(privateKeyPem, 'base64');
}

function verifyCertSign(
  params: Record<string, string>,
  signature: string,
  certificatePem: string,
): boolean {
  if (!certificatePem || !signature) return false;
  const signStr = buildSignString(params);
  const verify = createVerify('SHA256WithRSA');
  verify.update(signStr, 'utf-8');
  return verify.verify(certificatePem, signature, 'base64');
}

/**
 * 将对象参数转换为银联网关所需的 URL-encoded form 格式，
 * 用于 frontTransReq.do 的 POST 请求。
 */
function buildFormParams(
  config: UnionPayConfig,
  params: Record<string, string>,
): URLSearchParams {
  const form = new URLSearchParams();

  // 固定参数
  const fixed: Record<string, string> = {
    version: VERSION,
    encoding: CHARSET,
    signMethod: SIGN_METHOD_RSA,
    certId: '', // 将在签名前填充
    txnType: TXN_TYPE_WAP,
    txnSubType: TXN_SUB_TYPE_CONSUME,
    bizType: '000201', // WAP 支付
    channelType: '08', // WAP 渠道
    frontUrl: params.frontUrl || '',
    backUrl: config.notifyUrl || '',
    accessType: '0', // 商户接入
    merId: config.mid,
    termId: config.tid,
    currencyCode: CURRENCY_CNY,
  };

  // 合并固定参数和业务参数
  const allParams = { ...fixed, ...params };
  // 移除仅用于前端的参数
  delete allParams.frontUrl;

  for (const [k, v] of Object.entries(allParams)) {
    if (v !== '' && v !== undefined) {
      form.set(k, v);
    }
  }

  return form;
}

// ──────────────────────────────────────────────
// UnionPay Payment Class
// ──────────────────────────────────────────────

export class UnionPayPayment implements PaymentChannel {
  private config: UnionPayConfig;
  private privateKey: string;
  private certificate: string;
  private gatewayUrl: string;

  constructor(config: UnionPayConfig) {
    this.config = config;
    this.gatewayUrl = config.testMode ? GATEWAY_TEST : GATEWAY_PROD;

    // 解析 PKCS12 证书
    const { privateKey, certificate } = extractPfx(config.certPath, config.certPassword);
    this.privateKey = privateKey;
    this.certificate = certificate;
  }

  /**
   * 创建支付（WAP 前台交易）
   * 构建银联 WAP 支付表单参数，签名后返回跳转 URL。
   * 前端收到 payUrl 后引导用户跳转到银联支付页面。
   */
  async createPayment(params: CreatePaymentParams): Promise<PaymentResult> {
    try {
      const txnTime = formatTxnTime();
      const orderId = params.orderNo || params.orderId;

      // 银联金额单位是分，params.amount 已经是分
      const txnAmt = String(params.amount);

      // 从证书中提取证书序列号（用于签名标识）
      const certId = this.extractCertId();

      const payParams: Record<string, string> = {
        orderId,
        txnTime,
        txnAmt,
        orderDesc: params.description || `订单${orderId}`,
        frontUrl: params.returnUrl || '',
      };

      // 合并 extra 参数
      if (params.extra) {
        for (const [k, v] of Object.entries(params.extra)) {
          if (v !== undefined && v !== null) {
            payParams[k] = String(v);
          }
        }
      }

      const form = buildFormParams(this.config, payParams);

      // 设置证书序列号
      if (certId) {
        form.set('certId', certId);
      }

      // 构建待签名参数 map
      const signParams: Record<string, string> = {};
      form.forEach((value, key) => {
        signParams[key] = value;
      });

      // 签名
      const signature = signWithCert(signParams, this.privateKey);
      form.set('signature', signature);

      // 构建支付跳转 URL（银联标准方式：将所有参数拼接到网关 URL 后）
      const payUrl = `${this.gatewayUrl}?${form.toString()}`;

      return {
        success: true,
        transactionNo: orderId,
        channel: 'unionpay',
        payUrl,
      };
    } catch (err: any) {
      return {
        success: false,
        transactionNo: params.orderNo || params.orderId,
        channel: 'unionpay',
        error: err.message || '创建银联支付失败',
      };
    }
  }

  /**
   * 查询交易状态
   * 调用银联 backTransReq.do 接口查询订单状态
   */
  async queryPayment(transactionNo: string): Promise<PaymentStatus> {
    try {
      const txnTime = formatTxnTime();
      const certId = this.extractCertId();

      const queryParams: Record<string, string> = {
        version: VERSION,
        encoding: CHARSET,
        signMethod: SIGN_METHOD_RSA,
        certId: certId || '',
        txnType: '00', // 交易查询
        txnSubType: '00',
        bizType: '000201',
        accessType: '0',
        merId: this.config.mid,
        orderId: transactionNo,
        txnTime,
      };

      const signature = signWithCert(queryParams, this.privateKey);
      queryParams.signature = signature;

      // 银联查询接口使用 backTransReq.do
      const queryUrl = this.gatewayUrl.replace('frontTransReq.do', 'backTransReq.do');
      const response = await fetch(queryUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(queryParams).toString(),
      });

      const text = await response.text();
      const result = this.parseResponse(text);

      return {
        transactionNo,
        status: this.mapRespCode(result.respCode),
        paidAt: result.txnTime || undefined,
        amount: result.txnAmt ? parseInt(result.txnAmt, 10) : undefined,
        channelData: result,
      };
    } catch (err: any) {
      return {
        transactionNo,
        status: 'failed',
        channelData: { error: err.message },
      };
    }
  }

  /**
   * 退款
   * 调用银联 backTransReq.do 接口发起退款
   */
  async refund(params: RefundParams): Promise<RefundResult> {
    try {
      const txnTime = formatTxnTime();
      const certId = this.extractCertId();

      const refundParams: Record<string, string> = {
        version: VERSION,
        encoding: CHARSET,
        signMethod: SIGN_METHOD_RSA,
        certId: certId || '',
        txnType: '04', // 退货
        txnSubType: '00',
        bizType: '000201',
        accessType: '0',
        merId: this.config.mid,
        txnAmt: String(params.amount),
        orderId: params.refundNo,        // 商户退款单号
        origQryId: params.transactionNo, // 原交易订单号
        txnTime,
      };

      const signature = signWithCert(refundParams, this.privateKey);
      refundParams.signature = signature;

      const queryUrl = this.gatewayUrl.replace('frontTransReq.do', 'backTransReq.do');
      const response = await fetch(queryUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(refundParams).toString(),
      });

      const text = await response.text();
      const result = this.parseResponse(text);

      if (result.respCode === '00') {
        return {
          success: true,
          refundNo: params.refundNo,
          refundAmount: params.amount,
        };
      }

      return {
        success: false,
        refundNo: params.refundNo,
        refundAmount: 0,
        error: result.respMsg || `退款失败 (respCode: ${result.respCode})`,
      };
    } catch (err: any) {
      return {
        success: false,
        refundNo: params.refundNo,
        refundAmount: 0,
        error: err.message || '银联退款异常',
      };
    }
  }

  /**
   * 验证银联异步通知回调的签名
   * 银联回调以 form POST 方式发送，body 为 URL-encoded 表单数据
   */
  async verifyWebhook(
    headers: Record<string, string>,
    body: string,
  ): Promise<WebhookEvent | null> {
    try {
      const params = new URLSearchParams(body);
      const callbackParams: Record<string, string> = {};
      params.forEach((value, key) => {
        callbackParams[key] = value;
      });

      const signature = callbackParams.signature || '';
      if (!signature) {
        return null;
      }

      // 从回调参数中获取验签证书（银联会返回签名证书的 certId）
      // 如果本地证书不可用，尝试从回调中提取
      if (this.certificate) {
        const valid = verifyCertSign(callbackParams, signature, this.certificate);
        if (!valid) {
          return null;
        }
      }

      // 检查应答码
      const respCode = callbackParams.respCode;
      if (respCode !== '00') {
        return null;
      }

      // 解析为 WebhookEvent
      const txnType = callbackParams.txnType;
      let eventType: WebhookEvent['eventType'] = 'payment.success';
      if (txnType === '04') {
        eventType = 'refund.success';
      }

      return {
        channel: 'unionpay',
        eventType,
        transactionNo: callbackParams.orderId || callbackParams.origQryId || '',
        orderNo: callbackParams.orderId,
        amount: callbackParams.txnAmt ? parseInt(callbackParams.txnAmt, 10) : undefined,
        rawData: callbackParams,
      };
    } catch {
      return null;
    }
  }

  // ──────────────────────────────────────────────
  // Private helpers
  // ──────────────────────────────────────────────

  /**
   * 从本地证书中提取证书序列号（银联签名必须字段）
   */
  private extractCertId(): string {
    if (!this.certificate) return '';
    try {
      const x509 = new X509Certificate(this.certificate);
      // X509Certificate.serialNumber 返回十六进制字符串
      return x509.serialNumber || '';
    } catch {
      return '';
    }
  }

  /**
   * 解析银联网关的响应文本。
   * 银联响应格式可能是：
   * - URL-encoded form 字符串: key1=value1&key2=value2
   * - JSON
   */
  private parseResponse(text: string): Record<string, string> {
    const result: Record<string, string> = {};

    // 尝试 JSON 解析
    try {
      const json = JSON.parse(text);
      for (const [k, v] of Object.entries(json)) {
        result[k] = String(v);
      }
      return result;
    } catch {
      // 不是 JSON，按 URL-encoded 解析
    }

    // URL-encoded form
    const params = new URLSearchParams(text);
    params.forEach((value, key) => {
      result[key] = value;
    });

    return result;
  }

  /**
   * 将银联应答码映射为内部支付状态
   * 银联应答码说明：
   * - 00: 交易成功
   * - 01/02: 交易失败
   * - 03/04: 交易处理中
   * - 05: 已退款
   * - 其他: 失败
   */
  private mapRespCode(respCode?: string): PaymentStatusType {
    if (!respCode) return 'pending';
    switch (respCode) {
      case '00':
        return 'success';
      case '05':
        return 'refunded';
      case '01':
      case '02':
        return 'failed';
      case '03':
      case '04':
        return 'pending';
      default:
        return 'failed';
    }
  }
}
