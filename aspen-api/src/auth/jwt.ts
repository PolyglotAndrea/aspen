/**
 * JWT 工具
 * 使用 jose 库（Bun 兼容，无原生依赖）
 */

import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'aspen-dev-jwt-secret-change-in-production'
);

const TOKEN_EXPIRY = '7d';

export interface JWTPayload {
  sub: string;       // memberId
  tenantId: string;
  phone: string;
  role: 'member' | 'admin';
}

export async function signToken(payload: JWTPayload): Promise<string> {
  return new SignJWT(payload as any)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .setSubject(payload.sub)
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload> {
  const { payload } = await jwtVerify(token, JWT_SECRET);
  return payload as unknown as JWTPayload;
}
