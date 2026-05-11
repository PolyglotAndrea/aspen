/**
 * 订单模块入口 (Order Module Entry)
 * 统一订单系统 - 支持预订、外卖、周边商品三种订单类型
 *
 * 文件拆分说明:
 * - order.routes.ts  - 核心订单 CRUD 路由
 * - order.cart.ts    - 购物车相关路由
 * - order.helpers.ts - 辅助函数 (订单号生成、金额计算、状态校验)
 */

import { Elysia } from 'elysia';
import { orderRoutes } from './order.routes';
import { cartRoutes } from './order.cart';

export const orderRoutesModule = new Elysia({ prefix: '/orders' })
  .use(orderRoutes)
  .use(cartRoutes);