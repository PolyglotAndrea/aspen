import { db } from '../db';
import { members } from '../db/schema';
import { eq, and, like, or, sql } from 'drizzle-orm';

export const memberRepo = {
  async findById(tenantId: string, memberId: string) {
    const rows = await db.select().from(members).where(and(eq(members.id, memberId), eq(members.tenantId, tenantId))).limit(1);
    return rows[0] || null;
  },

  async findByPhone(tenantId: string, phone: string) {
    const rows = await db.select().from(members).where(and(eq(members.phone, phone), eq(members.tenantId, tenantId))).limit(1);
    return rows[0] || null;
  },

  async findByUsername(tenantId: string, username: string) {
    const rows = await db.select().from(members).where(and(eq(members.username, username), eq(members.tenantId, tenantId))).limit(1);
    return rows[0] || null;
  },

  async findByTenant(tenantId: string, params?: { search?: string; status?: string; page?: number; pageSize?: number }) {
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 20;
    const conditions = [eq(members.tenantId, tenantId)];

    if (params?.status && params.status !== 'all') {
      conditions.push(eq(members.status, params.status));
    }
    if (params?.search) {
      conditions.push(or(like(members.phone, `%${params.search}%`), like(members.nickname, `%${params.search}%`))!);
    }

    const where = and(...conditions);
    const rows = await db.select().from(members).where(where).limit(pageSize).offset((page - 1) * pageSize);
    const countResult = await db.select({ count: sql<number>`count(*)` }).from(members).where(where);
    return { members: rows, total: Number(countResult[0]?.count || 0) };
  },

  async create(data: typeof members.$inferInsert) {
    await db.insert(members).values(data);
    return data;
  },

  async update(tenantId: string, memberId: string, data: Partial<typeof members.$inferInsert>) {
    await db.update(members).set(data).where(and(eq(members.id, memberId), eq(members.tenantId, tenantId)));
  },

  async delete(tenantId: string, memberId: string) {
    await db.update(members).set({ status: 'cancelled' }).where(and(eq(members.id, memberId), eq(members.tenantId, tenantId)));
  },

  async updatePoints(tenantId: string, memberId: string, pointsDelta: number) {
    const member = await this.findById(tenantId, memberId);
    if (!member) throw new Error('Member not found');
    const newPoints = (member.points || 0) + pointsDelta;
    const newTotal = pointsDelta > 0 ? (member.totalPoints || 0) + pointsDelta : member.totalPoints;
    await db.update(members).set({ points: newPoints, totalPoints: newTotal }).where(and(eq(members.id, memberId), eq(members.tenantId, tenantId)));
    return { points: newPoints, totalPoints: newTotal };
  },
};
