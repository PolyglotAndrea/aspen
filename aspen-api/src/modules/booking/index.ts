/**
 * 预订模块 (Booking Module)
 *
 * 支持多门店预订、在线选座、核销等功能
 * 继承统一订单系统
 */

import { Elysia, t } from 'elysia';
import { getTenantConfig } from '../../config/tenant.registry';
import { storeRepo } from '../../repositories/store.repo';

// ============================================
// 预订路由
// ============================================

export const bookingRoutes = new Elysia({ prefix: '/bookings' })

  // 获取预订配置
  .get('/config', async ({ headers }) => {
    const tenantId = headers['x-tenant-id'] || 'aspen';
    const config = getTenantConfig(tenantId);

    if (!config?.features.booking) {
      return { enabled: false };
    }

    const stores = config.stores.enabled
      ? await storeRepo.findByTenant(tenantId)
      : undefined;

    return {
      enabled: true,
      mode: config.booking.mode,
      rules: config.booking.rules,
      seatTypes: config.booking.seatTypes,
      bookingConfig: config.bookingConfig,
      businessHours: config.businessHours,
      storesEnabled: config.features.stores,
      stores,
    };
  })

  // 获取门店列表
  .get('/stores', async ({ headers }) => {
    const tenantId = headers['x-tenant-id'] || 'aspen';
    const config = getTenantConfig(tenantId);

    if (!config?.features.stores) {
      return { enabled: false, stores: [] };
    }

    const allStores = await storeRepo.findByTenant(tenantId);

    return {
      enabled: true,
      stores: allStores.map(s => ({
        id: s.id,
        name: s.name,
        shortName: s.shortName,
        address: s.address,
        phone: s.phone,
        businessHours: s.businessHours,
        status: s.status,
        images: s.images,
        description: s.description,
      })),
    };
  })

  // 获取门店详情
  .get('/stores/:id', async ({ params: { id }, headers }) => {
    const tenantId = headers['x-tenant-id'] || 'aspen';
    const config = getTenantConfig(tenantId);

    if (!config?.features.stores) {
      throw new Error('多门店功能未启用');
    }

    const store = await storeRepo.findById(tenantId, id);

    if (!store) {
      throw new Error('门店不存在');
    }

    return store;
  })

  // 创建门店
  .post('/stores', async ({ body, headers }) => {
    const tenantId = headers['x-tenant-id'] || 'aspen';
    const config = getTenantConfig(tenantId);

    if (!config?.features.stores) {
      throw new Error('多门店功能未启用');
    }

    const { name, shortName, address, phone, longitude, latitude, businessHours, description, images } = body as any;

    if (!name || !address || !phone) {
      throw new Error('缺少必要参数');
    }

    const existingStores = await storeRepo.findByTenant(tenantId);
    const storeId = `${tenantId}_store_${Date.now()}`;

    const newStore = {
      id: storeId,
      tenantId,
      name,
      shortName,
      address,
      phone,
      longitude,
      latitude,
      businessHours: businessHours || config.businessHours,
      status: 'active' as const,
      createdAt: new Date(),
      sort: existingStores.length,
      description,
      images,
    };

    await storeRepo.create(newStore);

    console.log(`[Store] Created: ${name} (${tenantId})`);

    return {
      success: true,
      store: newStore,
    };
  })

  // 更新门店
  .patch('/stores/:id', async ({ params: { id }, body, headers }) => {
    const tenantId = headers['x-tenant-id'] || 'aspen';
    const config = getTenantConfig(tenantId);

    if (!config?.features.stores) {
      throw new Error('多门店功能未启用');
    }

    const existingStore = await storeRepo.findById(tenantId, id);

    if (!existingStore) {
      throw new Error('门店不存在');
    }

    const updates = body as any;
    const allowedFields = ['name', 'shortName', 'address', 'phone', 'longitude', 'latitude', 'businessHours', 'status', 'sort', 'description', 'images'];

    const updateData: Record<string, any> = {};
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field];
      }
    }

    await storeRepo.update(tenantId, id, updateData);

    const updatedStore = await storeRepo.findById(tenantId, id);

    return {
      success: true,
      store: updatedStore,
    };
  })

  // 删除门店
  .delete('/stores/:id', async ({ params: { id }, headers }) => {
    const tenantId = headers['x-tenant-id'] || 'aspen';
    const config = getTenantConfig(tenantId);

    if (!config?.features.stores) {
      throw new Error('多门店功能未启用');
    }

    const existingStore = await storeRepo.findById(tenantId, id);

    if (!existingStore) {
      throw new Error('门店不存在');
    }

    await storeRepo.delete(tenantId, id);

    return { success: true, message: '门店已删除' };
  })

  // 获取门店桌位
  .get('/stores/:id/tables', async ({ params: { id }, headers }) => {
    const tenantId = headers['x-tenant-id'] || 'aspen';
    const config = getTenantConfig(tenantId);

    let store: any | null = null;

    if (config?.features.stores) {
      store = await storeRepo.findById(tenantId, id);
    }

    if (!store) {
      // 如果没有多门店配置，使用默认桌位
      if (config && config.booking.seatTypes.length > 0) {
        return {
          storeId: 'default',
          storeName: config.brandName,
          tables: config.booking.seatTypes.map((s, i) => ({
            id: s.id,
            name: s.name,
            capacity: s.capacity,
            type: 'indoor' as const,
            available: s.available,
            price: s.price,
          })),
        };
      }
      throw new Error('门店不存在');
    }

    const tables = await storeRepo.findTables(tenantId, id);

    return {
      storeId: store.id,
      storeName: store.name,
      tables: tables || [],
    };
  })

  // 添加桌位
  .post('/stores/:id/tables', async ({ params: { id }, body, headers }) => {
    const tenantId = headers['x-tenant-id'] || 'aspen';
    const config = getTenantConfig(tenantId);

    if (!config?.features.stores) {
      throw new Error('多门店功能未启用');
    }

    const store = await storeRepo.findById(tenantId, id);

    if (!store) {
      throw new Error('门店不存在');
    }

    const { name, capacity, position, type, price } = body as any;

    if (!name || !capacity) {
      throw new Error('缺少必要参数');
    }

    const tableId = `${id}_table_${Date.now()}`;
    const table = {
      id: tableId,
      tenantId,
      name,
      capacity,
      position,
      type: type || 'indoor',
      available: true,
      price,
      storeId: id,
    };

    await storeRepo.addTable(table);

    return {
      success: true,
      table,
    };
  })

  // 获取可用桌位 (按日期时间筛选)
  .get('/available-tables', async ({ headers, query }) => {
    const tenantId = headers['x-tenant-id'] || 'aspen';
    const config = getTenantConfig(tenantId);

    if (!config?.features.booking) {
      throw new Error('预订功能未启用');
    }

    const { storeId, date, time, guests } = query;

    let tables: any[] = [];

    if (config.features.stores && storeId) {
      // 多门店模式
      const store = await storeRepo.findById(tenantId, storeId as string);
      if (store) {
        const storeTables = await storeRepo.findTables(tenantId, storeId as string);
        tables = storeTables.filter((t: any) =>
          t.available && t.capacity >= parseInt(guests as string || '1')
        );
      }
    } else {
      // 单门店模式
      tables = config.booking.seatTypes
        .filter(s => s.available && s.capacity >= parseInt(guests as string || '1'))
        .map(s => ({
          id: s.id,
          name: s.name,
          icon: s.icon,
          capacity: s.capacity,
          price: s.price,
        }));
    }

    // 如果是 SEATING 模式，返回桌位列表供选择
    if (config.booking.mode === 'SEATING') {
      return {
        mode: 'SEATING',
        date,
        time,
        guests,
        tables,
      };
    }

    // RULES 模式不需要选座
    return {
      mode: 'RULES',
      date,
      time,
      guests,
      tables: [],
    };
  })

  // 获取预订规则
  .get('/rules', ({ headers }) => {
    const tenantId = headers['x-tenant-id'] || 'aspen';
    const config = getTenantConfig(tenantId);

    if (!config?.features.booking) {
      return { enabled: false };
    }

    return {
      enabled: true,
      mode: config.booking.mode,
      rules: config.booking.rules,
      bookingConfig: config.bookingConfig,
    };
  })

  // 获取预订列表 (管理端)
  .get('/', ({ headers, query }) => {
    const tenantId = headers['x-tenant-id'] || 'aspen';
    const config = getTenantConfig(tenantId);

    // 从订单系统获取预订订单
    // 这里可以添加额外的预订列表逻辑
    return {
      tenantId,
      brandName: config?.brandName,
      mode: config?.booking.mode,
      // 预订列表将通过统一订单系统获取
    };
  })

  // 获取预订详情
  .get('/:id', ({ params: { id }, headers }) => {
    const tenantId = headers['x-tenant-id'] || 'aspen';

    // 预订详情将通过统一订单系统获取
    return {
      id,
      tenantId,
      message: '请使用 /api/v1/orders/:id 获取详情',
    };
  })

  // 创建预订 (简化版，完整逻辑在统一订单系统)
  .post('/', async ({ body, headers }) => {
    const tenantId = headers['x-tenant-id'] || 'aspen';
    const config = getTenantConfig(tenantId);

    if (!config?.features.booking) {
      throw new Error('预订功能未启用');
    }

    const {
      name,
      phone,
      date,
      time,
      guests,
      storeId,
      tableId,
      tableName,
      remarks,
    } = body as any;

    // 验证必填字段
    if (!name || !phone || !date || !time || !guests) {
      throw new Error('缺少必要参数');
    }

    // 验证人数
    if (guests > config.bookingConfig.maxGuests) {
      throw new Error(`最多支持 ${config.bookingConfig.maxGuests} 人预订`);
    }

    // SEATING 模式需要选座
    if (config.booking.mode === 'SEATING' && config.booking.seatTypes.length > 0) {
      if (!tableId) {
        throw new Error('请选择桌位');
      }
    }

    // 验证门店
    if (config.features.stores && storeId) {
      const store = await storeRepo.findById(tenantId, storeId);
      if (!store) {
        throw new Error('门店不存在');
      }
      if (store.status !== 'active') {
        throw new Error('门店已停业');
      }
    }

    // 返回预订信息，实际创建通过统一订单系统
    const verifyCode = Math.random().toString(36).substr(2, 6).toUpperCase();

    console.log(`[Booking] Created: ${name}, ${date} ${time}, ${guests}人`);

    return {
      success: true,
      booking: {
        id: `${tenantId}_booking_${Date.now()}`,
        tenantId,
        name,
        phone,
        date,
        time,
        guests,
        storeId,
        tableId,
        tableName,
        verifyCode,
        status: config.bookingConfig.autoConfirm ? 'confirmed' : 'pending',
        createdAt: new Date().toISOString(),
      },
      message: config.bookingConfig.autoConfirm ? '预订成功' : '预订已提交，等待确认',
      deposit: config.bookingConfig.requireDeposit ? {
        required: true,
        amount: config.bookingConfig.depositAmount,
        message: `需支付订金 ¥${config.bookingConfig.depositAmount}`,
      } : undefined,
    };
  }, {
    body: t.Object({
      name: t.String({ minLength: 1 }),
      phone: t.String({ pattern: '^1\\d{10}$' }),
      date: t.String({ format: 'date' }),
      time: t.String(),
      guests: t.Number({ minimum: 1, maximum: 50 }),
      storeId: t.Optional(t.String()),
      tableId: t.Optional(t.String()),
      tableName: t.Optional(t.String()),
      remarks: t.Optional(t.String()),
    }),
  })

  // 确认预订 (管理员操作)
  .post('/:id/confirm', ({ params: { id }, headers }) => {
    const tenantId = headers['x-tenant-id'] || 'aspen';

    // 通过统一订单系统处理
    return {
      success: true,
      bookingId: id,
      message: '确认成功，请使用 /api/v1/orders/:id/confirm',
    };
  })

  // 取消预订
  .post('/:id/cancel', ({ params: { id }, headers }) => {
    const tenantId = headers['x-tenant-id'] || 'aspen';

    // 通过统一订单系统处理
    return {
      success: true,
      bookingId: id,
      message: '取消成功，请使用 /api/v1/orders/:id/cancel',
    };
  })

  // 核销预订
  .post('/:id/verify', ({ params: { id }, body, headers }) => {
    const tenantId = headers['x-tenant-id'] || 'aspen';
    const { verifyCode } = body as any;

    // 通过统一订单系统处理
    return {
      success: true,
      bookingId: id,
      verifyCode,
      message: '核销成功，请使用 /api/v1/orders/:id/verify',
    };
  });

export default bookingRoutes;
