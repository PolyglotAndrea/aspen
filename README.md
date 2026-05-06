# Aspen - 多租户餐饮管理平台

Aspen 是一个全栈多租户餐饮品牌管理平台，支持预订系统、会员管理、外卖配送、周边商品、统一订单、支付集成（微信/支付宝/银联）及多级分账。

## 项目结构

```
aspen/
├── aspen-api/          # 后端 API (Bun + ElysiaJS)
├── aspen-mp/           # 小程序/H5 前端 (uni-app + Vue 3)
├── aspen-admin/        # 管理后台 (React + Vite + Tailwind)
└── docker-compose.yml  # PostgreSQL + Redis
```

## 技术栈

| 层级 | 技术 |
|------|------|
| 后端框架 | Bun + ElysiaJS |
| 数据库 | PostgreSQL + Drizzle ORM |
| 认证 | JWT (jose) + bcryptjs |
| 小程序 | uni-app (Vue 3) + Pinia |
| 管理后台 | React 18 + Vite + Ant Design + Tailwind CSS |
| 支付 | 微信支付 v3 / 支付宝 OpenAPI v3 / 银联 |

## 快速开始

### 前置要求

- [Bun](https://bun.sh) >= 1.0
- [Node.js](https://nodejs.org) >= 18
- [Docker](https://docker.com) (用于 PostgreSQL)

### 1. 启动数据库

```bash
docker compose up -d
```

### 2. 后端 API

```bash
cd aspen-api
cp .env.example .env    # 或直接使用 .env
bun install
bun run db:push         # 推送 schema 到数据库
bun run db:seed         # 种子数据
bun run dev             # 启动开发服务器 (端口 3000)
```

Swagger 文档: http://localhost:3000/swagger

### 3. 小程序 / H5

```bash
cd aspen-mp
npm install
npm run dev:h5          # H5 模式 (端口 5173)
```

### 4. 管理后台

```bash
cd aspen-admin
npm install
npm run dev             # 开发服务器 (端口 5174)
```

### 一键启动

```bash
./start.sh all          # 启动 API + MP
./start.sh stop         # 停止所有服务
./start.sh status       # 查看运行状态
```

## 核心功能

### 多租户系统

通过 `x-tenant-id` HTTP header 实现行级租户隔离。内置 4 个示例租户：

| 租户 | 品牌 | 特点 |
|------|------|------|
| `aspen` | 白杨树 | 单门店，全功能 |
| `volcano` | 火山 | 多门店，高级预订 |
| `ocean` | 深海 | 简化版，无会员 |
| `gold` | 金阁 | 高端餐饮，三级分账 |

### 预订系统

- 两种模式: RULES（纯时间预约）和 SEATING（选座 + 押金）
- 多门店支持、桌位管理、可用时段查询

### 会员系统

- 手机号自动注册、密码登录
- 4 等级（青铜/白银/黄金/铂金）、积分体系
- 签到、消费积分、积分抵扣

### 统一订单

- 支持预订/外卖/商品三种订单类型
- 状态机: `pending → paid → confirmed → preparing → ready → delivering/completed`
- 购物车、核销码、退款流程

### 支付集成

- **微信支付 v3**: JSAPI（小程序）、RSA-SHA256-PSS 签名、AES-256-GCM 回调解密
- **支付宝 OpenAPI v3**: WAP 支付、RSA2 签名、表单自动提交
- **银联**: 证书签名、WAP 重定向、异步回调
- **模拟模式**: 开发环境默认，所有操作即时成功
- **多级分账**: 按订单灵活配置 N 级分账比例

### 外卖配送

- 菜单 CRUD、分类管理
- 配送费计算（区域制 + 免配送门槛）
- 配送时间窗口检查

### 周边商品

- 商品 CRUD、分类管理
- 库存管理、规格配置

## API 路由

所有业务路由在 `/api/v1` 下。完整文档见 Swagger。

```
GET  /health                              # 健康检查
GET  /api/v1/brand                        # 品牌信息
GET  /api/v1/menu                         # 堂食菜单
GET  /api/v1/bookings/config              # 预订配置
GET  /api/v1/bookings/stores              # 门店列表
GET  /api/v1/bookings/available-tables    # 可用桌位
POST /api/v1/orders                       # 创建订单
GET  /api/v1/orders                       # 订单列表
GET  /api/v1/orders/cart                  # 购物车
POST /api/v1/member/login/phone           # 手机登录
GET  /api/v1/member/profile               # 会员信息
GET  /api/v1/delivery/menu                # 外卖菜单
GET  /api/v1/products                     # 周边商品
POST /api/v1/payment/orders/:id/pay       # 创建支付
POST /api/v1/payment/notify/wechat        # 微信回调
POST /api/v1/payment/notify/alipay        # 支付宝回调
POST /api/v1/payment/notify/unionpay      # 银联回调
GET  /api/v1/admin/members                # 管理会员 (需 x-admin-key)
```

## 环境变量

```bash
# aspen-api/.env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/aspen_main
JWT_SECRET=your-jwt-secret
ADMIN_API_KEY=your-admin-key
PAYMENT_MODE=simulate          # simulate | sandbox | production
```

## Docker

```bash
docker compose up -d           # 启动 PostgreSQL + Redis
docker compose down            # 停止
docker compose down -v         # 停止并删除数据
```

## 许可证

[MIT](LICENSE)
