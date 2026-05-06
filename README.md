# Aspen - Multi-Tenant Restaurant Management Platform

Aspen is a full-stack multi-tenant restaurant brand management platform featuring booking, member management, delivery, merchandise, unified orders, payment integration (WeChat Pay / Alipay / UnionPay), and multi-level profit sharing.

## Project Structure

```
aspen/
├── aspen-api/          # Backend API (Bun + ElysiaJS)
├── aspen-mp/           # Mini Program / H5 Frontend (uni-app + Vue 3)
├── aspen-admin/        # Admin Dashboard (React + Vite + Tailwind)
└── docker-compose.yml  # PostgreSQL + Redis
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Bun + ElysiaJS |
| Database | PostgreSQL + Drizzle ORM |
| Auth | JWT (jose) + bcryptjs |
| Mini Program | uni-app (Vue 3) + Pinia |
| Admin Dashboard | React 18 + Vite + Ant Design + Tailwind CSS |
| Payment | WeChat Pay v3 / Alipay OpenAPI v3 / UnionPay |

## Quick Start

### Prerequisites

- [Bun](https://bun.sh) >= 1.0
- [Node.js](https://nodejs.org) >= 18
- [Docker](https://docker.com) (for PostgreSQL)

### 1. Start Database

```bash
docker compose up -d
```

### 2. Backend API

```bash
cd aspen-api
cp .env.example .env
bun install
bun run db:push         # Push schema to database
bun run db:seed         # Seed sample data
bun run dev             # Start dev server (port 3000)
```

Swagger docs: http://localhost:3000/swagger

### 3. Mini Program / H5

```bash
cd aspen-mp
npm install
npm run dev:h5          # H5 mode (port 5173)
```

### 4. Admin Dashboard

```bash
cd aspen-admin
npm install
npm run dev             # Dev server (port 5174)
```

### One-Click Start

```bash
./start.sh all          # Start API + MP
./start.sh stop         # Stop all services
./start.sh status       # Check running status
```

## Core Features

### Multi-Tenant System

Row-level tenant isolation via `x-tenant-id` HTTP header. Four built-in demo tenants:

| Tenant | Brand | Description |
|--------|-------|-------------|
| `aspen` | Aspen | Single store, full features |
| `volcano` | Volcano | Multi-store, advanced booking |
| `ocean` | Ocean | Simplified, no member system |
| `gold` | Gold Pavilion | Fine dining, 3-level profit sharing |

### Booking System

- Two modes: RULES (time-only reservation) and SEATING (seat selection + deposit)
- Multi-store support, table management, availability queries

### Member System

- Auto-register on first phone login, password login
- 4 tiers (Bronze / Silver / Gold / Platinum), points system
- Daily check-in, purchase points, points redemption

### Unified Orders

- Three order types: booking, delivery, product
- State machine: `pending -> paid -> confirmed -> preparing -> ready -> delivering/completed`
- Shopping cart, verification code, refund flow

### Payment Integration

- **WeChat Pay v3**: JSAPI (Mini Program), RSA-SHA256-PSS signing, AES-256-GCM webhook decryption
- **Alipay OpenAPI v3**: WAP payment, RSA2 signing, auto-submit form redirect
- **UnionPay**: Certificate-based signing, WAP redirect, async callback
- **Simulate mode**: Default for dev, all operations succeed instantly
- **Multi-level profit sharing**: Flexible N-level split ratio per order

### Delivery

- Menu CRUD, category management
- Delivery fee calculation (area-based + free delivery threshold)
- Delivery time window checking

### Merchandise

- Product CRUD, category management
- Inventory management, spec configuration

## API Routes

All business routes are under `/api/v1`. Full documentation at Swagger.

```
GET  /health                              # Health check
GET  /api/v1/brand                        # Brand info
GET  /api/v1/menu                         # Dine-in menu
GET  /api/v1/bookings/config              # Booking config
GET  /api/v1/bookings/stores              # Store list
GET  /api/v1/bookings/available-tables    # Available tables
POST /api/v1/orders                       # Create order
GET  /api/v1/orders                       # List orders
GET  /api/v1/orders/cart                  # Shopping cart
POST /api/v1/member/login/phone           # Phone login
GET  /api/v1/member/profile               # Member profile
GET  /api/v1/delivery/menu                # Delivery menu
GET  /api/v1/products                     # Merchandise
POST /api/v1/payment/orders/:id/pay       # Create payment
POST /api/v1/payment/notify/wechat        # WeChat webhook
POST /api/v1/payment/notify/alipay        # Alipay webhook
POST /api/v1/payment/notify/unionpay      # UnionPay webhook
GET  /api/v1/admin/members                # Manage members (requires x-admin-key)
```

## Environment Variables

```bash
# aspen-api/.env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/aspen_main
JWT_SECRET=your-jwt-secret
ADMIN_API_KEY=your-admin-key
PAYMENT_MODE=simulate          # simulate | sandbox | production
```

## Docker

```bash
docker compose up -d           # Start PostgreSQL + Redis
docker compose down            # Stop containers
docker compose down -v         # Stop and remove volumes
```

## License

[MIT](LICENSE)
