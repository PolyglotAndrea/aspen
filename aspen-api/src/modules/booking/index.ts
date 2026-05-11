/**
 * 预订模块 (Booking Module) v2.0
 *
 * 支持多门店预订、在线选座、核销等功能
 * 继承统一订单系统
 */

import { Elysia, t } from 'elysia';
import type { Store, StoreDetail } from '../../config/tenant.types';
import { getTenantConfig } from '../../config/tenant.registry';
import { storeRepo } from '../../repositories/store.repo';
import { deliveryRepo } from '../../repositories/product.repo';

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

  // 获取门店列表 (增强版 - 含评分/配送等)
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
        longitude: s.longitude,
        latitude: s.latitude,
        businessHours: s.businessHours,
        minOrderAmount: s.minOrderAmount,
        deliveryFee: s.deliveryFee,
        packPrice: s.packPrice,
        notice: s.notice,
        qrCode: s.qrCode,
        isOpen: s.isOpen,
        features: s.features,
        rating: s.rating,
        ratingCount: s.ratingCount,
        monthlySales: s.monthlySales,
        deliveryDistance: s.deliveryDistance,
        images: s.images,
        description: s.description,
        status: s.status,
        sort: s.sort,
      })),
    };
  })

  // 获取门店详情 (含配送范围)
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

    // 获取该门店的外卖配置
    let deliveryAreas;
    if (config?.features.delivery) {
      const deliveryConfig = config.delivery;
      if (deliveryConfig?.areas) {
        deliveryAreas = deliveryConfig.areas;
      }
    }

    const storeDetail: StoreDetail = {
      ...store,
      rating: store.rating ?? 0,
      ratingCount: store.ratingCount ?? 0,
      monthlySales: store.monthlySales ?? 0,
      minOrderAmount: store.minOrderAmount ?? 0,
      deliveryFee: store.deliveryFee ?? 0,
      deliveryDistance: store.deliveryDistance ?? 5,
      packPrice: store.packPrice ?? 0,
      deliveryAreas: deliveryAreas,
    };

    return storeDetail;
  })

  // 创建门店
  .post('/stores', async ({ body, headers }) => {
    const tenantId = headers['x-tenant-id'] || 'aspen';
    const config = getTenantConfig(tenantId);

    if (!config?.features.stores) {
      throw new Error('多门店功能未启用');
    }

    const {
      name, shortName, address, phone,
      longitude, latitude, businessHours, description, images,
      minOrderAmount, deliveryFee, packPrice, notice, qrCode,
      features, isOpen,
    } = body as any;

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
      rating: 0,
      ratingCount: 0,
      monthlySales: 0,
      minOrderAmount: minOrderAmount || 0,
      deliveryFee: deliveryFee || 0,
      deliveryDistance: ((body as any).deliveryDistance as number) || 5,
      packPrice: packPrice || 0,
      notice: notice || '',
      qrCode: qrCode || '',
      features: features || {},
      isOpen: isOpen !== undefined ? isOpen : true,
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
    const allowedFields = [
      'name', 'shortName', 'address', 'phone',
      'longitude', 'latitude', 'businessHours', 'status',
      'sort', 'description', 'images',
      'minOrderAmount', 'deliveryFee', 'packPrice',
      'notice', 'qrCode', 'features', 'isOpen',
      'rating', 'ratingCount', 'monthlySales',
    ];

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
      const store = await storeRepo.findById(tenantId, storeId as string);
      if (store) {
        const storeTables = await storeRepo.findTables(tenantId, storeId as string);
        tables = storeTables.filter((t: any) =>
          t.available && t.capacity >= parseInt(guests as string || '1')
        );
      }
    } else if (config.booking?.seatTypes) {
      tables = config.booking.seatTypes
        .filter((s: any) => s.available && s.capacity >= parseInt(guests as string || '1'))
        .map((s: any) => ({
          id: s.id,
          name: s.name,
          icon: s.icon,
          capacity: s.capacity,
          price: s.price,
        }));
    }

    if (config.booking.mode === 'SEATING') {
      return {
        mode: 'SEATING',
        date,
        time,
        guests,
        tables,
      };
    }

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

    return {
      tenantId,
      brandName: config?.brandName,
      mode: config?.booking.mode,
    };
  })

  // 获取预订详情
  .get('/:id', ({ params: { id }, headers }) => {
    const tenantId = headers['x-tenant-id'] || 'aspen';

    return {
      id,
      tenantId,
      message: '请使用 /api/v1/orders/:id 获取详情',
    };
  })

  // 创建预订
  .post('/', async ({ body, headers }) => {
    const tenantId = headers['x-tenant-id'] || 'aspen';
    const config = getTenantConfig(tenantId);

    if (!config?.features.booking) {
      throw new Error('预订功能未启用');
    }

    const {
      name, phone, date, time, guests, storeId,
    } = body as any;

    if (!name || !phone || !date || !time) {
      throw new Error('缺少必要参数');
    }

    const orderData = {
      type: 'booking',
      storeId,
      items: [{
        productId: 'booking',
        productName: '到店预订',
        price: 0,
        quantity: 1,
        subtotal: 0,
      }],
      bookingInfo: {
        date, time, guests, name, phone,
      },
    };

    return {
      success: true,
      message: '预订已提交，请选择桌位并完成支付',
      data: orderData,
    };
  });