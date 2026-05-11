# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

Aspen is a multi-tenant restaurant management platform with three main components:

| Component | Directory | Tech Stack | Dev Port |
|-----------|-----------|------------|----------|
| Backend API | `aspen-api/` | Bun + ElysiaJS | 3000 |
| Mini Program / H5 | `aspen-mp/` | uni-app (Vue 3) | 5173 |
| Admin Dashboard | `aspen-admin/` | React + Vite + Tailwind | 5175 |

> **Port conflict**: Both `aspen-mp` and `aspen-admin` default to port 5174 in their vite configs. Run only one at a time, or change the port in the respective `vite.config.ts`.

## Common Commands

### Full-stack startup

```bash
./start.sh all       # Start API + MP (checks bun, node, npm first)
./start.sh api       # Start only backend
./start.sh mp        # Start only mini program (H5)
./start.sh stop      # Kill all bun/vite processes
./start.sh status    # Check if API (3000) and MP (5173) are running
./start.sh test      # Smoke test: health, brand, booking endpoints
```

### aspen-api (Backend)

```bash
cd aspen-api
bun install          # Install dependencies
bun run dev          # Development with hot reload (bun run --watch)
bun run start        # Production
bun run typecheck    # TypeScript check (tsc --noEmit)
```

### aspen-mp (Mini Program)

```bash
cd aspen-mp
npm install
npm run dev:h5       # H5 web version
npm run dev:mp       # WeChat mini-program (requires WeChat DevTools)
npm run build:h5     # Build H5
npm run build:mp     # Build mini-program
npm run type-check   # TypeScript check (vue-tsc --noEmit)
```

### aspen-admin (Dashboard)

```bash
cd aspen-admin
npm install
npm run dev          # Development server (proxies /api to localhost:3000)
npm run build        # Production build (tsc && vite build)
npm run preview      # Preview production build
```

### Docker (Postgres + Redis)

```bash
docker compose up -d           # Start postgres (5432) + redis (6379)
docker compose down            # Stop containers
docker compose down -v         # Stop and remove volumes
```

## Architecture

### Multi-Tenant System

Tenant isolation is via the `x-tenant-id` HTTP header. The tenant middleware (`src/middleware/tenant.ts`) extracts this header, validates the tenant exists and is active, and injects a `TenantContext` into each request via Elysia's `derive()`. Routes `/health`, `/swagger`, and `/tenants` bypass tenant validation.

When no header is sent, the default tenant `aspen` is used.

```bash
curl http://localhost:3000/api/v1/brand -H "x-tenant-id: volcano"
curl http://localhost:3000/api/v1/brand   # defaults to aspen
```

**Available tenants**: `aspen`, `volcano`, `ocean`, `gold`

### Tenant Configuration

Tenants are defined in `src/config/tenant.registry.ts` (hardcoded in-memory registry). Each tenant has:
- **Theme**: colors, logo, background
- **Feature flags**: booking, menu, member, comments, delivery, product, stores
- **Booking config**: mode (RULES or SEATING), business hours, rules
- **Member config**: 4 tiers (bronze/silver/gold/platinum) with point thresholds and benefits
- **Delivery config**: fee rules, areas, time windows
- **Product config**: categories, specs
- **Stores config**: multi-store support (volcano, gold)

To add a new tenant, use the CLI script: `bun run scripts/copy-tenant.ts`

### Database (PostgreSQL + Drizzle ORM)

Data is persisted in PostgreSQL via Drizzle ORM. Schema in `src/db/schema.ts`, repositories in `src/repositories/`. Tenant config stored as JSONB in `tenants.config`.

```bash
docker compose up -d        # Start postgres
bun run db:push             # Push schema to DB
bun run db:seed             # Seed with sample data
```

### Authentication

JWT-based auth using `jose` (Bun-compatible). SMS verification simulated (code: `888888`). Admin endpoints protected by `x-admin-key` header.

### Plugin / Module System

Two layers exist:

1. **Feature Modules** (`src/modules/`): Business logic for booking, order, member, delivery, product. Each exports route handlers registered in `src/index.ts` under `/api/v1`.

2. **Plugin System** (`src/plugins/`): A `PluginRegistry` with lifecycle hooks (onStart, onStop, onTenantChange, beforeRequest, afterRequest). `FeatureModule` is an abstract base class that bridges modules to the plugin format via `toPlugin()`. Currently, modules are registered directly as Elysia route groups — the plugin registry infrastructure exists but is not actively used for route mounting.

### Module Details

| Module | Key behaviors |
|--------|--------------|
| **Booking** | Multi-store CRUD, table management, seat availability by date/time/guests. Two modes: RULES (time-only) and SEATING (seat selection + optional deposit) |
| **Order** | Unified system for booking/delivery/product orders. Status state machine: `pending → paid → confirmed → preparing → ready → delivering/completed`. Includes shopping cart, payment simulation, verification (check-in code) |
| **Member** | Auto-register on first phone login. Profile CRUD, points system (sign-in, earn on purchase, use/deduct), level upgrades based on cumulative points |
| **Delivery** | Delivery menu CRUD, category listing, fee calculation (area-based with free threshold), delivery time window checking |
| **Product** | Peripheral product CRUD, category management, sample products pre-seeded |

### Frontend Tenant Integration

- **aspen-mp**: `src/utils/useTenant.ts` — Vue composable that fetches brand info from `/api/v1/brand`, applies theme CSS variables, caches in uni storage, and provides `switchTenant()` for runtime switching. Themes defined in `src/theme.json`.
- **aspen-admin**: `src/components/TenantSwitcher.tsx` — Dropdown that lists tenants from API, stores selection in localStorage, triggers page reload. The admin `lib/api.ts` auto-injects `x-tenant-id` from localStorage into all API calls.
- **Admin proxy**: The admin vite config proxies `/api` requests to `http://localhost:3000`, so the admin dashboard must have the API running.

### Component Library (aspen-mp)

Components follow the `As*` naming convention and are auto-registered via easycom (`src/pages.json`): AsCard, AsThemeProvider, AsOrderList, AsStatusTag, AsBookingModal, AsInput, AsDatePicker, AsTimePicker, AsStepper, AsMemberStatus, AsSeatSelector, AsBookingModule, AsBookingRules, AsMemberStatus.

## API Routes

All business routes are grouped under `/api/v1`. Swagger docs at `http://localhost:3000/swagger`.

### Core
- `GET /api/v1/brand` — Brand info and theme
- `GET /api/v1/menu` — Menu items (dine-in)

### Booking
- `GET /api/v1/bookings/config` — Booking configuration
- `GET /api/v1/bookings/stores` — Store list (multi-store tenants)
- `GET /api/v1/bookings/available-tables` — Available seats by date/time/guests

### Orders (Unified)
- `POST /api/v1/orders` — Create order
- `GET /api/v1/orders` — List orders
- `GET /api/v1/orders/cart` — Shopping cart
- `POST /api/v1/orders/:id/verify` — Verify (check-in)
- `POST /api/v1/orders/:id/pay` — Payment (simulated)

### Member
- `POST /api/v1/member/login/phone` — Phone login (auto-registers, returns JWT)
- `POST /api/v1/member/login/password` — Password login
- `GET /api/v1/member/profile` — Profile (requires auth)
- `GET /api/v1/member/points` — Points records
- `POST /api/v1/member/points/signin` — Daily sign-in

### Admin Members (requires x-admin-key)
- `GET /api/v1/admin/members` — List members (paginated, searchable)
- `GET /api/v1/admin/members/:id` — Member detail
- `POST /api/v1/admin/members` — Create member
- `PATCH /api/v1/admin/members/:id` — Update member
- `DELETE /api/v1/admin/members/:id` — Soft delete
- `POST /api/v1/admin/members/:id/points` — Adjust points

### Delivery
- `GET /api/v1/delivery/config` — Delivery configuration
- `GET /api/v1/delivery/menu` — Delivery menu
- `GET /api/v1/delivery/categories` — Menu categories

### Products
- `GET /api/v1/products` — Product list
- `GET /api/v1/products/categories` — Product categories

### Payment
- `POST /api/v1/payment/orders/:id/pay` — Create payment (supports wechat/alipay/unionpay/simulate)
- `POST /api/v1/payment/confirm/:transactionNo` — Confirm payment (simulate mode only)
- `GET /api/v1/payment/orders/:id/status` — Query payment status
- `POST /api/v1/payment/orders/:id/refund` — Refund
- `GET /api/v1/payment/orders/:id/profit-sharing` — Query profit sharing status
- `POST /api/v1/payment/profit-sharing/:id/settle` — Settle profit sharing
- `POST /api/v1/payment/notify/wechat` — WeChat Pay webhook
- `POST /api/v1/payment/notify/alipay` — Alipay webhook
- `POST /api/v1/payment/notify/unionpay` — UnionPay webhook

### Tenant Management
- `GET /tenants` — List all tenants
- `GET /tenants/:id` — Get tenant config

### System
- `GET /health` — Health check
- `GET /swagger` — API documentation

## Testing Examples

```bash
# Member phone login (auto-registers on first call)
curl -X POST http://localhost:3000/api/v1/member/login/phone \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: aspen" \
  -d '{"phone":"13800000000"}'

# Create a booking order
curl -X POST http://localhost:3000/api/v1/orders \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: volcano" \
  -d '{
    "type": "booking",
    "items": [{"productId": "1", "productName": "测试", "price": 100, "quantity": 1}],
    "bookingInfo": {"date": "2024-12-25", "time": "18:00", "guests": 2}
  }'

# Switch tenant context
curl http://localhost:3000/api/v1/brand -H "x-tenant-id: gold"
```
