/**
 * 种子数据脚本
 *
 * 可幂等重复运行（使用 upsert）
 * 用法: bun run scripts/seed.ts
 */

import { db } from '../src/db';
import {
  tenants, stores, tables, members, pointsRecords,
  orders, orderItems, cartItems, products, productCategories,
  deliveryMenuItems, menuItems, brandData, smsCodes,
  transactions, profitSharingOrders,
} from '../src/db/schema';
import { sql } from 'drizzle-orm';

// ============================================
// 租户配置（来自 tenant.registry.ts）
// ============================================

const defaultTheme = {
  primary: '#4a9c6d', primaryLight: '#6bbd8a', primaryDark: '#2d5a3d',
  accent: '#4a9c6d', background: '#000000', text: '#ffffff',
  textMuted: 'rgba(255, 255, 255, 0.6)', textSecondary: 'rgba(255, 255, 255, 0.4)',
  border: 'rgba(255, 255, 255, 0.1)', success: '#4ade80', warning: '#fbbf24',
  error: '#f87171', info: '#60a5fa', blur: '20rpx',
};

const volcanoTheme = { ...defaultTheme, primary: '#dc2626', primaryLight: '#ef4444', primaryDark: '#991b1b', accent: '#f97316' };
const oceanTheme = { ...defaultTheme, primary: '#0ea5e9', primaryLight: '#38bdf8', primaryDark: '#0369a1', accent: '#06b6d4', background: '#0c1929' };
const goldTheme = { ...defaultTheme, primary: '#d4a574', primaryLight: '#e8c49a', primaryDark: '#a67c52', accent: '#c9a962' };

const memberConfig = {
  enabled: true, pointsName: '积分', signInPoints: 10, consumePointsRate: 1,
  pointsDeductionRate: 100, pointsExpireDays: 365, minDeductionPoints: 100, maxDeductionRate: 0.3,
  levels: [
    { id: 'bronze', name: '青铜会员', level: 1, icon: '🥉', pointsRate: 1, discount: 0.98, upgradePoints: 0, description: '新用户默认等级' },
    { id: 'silver', name: '白银会员', level: 2, icon: '🥈', pointsRate: 1.2, discount: 0.95, upgradePoints: 1000, description: '累计1000积分升级' },
    { id: 'gold', name: '黄金会员', level: 3, icon: '🥇', pointsRate: 1.5, discount: 0.9, upgradePoints: 5000, description: '累计5000积分升级' },
    { id: 'platinum', name: '铂金会员', level: 4, icon: '💎', pointsRate: 2, discount: 0.85, upgradePoints: 20000, description: '累计20000积分升级' },
  ],
  benefits: { discount: 0.95, freeDelivery: false, priorityService: false, birthdayBenefit: { enabled: true, discount: 0.9, gift: '生日蛋糕' }, doublePointsDays: [0] },
};

const deliveryConfig = {
  enabled: true, platforms: ['wechat', 'alipay'], minOrderAmount: 20, deliveryFee: 5,
  packagingFee: 2, codEnabled: true,
  timeConfig: { instantDelivery: true, maxAdvanceMinutes: 1440, minAdvanceMinutes: 30, dayStartTime: '10:00', dayEndTime: '21:00', estimatedMinutes: 45 },
  areas: [
    { id: 'area_1', name: '配送范围一 (3km内)', available: true, feeRule: { freeThreshold: 30, baseFee: 3, perKmFee: 1, maxDistance: 5 } },
    { id: 'area_2', name: '配送范围二 (5km内)', available: true, feeRule: { freeThreshold: 50, baseFee: 5, perKmFee: 2, maxDistance: 10 } },
  ],
};

const productConfig = {
  enabled: true, deliverySupported: true, pickupSupported: true,
  categories: [
    { id: 'merch', name: '周边纪念品', icon: '🎁', sort: 1, enabled: true },
    { id: 'voucher', name: '代金券', icon: '🎫', sort: 2, enabled: true },
    { id: 'gift', name: '礼品卡', icon: '💳', sort: 3, enabled: true },
  ],
};

const tenantConfigs = [
  {
    id: 'aspen', brandName: '白杨树', brandNameEn: 'Aspen',
    config: {
      id: 'aspen', brandName: '白杨树', brandNameEn: 'Aspen',
      dbConnection: '', redisUrl: '', storageBucket: 'aspen-cdn',
      theme: defaultTheme,
      features: { booking: true, menu: true, member: true, comments: true, delivery: true, product: true, stores: false },
      booking: { mode: 'RULES', enabled: true, rules: ['请提前至少 2 小时预约', '预约成功后请准时到达', '最多保留座位 15 分钟', '取消预约请提前 1 天通知'], seatTypes: [] },
      businessHours: { lunch: { start: '11:30', end: '14:00' }, dinner: { start: '17:30', end: '22:00' } },
      bookingConfig: { maxGuests: 20, minAdvanceHours: 2, maxAdvanceDays: 30, autoConfirm: false },
      stores: { enabled: false, stores: [], crossStoreBooking: false },
      member: memberConfig, delivery: deliveryConfig, product: productConfig,
      payment: {
        mode: 'simulate',
        channels: {
          wechat: { enabled: true, mchid: '1234567890', appId: 'wx_aspen_dev', apiV3Key: '', privateKeyPath: '', serialNo: '' },
          alipay: { enabled: true, appId: 'alipay_aspen_dev', privateKey: '', alipayPublicKey: '' },
          unionpay: { enabled: false, mid: '', tid: '', certPath: '', certPassword: '' },
        },
        profitSharing: { enabled: true, receivers: [
          { name: 'platform', ratio: 0.15, receiverId: 'platform_mch_001', receiverType: 'merchant' },
          { name: 'store', ratio: 0.85, receiverId: 'aspen_mch_001', receiverType: 'merchant' },
        ]},
      },
      createdAt: '2024-01-01T00:00:00Z', status: 'active',
    },
  },
  {
    id: 'volcano', brandName: '火山', brandNameEn: 'Volcano',
    config: {
      id: 'volcano', brandName: '火山', brandNameEn: 'Volcano',
      dbConnection: '', redisUrl: '', storageBucket: 'volcano-cdn',
      theme: volcanoTheme,
      features: { booking: true, menu: true, member: true, comments: true, delivery: true, product: true, stores: true },
      booking: { mode: 'SEATING', enabled: true, rules: ['需支付订金 ¥50 确认预约', '周末节假日限时 2 小时', '取消请提前 24 小时', '过时不候自动取消'], seatTypes: [
        { id: 'window', name: '窗边位', icon: '🪟', capacity: 2, available: true },
        { id: 'double', name: '双人桌', icon: '🪑', capacity: 2, available: true },
        { id: 'quad', name: '四人位', icon: '🛋️', capacity: 4, available: true },
        { id: 'vip', name: '包厢', icon: '🚪', capacity: 8, available: true, price: 500 },
      ]},
      businessHours: { lunch: { start: '11:00', end: '14:00' }, dinner: { start: '17:00', end: '23:00' } },
      bookingConfig: { maxGuests: 15, minAdvanceHours: 1, maxAdvanceDays: 14, autoConfirm: true, requireDeposit: true, depositAmount: 50, timeLimit: 120 },
      stores: { enabled: true, crossStoreBooking: true, stores: [], defaultStoreId: 'store_1' },
      member: memberConfig, delivery: deliveryConfig, product: productConfig,
      payment: {
        mode: 'simulate',
        channels: {
          wechat: { enabled: true, mchid: '1234567891', appId: 'wx_volcano_dev', apiV3Key: '', privateKeyPath: '', serialNo: '' },
          alipay: { enabled: true, appId: 'alipay_volcano_dev', privateKey: '', alipayPublicKey: '' },
          unionpay: { enabled: false, mid: '', tid: '', certPath: '', certPassword: '' },
        },
        profitSharing: { enabled: true, receivers: [
          { name: 'platform', ratio: 0.10, receiverId: 'platform_mch_001', receiverType: 'merchant' },
          { name: 'store_a', ratio: 0.45, receiverId: 'volcano_store_a', receiverType: 'merchant' },
          { name: 'store_b', ratio: 0.45, receiverId: 'volcano_store_b', receiverType: 'merchant' },
        ]},
      },
      createdAt: '2024-02-01T00:00:00Z', status: 'active',
    },
  },
  {
    id: 'ocean', brandName: '深海', brandNameEn: 'Ocean',
    config: {
      id: 'ocean', brandName: '深海', brandNameEn: 'Ocean',
      dbConnection: '', redisUrl: '', storageBucket: 'ocean-cdn',
      theme: oceanTheme,
      features: { booking: true, menu: true, member: false, comments: true, delivery: false, product: true, stores: false },
      booking: { mode: 'RULES', enabled: true, rules: ['请提前 3 小时预约', '预约后请准时到达', '入座后限时 2 小时'], seatTypes: [] },
      businessHours: { lunch: { start: '12:00', end: '14:30' }, dinner: { start: '18:00', end: '22:30' } },
      bookingConfig: { maxGuests: 10, minAdvanceHours: 3, maxAdvanceDays: 7, autoConfirm: false, timeLimit: 120 },
      stores: { enabled: false, stores: [], crossStoreBooking: false },
      member: { ...memberConfig, enabled: false }, delivery: { ...deliveryConfig, enabled: false }, product: productConfig,
      payment: { mode: 'simulate', channels: { wechat: { enabled: true, mchid: '1234567892', appId: 'wx_ocean_dev', apiV3Key: '', privateKeyPath: '', serialNo: '' }, alipay: { enabled: false, appId: '', privateKey: '', alipayPublicKey: '' }, unionpay: { enabled: false, mid: '', tid: '', certPath: '', certPassword: '' } }, profitSharing: { enabled: false, receivers: [] } },
      createdAt: '2024-03-01T00:00:00Z', status: 'active',
    },
  },
  {
    id: 'gold', brandName: '金阁', brandNameEn: 'Gold',
    config: {
      id: 'gold', brandName: '金阁', brandNameEn: 'Gold',
      dbConnection: '', redisUrl: '', storageBucket: 'gold-cdn',
      theme: goldTheme,
      features: { booking: true, menu: true, member: true, comments: false, delivery: false, product: true, stores: true },
      booking: { mode: 'SEATING', enabled: true, rules: ['需支付订金 ¥200 确认预约', '高端餐厅限时 2.5 小时', '取消请提前 48 小时', '着正装入店'], seatTypes: [
        { id: 'standard', name: '标准座', icon: '🪑', capacity: 2, available: true },
        { id: 'window', name: '景观座', icon: '🌃', capacity: 2, available: true, price: 100 },
        { id: 'booth', name: '卡座', icon: '🛋️', capacity: 4, available: true },
        { id: 'private', name: '包间', icon: '🚪', capacity: 10, available: true, price: 1000 },
      ]},
      businessHours: { lunch: { start: '11:30', end: '14:00' }, dinner: { start: '18:00', end: '23:00' } },
      bookingConfig: { maxGuests: 30, minAdvanceHours: 4, maxAdvanceDays: 60, autoConfirm: false, requireDeposit: true, depositAmount: 200, timeLimit: 150 },
      stores: { enabled: true, crossStoreBooking: true, stores: [], defaultStoreId: 'store_1' },
      member: memberConfig, delivery: { ...deliveryConfig, enabled: false }, product: productConfig,
      payment: {
        mode: 'simulate',
        channels: {
          wechat: { enabled: true, mchid: '1234567893', appId: 'wx_gold_dev', apiV3Key: '', privateKeyPath: '', serialNo: '' },
          alipay: { enabled: true, appId: 'alipay_gold_dev', privateKey: '', alipayPublicKey: '' },
          unionpay: { enabled: true, mid: 'gold_union_mid', tid: 'gold_union_tid', certPath: '', certPassword: '' },
        },
        profitSharing: { enabled: true, receivers: [
          { name: 'platform', ratio: 0.20, receiverId: 'platform_mch_001', receiverType: 'merchant' },
          { name: 'store', ratio: 0.60, receiverId: 'gold_mch_001', receiverType: 'merchant' },
          { name: 'agent', ratio: 0.20, receiverId: 'gold_agent_001', receiverType: 'personal' },
        ]},
      },
      createdAt: '2024-04-01T00:00:00Z', status: 'active',
    },
  },
];

// ============================================
// 种子数据
// ============================================

const sampleStores = [
  { id: 'store_1', tenantId: 'volcano', name: '总店', shortName: '总店', address: '市中心路123号', phone: '400-888-8888', businessHours: { lunch: { start: '11:30', end: '14:00' }, dinner: { start: '17:30', end: '22:00' } }, status: 'active', sort: 1 },
  { id: 'store_2', tenantId: 'volcano', name: '分店一', shortName: '分店一', address: '高新区创新路456号', phone: '400-888-8889', businessHours: { lunch: { start: '11:00', end: '14:00' }, dinner: { start: '17:00', end: '22:30' } }, status: 'active', sort: 2 },
  { id: 'store_3', tenantId: 'gold', name: '金阁总店', shortName: '总店', address: '金融街1号', phone: '400-999-9999', businessHours: { lunch: { start: '11:30', end: '14:00' }, dinner: { start: '18:00', end: '23:00' } }, status: 'active', sort: 1 },
];

const sampleTables = [
  { id: 'table_1', tenantId: 'volcano', storeId: 'store_1', name: 'A1', capacity: 2, type: 'window', position: '靠窗' },
  { id: 'table_2', tenantId: 'volcano', storeId: 'store_1', name: 'A2', capacity: 2, type: 'window', position: '靠窗' },
  { id: 'table_3', tenantId: 'volcano', storeId: 'store_1', name: 'B1', capacity: 4, type: 'indoor', position: '大厅' },
  { id: 'table_4', tenantId: 'volcano', storeId: 'store_1', name: 'V1', capacity: 8, type: 'vip', position: '包厢', price: 500 },
];

const sampleMenuItems = [
  { tenantId: 'aspen', name: '美式咖啡', price: 28, description: '经典美式', tags: ['咖啡', '经典'], available: true },
  { tenantId: 'aspen', name: '拿铁', price: 32, description: '丝滑拿铁', tags: ['咖啡', '热饮'], available: true },
  { tenantId: 'aspen', name: '提拉米苏', price: 38, description: '意式甜品', tags: ['甜品'], available: true },
  { tenantId: 'volcano', name: '和牛牛排', price: 388, description: 'A5和牛', tags: ['招牌', '牛排'], available: true },
  { tenantId: 'volcano', name: '龙虾意面', price: 168, description: '波士顿龙虾', tags: ['意面', '海鲜'], available: true },
  { tenantId: 'volcano', name: '凯撒沙拉', price: 58, description: '经典凯撒', tags: ['沙拉'], available: true },
];

const sampleDeliveryItems = [
  { tenantId: 'aspen', name: '招牌汉堡', price: 38, category: 'main', available: true, stock: 100, tags: ['招牌', '热销'] },
  { tenantId: 'aspen', name: '脆薯条', price: 18, category: 'sides', available: true, stock: 200 },
  { tenantId: 'aspen', name: '可乐', price: 8, category: 'drinks', available: true, stock: 500 },
  { tenantId: 'volcano', name: '招牌汉堡', price: 45, category: 'main', available: true, stock: 100, tags: ['招牌'] },
  { tenantId: 'volcano', name: '芝士薯条', price: 22, category: 'sides', available: true, stock: 150 },
];

const sampleProducts = [
  { tenantId: 'aspen', categoryId: 'merch', name: '品牌定制T恤', price: 128, originalPrice: 168, stock: 50, status: 'active', sort: 1 },
  { tenantId: 'aspen', categoryId: 'merch', name: '品牌LOGO徽章', price: 28, stock: 200, status: 'active', sort: 2 },
  { tenantId: 'aspen', categoryId: 'voucher', name: '50元代金券', price: 45, stock: 100, status: 'active', sort: 3 },
];

const sampleCategories = [
  { id: 'merch', tenantId: 'aspen', name: '周边纪念品', icon: '🎁', sort: 1 },
  { id: 'voucher', tenantId: 'aspen', name: '代金券', icon: '🎫', sort: 2 },
  { id: 'gift', tenantId: 'aspen', name: '礼品卡', icon: '💳', sort: 3 },
];

const sampleBrandData = [
  { id: 'brand_aspen', tenantId: 'aspen', videoUrl: 'https://cdn.aspen.com/brand-bg.mp4', tagline: '你见过白杨树吗', stories: [
    { id: 'origin', title: 'UNDER THE ASPEN', content: '白杨树下的静谧与火焰，在城市中寻找一片自然的栖息地...' },
    { id: 'philosophy', title: '自然与匠心', content: '我们相信，最好的料理源于对自然的敬畏...' },
  ]},
];

// ============================================
// 执行种子数据插入
// ============================================

async function seed() {
  console.log('🌱 开始插入种子数据...');

  // 清空现有数据（按外键依赖顺序）
  console.log('  清空现有数据...');
  await db.delete(profitSharingOrders);
  await db.delete(transactions);
  await db.delete(smsCodes);
  await db.delete(cartItems);
  await db.delete(orderItems);
  await db.delete(orders);
  await db.delete(pointsRecords);
  await db.delete(members);
  await db.delete(tables);
  await db.delete(stores);
  await db.delete(deliveryMenuItems);
  await db.delete(menuItems);
  await db.delete(products);
  await db.delete(productCategories);
  await db.delete(brandData);
  await db.delete(tenants);

  // 1. 租户
  console.log('  插入租户...');
  for (const t of tenantConfigs) {
    await db.insert(tenants).values({
      id: t.id,
      brandName: t.brandName,
      brandNameEn: t.brandNameEn,
      config: t.config as any,
      status: 'active',
    });
  }

  // 2. 门店
  console.log('  插入门店...');
  for (const s of sampleStores) {
    await db.insert(stores).values(s as any);
  }

  // 3. 桌位
  console.log('  插入桌位...');
  for (const t of sampleTables) {
    await db.insert(tables).values(t as any);
  }

  // 4. 堂食菜单
  console.log('  插入堂食菜单...');
  for (const item of sampleMenuItems) {
    await db.insert(menuItems).values(item as any);
  }

  // 5. 外卖菜单
  console.log('  插入外卖菜单...');
  for (const item of sampleDeliveryItems) {
    await db.insert(deliveryMenuItems).values({
      id: `dm_${item.tenantId}_${item.name}`,
      ...item,
    } as any);
  }

  // 6. 商品分类
  console.log('  插入商品分类...');
  for (const cat of sampleCategories) {
    await db.insert(productCategories).values(cat as any);
  }

  // 7. 商品
  console.log('  插入商品...');
  for (const p of sampleProducts) {
    await db.insert(products).values({
      id: `prod_${p.tenantId}_${p.name}`,
      images: [],
      ...p,
    } as any);
  }

  // 8. 品牌数据
  console.log('  插入品牌数据...');
  for (const b of sampleBrandData) {
    await db.insert(brandData).values(b as any);
  }

  console.log('✅ 种子数据插入完成！');
  console.log(`   - ${tenantConfigs.length} 个租户`);
  console.log(`   - ${sampleStores.length} 个门店`);
  console.log(`   - ${sampleTables.length} 个桌位`);
  console.log(`   - ${sampleMenuItems.length} 个堂食菜品`);
  console.log(`   - ${sampleDeliveryItems.length} 个外卖菜品`);
  console.log(`   - ${sampleCategories.length} 个商品分类`);
  console.log(`   - ${sampleProducts.length} 个商品`);
  console.log(`   - ${sampleBrandData.length} 个品牌数据`);

  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ 种子数据插入失败:', err);
  process.exit(1);
});
