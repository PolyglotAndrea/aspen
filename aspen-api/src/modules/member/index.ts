/**
 * 会员模块 (Member Module)
 *
 * 支持手机号和账号密码登录
 * 包含会员等级、积分、权益等功能
 *
 * 数据持久化通过 memberRepo / pointsRepo 仓库层实现
 */

import { Elysia, t } from 'elysia';
import type { MemberConfig, MemberLevel as MemberLevelType } from '../../config/tenant.types';
import { getTenantConfig } from '../../config/tenant.registry';
import { memberRepo } from '../../repositories/member.repo';
import { pointsRepo } from '../../repositories/points.repo';

// ============================================
// 辅助函数
// ============================================

/**
 * 生成会员ID
 */
function generateMemberId(tenantId: string): string {
  return `mem_${tenantId}_${Date.now()}`;
}

/**
 * 生成积分记录ID
 */
function generatePointsRecordId(): string {
  return `pts_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
}

/**
 * 获取会员等级
 */
function getMemberLevel(config: MemberConfig, points: number): MemberLevelType | undefined {
  const sortedLevels = [...config.levels].sort((a, b) => b.level - a.level);
  return sortedLevels.find(level => points >= level.upgradePoints);
}

/**
 * 验证密码 (简化版，生产环境需要加密)
 */
function verifyPassword(input: string, stored: string): boolean {
  return input === stored;
}

// ============================================
// 会员路由
// ============================================

export const memberRoutes = new Elysia({ prefix: '/member' })

  // 获取会员配置
  .get('/config', ({ headers }) => {
    const tenantId = headers['x-tenant-id'] || 'aspen';
    const config = getTenantConfig(tenantId);

    if (!config?.member.enabled) {
      return { enabled: false };
    }

    return {
      enabled: true,
      pointsName: config.member.pointsName,
      levels: config.member.levels.map(l => ({
        id: l.id,
        name: l.name,
        level: l.level,
        icon: l.icon,
        upgradePoints: l.upgradePoints,
        discount: l.discount,
        description: l.description,
      })),
      signInPoints: config.member.signInPoints,
      consumePointsRate: config.member.consumePointsRate,
      pointsDeductionRate: config.member.pointsDeductionRate,
    };
  })

  // 获取会员等级列表
  .get('/levels', ({ headers }) => {
    const tenantId = headers['x-tenant-id'] || 'aspen';
    const config = getTenantConfig(tenantId);

    if (!config?.member.enabled) {
      throw new Error('会员功能未启用');
    }

    return {
      levels: config.member.levels.map(l => ({
        id: l.id,
        name: l.name,
        level: l.level,
        icon: l.icon,
        pointsRate: l.pointsRate,
        discount: l.discount,
        upgradePoints: l.upgradePoints,
        description: l.description,
      })),
    };
  })

  // 手机号注册
  .post('/register/phone', async ({ body, headers }) => {
    const tenantId = headers['x-tenant-id'] || 'aspen';
    const config = getTenantConfig(tenantId);

    if (!config?.member.enabled) {
      throw new Error('会员功能未启用');
    }

    const { phone, nickname } = body as any;

    const existing = await memberRepo.findByPhone(tenantId, phone);
    if (existing) {
      throw new Error('手机号已注册');
    }

    const defaultLevel = config.member.levels[0];
    const memberId = generateMemberId(tenantId);
    const signInPoints = config.member.signInPoints || 0;

    await memberRepo.create({
      id: memberId,
      tenantId,
      phone,
      nickname: nickname || `用户${phone.slice(-4)}`,
      levelId: defaultLevel?.id || 'bronze',
      points: signInPoints,
      totalPoints: signInPoints,
      balance: 0,
      status: 'active',
    });

    if (signInPoints > 0) {
      await pointsRepo.create({
        id: generatePointsRecordId(),
        tenantId,
        memberId,
        points: signInPoints,
        balance: signInPoints,
        type: 'gift',
        description: '新用户注册赠送积分',
      });
    }

    console.log(`[Member] Registered: ${phone} (${tenantId})`);

    return {
      success: true,
      member: {
        id: memberId,
        phone,
        nickname: nickname || `用户${phone.slice(-4)}`,
        levelId: defaultLevel?.id || 'bronze',
        points: signInPoints,
      },
      message: '注册成功',
    };
  }, {
    body: t.Object({
      phone: t.String({ pattern: '^1\\d{10}$' }),
      nickname: t.Optional(t.String()),
      code: t.Optional(t.String()),
    }),
  })

  // 手机号登录
  .post('/login/phone', async ({ body, headers }) => {
    const tenantId = headers['x-tenant-id'] || 'aspen';
    const config = getTenantConfig(tenantId);

    if (!config?.member.enabled) {
      throw new Error('会员功能未启用');
    }

    const { phone, code } = body as any;

    let member = await memberRepo.findByPhone(tenantId, phone);
    let isNew = false;

    if (!member) {
      const defaultLevel = config.member.levels[0];
      const memberId = generateMemberId(tenantId);
      const signInPoints = config.member.signInPoints || 0;

      await memberRepo.create({
        id: memberId,
        tenantId,
        phone,
        nickname: `用户${phone.slice(-4)}`,
        levelId: defaultLevel?.id || 'bronze',
        points: signInPoints,
        totalPoints: signInPoints,
        balance: 0,
        status: 'active',
      });

      if (signInPoints > 0) {
        await pointsRepo.create({
          id: generatePointsRecordId(),
          tenantId,
          memberId,
          points: signInPoints,
          balance: signInPoints,
          type: 'gift',
          description: '新用户登录赠送积分',
        });
      }

      member = await memberRepo.findById(tenantId, memberId);
      isNew = true;
    }

    if (!member || member.status !== 'active') {
      throw new Error('账号状态异常');
    }

    console.log(`[Member] Login: ${phone} (${tenantId})${isNew ? ' [auto-registered]' : ''}`);

    const level = config.member.levels.find(l => l.id === member!.levelId);

    return {
      success: true,
      member: {
        id: member.id,
        phone: member.phone,
        nickname: member.nickname,
        avatar: member.avatar,
        levelId: member.levelId,
        levelName: level?.name,
        levelIcon: level?.icon,
        points: member.points,
        totalPoints: member.totalPoints,
        balance: member.balance,
        discount: level?.discount,
      },
      token: `mem_${member.id}_${Date.now()}`,
    };
  }, {
    body: t.Object({
      phone: t.String({ pattern: '^1\\d{10}$' }),
      code: t.Optional(t.String()),
    }),
  })

  // 账号密码登录
  .post('/login/password', async ({ body, headers }) => {
    const tenantId = headers['x-tenant-id'] || 'aspen';
    const config = getTenantConfig(tenantId);

    if (!config?.member.enabled) {
      throw new Error('会员功能未启用');
    }

    const { username, password } = body as any;

    let member = await memberRepo.findByUsername(tenantId, username);
    if (!member) {
      member = await memberRepo.findByPhone(tenantId, username);
    }

    if (!member) {
      throw new Error('账号不存在');
    }

    if (!verifyPassword(password, (member as any).passwordHash || '')) {
      throw new Error('密码错误');
    }

    if (member.status !== 'active') {
      throw new Error('账号状态异常');
    }

    const level = config.member.levels.find(l => l.id === member!.levelId);

    return {
      success: true,
      member: {
        id: member.id,
        phone: member.phone,
        username: member.username,
        nickname: member.nickname,
        avatar: member.avatar,
        levelId: member.levelId,
        levelName: level?.name,
        levelIcon: level?.icon,
        points: member.points,
        totalPoints: member.totalPoints,
        balance: member.balance,
        discount: level?.discount,
      },
      token: `mem_${member.id}_${Date.now()}`,
    };
  })

  // 获取会员信息
  .get('/profile', async ({ headers }) => {
    const tenantId = headers['x-tenant-id'] || 'aspen';
    const memberId = headers['x-member-id'] as string;

    if (!memberId) {
      throw new Error('未登录');
    }

    const member = await memberRepo.findById(tenantId, memberId);

    if (!member) {
      throw new Error('会员不存在');
    }

    const config = getTenantConfig(tenantId);
    const level = config?.member.levels.find(l => l.id === member.levelId);

    return {
      id: member.id,
      phone: member.phone,
      username: member.username,
      nickname: member.nickname,
      avatar: member.avatar,
      levelId: member.levelId,
      levelName: level?.name,
      levelIcon: level?.icon,
      points: member.points,
      totalPoints: member.totalPoints,
      balance: member.balance,
      birthday: member.birthday,
      createdAt: member.createdAt,
      lastConsumeAt: member.lastConsumeAt,
      discount: level?.discount,
    };
  })

  // 更新会员信息
  .patch('/profile', async ({ body, headers }) => {
    const tenantId = headers['x-tenant-id'] || 'aspen';
    const memberId = headers['x-member-id'] as string;

    if (!memberId) {
      throw new Error('未登录');
    }

    const member = await memberRepo.findById(tenantId, memberId);

    if (!member) {
      throw new Error('会员不存在');
    }

    const updates = body as any;
    const allowedFields = ['nickname', 'avatar', 'birthday', 'username', 'passwordHash'];
    const updateData: Record<string, any> = {};

    for (const key of allowedFields) {
      if (updates[key] !== undefined) {
        updateData[key] = updates[key];
      }
    }

    // Map 'password' from client to 'passwordHash' in db
    if (updates.password !== undefined) {
      updateData.passwordHash = updates.password;
    }

    if (Object.keys(updateData).length > 0) {
      await memberRepo.update(tenantId, memberId, updateData);
    }

    return {
      success: true,
      member: {
        id: member.id,
        nickname: updates.nickname ?? member.nickname,
        avatar: updates.avatar ?? member.avatar,
        username: updates.username ?? member.username,
      },
    };
  })

  // 获取积分明细
  .get('/points', async ({ headers, query }) => {
    const tenantId = headers['x-tenant-id'] || 'aspen';
    const memberId = headers['x-member-id'] as string;

    if (!memberId) {
      throw new Error('未登录');
    }

    const member = await memberRepo.findById(tenantId, memberId);

    if (!member) {
      throw new Error('会员不存在');
    }

    const records = await pointsRepo.findByMember(tenantId, memberId, query.type || undefined);

    return {
      points: member.points,
      totalPoints: member.totalPoints,
      records: records.slice(0, 50),
    };
  })

  // 签到
  .post('/points/signin', async ({ headers }) => {
    const tenantId = headers['x-tenant-id'] || 'aspen';
    const memberId = headers['x-member-id'] as string;
    const config = getTenantConfig(tenantId);

    if (!memberId) {
      throw new Error('未登录');
    }

    if (!config?.member.enabled) {
      throw new Error('会员功能未启用');
    }

    const member = await memberRepo.findById(tenantId, memberId);

    if (!member) {
      throw new Error('会员不存在');
    }

    // 检查今天是否已签到
    const today = new Date().toISOString().slice(0, 10);
    const todayRecords = await pointsRepo.findByMember(tenantId, memberId, 'signin');
    const signedToday = todayRecords.some(r => {
      if (!r.createdAt) return false;
      const d = r.createdAt instanceof Date ? r.createdAt : new Date(r.createdAt);
      return d.toISOString().slice(0, 10) === today;
    });

    if (signedToday) {
      throw new Error('今日已签到');
    }

    const signInPoints = config.member.signInPoints;

    // 更新积分
    const updated = await memberRepo.updatePoints(tenantId, memberId, signInPoints);

    // 添加积分记录
    await pointsRepo.create({
      id: generatePointsRecordId(),
      tenantId,
      memberId,
      points: signInPoints,
      balance: updated.points,
      type: 'signin',
      description: '每日签到',
    });

    // 检查是否升级
    const newLevel = getMemberLevel(config.member, updated.points);
    let levelUpgraded = false;
    if (newLevel && newLevel.id !== member.levelId) {
      await memberRepo.update(tenantId, memberId, { levelId: newLevel.id });
      levelUpgraded = true;

      await pointsRepo.create({
        id: generatePointsRecordId(),
        tenantId,
        memberId,
        points: 0,
        balance: updated.points,
        type: 'upgrade',
        description: `升级到 ${newLevel.name}`,
      });
    }

    console.log(`[Member] Signin: ${member.phone}, +${signInPoints} points`);

    return {
      success: true,
      points: updated.points,
      signInPoints,
      levelUpgraded,
      newLevel: levelUpgraded ? {
        id: newLevel!.id,
        name: newLevel!.name,
        discount: newLevel!.discount,
      } : undefined,
      message: `签到成功，获得 ${signInPoints} ${config.member.pointsName}`,
    };
  })

  // 使用积分
  .post('/points/use', async ({ body, headers }) => {
    const tenantId = headers['x-tenant-id'] || 'aspen';
    const memberId = headers['x-member-id'] as string;
    const config = getTenantConfig(tenantId);

    if (!memberId) {
      throw new Error('未登录');
    }

    if (!config?.member.enabled) {
      throw new Error('会员功能未启用');
    }

    const { points, orderId } = body as any;

    if (!points || points < config.member.minDeductionPoints) {
      throw new Error(`最低使用 ${config.member.minDeductionPoints} 积分`);
    }

    const member = await memberRepo.findById(tenantId, memberId);

    if (!member) {
      throw new Error('会员不存在');
    }

    if ((member.points || 0) < points) {
      throw new Error('积分不足');
    }

    const deductionAmount = Math.floor(points * config.member.pointsDeductionRate);
    const maxDeduction = Math.floor((member.points || 0) * config.member.pointsDeductionRate);

    const maxAllowed = Math.floor(maxDeduction * config.member.maxDeductionRate);
    const actualDeduction = Math.min(deductionAmount, maxAllowed);
    const actualPoints = Math.floor(actualDeduction / config.member.pointsDeductionRate);

    // 扣减积分
    const updated = await memberRepo.updatePoints(tenantId, memberId, -actualPoints);

    await pointsRepo.create({
      id: generatePointsRecordId(),
      tenantId,
      memberId,
      points: -actualPoints,
      balance: updated.points,
      type: 'consume',
      description: '订单抵扣',
      orderId,
    });

    console.log(`[Member] Points used: ${actualPoints}, deduction: ¥${actualDeduction}`);

    return {
      success: true,
      pointsUsed: actualPoints,
      deductionAmount: actualDeduction,
      remainingPoints: updated.points,
      message: `使用 ${actualPoints} 积分，抵扣 ¥${actualDeduction}`,
    };
  }, {
    body: t.Object({
      points: t.Number({ minimum: 1 }),
      orderId: t.Optional(t.String()),
    }),
  })

  // 消费获得积分 (由订单系统调用)
  .post('/points/earn', async ({ body, headers }) => {
    const tenantId = headers['x-tenant-id'] || 'aspen';
    const config = getTenantConfig(tenantId);

    const { memberId, amount, orderId, description } = body as any;

    if (!config?.member.enabled) {
      return { success: false, message: '会员功能未启用' };
    }

    const member = await memberRepo.findById(tenantId, memberId);

    if (!member) {
      return { success: false, message: '会员不存在' };
    }

    const level = config.member.levels.find(l => l.id === member.levelId);
    const pointsRate = level?.pointsRate || 1;
    const earnedPoints = Math.floor(amount * config.member.consumePointsRate * pointsRate);

    if (earnedPoints <= 0) {
      return { success: true, pointsEarned: 0 };
    }

    // 更新积分
    const updated = await memberRepo.updatePoints(tenantId, memberId, earnedPoints);

    // 更新消费时间
    await memberRepo.update(tenantId, memberId, { lastConsumeAt: new Date().toISOString() } as any);

    await pointsRepo.create({
      id: generatePointsRecordId(),
      tenantId,
      memberId,
      points: earnedPoints,
      balance: updated.points,
      type: 'consume',
      description: description || '消费获得积分',
      orderId,
    });

    // 检查升级
    const newLevel = getMemberLevel(config.member, updated.points);
    let leveledUp = false;
    if (newLevel && newLevel.id !== member.levelId) {
      await memberRepo.update(tenantId, memberId, { levelId: newLevel.id });
      leveledUp = true;
    }

    console.log(`[Member] Points earned: ${member.phone}, +${earnedPoints} points`);

    return {
      success: true,
      pointsEarned: earnedPoints,
      totalPoints: updated.points,
      leveledUp,
      newLevel: leveledUp ? { id: newLevel!.id, name: newLevel!.name } : undefined,
    };
  });

// ============================================
// Admin 会员管理路由
// ============================================

export const adminMemberRoutes = new Elysia({ prefix: '/admin/members' })

  // 列表 (分页 + 搜索)
  .get('/', async ({ headers, query }) => {
    const tenantId = headers['x-tenant-id'] || 'aspen';
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 20;
    const search = query.search as string | undefined;
    const status = query.status as string | undefined;

    const result = await memberRepo.findByTenant(tenantId, { page, pageSize, search, status });

    return {
      members: result.members.map(m => ({
        id: m.id,
        phone: m.phone,
        nickname: m.nickname,
        level: m.levelId,
        points: m.points,
        status: m.status,
        avatar: m.avatar,
        birthday: m.birthday,
        createdAt: m.createdAt,
      })),
      total: result.total,
      page,
      pageSize,
    };
  })

  // 详情
  .get('/:id', async ({ headers, params }) => {
    const tenantId = headers['x-tenant-id'] || 'aspen';
    const member = await memberRepo.findById(tenantId, params.id);
    if (!member) throw new Error('会员不存在');
    return { member };
  })

  // 创建
  .post('/', async ({ body, headers }) => {
    const tenantId = headers['x-tenant-id'] || 'aspen';
    const data = body as any;

    const existing = await memberRepo.findByPhone(tenantId, data.phone);
    if (existing) throw new Error('手机号已注册');

    const memberId = `mem_admin_${Date.now()}`;
    await memberRepo.create({
      id: memberId,
      tenantId,
      phone: data.phone,
      nickname: data.nickname || `用户${data.phone.slice(-4)}`,
      levelId: data.level || 'normal',
      points: 0,
      totalPoints: 0,
      balance: 0,
      status: data.status || 'active',
      birthday: data.birthday,
    });

    return { success: true, member: { id: memberId } };
  })

  // 更新
  .patch('/:id', async ({ body, headers, params }) => {
    const tenantId = headers['x-tenant-id'] || 'aspen';
    const member = await memberRepo.findById(tenantId, params.id);
    if (!member) throw new Error('会员不存在');

    const data = body as any;
    const updates: Record<string, any> = {};
    if (data.nickname !== undefined) updates.nickname = data.nickname;
    if (data.level !== undefined) updates.levelId = data.level;
    if (data.status !== undefined) updates.status = data.status;
    if (data.avatar !== undefined) updates.avatar = data.avatar;
    if (data.birthday !== undefined) updates.birthday = data.birthday;

    if (Object.keys(updates).length > 0) {
      await memberRepo.update(tenantId, params.id, updates);
    }

    return { success: true };
  })

  // 删除 (软删除)
  .delete('/:id', async ({ headers, params }) => {
    const tenantId = headers['x-tenant-id'] || 'aspen';
    const member = await memberRepo.findById(tenantId, params.id);
    if (!member) throw new Error('会员不存在');

    await memberRepo.update(tenantId, params.id, { status: 'cancelled' });
    return { success: true };
  })

  // 积分调整
  .post('/:id/points', async ({ body, headers, params }) => {
    const tenantId = headers['x-tenant-id'] || 'aspen';
    const member = await memberRepo.findById(tenantId, params.id);
    if (!member) throw new Error('会员不存在');

    const { points, reason } = body as any;
    const updated = await memberRepo.updatePoints(tenantId, params.id, points);

    await pointsRepo.create({
      id: `pts_admin_${Date.now()}`,
      tenantId,
      memberId: params.id,
      points,
      balance: updated.points,
      type: 'admin',
      description: reason || '管理员手动调整',
    });

    return { success: true, points: updated.points };
  });

export default memberRoutes;
