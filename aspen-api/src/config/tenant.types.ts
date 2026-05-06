/**
 * 租户配置类型定义 (Tenant Configuration Types)
 * 扩展支持多门店、会员、外卖、周边商品等功能
 */

// ============================================
// 基础类型
// ============================================

/** 营业时间 */
export interface BusinessHours {
  lunch: { start: string; end: string };
  dinner: { start: string; end: string };
  /** 特殊日期营业时间 */
  holidays?: { date: string; hours: { start: string; end: string } }[];
}

/** 预约模式 */
export type BookingMode = 'RULES' | 'SEATING';

/** 桌位类型 */
export interface Table {
  id: string;
  name: string;
  capacity: number;
  /** 位置描述 */
  position?: string;
  /** 桌位类型 */
  type: 'indoor' | 'outdoor' | 'vip';
  /** 是否可用 */
  available?: boolean;
  /** 额外费用 */
  price?: number;
  /** 门店ID */
  storeId?: string;
}

/** 桌位类型配置 (简化版) */
export interface SeatType {
  id: string;
  name: string;
  icon?: string;
  capacity: number;
  available?: boolean;
  price?: number;
}

// ============================================
// 门店相关类型
// ============================================

/** 门店配置 */
export interface Store {
  id: string;
  name: string;
  /** 门店简称 */
  shortName?: string;
  address: string;
  phone: string;
  /** 经度 */
  longitude?: number;
  /** 纬度 */
  latitude?: number;
  /** 营业时间 */
  businessHours: BusinessHours;
  /** 桌位列表 */
  tables?: Table[];
  /** 状态 */
  status: 'active' | 'inactive' | 'maintenance';
  /** 创建时间 */
  createdAt: string;
  /** 排序 */
  sort: number;
  /** 图片 */
  images?: string[];
  /** 描述 */
  description?: string;
}

/** 多门店配置 */
export interface StoresConfig {
  /** 是否启用多门店 */
  enabled: boolean;
  /** 门店列表 */
  stores: Store[];
  /** 默认门店ID */
  defaultStoreId?: string;
  /** 是否支持跨店预约 */
  crossStoreBooking?: boolean;
}

// ============================================
// 会员相关类型
// ============================================

/** 会员等级 */
export interface MemberLevel {
  id: string;
  name: string;
  /** 等级数值 */
  level: number;
  /** 等级图标 */
  icon?: string;
  /** 积分倍率 */
  pointsRate: number;
  /** 折扣 (0-1) */
  discount: number;
  /** 升级所需积分 */
  upgradePoints: number;
  /** 等级描述 */
  description?: string;
}

/** 会员权益 */
export interface MemberBenefit {
  /** 折扣 */
  discount?: number;
  /** 免配送费 */
  freeDelivery?: boolean;
  /** 专属客服 */
  priorityService?: boolean;
  /** 生日优惠 */
  birthdayBenefit?: {
    enabled: boolean;
    discount: number;
    gift?: string;
  };
  /** 积分加倍日期 */
  doublePointsDays?: number[]; // 周几 (0-6)
}

/** 会员配置 */
export interface MemberConfig {
  /** 是否启用会员功能 */
  enabled: boolean;
  /** 会员等级配置 */
  levels: MemberLevel[];
  /** 积分名称 */
  pointsName: string;
  /** 签到积分 */
  signInPoints: number;
  /** 消费积分比例 (消费1元获得多少积分) */
  consumePointsRate: number;
  /** 积分抵扣比例 (多少积分抵扣1元) */
  pointsDeductionRate: number;
  /** 积分有效期 (天) */
  pointsExpireDays: number;
  /** 会员权益 */
  benefits: MemberBenefit;
  /** 最低抵扣积分 */
  minDeductionPoints: number;
  /** 最高抵扣比例 */
  maxDeductionRate: number;
}

/** 会员信息 */
export interface Member {
  id: string;
  tenantId: string;
  /** 手机号 */
  phone: string;
  /** 用户名 (可选) */
  username?: string;
  /** 昵称 */
  nickname?: string;
  /** 头像 */
  avatar?: string;
  /** 会员等级ID */
  levelId: string;
  /** 当前积分 */
  points: number;
  /** 历史累计积分 */
  totalPoints: number;
  /** 余额 */
  balance: number;
  /** 会员状态 */
  status: 'active' | 'frozen' | 'cancelled';
  /** 注册时间 */
  createdAt: string;
  /** 最后消费时间 */
  lastConsumeAt?: string;
  /** 生日 */
  birthday?: string;
}

/** 会员积分记录 */
export interface PointsRecord {
  id: string;
  memberId: string;
  /** 积分变化 (正数增加, 负数扣减) */
  points: number;
  /** 剩余积分 */
  balance: number;
  /** 类型 */
  type: 'consume' | 'signin' | 'refund' | 'admin' | 'expire' | 'upgrade' | 'gift';
  /** 描述 */
  description: string;
  /** 关联订单ID */
  orderId?: string;
  createdAt: string;
}

// ============================================
// 外卖相关类型
// ============================================

/** 配送费规则 */
export interface DeliveryFeeRule {
  /** 免费配送门槛 */
  freeThreshold: number;
  /** 基础配送费 */
  baseFee: number;
  /** 超出每公里费用 */
  perKmFee: number;
  /** 配送距离上限 (km) */
  maxDistance: number;
}

/** 配送区域 */
export interface DeliveryArea {
  id: string;
  name: string;
  /** 区域多边形坐标 */
  polygons?: { lat: number; lng: number }[];
  /** 配送费规则 */
  feeRule: DeliveryFeeRule;
  /** 是否可用 */
  available: boolean;
}

/** 配送时间配置 */
export interface DeliveryTimeConfig {
  /** 是否支持立即配送 */
  instantDelivery: boolean;
  /** 预约定金最长时间 (分钟) */
  maxAdvanceMinutes: number;
  /** 预约定金最短时间 (分钟) */
  minAdvanceMinutes: number;
  /** 每日配送开始时间 */
  dayStartTime: string;
  /** 每日配送结束时间 */
  dayEndTime: string;
  /** 预计配送时长 (分钟) */
  estimatedMinutes: number;
  /** 休息时间段 */
  breakTime?: { start: string; end: string };
}

/** 外卖配置 */
export interface DeliveryConfig {
  /** 是否启用外卖功能 */
  enabled: boolean;
  /** 支持的平台 */
  platforms?: string[];
  /** 配送区域 */
  areas?: DeliveryArea[];
  /** 配送时间配置 */
  timeConfig?: DeliveryTimeConfig;
  /** 起送金额 */
  minOrderAmount: number;
  /** 配送费 */
  deliveryFee: number;
  /** 包装费 */
  packagingFee?: number;
  /** 是否支持货到付款 */
  codEnabled?: boolean;
}

// ============================================
// 周边商品类型
// ============================================

/** 商品分类 */
export interface ProductCategory {
  id: string;
  name: string;
  /** 分类图标 */
  icon?: string;
  /** 排序 */
  sort: number;
  /** 是否启用 */
  enabled: boolean;
}

/** 商品规格 */
export interface ProductSpec {
  id: string;
  name: string;
  options: { value: string; price: number }[];
}

/** 商品 */
export interface Product {
  id: string;
  categoryId: string;
  name: string;
  /** 商品描述 */
  description?: string;
  /** 图片 */
  images: string[];
  /** 价格 */
  price: number;
  /** 原价 */
  originalPrice?: number;
  /** 库存 */
  stock: number;
  /** 单位 */
  unit?: string;
  /** 规格 */
  specs?: ProductSpec[];
  /** 状态 */
  status: 'active' | 'inactive' | 'offline';
  /** 排序 */
  sort: number;
  /** 创建时间 */
  createdAt: string;
}

/** 周边商品配置 */
export interface ProductConfig {
  /** 是否启用周边商品 */
  enabled: boolean;
  /** 商品分类 */
  categories: ProductCategory[];
  /** 是否支持配送 */
  deliverySupported: boolean;
  /** 是否支持自提 */
  pickupSupported: boolean;
}

// ============================================
// 统一订单类型
// ============================================

/** 订单类型 */
export type OrderType = 'booking' | 'delivery' | 'product';

/** 订单状态 */
export type OrderStatus =
  | 'pending'     // 待支付
  | 'paid'        // 已支付
  | 'confirmed'   // 已确认
  | 'preparing'   // 准备中
  | 'ready'       // 已完成备餐
  | 'delivering'  // 配送中
  | 'completed'   // 已完成
  | 'cancelled'   // 已取消
  | 'refunded';   // 已退款

/** 订单项 */
export interface OrderItem {
  id: string;
  /** 商品ID */
  productId: string;
  /** 商品名称 */
  productName: string;
  /** 商品图片 */
  productImage?: string;
  /** 规格 */
  spec?: string;
  /** 单价 */
  price: number;
  /** 数量 */
  quantity: number;
  /** 小计 */
  subtotal: number;
}

/** 统一订单 */
export interface Order {
  id: string;
  tenantId: string;
  /** 订单类型 */
  type: OrderType;
  /** 订单号 */
  orderNo: string;
  /** 会员ID */
  memberId?: string;
  /** 门店ID */
  storeId?: string;
  /** 订单状态 */
  status: OrderStatus;
  /** 订单项 */
  items: OrderItem[];
  /** 商品金额 */
  subtotal: number;
  /** 配送费 */
  deliveryFee?: number;
  /** 包装费 */
  packagingFee?: number;
  /** 优惠金额 */
  discount: number;
  /** 使用积分 */
  pointsUsed?: number;
  /** 积分抵扣金额 */
  pointsAmount?: number;
  /** 订单金额 */
  total: number;
  /** 实付金额 */
  paidAmount?: number;
  /** 支付方式 */
  paymentMethod?: 'wechat' | 'alipay' | 'balance' | 'cod';
  /** 支付时间 */
  paidAt?: string;
  /** 预订信息 (booking类型) */
  bookingInfo?: {
    date: string;
    time: string;
    guests: number;
    tableId?: string;
    tableName?: string;
    verifyCode?: string;
  };
  /** 配送信息 (delivery类型) */
  deliveryInfo?: {
    address: string;
    contactName: string;
    contactPhone: string;
    estimatedTime?: string;
    actualTime?: string;
    riderName?: string;
    riderPhone?: string;
  };
  /** 备注 */
  remarks?: string;
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
  /** 完成时间 */
  completedAt?: string;
}

// ============================================
// 购物车类型
// ============================================

/** 购物车项 */
export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productImage?: string;
  spec?: string;
  price: number;
  quantity: number;
  /** 库存 */
  stock: number;
}

/** 购物车 */
export interface Cart {
  tenantId: string;
  memberId?: string;
  items: CartItem[];
  /** 总数 */
  totalQuantity: number;
  /** 总金额 */
  totalAmount: number;
}

// ============================================
// 租户配置主类型
// ============================================

export interface TenantTheme {
  /** 主色调 */
  primary: string;
  primaryLight: string;
  primaryDark: string;
  /** 强调色 */
  accent: string;
  /** 背景色 */
  background: string;
  /** 文字颜色 */
  text: string;
  textMuted: string;
  textSecondary: string;
  /** 边框色 */
  border: string;
  /** 功能色 */
  success: string;
  warning: string;
  error: string;
  info: string;
  /** 模糊效果 */
  blur: string;
}

export interface BookingFeatures {
  /** 预约模式: RULES (规则预约) | SEATING (在线订座) */
  mode: BookingMode;
  /** 启用预约功能 */
  enabled: boolean;
  /** 预约规则说明 */
  rules: string[];
  /** 桌位类型列表 */
  seatTypes: SeatType[];
}

/** 功能开关 */
export interface TenantFeatures {
  booking: boolean;
  menu: boolean;
  member: boolean;
  comments: boolean;
  delivery: boolean;
  product: boolean;
  stores: boolean;
}

/** 预约配置 */
export interface BookingConfig {
  maxGuests: number;
  minAdvanceHours: number;
  maxAdvanceDays: number;
  autoConfirm: boolean;
  requireDeposit?: boolean;
  depositAmount?: number;
  timeLimit?: number;
}

/** 租户配置 */
export interface TenantConfig {
  /** 租户唯一标识 */
  id: string;
  /** 品牌名称 */
  brandName: string;
  /** 品牌英文名 */
  brandNameEn: string;
  /** 数据库连接字符串 */
  dbConnection: string;
  /** Redis 连接字符串 */
  redisUrl: string;
  /** S3/OSS 存储桶名称 */
  storageBucket: string;
  /** 主题配置 */
  theme: TenantTheme;
  /** 功能开关 */
  features: TenantFeatures;
  /** 预约功能配置 */
  booking: BookingFeatures;
  /** 营业时间 */
  businessHours: BusinessHours;
  /** 预约配置 */
  bookingConfig: BookingConfig;
  /** 多门店配置 */
  stores: StoresConfig;
  /** 会员配置 */
  member: MemberConfig;
  /** 外卖配置 */
  delivery: DeliveryConfig;
  /** 周边商品配置 */
  product: ProductConfig;
  /** 创建时间 */
  createdAt: string;
  /** 状态 */
  status: 'active' | 'suspended' | 'inactive';
}

/** 租户运行时上下文 */
export interface TenantContext {
  /** 当前租户配置 */
  config: TenantConfig;
  /** 数据库实例 */
  db?: any;
  /** Redis 实例 */
  redis?: any;
}

/** API 响应中的租户信息 */
export interface TenantApiResponse {
  tenantId: string;
  brandName: string;
  brandNameEn: string;
  theme: TenantTheme;
}

/** 创建新租户请求 */
export interface CreateTenantRequest {
  id: string;
  brandName: string;
  brandNameEn?: string;
  theme?: Partial<TenantTheme>;
}
