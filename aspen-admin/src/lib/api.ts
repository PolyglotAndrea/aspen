/**
 * API Provider - 自动注入租户上下文
 *
 * 所有管理后台的 API 请求都会经过这里
 * 自动添加 x-tenant-id 请求头
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

// 当前租户 ID (从 localStorage 获取)
export function getCurrentTenantId(): string {
  if (typeof window === 'undefined') return 'aspen';
  return localStorage.getItem('current_tenant_id') || 'aspen';
}

export function setCurrentTenantId(tenantId: string): void {
  localStorage.setItem('current_tenant_id', tenantId);
}

// 当前会员 ID
export function getCurrentMemberId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('current_member_id') || null;
}

export function setCurrentMemberId(memberId: string): void {
  localStorage.setItem('current_member_id', memberId);
}

// 带租户上下文的 fetch 封装
export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const tenantId = getCurrentTenantId();
  const adminToken = localStorage.getItem('admin_token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-tenant-id': tenantId,
    ...(options.headers as Record<string, string> || {}),
  };

  if (adminToken) {
    headers['Authorization'] = `Bearer ${adminToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem('admin_token');
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    throw new Error('登录已过期，请重新登录');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '请求失败' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

// ==================== 管理员认证 API ====================

export const adminAuthApi = {
  login: (data: { username: string; password: string }) =>
    apiFetch('/api/v1/admin/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  me: () => apiFetch('/api/v1/admin/me'),
};

// ==================== 租户管理 API ====================

export const tenantApi = {
  list: () => apiFetch('/tenants'),
  get: (id: string) => apiFetch(`/tenants/${id}`),
  create: (data: any) => apiFetch('/tenants', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any) => apiFetch(`/tenants/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
};

// ==================== 品牌 API ====================

export const brandApi = {
  get: () => apiFetch('/api/v1/brand'),
  update: (data: any) => apiFetch('/api/v1/brand', {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
};

// ==================== 菜单 API (堂食) ====================

export const menuApi = {
  list: (params?: { keyword?: string; category?: string; status?: string }) => {
    const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return apiFetch(`/api/v1/menu${query}`);
  },
  get: (id: number) => apiFetch(`/api/v1/menu/${id}`),
  create: (data: any) => apiFetch('/api/v1/menu', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: number, data: any) => apiFetch(`/api/v1/menu/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  delete: (id: number) => apiFetch(`/api/v1/menu/${id}`, {
    method: 'DELETE',
  }),
  getCategories: () => apiFetch('/api/v1/menu/categories'),
};

// ==================== 预订 API ====================

export const bookingApi = {
  getConfig: () => apiFetch('/api/v1/bookings/config'),
  list: (params?: { status?: string; date?: string; storeId?: string }) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiFetch(`/api/v1/bookings${query}`);
  },
  get: (id: string) => apiFetch(`/api/v1/bookings/${id}`),
  create: (data: any) => apiFetch('/api/v1/bookings', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  confirm: (id: string) => apiFetch(`/api/v1/bookings/${id}/confirm`, {
    method: 'POST',
  }),
  cancel: (id: string) => apiFetch(`/api/v1/bookings/${id}/cancel`, {
    method: 'POST',
  }),
  verify: (id: string, code: string) => apiFetch(`/api/v1/bookings/${id}/verify`, {
    method: 'POST',
    body: JSON.stringify({ verifyCode: code }),
  }),
  // 门店管理
  listStores: (params?: { keyword?: string; status?: string }) => {
    const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return apiFetch(`/api/v1/bookings/stores${query}`);
  },
  getStore: (id: string) => apiFetch(`/api/v1/bookings/stores/${id}`),
  createStore: (data: any) => apiFetch('/api/v1/bookings/stores', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateStore: (id: string, data: any) => apiFetch(`/api/v1/bookings/stores/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  deleteStore: (id: string) => apiFetch(`/api/v1/bookings/stores/${id}`, {
    method: 'DELETE',
  }),
  // 桌位管理
  listTables: (storeId: string) => apiFetch(`/api/v1/bookings/stores/${storeId}/tables`),
  addTable: (storeId: string, data: any) => apiFetch(`/api/v1/bookings/stores/${storeId}/tables`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateTable: (storeId: string, tableId: string, data: any) => apiFetch(`/api/v1/bookings/stores/${storeId}/tables/${tableId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  deleteTable: (storeId: string, tableId: string) => apiFetch(`/api/v1/bookings/stores/${storeId}/tables/${tableId}`, {
    method: 'DELETE',
  }),
};

// ==================== 统一订单 API ====================

export const orderApi = {
  getConfig: () => apiFetch('/api/v1/orders/config'),
  list: (params?: { type?: string; status?: string; storeId?: string; page?: number; pageSize?: number }) => {
    const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return apiFetch(`/api/v1/orders${query}`);
  },
  get: (id: string) => apiFetch(`/api/v1/orders/${id}`),
  create: (data: any) => apiFetch('/api/v1/orders', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any) => apiFetch(`/api/v1/orders/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  cancel: (id: string) => apiFetch(`/api/v1/orders/${id}/cancel`, {
    method: 'POST',
  }),
  verify: (id: string, code: string) => apiFetch(`/api/v1/orders/${id}/verify`, {
    method: 'POST',
    body: JSON.stringify({ verifyCode: code }),
  }),
  pay: (id: string, method: string = 'wechat') => apiFetch(`/api/v1/orders/${id}/pay`, {
    method: 'POST',
    body: JSON.stringify({ paymentMethod: method }),
  }),
  // 购物车
  getCart: () => apiFetch('/api/v1/orders/cart'),
  addToCart: (data: any) => apiFetch('/api/v1/orders/cart', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateCartItem: (productId: string, quantity: number, spec?: string) => apiFetch(`/api/v1/orders/cart/${productId}`, {
    method: 'PATCH',
    body: JSON.stringify({ quantity, spec }),
  }),
  clearCart: () => apiFetch('/api/v1/orders/cart', {
    method: 'DELETE',
  }),
};

// ==================== 周边商品 API ====================

export const productApi = {
  getConfig: () => apiFetch('/api/v1/products/config'),
  list: (params?: { category?: string; status?: string; keyword?: string; isRecommend?: boolean; isNew?: boolean; isHot?: boolean; sortBy?: string; sortOrder?: 'asc' | 'desc' }) => {
    const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return apiFetch(`/api/v1/products${query}`);
  },
  get: (id: string) => apiFetch(`/api/v1/products/${id}`),
  create: (data: any) => apiFetch('/api/v1/products', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any) => apiFetch(`/api/v1/products/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => apiFetch(`/api/v1/products/${id}`, {
    method: 'DELETE',
  }),
  // 分类
  getCategories: () => apiFetch('/api/v1/products/categories'),
  createCategory: (data: any) => apiFetch('/api/v1/products/categories', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateCategory: (id: string, data: any) => apiFetch(`/api/v1/products/categories/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  deleteCategory: (id: string) => apiFetch(`/api/v1/products/categories/${id}`, {
    method: 'DELETE',
  }),
  // SKU
  getSkus: (productId: string) => apiFetch(`/api/v1/products/${productId}/skus`),
  createSku: (productId: string, data: any) => apiFetch(`/api/v1/products/${productId}/skus`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateSku: (productId: string, skuId: string, data: any) => apiFetch(`/api/v1/products/${productId}/skus/${skuId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  deleteSku: (productId: string, skuId: string) => apiFetch(`/api/v1/products/${productId}/skus/${skuId}`, {
    method: 'DELETE',
  }),
};

// ==================== 外卖 API ====================

export const deliveryApi = {
  getConfig: () => apiFetch('/api/v1/delivery/config'),
  calcFee: (data: any) => apiFetch('/api/v1/delivery/calc-fee', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getMenu: (params?: { category?: string; keyword?: string; status?: string }) => {
    const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return apiFetch(`/api/v1/delivery/menu${query}`);
  },
  getCategories: () => apiFetch('/api/v1/delivery/categories'),
  getRecommend: () => apiFetch('/api/v1/delivery/recommend'),
  getHot: () => apiFetch('/api/v1/delivery/hot'),
  timeCheck: (data: any) => apiFetch('/api/v1/delivery/time-check', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getItem: (id: string) => apiFetch(`/api/v1/delivery/${id}`),
  createMenuItem: (data: any) => apiFetch('/api/v1/delivery', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateMenuItem: (id: string, data: any) => apiFetch(`/api/v1/delivery/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  deleteMenuItem: (id: string) => apiFetch(`/api/v1/delivery/${id}`, {
    method: 'DELETE',
  }),
  // 外卖分类管理
  createCategory: (data: any) => apiFetch('/api/v1/delivery/categories', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateCategory: (id: string, data: any) => apiFetch(`/api/v1/delivery/categories/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  deleteCategory: (id: string) => apiFetch(`/api/v1/delivery/categories/${id}`, {
    method: 'DELETE',
  }),
};

// ==================== 会员 API ====================

export const memberApi = {
  getConfig: () => apiFetch('/api/v1/member/config'),
  getLevels: () => apiFetch('/api/v1/member/levels'),
  register: (data: { phone: string; nickname?: string }) => apiFetch('/api/v1/member/register/phone', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  loginPhone: (data: { phone: string; code?: string }) => apiFetch('/api/v1/member/login/phone', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  loginPassword: (data: { username: string; password: string }) => apiFetch('/api/v1/member/login/password', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getProfile: () => apiFetch('/api/v1/member/profile'),
  updateProfile: (data: any) => apiFetch('/api/v1/member/profile', {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  getPoints: (params?: { type?: string }) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiFetch(`/api/v1/member/points${query}`);
  },
  signin: () => apiFetch('/api/v1/member/points/signin', {
    method: 'POST',
  }),
  usePoints: (points: number, orderId?: string) => apiFetch('/api/v1/member/points/use', {
    method: 'POST',
    body: JSON.stringify({ points, orderId }),
  }),
  // Admin endpoints
  adminList: (params?: { page?: number; pageSize?: number; status?: string; search?: string }) => {
    const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return apiFetch(`/api/v1/admin/members${query}`);
  },
  adminGet: (id: string) => apiFetch(`/api/v1/admin/members/${id}`),
  adminCreate: (data: any) => apiFetch('/api/v1/admin/members', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  adminUpdate: (id: string, data: any) => apiFetch(`/api/v1/admin/members/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  adminDelete: (id: string) => apiFetch(`/api/v1/admin/members/${id}`, {
    method: 'DELETE',
  }),
  adminAdjustPoints: (id: string, data: any) => apiFetch(`/api/v1/admin/members/${id}/points`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

// ==================== 支付 API ====================

export const paymentApi = {
  pay: (id: string, method: string = 'wechat') => apiFetch(`/api/v1/payment/orders/${id}/pay`, {
    method: 'POST',
    body: JSON.stringify({ paymentMethod: method }),
  }),
  confirm: (transactionNo: string) => apiFetch(`/api/v1/payment/confirm/${transactionNo}`, {
    method: 'POST',
  }),
  getStatus: (id: string) => apiFetch(`/api/v1/payment/orders/${id}/status`),
  refund: (id: string) => apiFetch(`/api/v1/payment/orders/${id}/refund`, {
    method: 'POST',
  }),
  profitSharing: (id: string) => apiFetch(`/api/v1/payment/orders/${id}/profit-sharing`),
  settleProfitSharing: (id: string) => apiFetch(`/api/v1/payment/profit-sharing/${id}/settle`, {
    method: 'POST',
  }),
  listTransactions: (params?: { orderId?: string; status?: string; page?: number; limit?: number }) => {
    const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return apiFetch(`/api/v1/payment/transactions${query}`);
  },
};
