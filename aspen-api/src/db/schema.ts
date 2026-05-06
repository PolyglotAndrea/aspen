import {
  pgTable, text, integer, real, boolean, timestamp, jsonb, serial, unique,
} from 'drizzle-orm/pg-core';

// ==================== 租户 ====================

export const tenants = pgTable('tenants', {
  id: text('id').primaryKey(),
  brandName: text('brand_name').notNull(),
  brandNameEn: text('brand_name_en'),
  config: jsonb('config').notNull(), // TenantConfig 完整嵌套对象
  status: text('status').default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ==================== 门店 ====================

export const stores = pgTable('stores', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id),
  name: text('name').notNull(),
  shortName: text('short_name'),
  address: text('address').notNull(),
  phone: text('phone').notNull(),
  longitude: real('longitude'),
  latitude: real('latitude'),
  businessHours: jsonb('business_hours'),
  status: text('status').default('active'),
  sort: integer('sort').default(0),
  images: jsonb('images'), // string[]
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ==================== 桌位 ====================

export const tables = pgTable('tables', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull(),
  storeId: text('store_id').notNull().references(() => stores.id),
  name: text('name').notNull(),
  capacity: integer('capacity').notNull(),
  position: text('position'),
  type: text('type').default('indoor'), // indoor | outdoor | vip
  available: boolean('available').default(true),
  price: real('price'),
});

// ==================== 会员 ====================

export const members = pgTable('members', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull(),
  phone: text('phone').notNull(),
  username: text('username'),
  passwordHash: text('password_hash'),
  nickname: text('nickname'),
  avatar: text('avatar'),
  levelId: text('level_id').default('bronze'),
  points: integer('points').default(0),
  totalPoints: integer('total_points').default(0),
  balance: real('balance').default(0),
  status: text('status').default('active'), // active | frozen | cancelled
  birthday: text('birthday'),
  lastConsumeAt: timestamp('last_consume_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (t) => ({
  tenantPhoneUnique: unique('tenant_phone_unique').on(t.tenantId, t.phone),
}));

// ==================== 积分流水 ====================

export const pointsRecords = pgTable('points_records', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull(),
  memberId: text('member_id').notNull().references(() => members.id),
  points: integer('points').notNull(),
  balance: integer('balance').notNull(),
  type: text('type').notNull(), // consume | signin | refund | admin | expire | upgrade | gift
  description: text('description').notNull(),
  orderId: text('order_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ==================== 订单 ====================

export const orders = pgTable('orders', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull(),
  type: text('type').notNull(), // booking | delivery | product
  orderNo: text('order_no').notNull().unique(),
  memberId: text('member_id'),
  storeId: text('store_id'),
  status: text('status').default('pending'),
  subtotal: real('subtotal').notNull(),
  deliveryFee: real('delivery_fee'),
  packagingFee: real('packaging_fee'),
  discount: real('discount').default(0),
  pointsUsed: integer('points_used'),
  pointsAmount: real('points_amount'),
  total: real('total').notNull(),
  paidAmount: real('paid_amount'),
  paymentMethod: text('payment_method'),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  bookingInfo: jsonb('booking_info'),
  deliveryInfo: jsonb('delivery_info'),
  remarks: text('remarks'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
});

// ==================== 订单明细 ====================

export const orderItems = pgTable('order_items', {
  id: text('id').primaryKey(),
  orderId: text('order_id').notNull().references(() => orders.id),
  productId: text('product_id').notNull(),
  productName: text('product_name').notNull(),
  productImage: text('product_image'),
  spec: text('spec'),
  price: real('price').notNull(),
  quantity: integer('quantity').notNull(),
  subtotal: real('subtotal').notNull(),
});

// ==================== 购物车 ====================

export const cartItems = pgTable('cart_items', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull(),
  memberId: text('member_id').notNull(),
  productId: text('product_id').notNull(),
  productName: text('product_name').notNull(),
  productImage: text('product_image'),
  spec: text('spec'),
  price: real('price').notNull(),
  quantity: integer('quantity').notNull(),
  stock: integer('stock').notNull(),
}, (t) => ({
  cartUnique: unique('cart_unique').on(t.tenantId, t.memberId, t.productId, t.spec),
}));

// ==================== 周边商品 ====================

export const products = pgTable('products', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull(),
  categoryId: text('category_id').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  images: jsonb('images'), // string[]
  price: real('price').notNull(),
  originalPrice: real('original_price'),
  stock: integer('stock').default(999),
  unit: text('unit'),
  specs: jsonb('specs'),
  status: text('status').default('active'), // active | inactive | offline
  sort: integer('sort').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ==================== 商品分类 ====================

export const productCategories = pgTable('product_categories', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull(),
  name: text('name').notNull(),
  icon: text('icon'),
  sort: integer('sort').default(0),
  enabled: boolean('enabled').default(true),
});

// ==================== 外卖菜单 ====================

export const deliveryMenuItems = pgTable('delivery_menu_items', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  price: real('price').notNull(),
  originalPrice: real('original_price'),
  image: text('image'),
  category: text('category').notNull(),
  available: boolean('available').default(true),
  stock: integer('stock').default(999),
  tags: jsonb('tags'), // string[]
  specs: jsonb('specs'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ==================== 堂食菜单 ====================

export const menuItems = pgTable('menu_items', {
  id: serial('id').primaryKey(),
  tenantId: text('tenant_id').notNull(),
  name: text('name').notNull(),
  price: real('price').notNull(),
  description: text('description'),
  tags: jsonb('tags'), // string[]
  imageUrl: text('image_url'),
  available: boolean('available').default(true),
});

// ==================== 品牌数据 ====================

export const brandData = pgTable('brand_data', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().unique(),
  videoUrl: text('video_url'),
  tagline: text('tagline'),
  stories: jsonb('stories'),
});

// ==================== 短信验证码 ====================

export const smsCodes = pgTable('sms_codes', {
  id: serial('id').primaryKey(),
  tenantId: text('tenant_id').notNull(),
  phone: text('phone').notNull(),
  code: text('code').notNull(),
  purpose: text('purpose').default('login'), // login | register | reset
  used: boolean('used').default(false),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ==================== 支付交易流水 ====================

export const transactions = pgTable('transactions', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull(),
  orderId: text('order_id').notNull(),
  channel: text('channel').notNull(), // wechat | alipay | unionpay | simulate
  transactionNo: text('transaction_no'),
  amount: real('amount').notNull(),
  type: text('type').notNull(), // pay | refund
  status: text('status').default('pending'), // pending | success | failed
  rawResponse: jsonb('raw_response'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ==================== 分账记录 ====================

export const profitSharingOrders = pgTable('profit_sharing_orders', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull(),
  orderId: text('order_id').notNull(),
  transactionId: text('transaction_id').notNull(),
  totalAmount: real('total_amount').notNull(),
  config: jsonb('config').notNull(), // ProfitSharingConfig
  status: text('status').default('pending'), // pending | settled | failed
  settledAt: timestamp('settled_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
