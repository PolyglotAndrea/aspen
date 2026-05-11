/**
 * Aspen API Server - 多租户版本
 * 主入口文件
 *
 * 支持的功能模块:
 * - 多租户管理
 * - 预订系统 (支持多门店、在线选座、核销)
 * - 会员系统 (等级、积分、权益)
 * - 外卖系统 (菜单、购物车、配送)
 * - 周边商品 (商品、分类)
 * - 统一订单系统
 */

import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { staticPlugin } from '@elysiajs/static';

// 租户中间件
import { tenantPlugin, tenantManagementRoutes } from './middleware/tenant';
// 认证中间件
import { authPlugin } from './middleware/auth';
// 插件系统
import { pluginMiddleware, pluginRegistry } from './plugins';
// 示例插件
import { requestLoggingPlugin, tenantMetricsPlugin } from './plugins/example';

// 业务路由
import { brandRoutes } from './routes/brand';
import { menuRoutes } from './routes/menu';
import { paymentRoutes } from './routes/payment';

// 模块化路由
import { bookingRoutes } from './modules/booking';
import { orderRoutesModule } from './modules/order';
import { memberRoutes, adminMemberRoutes } from './modules/member';
import { adminAuthRoutes } from './modules/admin';
import { deliveryRoutes } from './modules/delivery';
import { productRoutes } from './modules/product';

// 环境配置
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

// 应用实例
const app = new Elysia()
  // ==================== 基础中间件 ====================
  .use(cors())
  .use(swagger({
    documentation: {
      info: {
        title: 'Aspen Multi-Tenant API',
        version: '3.0.0',
        description: '多租户餐饮品牌 API - 支持预订、会员、外卖、周边商品、支付集成',
      },
      servers: [
        { url: 'http://localhost:3000', description: '本地开发' },
      ],
    },
  }))
  .use(staticPlugin())

  // ==================== 健康检查 ====================
  .get('/health', () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '3.0.0',
    mode: 'multi-tenant',
    features: ['booking', 'member', 'delivery', 'product', 'stores'],
  }))

  // ==================== 租户中间件 ====================
  .use(tenantPlugin({
    allowDevCreation: true,
    defaultTenant: 'aspen',
  }))

  // 租户管理路由
  .use(tenantManagementRoutes)

  // ==================== 认证中间件 ====================
  .use(authPlugin)

  // ==================== 插件系统 ====================
  .use(pluginMiddleware())

  // ==================== 业务路由 ====================
  .group('/api/v1', (app) =>
    app
      // 品牌路由
      .use(brandRoutes)
      // 菜单路由 (堂食)
      .use(menuRoutes)
      // 预订路由
      .use(bookingRoutes)
      // 统一订单路由
      .use(orderRoutesModule)
      // 会员路由
      .use(memberRoutes)
      // 外卖路由
      .use(deliveryRoutes)
      // 周边商品路由
      .use(productRoutes)
      // Admin 会员管理路由
      .use(adminMemberRoutes)
      // Admin 认证路由
      .use(adminAuthRoutes)
      // 支付路由
      .use(paymentRoutes)
  )

  // ==================== 错误处理 ====================
  .onError(({ error, code, set }) => {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error(`[Error] ${code}:`, errMsg);

    if (code === 'NOT_FOUND') {
      set.status = 404;
      return { success: false, error: '接口不存在' };
    }

    if (code === 'VALIDATION') {
      set.status = 400;
      return { success: false, error: '参数验证失败', message: errMsg };
    }

    set.status = 500;
    return { success: false, error: '服务器错误', message: errMsg };
  })

  // ==================== 启动服务 ====================
  .listen(PORT);

// 注册示例插件
pluginRegistry.register(requestLoggingPlugin, { enabled: true, priority: 10 });
pluginRegistry.register(tenantMetricsPlugin, { enabled: true, priority: 5 });

// 异步启动插件
(async () => {
  await pluginRegistry.startAll();
  console.log('[Plugin] All plugins started');
})().catch(console.error);

// 启动信息
console.log(`
╔════════════════════════════════════════════════════════════╗
║         🌲 Aspen Multi-Tenant API Server v3.0              ║
╠════════════════════════════════════════════════════════════╣
║  📍 地址: http://localhost:${PORT}                            ║
║  📖 Swagger: http://localhost:${PORT}/swagger                ║
║  🏛️ 多租户: 已启用                                          ║
║  🔐 认证: JWT + SMS 验证码                                   ║
║  💾 数据库: PostgreSQL (Drizzle ORM)                        ║
║  💳 支付: 微信/支付宝/银联 (模拟模式)                        ║
║                                                            ║
║  可用模块:                                                  ║
║    • 预订系统 (booking)      ✅ 预订/选座/核销              ║
║    • 会员系统 (member)       ✅ 等级/积分/权益/JWT          ║
║    • 外卖系统 (delivery)     ✅ 菜单/购物车/配送            ║
║    • 周边商品 (product)      ✅ 商品/分类                   ║
║    • 统一订单 (orders)       ✅ 订单/支付/核销              ║
║    • 多门店 (stores)         ✅ 门店管理                    ║
║    • 支付集成 (payment)      ✅ 微信/支付宝/银联/分账       ║
║                                                            ║
║  可用租户:                                                  ║
║    • aspen   (白杨树 - 单门店)                             ║
║    • volcano (火山 - 多门店)                               ║
║    • ocean   (深海 - 简单预订)                             ║
║    • gold    (金阁 - 高端餐饮)                             ║
║                                                            ║
║  💡 提示:                                                  ║
║    - 使用 x-tenant-id header 指定租户                      ║
║    - 管理后台需要 x-admin-key header                       ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
`);