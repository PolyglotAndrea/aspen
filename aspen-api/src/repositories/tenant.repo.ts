import { db } from '../db';
import { tenants } from '../db/schema';
import { eq } from 'drizzle-orm';
import type { TenantConfig } from '../config/tenant.types';

// 内存缓存，避免每次请求查库
const cache = new Map<string, { config: TenantConfig; ts: number }>();
const CACHE_TTL = 60_000; // 60 秒

export const tenantRepo = {
  async findById(tenantId: string): Promise<{ id: string; brandName: string; brandNameEn: string; config: TenantConfig; status: string } | null> {
    const cached = cache.get(tenantId);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      const row = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1);
      if (!row[0]) return null;
      return { id: row[0].id, brandName: row[0].brandName, brandNameEn: row[0].brandNameEn || '', config: cached.config, status: row[0].status || 'active' };
    }
    const row = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1);
    if (!row[0]) return null;
    const config = row[0].config as TenantConfig;
    cache.set(tenantId, { config, ts: Date.now() });
    return { id: row[0].id, brandName: row[0].brandName, brandNameEn: row[0].brandNameEn || '', config, status: row[0].status || 'active' };
  },

  async findAll(): Promise<Array<{ id: string; brandName: string; brandNameEn: string; config: TenantConfig; status: string }>> {
    const rows = await db.select().from(tenants);
    return rows.map(row => ({
      id: row.id,
      brandName: row.brandName,
      brandNameEn: row.brandNameEn || '',
      config: row.config as TenantConfig,
      status: row.status || 'active',
    }));
  },

  async create(data: { id: string; brandName: string; brandNameEn?: string; config: TenantConfig; status?: string }): Promise<void> {
    await db.insert(tenants).values({
      id: data.id,
      brandName: data.brandName,
      brandNameEn: data.brandNameEn || null,
      config: data.config as any,
      status: data.status || 'active',
    });
    cache.set(data.id, { config: data.config, ts: Date.now() });
  },

  async update(tenantId: string, updates: Partial<TenantConfig>): Promise<void> {
    const existing = await this.findById(tenantId);
    if (!existing) throw new Error(`Tenant ${tenantId} not found`);

    const merged = deepMergeConfig(existing.config, updates);
    await db.update(tenants).set({
      config: merged as any,
      updatedAt: new Date(),
    }).where(eq(tenants.id, tenantId));
    cache.set(tenantId, { config: merged, ts: Date.now() });
  },

  async updateStatus(tenantId: string, status: string): Promise<void> {
    await db.update(tenants).set({ status, updatedAt: new Date() }).where(eq(tenants.id, tenantId));
  },

  async delete(tenantId: string): Promise<void> {
    await db.delete(tenants).where(eq(tenants.id, tenantId));
    cache.delete(tenantId);
  },

  clearCache(tenantId?: string) {
    if (tenantId) cache.delete(tenantId);
    else cache.clear();
  },
};

function deepMergeConfig(existing: TenantConfig, updates: Partial<TenantConfig>): TenantConfig {
  const nestedKeys = ['theme', 'features', 'booking', 'delivery', 'product', 'stores', 'member', 'businessHours', 'bookingConfig'] as const;
  const result = { ...existing };
  for (const key of Object.keys(updates) as (keyof TenantConfig)[]) {
    const val = updates[key];
    if (val === undefined) continue;
    if ((nestedKeys as readonly string[]).includes(key) && typeof val === 'object' && val !== null && !Array.isArray(val)) {
      (result as any)[key] = { ...(existing as any)[key], ...val };
    } else {
      (result as any)[key] = val;
    }
  }
  return result;
}
