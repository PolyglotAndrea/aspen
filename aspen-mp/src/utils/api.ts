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
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
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
      method: options.method || 'GET',
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
  list: () => apiFetch('/api/v1/menu'),
};

// ==================== 预订 API ====================

export const bookingApi = {
  getConfig: () => apiFetch('/api/v1/bookings/config'),
  getStores: () => apiFetch('/api/v1/bookings/stores'),
  getAvailableTables: (params: { date: string; time: string; guests: number }) =>
    apiFetch(`/api/v1/bookings/available-tables?date=${params.date}&time=${params.time}&guests=${params.guests}`),
  create: (data: any) => apiFetch('/api/v1/orders', {
    method: 'POST',
    data: { type: 'booking', ...data },
  }),
};

// ==================== 订单 API ====================

export const orderApi = {
  list: (params?: { status?: string; type?: string }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.type) query.set('type', params.type);
    const qs = query.toString();
    return apiFetch(`/api/v1/orders${qs ? `?${qs}` : ''}`);
  },
  get: (id: string) => apiFetch(`/api/v1/orders/${id}`),
  create: (data: any) => apiFetch('/api/v1/orders', {
    method: 'POST',
    data,
  }),
  pay: (id: string) => apiFetch(`/api/v1/orders/${id}/pay`, { method: 'POST' }),
  cancel: (id: string) => apiFetch(`/api/v1/orders/${id}/cancel`, { method: 'POST' }),
  // 购物车
  getCart: () => apiFetch('/api/v1/orders/cart'),
  addToCart: (data: any) => apiFetch('/api/v1/orders/cart', { method: 'POST', data }),
  updateCartItem: (productId: string, quantity: number, spec?: string) =>
    apiFetch(`/api/v1/orders/cart/${productId}`, { method: 'PATCH', data: { quantity, spec } }),
  clearCart: () => apiFetch('/api/v1/orders/cart', { method: 'DELETE' }),
};

// ==================== 会员 API ====================

export const memberApi = {
  loginPhone: (phone: string, code?: string) => apiFetch('/api/v1/member/login/phone', {
    method: 'POST',
    data: { phone, code },
  }),
  loginPassword: (phone: string, password: string) => apiFetch('/api/v1/member/login/password', {
    method: 'POST',
    data: { phone, password },
  }),
  getProfile: () => apiFetch('/api/v1/member/profile'),
  updateProfile: (data: any) => apiFetch('/api/v1/member/profile', {
    method: 'PATCH',
    data,
  }),
  getPoints: () => apiFetch('/api/v1/member/points'),
  signin: () => apiFetch('/api/v1/member/points/signin', { method: 'POST' }),
};

// ==================== 外卖 API ====================

export const deliveryApi = {
  getConfig: () => apiFetch('/api/v1/delivery/config'),
  getMenu: () => apiFetch('/api/v1/delivery/menu'),
  getCategories: () => apiFetch('/api/v1/delivery/categories'),
  calcFee: (data: { distance?: number; amount?: number; areaId?: string }) =>
    apiFetch('/api/v1/delivery/calc-fee', { method: 'POST', data }),
};

// ==================== 商品 API ====================

export const productApi = {
  list: (params?: { category?: string }) => {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    const qs = query.toString();
    return apiFetch(`/api/v1/products${qs ? `?${qs}` : ''}`);
  },
  getCategories: () => apiFetch('/api/v1/products/categories'),
};
