/**
 * 租户复制脚本 (Tenant Copy Script)
 *
 * 用途: 快速复制一个新租户，基于模板自动创建数据库、配置和前端主题
 *
 * 使用方法:
 *   bun run scripts/copy-tenant.ts <新租户ID> <品牌名称> [模板租户ID]
 *
 * 示例:
 *   bun run scripts/copy-tenant.ts mycafe "我的咖啡馆" aspen
 */

import { createTenant, getTenantConfig, TENANT_REGISTRY } from '../src/config/tenant.registry';
import type { TenantConfig, TenantTheme } from '../src/config/tenant.types';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

// CLI 参数解析
const args = process.argv.slice(2);
const newTenantId = args[0];
const brandName = args[1];
const templateTenantId = args[2] || 'aspen';

if (!newTenantId || !brandName) {
  console.log(`
用法: bun run scripts/copy-tenant.ts <新租户ID> <品牌名称> [模板租户ID]

示例:
  bun run scripts/copy-tenant.ts mycafe "我的咖啡馆" aspen
  bun run scripts/copy-tenant.ts myrestaurant "我的餐厅" volcano
  `);
  process.exit(1);
}

/**
 * 主函数: 复制租户
 */
async function copyTenant() {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║         🔄 Aspen 租户复制工具 v1.0                         ║
╚════════════════════════════════════════════════════════════╝
  `);

  // 1. 验证模板租户存在
  console.log(`📋 步骤 1: 验证模板租户 "${templateTenantId}"...`);
  const templateConfig = getTenantConfig(templateTenantId);
  if (!templateConfig) {
    console.error(`❌ 错误: 模板租户 "${templateTenantId}" 不存在`);
    process.exit(1);
  }
  console.log(`   ✅ 找到模板: ${templateConfig.brandName} (${templateConfig.brandNameEn})`);

  // 2. 检查新租户是否已存在
  console.log(`\n📋 步骤 2: 检查新租户 "${newTenantId}"...`);
  if (TENANT_REGISTRY[newTenantId]) {
    console.error(`❌ 错误: 租户 "${newTenantId}" 已存在`);
    process.exit(1);
  }
  console.log(`   ✅ 新租户名称可用`);

  // 3. 创建新租户配置
  console.log(`\n📋 步骤 3: 创建新租户配置...`);
  const newTenant = createTenant({
    id: newTenantId,
    brandName: brandName,
    brandNameEn: newTenantId.toUpperCase(),
    theme: {
      ...templateConfig.theme,
      primary: generateRandomColor(),
    },
    booking: {
      ...templateConfig.booking,
      rules: [...templateConfig.booking.rules],
    },
  });
  console.log(`   ✅ 租户创建成功: ${newTenant.brandName}`);

  // 4. 模拟数据库表结构创建
  console.log(`\n📋 步骤 4: 创建数据库表结构...`);
  await simulateDatabaseMigration(newTenantId);
  console.log(`   ✅ 表结构已创建 (模拟)`);

  // 5. 生成前端主题配置
  console.log(`\n📋 步骤 5: 生成前端主题配置...`);
  await generateFrontendTheme(newTenant);
  console.log(`   ✅ 主题配置已生成`);

  // 6. 生成前端预约模块配置
  console.log(`\n📋 步骤 6: 生成预约模块配置...`);
  await generateBookingConfig(newTenant);
  console.log(`   ✅ 预约配置已生成`);

  // 7. 生成静态资源目录
  console.log(`\n📋 步骤 7: 初始化存储配置...`);
  await initStorageConfig(newTenantId, newTenant.storageBucket);
  console.log(`   ✅ 存储配置已初始化 (模拟)`);

  console.log(`
╔════════════════════════════════════════════════════════════╗
║         ✅ 租户复制完成!                                   ║
╠════════════════════════════════════════════════════════════╣
║  新租户信息:                                               ║
║    ID: ${newTenantId.padEnd(48)}║
║    名称: ${brandName.padEnd(47)}║
║    预约模式: ${newTenant.booking.mode.padEnd(40)}║
║                                                            ║
║  后续操作:                                                 ║
║    1. 重启后端服务: bun run src/index.ts                   ║
║    2. 测试 API: curl -H "x-tenant-id: ${newTenantId}" \\   ║
║                http://localhost:3000/api/v1/brand         ║
║    3. 小程序请求头添加: x-tenant-id: ${newTenantId}        ║
╚════════════════════════════════════════════════════════════╝
  `);
}

/**
 * 模拟数据库迁移
 */
async function simulateDatabaseMigration(tenantId: string): Promise<void> {
  // 模拟创建表
  const tables = [
    `bookings_${tenantId}`,
    `menu_${tenantId}`,
    `members_${tenantId}`,
  ];

  for (const table of tables) {
    // 模拟延迟
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log(`   📝 创建表: ${table}`);
  }
}

/**
 * 生成随机主题色
 */
function generateRandomColor(): string {
  const colors = [
    '#4a9c6d', // 绿
    '#dc2626', // 红
    '#0ea5e9', // 蓝
    '#d4a574', // 金
    '#8b5cf6', // 紫
    '#f97316', // 橙
    '#06b6d4', // 青
    '#ec4899', // 粉
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * 生成前端主题配置
 */
async function generateFrontendTheme(tenant: TenantConfig): Promise<void> {
  const themeDir = join(process.cwd(), '../aspen-mp/src/themes');
  const themeFile = join(themeDir, `${tenant.id}.json`);

  // 确保目录存在
  if (!existsSync(themeDir)) {
    mkdirSync(themeDir, { recursive: true });
  }

  const themeConfig = {
    tenantId: tenant.id,
    brandName: tenant.brandName,
    brandNameEn: tenant.brandNameEn,
    theme: tenant.theme,
    config: {
      bookingMode: tenant.booking.mode,
      features: tenant.features,
    },
  };

  writeFileSync(themeFile, JSON.stringify(themeConfig, null, 2));
  console.log(`   📝 主题文件: ${tenant.id}.json`);
}

/**
 * 生成预约模块配置
 */
async function generateBookingConfig(tenant: TenantConfig): Promise<void> {
  const configDir = join(process.cwd(), '../aspen-mp/src/configs');
  const configFile = join(configDir, `${tenant.id}.json`);

  // 确保目录存在
  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true });
  }

  const bookingConfig = {
    mode: tenant.booking.mode,
    rules: tenant.booking.rules,
    seatTypes: tenant.booking.seatTypes,
    bookingConfig: {
      maxGuests: tenant.bookingConfig.maxGuests,
      minAdvanceHours: tenant.bookingConfig.minAdvanceHours,
      maxAdvanceDays: tenant.bookingConfig.maxAdvanceDays,
      autoConfirm: tenant.bookingConfig.autoConfirm,
      requireDeposit: tenant.bookingConfig.requireDeposit,
      depositAmount: tenant.bookingConfig.depositAmount,
      timeLimit: tenant.bookingConfig.timeLimit,
    },
    businessHours: tenant.businessHours,
  };

  writeFileSync(configFile, JSON.stringify(bookingConfig, null, 2));
  console.log(`   📝 预约配置: ${tenant.id}.json`);
}

/**
 * 初始化存储配置
 */
async function initStorageConfig(tenantId: string, bucket: string): Promise<void> {
  const dirs = [
    `assets/images`,
    `assets/videos`,
    `menu`,
    `brand`,
  ];

  for (const dir of dirs) {
    // 模拟创建目录
    await new Promise(resolve => setTimeout(resolve, 50));
    console.log(`   📝 存储目录: ${bucket}/${dir}`);
  }
}

// 执行主函数
copyTenant().catch(console.error);
