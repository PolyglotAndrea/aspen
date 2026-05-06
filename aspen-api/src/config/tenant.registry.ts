/**
 * 租户注册表 (Tenant Registry)
 *
 * 从数据库读取，带内存缓存
 */

import type {
  TenantConfig,
  BookingFeatures,
} from './tenant.types';
import { tenantRepo } from '../repositories/tenant.repo';

// ============================================
// 缓存层（同步读取，异步刷新）
// ============================================

const cache = new Map<string, TenantConfig>();
let cacheLoaded = false;
let lastLoadTime = 0;
const CACHE_TTL = 60_000; // 60 秒

async function ensureCacheLoaded(): Promise<void> {
  if (cacheLoaded && Date.now() - lastLoadTime < CACHE_TTL) return;
  const allTenants = await tenantRepo.findAll();
  for (const t of allTenants) {
    if (t.status === 'active') {
      cache.set(t.id, t.config);
    }
  }
  cacheLoaded = true;
  lastLoadTime = Date.now();
}

// 启动时预加载（非阻塞）
ensureCacheLoaded().catch(console.error);

// ============================================
// 导出函数（保持向后兼容）
// ============================================

/**
 * 根据租户 ID 获取租户配置（同步，从缓存读取）
 */
export function getTenantConfig(tenantId: string): TenantConfig | null {
  return cache.get(tenantId) || null;
}

/**
 * 检查租户是否存在且活跃
 */
export function isTenantActive(tenantId: string): boolean {
  const config = cache.get(tenantId);
  return config?.status === 'active';
}

/**
 * 检查租户预约功能是否启用
 */
export function isBookingEnabled(tenantId: string): boolean {
  const config = cache.get(tenantId);
  return config?.booking?.enabled ?? false;
}

/**
 * 获取租户的预约模式
 */
export function getBookingMode(tenantId: string): 'RULES' | 'SEATING' {
  const config = cache.get(tenantId);
  return config?.booking?.mode ?? 'RULES';
}

/**
 * 获取租户的预约规则
 */
export function getBookingRules(tenantId: string): string[] {
  const config = cache.get(tenantId);
  return config?.booking?.rules ?? [];
}

/**
 * 获取租户的桌位类型
 */
export function getSeatTypes(tenantId: string): BookingFeatures['seatTypes'] {
  const config = cache.get(tenantId);
  return config?.booking?.seatTypes ?? [];
}

/**
 * 获取所有活跃租户列表
 */
export function getActiveTenants(): TenantConfig[] {
  return Array.from(cache.values()).filter(t => t.status === 'active');
}

/**
 * 创建新租户（异步，写入数据库）
 */
export async function createTenant(config: Partial<TenantConfig> & { id: string }): Promise<TenantConfig> {
  const existing = await tenantRepo.findById(config.id);
  if (existing) {
    throw new Error(`租户 ${config.id} 已存在`);
  }

  const newTenant: TenantConfig = {
    id: config.id,
    brandName: config.brandName || config.id,
    brandNameEn: config.brandNameEn || config.id.toUpperCase(),
    dbConnection: config.dbConnection || '',
    redisUrl: config.redisUrl || '',
    storageBucket: config.storageBucket || `${config.id}-cdn`,
    theme: config.theme || {
      primary: '#4a9c6d', primaryLight: '#6bbd8a', primaryDark: '#2d5a3d',
      accent: '#4a9c6d', background: '#000000', text: '#ffffff',
      textMuted: 'rgba(255, 255, 255, 0.6)', textSecondary: 'rgba(255, 255, 255, 0.4)',
      border: 'rgba(255, 255, 255, 0.1)', success: '#4ade80', warning: '#fbbf24',
      error: '#f87171', info: '#60a5fa', blur: '20rpx',
    },
    features: config.features || {
      booking: true, menu: true, member: true, comments: true,
      delivery: false, product: false, stores: false,
    },
    booking: config.booking || { mode: 'RULES', enabled: true, rules: [], seatTypes: [] },
    businessHours: config.businessHours || { lunch: { start: '11:30', end: '14:00' }, dinner: { start: '17:30', end: '22:00' } },
    bookingConfig: config.bookingConfig || { maxGuests: 20, minAdvanceHours: 2, maxAdvanceDays: 30, autoConfirm: false },
    stores: config.stores || { enabled: false, stores: [], crossStoreBooking: false },
    member: config.member || { enabled: false, pointsName: '积分', signInPoints: 10, consumePointsRate: 1, pointsDeductionRate: 100, pointsExpireDays: 365, minDeductionPoints: 100, maxDeductionRate: 0.3, levels: [], benefits: { discount: 1, freeDelivery: false, priorityService: false, birthdayBenefit: { enabled: false }, doublePointsDays: [] } },
    delivery: config.delivery || { enabled: false, minOrderAmount: 0, deliveryFee: 0 },
    product: config.product || { enabled: false, deliverySupported: false, pickupSupported: false, categories: [] },
    createdAt: new Date().toISOString(),
    status: 'active',
  };

  await tenantRepo.create({ id: newTenant.id, brandName: newTenant.brandName, brandNameEn: newTenant.brandNameEn, config: newTenant });
  cache.set(newTenant.id, newTenant);
  return newTenant;
}

/**
 * 更新租户配置（异步，写入数据库）
 */
export async function updateTenant(tenantId: string, updates: Partial<TenantConfig>): Promise<TenantConfig | null> {
  await tenantRepo.update(tenantId, updates);
  // 重新加载缓存
  const updated = await tenantRepo.findById(tenantId);
  if (updated) {
    cache.set(tenantId, updated.config);
    return updated.config;
  }
  return null;
}

/**
 * 删除租户（异步，从数据库删除）
 */
export async function deleteTenant(tenantId: string): Promise<boolean> {
  await tenantRepo.delete(tenantId);
  cache.delete(tenantId);
  return true;
}

/**
 * 刷新缓存
 */
export function refreshCache(tenantId?: string) {
  if (tenantId) {
    cache.delete(tenantId);
  } else {
    cache.clear();
    cacheLoaded = false;
  }
}
