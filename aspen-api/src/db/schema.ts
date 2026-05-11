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
  // 新增字段
  rating: real('rating').default(0),                // 评分
  ratingCount: integer('rating_count').default(0),   // 评分人数
  monthlySales: integer('monthly_sales').default(0), // 月销量
  minOrderAmount: real('min_order_amount').default(0), // 起送价
  deliveryFee: real('delivery_fee').default(0),      // 配送费
  deliveryDistance: real('delivery_distance').default(5), // 配送距离(km)
  packPrice: real('pack_price').default(0),          // 包装费
  notice: text('notice'),                            // 门店公告
  qrCode: text('qr_code'),                           // 二维码
  isOpen: boolean('is_open').default(true),          // 是否营业
  features: jsonb('features').default({}),           // 门店特性(可开发票/包间/WiFi等)
  images: jsonb('images'), // string[]               // 门店图片
  description: text('description'),
  status: text('status').default('active'),
  sort: integer('sort').default(0),
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
  subtitle: text('subtitle'),                             // 副标题/卖点
  description: text('description'),                       // 富文本详情
  images: jsonb('images'),                                // string[] 多图
  videoUrl: text('video_url'),                            // 商品视频
  price: real('price').notNull(),
  originalPrice: real('original_price'),                  // 原价/划线价
  stock: integer('stock').default(999),
  unit: text('unit'),                                     // 单位(份/碗/杯)
  specs: jsonb('specs'),                                  // 商品规格
  tags: jsonb('tags').default([]),                        // 营销标签: ["招牌","必点","新品"]
  isRecommend: boolean('is_recommend').default(false),    // 是否推荐
  isNew: boolean('is_new').default(false),                // 是否新品
  isHot: boolean('is_hot').default(false),                // 是否热销
  sort: integer('sort').default(0),
  status: text('status').default('active'),               // active | inactive | offline
  soldCount: integer('sold_count').default(0),            // 销量
  rating: real('rating').default(0),                      // 评分
  ratingCount: integer('rating_count').default(0),        // 评价数
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ==================== 商品分类 ====================

export const productCategories = pgTable('product_categories', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull(),
  name: text('name').notNull(),
  icon: text('icon'),
  image: text('image'),                                    // 分类图片
  description: text('description'),                         // 分类描述
  parentId: text('parent_id'),                              // 父分类ID(支持多级)
  sort: integer('sort').default(0),
  enabled: boolean('enabled').default(true),
});

// ==================== 外卖菜单 ====================

export const deliveryMenuItems = pgTable('delivery_menu_items', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull(),
  name: text('name').notNull(),
  subtitle: text('subtitle'),                               // 副标题
  description: text('description'),                          // 富文本描述
  price: real('price').notNull(),
  originalPrice: real('original_price'),
  image: text('image'),
  images: jsonb('images'),                                  // 多图
  category: text('category').notNull(),
  available: boolean('available').default(true),
  stock: integer('stock').default(999),
  tags: jsonb('tags').default([]),                          // 标签: ["招牌","辣","推荐"]
  specs: jsonb('specs'),                                    // 规格选项
  isRecommend: boolean('is_recommend').default(false),      // 推荐标记
  isNew: boolean('is_new').default(false),                  // 新品标记
  soldCount: integer('sold_count').default(0),              // 月销量
  rating: real('rating').default(0),                        // 评分
  sort: integer('sort').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ==================== 堂食菜单 ====================

export const menuItems = pgTable('menu_items', {
  id: serial('id').primaryKey(),
  tenantId: text('tenant_id').notNull(),
  categoryId: text('category_id'),                          // 关联分类
  name: text('name').notNull(),
  subtitle: text('subtitle'),                               // 副标题
  price: real('price').notNull(),
  originalPrice: real('original_price'),                    // 原价
  description: text('description'),                         // 描述
  tags: jsonb('tags').default([]),                          // 标签
  imageUrl: text('image_url'),
  images: jsonb('images'),                                  // 多图
  isRecommend: boolean('is_recommend').default(false),      // 推荐
  isNew: boolean('is_new').default(false),                  // 新品
  isHot: boolean('is_hot').default(false),                  // 热销
  available: boolean('available').default(true),
  soldCount: integer('sold_count').default(0),              // 销量
  rating: real('rating').default(0),                        // 评分
  sort: integer('sort').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ==================== 菜单分类 ====================

export const menuCategories = pgTable('menu_categories', {
  id: serial('id').primaryKey(),
  tenantId: text('tenant_id').notNull(),
  name: text('name').notNull(),
  icon: text('icon'),
  image: text('image'),
  description: text('description'),
  sort: integer('sort').default(0),
  enabled: boolean('enabled').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ==================== 品牌数据 ====================

export const brandData = pgTable('brand_data', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().unique(),
  videoUrl: text('video_url'),
  tagline: text('tagline'),
  stories: jsonb('stories'),
});

// ==================== 管理员 ====================

export const admins = pgTable('admins', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id'),
  username: text('username').notNull(),
  passwordHash: text('password_hash').notNull(),
  displayName: text('display_name'),
  role: text('role').notNull().default('admin'), // admin | super_admin
  avatar: text('avatar'),
  status: text('status').default('active'),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ==================== 支付记录 ====================

export const payments = pgTable('payments', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull(),
  orderId: text('order_id').notNull(),
  transactionNo: text('transaction_no').notNull().unique(),
  channel: text('channel').notNull(), // wechat | alipay | unionpay | simulate
  amount: integer('amount').notNull(), // 分
  status: text('status').default('pending'),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  rawData: jsonb('raw_data'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ==================== 商品规格(SKU) ====================

export const productSkus = pgTable('product_skus', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull(),
  productId: text('product_id').notNull().references(() => products.id),
  name: text('name').notNull(),             // 规格名称 如 "大杯 / 加辣"
  price: real('price').notNull(),           // 规格加价(可为负)
  stock: integer('stock').default(999),
  sort: integer('sort').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ==================== 收藏 ====================

export const favorites = pgTable('favorites', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull(),
  memberId: text('member_id').notNull().references(() => members.id),
  targetType: text('target_type').notNull(), // product | store | menu_item
  targetId: text('target_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (t) => ({
  memberTargetUnique: unique('member_target_unique').on(t.memberId, t.targetType, t.targetId),
}));

// ==================== 交易记录 (stub) ====================
export const transactions = pgTable('transactions', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull(),
  orderId: text('order_id').notNull(),
  transactionNo: text('transaction_no'),
  channel: text('channel'),
  type: text('type').notNull(),
  amount: real('amount').notNull(),
  status: text('status').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ==================== 分账订单 (stub) ====================
export const profitSharingOrders = pgTable('profit_sharing_orders', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull(),
  orderId: text('order_id').notNull(),
  transactionId: text('transaction_id'),
  amount: real('amount').notNull(),
  status: text('status').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ==================== 短信验证码 (stub) ====================
export const smsCodes = pgTable('sms_codes', {
  id: serial('id').primaryKey(),
  tenantId: text('tenant_id').notNull(),
  phone: text('phone').notNull(),
  code: text('code').notNull(),
  type: text('type').notNull(),
  purpose: text('purpose').default('login'),
  used: boolean('used').default(false),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});