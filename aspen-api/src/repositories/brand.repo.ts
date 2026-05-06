import { db } from '../db';
import { brandData } from '../db/schema';
import { eq } from 'drizzle-orm';

export const brandRepo = {
  async findByTenant(tenantId: string) {
    const rows = await db.select().from(brandData).where(eq(brandData.tenantId, tenantId)).limit(1);
    return rows[0] || null;
  },

  async upsert(tenantId: string, data: { videoUrl?: string; tagline?: string; stories?: any[] }) {
    const existing = await this.findByTenant(tenantId);
    if (existing) {
      await db.update(brandData).set({
        videoUrl: data.videoUrl ?? existing.videoUrl,
        tagline: data.tagline ?? existing.tagline,
        stories: data.stories ?? existing.stories,
      }).where(eq(brandData.tenantId, tenantId));
    } else {
      await db.insert(brandData).values({
        id: `brand_${tenantId}`,
        tenantId,
        videoUrl: data.videoUrl || null,
        tagline: data.tagline || null,
        stories: data.stories || null,
      });
    }
  },
};
