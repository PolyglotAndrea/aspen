/**
 * 租户配置类型定义 (Tenant Configuration Types)
 * 扩展支持多门店、会员、外卖、周边商品等功能
 *
 * v2.0 优化: 对齐市面主流餐饮+电商小程序标准模型
 * - 商品: SKU系统、营销标签、富文本、销量/评分
 * - 门店: 配送范围、评分、公告、二维码
 * - 菜单: 多级分类、多图、推荐/新品/热销标记
 * - 外卖: 多规格、推荐/标签、销量统计
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
// 会员相关类型
// ============================================

/** 会员等级 */
export interface MemberLevel {
  id: string;
  name: string;
  level: number;
  icon?: string;
  /** 升级所需积分 */
  upgradePoints: number;
  /** 积分倍率 */
  pointsRate?: number;
  /** 折扣 (0-1) */
  discount?: number;
  description?: string;
}

/** 会员配置 */
export interface MemberConfig {
  enabled: boolean;
  /** 积分名称 */
  pointsName: string;
  /** 等级列表 */
  levels: MemberLevel[];
  /** 签到积分 */
  signInPoints: number;
  /** 消费积分倍率 */
  consumePointsRate: number;
  /** 积分抵扣率 */
  pointsDeductionRate: number;
  /** 最低抵扣积分 */
  minDeductionPoints: number;
  /** 最高抵扣倍率 */
  maxDeductionRate: number;
  /** 积分过期天数 */
  pointsExpireDays: number;
  /** 会员权益 */
  benefits: MemberBenefits;
}

/** 会员权益 */
export interface MemberBenefits {
  discount: number;
  freeDelivery: boolean;
  priorityService: boolean;
  birthdayBenefit: {
    enabled: boolean;
    discount: number;
    gift?: string;
  };
  doublePointsDays: number[];
}

// ============================================
// 租户配置类型 (TenantConfig)
// ============================================

/** 主题配置 */
export interface TenantTheme {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  accent: string;
  background?: string;
  text?: string;
  textMuted?: string;
  textSecondary?: string;
  border?: string;
  success?: string;
  warning?: string;
  error?: string;
  info?: string;
  blur?: string;
}

export interface TenantConfig {
  /** 租户 ID */
  id: string;
  /** 品牌名称 */
  brandName: string;
  /** 品牌英文名称 */
  brandNameEn?: string;
  /** 状态 */
  status: 'active' | 'inactive' | 'pending';
  /** 主题配置 */
  theme: TenantTheme;
  /** 功能开关 */
  features: TenantFeatures;
  /** 业务时间 */
  businessHours: BusinessHours;
  /** 预约配置 */
  booking: {
    enabled: boolean;
    mode: BookingMode;
    rules: string[];
    seatTypes: SeatType[];
    maxGuests: number;
    minAdvanceHours: number;
    maxAdvanceDays: number;
    autoConfirm: boolean;
    requireDeposit?: boolean;
    depositAmount?: number;
    timeLimit?: number;
  };
  /** bookingConfig 兼容字段 */
  bookingConfig?: {
    maxGuests: number;
    minAdvanceHours: number;
    maxAdvanceDays: number;
    autoConfirm: boolean;
    requireDeposit?: boolean;
    depositAmount?: number;
    timeLimit?: number;
  };
  /** 外卖配置 */
  delivery: DeliveryConfig;
  /** 会员配置 */
  member: MemberConfig;
  /** 桌位配置 */
  tables: {
    enabled: boolean;
    seatTypes: SeatType[];
  };
  /** 门店配置 */
  stores: StoresConfig;
  /** 产品/菜单配置 */
  product: ProductConfig;
  payment: PaymentConfig;
  /** 品牌数据 */
  brandData?: {
    videoUrl?: string;
    tagline?: string;
    stories?: any[];
  };
  /** 数据库连接 (仅创建租户时使用) */
  dbConnection?: {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
  };
  /** Redis URL */
  redisUrl?: string;
  /** 存储桶 */
  storageBucket?: string;
  /** 创建时间 */
  createdAt?: string;
}

export interface TenantFeatures {
  booking: boolean;
  menu: boolean;
  member: boolean;
  comments: boolean;
  delivery: boolean;
  product: boolean;
  stores: boolean;
}

export interface BookingFeatures {
  enabled: boolean;
  mode: BookingMode;
  rules: string[];
  seatTypes: SeatType[];
}

/** 租户上下文 */
export interface TenantContext {
  config: TenantConfig;
}

/** 门店基础信息 (对应 stores 表) */
export interface Store {
  id: string;
  tenantId: string;
  name: string;
  shortName?: string | null;
  address: string;
  phone: string;
  longitude?: number | null;
  latitude?: number | null;
  businessHours?: any;
  rating: number;
  ratingCount: number;
  monthlySales: number;
  minOrderAmount: number;
  deliveryFee: number;
  deliveryDistance: number;
  packPrice: number;
  notice?: string | null;
  qrCode?: string | null;
  isOpen?: boolean | null;
  features: any;
  images?: any;
  description?: string | null;
  status?: string | null;
  sort?: number | null;
  createdAt?: string | null | Date;
  updatedAt?: string;
}

/** 租户 API 响应 */
export interface TenantApiResponse {
  success: boolean;
  tenantId?: string;
  brandName?: string;
  brandNameEn?: string;
  theme?: TenantTheme;
  features?: TenantFeatures;
  error?: string;
}

// ============================================
// 多门店配置
// ============================================

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

/** 门店详情 (返回给前端的完整数据) */
export interface StoreDetail extends Store {
  /** 距离(千米) */
  distance?: number;
  /** 预计配送时间(分钟) */
  estimatedDeliveryTime?: number;
  /** 配送区域 */
  deliveryAreas?: DeliveryArea[];
}

// ============================================
// 商品规格与SKU
// ============================================

/** 商品规格选项 */
export interface ProductSpecOption {
  id: string;
  name: string;
  price: number;       // 加价(可正可负)
  stock: number;
}

/** 商品规格组 */
export interface ProductSpecGroup {
  id: string;
  name: string;
  options: ProductSpecOption[];
}

/** SKU条目 */
export interface ProductSKU {
  id: string;
  name: string;            // SKU名称 "大杯/加辣"
  price: number;           // 规格加价
  stock: number;
  specIds: string[];       // 规格ID组合
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
  /** 分类图片 */
  image?: string;
  /** 分类描述 */
  description?: string;
  /** 父分类ID (支持多级) */
  parentId?: string;
  /** 排序 */
  sort: number;
  /** 是否启用 */
  enabled: boolean;
}

/** 商品 */
export interface Product {
  id: string;
  categoryId: string;
  name: string;
  /** 副标题/卖点 */
  subtitle?: string | null;
  /** 商品描述 (富文本) */
  description?: string | null;
  /** 图片列表 */
  images?: string[] | unknown;
  /** 视频URL */
  videoUrl?: string | null;
  /** 价格 */
  price: number;
  /** 原价/划线价 */
  originalPrice?: number | null;
  /** 库存 */
  stock?: number | null;
  /** 单位 */
  unit?: string | null;
  /** 规格组 */
  specs?: ProductSpecGroup[] | unknown;
  /** 营销标签 */
  tags?: string[] | unknown;
  /** 是否推荐 */
  isRecommend?: boolean | null;
  /** 是否新品 */
  isNew?: boolean | null;
  /** 是否热销 */
  isHot?: boolean | null;
  /** 排序 */
  sort?: number | null;
  /** 状态 */
  status?: 'active' | 'inactive' | 'offline' | null;
  /** 销量 */
  soldCount?: number | null;
  /** 评分 */
  rating?: number | null;
  /** 评价数 */
  ratingCount?: number | null;
  /** 创建时间 */
  createdAt?: string | Date | null;
  /** 更新时间 */
  updatedAt?: string | Date | null;
}

/** 商品详情 (返回给前端的完整数据) */
export interface ProductDetail extends Product {
  /** SKU列表 */
  skus?: ProductSKU[];
  /** 同类推荐 */
  recommends?: Product[];
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

/** 支付配置 (租户级别) - 使用 payment/types 的 TenantPaymentConfig */
export type PaymentConfig = import('../payment/types').TenantPaymentConfig;

// ============================================
// 堂食菜单类型
// ============================================

/** 菜单分类 */
export interface MenuCategory {
  id: string;
  name: string;
  icon?: string;
  image?: string;
  description?: string;
  sort: number;
  enabled: boolean;
  /** 子分类 */
  children?: MenuCategory[];
}

/** 堂食菜品 */
export interface MenuItem {
  id: string;
  categoryId?: string;
  name: string;
  /** 副标题 */
  subtitle?: string;
  price: number;
  /** 原价 */
  originalPrice?: number;
  /** 描述 */
  description?: string;
  /** 标签 */
  tags: string[];
  /** 图片 */
  imageUrl?: string;
  /** 多图 */
  images?: string[];
  /** 是否推荐 */
  isRecommend: boolean;
  /** 是否新品 */
  isNew: boolean;
  /** 是否热销 */
  isHot: boolean;
  /** 可用 */
  available: boolean;
  /** 销量 */
  soldCount: number;
  /** 评分 */
  rating: number;
  /** 排序 */
  sort: number;
  /** 创建时间 */
  createdAt: string;
}

/** 堂食菜单配置 */
export interface MenuConfig {
  enabled: boolean;
  categories: MenuCategory[];
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

/** 外卖菜品 */
export interface DeliveryItem {
  id: string;
  name: string;
  /** 副标题 */
  subtitle?: string;
  /** 描述 (富文本) */
  description?: string;
  price: number;
  /** 原价 */
  originalPrice?: number;
  /** 主图 */
  image: string;
  /** 多图 */
  images?: string[];
  category: string;
  available: boolean;
  stock: number;
  /** 标签 */
  tags: string[];
  /** 规格选项 */
  specs?: ProductSpecGroup[];
  /** 是否推荐 */
  isRecommend: boolean;
  /** 是否新品 */
  isNew: boolean;
  /** 月销量 */
  soldCount: number;
  /** 评分 */
  rating: number;
  /** 创建时间 */
  createdAt: string;
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
  /** 实付金额 */
  total: number;
  /** 实付金额 */
  paidAmount?: number;
  /** 支付方式 */
  paymentMethod?: string;
  /** 支付时间 */
  paidAt?: string;
  /** 预订信息 */
  bookingInfo?: {
    date: string;
    time: string;
    guests: number;
    tableId?: string;
    tableName?: string;
    verifyCode?: string;
  };
  /** 配送信息 */
  deliveryInfo?: {
    address: string;
    contactName: string;
    contactPhone: string;
    distance?: number;
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