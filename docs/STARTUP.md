# 🌲 Aspen 全栈项目本地启动指南

> 更新时间: 2024-04-23
> 版本: 2.0.0 (多租户版)

---

## 📋 项目概览

| 模块 | 路径 | 技术栈 | 端口 |
|------|------|--------|------|
| 后端 API | `aspen-api/` | Bun + ElysiaJS | 3000 |
| 小程序 | `aspen-mp/` | uni-app + Vue3 | 5173 |
| 管理后台 | `aspen-admin/` | React + Refine | 5174 |

---

## 🚀 快速启动 (5分钟)

### 1. 启动后端 API

```bash
cd aspen-api

# 安装依赖 (首次)
bun install

# 启动服务
bun run src/index.ts
```

✅ 验证: 访问 http://localhost:3000/health

---

### 2. 测试多租户功能

```bash
# 白杨树租户 (默认)
curl http://localhost:3000/api/v1/brand

# 火山租户
curl -H "x-tenant-id: volcano" http://localhost:3000/api/v1/brand

# 深海租户
curl -H "x-tenant-id: ocean" http://localhost:3000/api/v1/brand

# 预约配置 (各租户不同)
curl -H "x-tenant-id: volcano" http://localhost:3000/api/v1/bookings/config
```

---

### 3. 启动小程序 (uni-app)

```bash
cd aspen-mp

# 安装依赖 (首次)
npm install

# 启动 H5 开发服务器
npm run dev:h5
```

✅ 验证: 访问 http://localhost:5173

> ⚠️ 微信小程序需使用微信开发者工具打开 `aspen-mp` 目录

---

## 📖 详细启动步骤

### 后端 - aspen-api

```bash
# 进入目录
cd aspen-api

# 1. 安装依赖
bun install

# 2. 复制环境变量模板
cp .env.example .env

# 3. 启动开发模式 (热重载)
bun run dev

# 或生产模式
bun run start
```

**环境变量 (.env):**
```bash
PORT=3000
DATABASE_URL=postgresql://postgres:password@localhost:5432/aspen
REDIS_URL=redis://localhost:6379
```

---

### 小程序 - aspen-mp

```bash
# 进入目录
cd aspen-mp

# 1. 安装依赖
npm install

# 2. 启动 H5 (网页版)
npm run dev:h5

# 3. 微信小程序 (需微信开发者工具)
npm run dev:mp
```

**API 配置:**
- 默认 API 地址: `http://localhost:3000`
- 修改位置: 各页面中的 `API_BASE` 常量

---

### 管理后台 - aspen-admin (可选)

```bash
# 进入目录
cd aspen-admin

# 1. 安装依赖
npm install

# 2. 启动开发服务器
npm run dev
```

✅ 验证: 访问 http://localhost:5174

> ⚠️ 管理后台需要后端 API 运行在 3000 端口

---

## 🧪 API 测试用例

### 1. 品牌信息

```bash
# 获取品牌信息 (带租户主题)
curl http://localhost:3000/api/v1/brand \
  -H "x-tenant-id: volcano"
```

响应示例:
```json
{
  "tenantId": "volcano",
  "brandName": "火山",
  "theme": {
    "primary": "#dc2626",
    ...
  }
}
```

### 2. 菜单

```bash
# 获取菜单列表
curl http://localhost:3000/api/v1/menu \
  -H "x-tenant-id: aspen"
```

### 3. 预约

```bash
# 获取预约配置 (含规则和桌位)
curl http://localhost:3000/api/v1/bookings/config \
  -H "x-tenant-id: volcano"

# 创建预约 (RULES 模式)
curl -X POST http://localhost:3000/api/v1/bookings \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: aspen" \
  -d '{
    "name": "张三",
    "phone": "13800000000",
    "date": "2024-12-25",
    "time": "18:00",
    "guests": 2
  }'

# 创建预约 (SEATING 模式 - 需选座)
curl -X POST http://localhost:3000/api/v1/bookings \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: volcano" \
  -d '{
    "name": "李四",
    "phone": "13900000000",
    "date": "2024-12-25",
    "time": "19:00",
    "guests": 4,
    "seatId": "quad",
    "seatName": "四人位"
  }'
```

### 4. 租户管理

```bash
# 列出所有租户
curl http://localhost:3000/tenants

# 获取指定租户配置
curl http://localhost:3000/tenants/volcano
```

---

## 🔧 高级配置

### 切换主题 (前端)

在 `aspen-mp/src/utils/useTenant.ts` 中:

```ts
const { switchTenant } = useTenant({
  tenantId: 'volcano',  // 改为 volcano/ocean/gold
  autoApply: true
});
```

### 添加新租户

```bash
cd aspen-api

# 使用复制脚本创建新租户
bun run scripts/copy-tenant.ts mybrand "我的品牌" aspen
```

### 预约模式说明

| 模式 | 租户 | 特点 |
|------|------|------|
| `RULES` | aspen, ocean | 仅选择时间，无需选座 |
| `SEATING` | volcano, gold | 需选择桌位、可配置订金 |

---

## ⚠️ 常见问题

### 1. 端口被占用

```bash
# 查找占用进程
lsof -i :3000

# 杀掉进程
kill -9 <PID>
```

### 2. 小程序无法连接 API

检查 `aspen-mp/src/pages/*/index.vue` 中的 `API_BASE` 是否为本地 IP:
```ts
const API_BASE = 'http://localhost:3000/api/v1';
```

> 手机调试需改为电脑局域网 IP: `http://192.168.x.x:3000`

### 3. 依赖安装失败

```bash
# 清理缓存后重试
rm -rf node_modules package-lock.json
npm install
```

---

## 📦 目录结构总览

```
aspen/
├── aspen-api/              # 后端 API
│   ├── src/
│   │   ├── index.ts       # 主入口
│   │   ├── config/        # 租户配置
│   │   ├── middleware/    # 租户中间件
│   │   └── routes/        # 业务路由
│   ├── scripts/
│   │   └── copy-tenant.ts # 租户复制脚本
│   └── .env.example       # 环境变量模板
│
├── aspen-mp/              # 小程序
│   ├── src/
│   │   ├── components/    # 组件库 (AsCard, AsBookingModule 等)
│   │   ├── pages/         # 页面
│   │   ├── utils/         # 工具函数
│   │   └── theme.json     # 主题配置
│   └── pages.json         # 页面配置
│
└── aspen-admin/           # 管理后台 (可选)
    ├── src/
    │   └── pages/         # 管理页面
    └── package.json
```

---

## ✅ 启动检查清单

- [ ] 后端 API 启动成功 (http://localhost:3000)
- [ ] 健康检查通过 (`/health`)
- [ ] 多租户切换正常 (`x-tenant-id` 请求头)
- [ ] 小程序 H5 页面可访问 (http://localhost:5173)
- [ ] 预约功能正常工作

---

**有问题?** 检查控制台输出或查看 API 响应错误信息。
