/**
 * 短信验证码服务
 * 当前为模拟模式，固定验证码 888888
 * 未来可替换为真实短信网关
 */

import { smsRepo } from '../repositories/sms.repo';

const SIMULATED_CODE = '888888';
const CODE_EXPIRY_MINUTES = 5;

/**
 * 发送短信验证码（模拟模式）
 */
export async function sendSmsCode(tenantId: string, phone: string): Promise<{ code: string }> {
  const code = process.env.PAYMENT_MODE === 'simulate' ? SIMULATED_CODE : generateRandomCode();
  const expiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000);

  await smsRepo.create({
    tenantId,
    phone,
    code,
    type: 'login',
    purpose: 'login',
    expiresAt,
  });

  console.log(`[SMS] Code for ${phone}: ${code} (simulated)`);
  return { code };
}

/**
 * 验证短信验证码
 */
export async function verifySmsCode(
  tenantId: string,
  phone: string,
  code: string
): Promise<boolean> {
  const record = await smsRepo.findValidCode(tenantId, phone, code, 'login');
  if (!record) return false;

  await smsRepo.markUsed(record.id);
  return true;
}

function generateRandomCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
