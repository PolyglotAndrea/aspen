/**
 * 支付服务工厂
 * 根据租户配置和渠道名返回对应的支付实现
 */

import type { PaymentChannel, PaymentChannelType, TenantPaymentConfig } from './types';
import { simulatePayment, SimulatePayment } from './simulate';
import { WeChatPayment } from './wechat';
import { AlipayPayment } from './alipay';
import { UnionPayPayment } from './unionpay';

// 渠道实例缓存
const channelCache = new Map<string, PaymentChannel>();

/**
 * 获取支付渠道实例
 */
export function getPaymentChannel(
  channel: PaymentChannelType,
  config?: TenantPaymentConfig,
): PaymentChannel {
  // 模拟模式始终返回模拟实例
  if (channel === 'simulate' || !config || config.mode === 'simulate') {
    return simulatePayment;
  }

  const cacheKey = `${channel}_${config.mode}`;
  if (channelCache.has(cacheKey)) {
    return channelCache.get(cacheKey)!;
  }

  let instance: PaymentChannel;

  switch (channel) {
    case 'wechat': {
      const wechatConfig = config.channels.wechat;
      if (!wechatConfig?.enabled) {
        throw new Error('微信支付未启用');
      }
      instance = new WeChatPayment({
        mchid: wechatConfig.mchid,
        appId: wechatConfig.appId,
        apiV3Key: wechatConfig.apiV3Key,
        privateKeyPath: wechatConfig.privateKeyPath,
        serialNo: wechatConfig.serialNo,
        notifyUrl: wechatConfig.notifyUrl,
      });
      break;
    }

    case 'alipay': {
      const alipayConfig = config.channels.alipay;
      if (!alipayConfig?.enabled) {
        throw new Error('支付宝未启用');
      }
      instance = new AlipayPayment({
        appId: alipayConfig.appId,
        privateKey: alipayConfig.privateKey,
        alipayPublicKey: alipayConfig.alipayPublicKey,
        notifyUrl: alipayConfig.notifyUrl,
        returnUrl: alipayConfig.returnUrl,
        sandbox: config.mode === 'sandbox',
      });
      break;
    }

    case 'unionpay': {
      const unionConfig = config.channels.unionpay;
      if (!unionConfig?.enabled) {
        throw new Error('银联未启用');
      }
      instance = new UnionPayPayment({
        mid: unionConfig.mid,
        tid: unionConfig.tid,
        certPath: unionConfig.certPath,
        certPassword: unionConfig.certPassword,
        notifyUrl: unionConfig.notifyUrl,
        sandbox: config.mode === 'sandbox',
      });
      break;
    }

    default:
      throw new Error(`不支持的支付渠道: ${channel}`);
  }

  channelCache.set(cacheKey, instance);
  return instance;
}

/**
 * 根据订单类型选择默认支付渠道
 */
export function getDefaultChannel(config?: TenantPaymentConfig): PaymentChannelType {
  if (!config || config.mode === 'simulate') return 'simulate';
  if (config.channels.wechat?.enabled) return 'wechat';
  if (config.channels.alipay?.enabled) return 'alipay';
  if (config.channels.unionpay?.enabled) return 'unionpay';
  return 'simulate';
}

export { SimulatePayment, simulatePayment } from './simulate';
export { WeChatPayment } from './wechat';
export { AlipayPayment } from './alipay';
export { UnionPayPayment } from './unionpay';
export { createSharingOrder, settleSharingOrder, querySharingStatus, cancelSharingOrder } from './profit-sharing';
export type * from './types';
