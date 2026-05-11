# Aspen 本地部署指南

## 环境要求

| 工具 | 最低版本 | 说明 |
|------|---------|------|
| [Bun](https://bun.sh) | >= 1.0 | 后端运行时 |
| [Node.js](https://nodejs.org) | >= 18 | 前端构建 |
| [Docker](https://docker.com) | 最新 | PostgreSQL + Redis |

## 项目结构

```
aspen/
├── aspen-api/          # 后端 API (Bun + ElysiaJS)
├── aspen-mp/           # 小程序 / H5 前端 (uni-app + Vue 3)
├── aspen-admin/        # 管理后台 (React + Vite + Tailwind)
├── docker-compose.yml  # PostgreSQL + Redis
├── start.sh            # 一键启动脚本
└── LOCAL_DEPLOYMENT.md # 本文档
```

---

## 第一步：启动数据库

```bash
# 在项目根目录执行
docker compose up -d
```

启动 PostgreSQL (端口 5432) 和 Redis (端口 6379)。

验证容器状态：

```bash
docker compose ps
# 两个容器应显示 "healthy" 状态
```

数据库连接信息：

| 项目 | 值 |
|------|-----|
| 主机 | `localhost` |
| 端口 | `5432` |
| 用户 | `postgres` |
| 密码 | `postgres` |
| 数据库 | `aspen_main` |

---

## 第二步：配置后端环境变量

```bash
cd aspen-api
cp .env.example .env
```

`.env` 文件已预设开发默认值，无需修改即可运行：

```bash
# aspen-api/.env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/aspen_main
JWT_SECRET=dev-jwt-secret-change-in-production
ADMIN_API_KEY=dev-admin-key-change-in-production
PAYMENT_MODE=simulate
```

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `DATABASE_URL` | PostgreSQL 连接串 | `postgresql://postgres:postgres@localhost:5432/aspen_main` |
| `JWT_SECRET` | JWT 签名密钥 | `dev-jwt-secret-change-in-production` |
| `ADMIN_API_KEY` | 管理后台 API 密钥 | `dev-admin-key-change-in-production` |
| `PAYMENT_MODE` | 支付模式 | `simulate`（模拟）/ `sandbox` / `production` |

---

## 第三步：初始化后端

```bash
cd aspen-api

# 安装依赖
bun install

# 推送数据库 Schema
bun run db:push

# 插入种子数据（4 个租户 + 示例数据）
bun run db:seed
```

种子数据包含：

- **4 个租户**：aspen（白杨树）、volcano（火山）、ocean（深海）、gold（金阁）
- **3 个门店**：volcano 2 家、gold 1 家
- **4 个桌位**：volcano 门店桌位
- **6 道堂食菜品**：aspen 3 道、volcano 3 道
- **5 道外卖菜品**：aspen 3 道、volcano 2 道
- **3 个商品分类 + 3 个周边商品**
- **1 个品牌故事数据**

---

## 第四步：启动后端 API

```bash
cd aspen-api
bun run dev
```

后端将在 `http://localhost:3000` 启动，Swagger 文档地址：`http://localhost:3000/swagger`

验证后端：

```bash
# 健康检查
curl http://localhost:3000/health

# 品牌信息
curl http://localhost:3000/api/v1/brand -H "x-tenant-id: aspen"

# 切换租户
curl http://localhost:3000/api/v1/brand -H "x-tenant-id: volcano"
```

---

## 第五步：配置前端环境变量

### 小程序 / H5

```bash
cd aspen-mp
cp .env.example .env
```

```bash
# aspen-mp/.env
VITE_API_BASE=http://localhost:3000
```

### 管理后台

```bash
cd aspen-admin
cp .env.example .env
```

```bash
# aspen-admin/.env
VITE_API_BASE=http://localhost:3000
VITE_ADMIN_KEY=dev-admin-key-change-in-production
```

> `VITE_ADMIN_KEY` 需与后端 `ADMIN_API_KEY` 一致。

---

## 第六步：启动前端

### 小程序 / H5

```bash
cd aspen-mp
npm install
npm run dev:h5          # H5 模式 (http://localhost:5173)
```

微信小程序模式需使用微信开发者工具打开 `aspen-mp` 目录：

```bash
npm run dev:mp
```

### 管理后台

```bash
cd aspen-admin
npm install
npm run dev             # http://localhost:5174
```

> **端口冲突**：`aspen-mp` 和 `aspen-admin` 默认都使用 5174 端口。同时启动时需修改其中一个的 `vite.config.ts` 中的 `server.port`。

---

## 一键启动

```bash
# 在项目根目录
./start.sh all          # 启动 API + MP
./start.sh api          # 仅启动后端
./start.sh mp           # 仅启动小程序
./start.sh stop         # 停止所有服务
./start.sh status       # 查看运行状态
./start.sh test         # API 冒烟测试
```

---

## 多租户切换

通过 `x-tenant-id` 请求头切换租户，默认为 `aspen`。

| 租户 ID | 品牌 | 特点 |
|---------|------|------|
| `aspen` | 白杨树 | 单店，全功能 |
| `volcano` | 火山 | 多门店，高级预约（选座模式） |
| `ocean` | 深海 | 简化版，无会员系统 |
| `gold` | 金阁 | 高端餐饮，三级分账 |

```bash
# 示例
curl http://localhost:3000/api/v1/brand -H "x-tenant-id: gold"
```

---

## 认证测试

```bash
# 手机号登录（自动注册，验证码固定 888888）
curl -X POST http://localhost:3000/api/v1/member/login/phone \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: aspen" \
  -d '{"phone":"13800000000","code":"888888"}'

# 返回 JWT token，用于后续请求
# Authorization: Bearer <token>
```

---

## 支付测试

默认 `simulate` 模式，所有支付操作立即成功。

```bash
# 创建订单
curl -X POST http://localhost:3000/api/v1/orders \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: aspen" \
  -d '{
    "type": "booking",
    "items": [{"productId": "1", "productName": "测试", "price": 100, "quantity": 1}],
    "bookingInfo": {"date": "2024-12-25", "time": "18:00", "guests": 2}
  }'

# 发起支付（返回模拟结果）
curl -X POST http://localhost:3000/api/v1/payment/orders/<订单ID>/pay \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: aspen" \
  -d '{"paymentMethod":"simulate"}'

# 手动确认支付（仅 simulate 模式）
curl -X POST http://localhost:3000/api/v1/payment/confirm/<交易号> \
  -H "x-tenant-id: aspen"
```

---

## 管理后台 API

管理端点需要 `x-admin-key` 请求头：

```bash
# 会员列表
curl http://localhost:3000/api/v1/admin/members \
  -H "x-tenant-id: aspen" \
  -H "x-admin-key: dev-admin-key-change-in-production"

# 调整积分
curl -X POST http://localhost:3000/api/v1/admin/members/<会员ID>/points \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: aspen" \
  -H "x-admin-key: dev-admin-key-change-in-production" \
  -d '{"points": 100, "reason": "活动奖励"}'
```

---

## 类型检查

```bash
# 后端
cd aspen-api && bun run typecheck

# 小程序
cd aspen-mp && npm run type-check

# 管理后台
cd aspen-admin && npm run build    # 含 tsc 检查
```

---

## 清理与重建

```bash
# 停止并删除数据库卷
docker compose down -v

# 重新启动并初始化
docker compose up -d
cd aspen-api
bun run db:push
bun run db:seed
```

---

## 常见问题

**端口被占用**：修改对应 `vite.config.ts` 的 `server.port`，或 `aspen-api/.env` 的 `PORT`。

**数据库连接失败**：确认 Docker 容器运行中 (`docker compose ps`)，检查 `DATABASE_URL` 是否正确。

**Bun 未安装**：`curl -fsSL https://bun.sh/install | bash`

**微信小程序无法连接**：需在微信开发者工具中配置合法域名，或勾选"不校验合法域名"。

**支付回调不通**：`simulate` 模式不依赖外部回调，使用 `/payment/confirm/:transactionNo` 手动触发。
