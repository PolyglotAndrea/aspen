/**
 * MP API 层 - 自动注入租户上下文
 *
 * 所有小程序端的 API 请求都经过这里
 * 自动添加 x-tenant-id / x-member-id 请求头
 * 使用 uni.request 兼容小程序和 H5
 */

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

// ==================== 租户/会员上下文 ====================

export function getCurrentTenantId(): string {
  return uni.getStorageSync('current_tenant_id') || 'aspen';
}

export function setCurrentTenantId(tenantId: string): void {
  uni.setStorageSync('current_tenant_id', tenantId);
}

export function getCurrentMemberId(): string | null {
  return uni.getStorageSync('current_member_id') || null;
}

export function setCurrentMemberId(memberId: string): void {
  uni.setStorageSync('current_member_id', memberId);
}

// ==================== 核心请求封装 ====================

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  data?: any;
  header?: Record<string, string>;
}

export async function apiFetch<T = any>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const tenantId = getCurrentTenantId();
  const memberId = getCurrentMemberId();

  const header: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-tenant-id': tenantId,
    ...(options.header || {}),
  };

  // 优先使用 JWT token，回退到 x-member-id
  try {
    const { useAuthStore } = await import('../stores/auth');
    const authStore = useAuthStore();
    if (authStore.token) {
      header['Authorization'] = `Bearer ${authStore.token}`;
    }
  } catch {
    // store 未初始化，回退到 x-member-id
    if (memberId) {
      header['x-member-id'] = memberId;
    }
  }

  return new Promise((resolve, reject) => {
    uni.request({
      url: `${API_BASE}${endpoint}`,
      method: (options.method || 'GET') as any,
      header,
      data: options.data,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data as T);
        } else {
          const errMsg = (res.data as any)?.message || (res.data as any)?.error || `HTTP ${res.statusCode}`;
          reject(new Error(errMsg));
        }
      },
      fail: (err) => {
        reject(new Error(err.errMsg || '网络错误'));
      },
    });
  });
}

// ==================== 品牌 API ====================

export const brandApi = {
  get: () => apiFetch('/api/v1/brand'),
};

// ==================== 菜单 API ====================

export const menuApi = {
  list: (params?: Record<string, string>) => apiFetch<{ total: number; items: any[] }>('/api/v1/menu' + toQuery(params)),
  categories: () => apiFetch<{ categories: any[] }>('/api/v1/menu/categories'),
  detail: (id: string) => apiFetch(`/api/v1/menu/${id}`),
};

// ==================== 预订 API ====================

export const bookingApi = {
  getConfig: () => apiFetch('/api/v1/bookings/config'),
  getStores: () => apiFetch('/api/v1/bookings/stores'),
  getStoreDetail: (id: string) => apiFetch(`/api/v1/bookings/stores/${id}`),
  getAvailableTables: (params: Record<string, string>) => apiFetch('/api/v1/bookings/available-tables' + toQuery(params)),
  create: (data: any) => apiFetch('/api/v1/orders', { method: 'POST', data: { type: 'booking', ...data } }),
};

// ==================== 外卖 API ====================

export const deliveryApi = {
  getConfig: () => apiFetch('/api/v1/delivery/config'),
  getMenu: (params?: Record<string, string>) => apiFetch<{ categories: string[]; items: any[] }>('/api/v1/delivery/menu' + toQuery(params)),
  getCategories: () => apiFetch<{ categories: any[] }>('/api/v1/delivery/categories'),
  getHot: (limit?: number) => apiFetch<{ items: any[] }>('/api/v1/delivery/hot' + (limit ? `?limit=${limit}` : '')),
  getDetail: (id: string) => apiFetch(`/api/v1/delivery/menu/${id}`),
  calcFee: (data: any) => apiFetch('/api/v1/delivery/calc-fee', { method: 'POST', data }),
  timeCheck: () => apiFetch('/api/v1/delivery/time-check'),
  recommend: () => apiFetch<{ items: any[] }>('/api/v1/delivery/recommend'),
};

// ==================== 商品 API ====================

export const productApi = {
  getConfig: () => apiFetch('/api/v1/products/config'),
  getCategories: () => apiFetch<{ categories: any[] }>('/api/v1/products/categories'),
  getList: (params?: Record<string, string>) => apiFetch<{ products: any[] }>('/api/v1/products' + toQuery(params)),
  getDetail: (id: string) => apiFetch<{ skus?: any[]; recommends?: any[] }>(`/api/v1/products/${id}`),
};

// ==================== 会员 API ====================

export const memberApi = {
  loginPhone: (phone: string) => apiFetch('/api/v1/member/login/phone', { method: 'POST', data: { phone } }),
  loginPassword: (phone: string, password: string) => apiFetch('/api/v1/member/login/password', { method: 'POST', data: { phone, password } }),
  getProfile: () => apiFetch('/api/v1/member/profile'),
  updateProfile: (data: any) => apiFetch('/api/v1/member/profile', { method: 'PATCH', data }),
  getPoints: () => apiFetch('/api/v1/member/points'),
  signin: () => apiFetch('/api/v1/member/points/signin', { method: 'POST' }),
};

// ==================== 订单 API ====================

export const orderApi = {
  getConfig: () => apiFetch('/api/v1/orders/config'),
  getCart: () => apiFetch('/api/v1/orders/cart'),
  addToCart: (data: any) => apiFetch('/api/v1/orders/cart', { method: 'POST', data }),
  updateCart: (productId: string, data: any) => apiFetch(`/api/v1/orders/cart/${productId}`, { method: 'PATCH', data }),
  clearCart: () => apiFetch('/api/v1/orders/cart', { method: 'DELETE' }),
  createOrder: (data: any) => apiFetch('/api/v1/orders', { method: 'POST', data }),
  getOrderList: (params?: Record<string, string>) => apiFetch<any>('/api/v1/orders' + toQuery(params)),
  getOrderDetail: (id: string) => apiFetch(`/api/v1/orders/${id}`),
  payOrder: (id: string, method: string = 'wechat') => apiFetch(`/api/v1/orders/${id}/pay`, { method: 'POST', data: { paymentMethod: method } }),
  cancelOrder: (id: string) => apiFetch(`/api/v1/orders/${id}/cancel`, { method: 'POST' }),
  verifyOrder: (id: string, code: string) => apiFetch(`/api/v1/orders/${id}/verify`, { method: 'POST', data: { verifyCode: code } }),
};

// ==================== 工具函数 ====================

function toQuery(params?: Record<string, string>): string {
  if (!params) return '';
  const entries = Object.entries(params).filter(([_, v]) => v !== undefined && v !== '');
  if (entries.length === 0) return '';
  return '?' + entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
}