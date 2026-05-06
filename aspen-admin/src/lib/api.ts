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
  const memberId = getCurrentMemberId();

  const adminKey = import.meta.env.VITE_ADMIN_KEY || 'dev-admin-key-change-in-production';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-tenant-id': tenantId,
    'x-admin-key': adminKey,
    ...(options.headers as Record<string, string> || {}),
  };

  if (memberId) {
    headers['x-member-id'] = memberId;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '请求失败' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

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

// ==================== 菜单 API ====================

export const menuApi = {
  list: () => apiFetch('/api/v1/menu'),
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
  listStores: () => apiFetch('/api/v1/bookings/stores'),
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
  adminAdjustPoints: (id: string, data: { points: number; reason?: string }) => apiFetch(`/api/v1/admin/members/${id}/points`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

// ==================== 外卖 API ====================

export const deliveryApi = {
  getConfig: () => apiFetch('/api/v1/delivery/config'),
  getMenu: (params?: { category?: string; available?: boolean }) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiFetch(`/api/v1/delivery/menu${query}`);
  },
  getCategories: () => apiFetch('/api/v1/delivery/categories'),
  getMenuItem: (id: string) => apiFetch(`/api/v1/delivery/menu/${id}`),
  createMenuItem: (data: any) => apiFetch('/api/v1/delivery/menu', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateMenuItem: (id: string, data: any) => apiFetch(`/api/v1/delivery/menu/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  deleteMenuItem: (id: string) => apiFetch(`/api/v1/delivery/menu/${id}`, {
    method: 'DELETE',
  }),
  calcFee: (data: { distance: number; amount: number; areaId?: string }) => apiFetch('/api/v1/delivery/calc-fee', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  checkTime: () => apiFetch('/api/v1/delivery/time-check'),
};

// ==================== 支付 API ====================

export const paymentApi = {
  pay: (orderId: string, method?: string) => apiFetch(`/api/v1/payment/orders/${orderId}/pay`, {
    method: 'POST',
    body: JSON.stringify({ paymentMethod: method || 'simulate' }),
  }),
  confirm: (transactionNo: string) => apiFetch(`/api/v1/payment/confirm/${transactionNo}`, {
    method: 'POST',
  }),
  getStatus: (orderId: string) => apiFetch(`/api/v1/payment/orders/${orderId}/status`),
  refund: (orderId: string, reason?: string, amount?: number) => apiFetch(`/api/v1/payment/orders/${orderId}/refund`, {
    method: 'POST',
    body: JSON.stringify({ reason, amount }),
  }),
  getProfitSharing: (orderId: string) => apiFetch(`/api/v1/payment/orders/${orderId}/profit-sharing`),
  settleProfitSharing: (id: string) => apiFetch(`/api/v1/payment/profit-sharing/${id}/settle`, {
    method: 'POST',
  }),
};

// ==================== 周边商品 API ====================

export const productApi = {
  getConfig: () => apiFetch('/api/v1/products/config'),
  list: (params?: { category?: string; status?: string }) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
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
  getCategories: () => apiFetch('/api/v1/products/categories'),
  createCategory: (data: { name: string; icon?: string }) => apiFetch('/api/v1/products/categories', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

// ==================== 导出 ====================

export default {
  tenant: tenantApi,
  brand: brandApi,
  menu: menuApi,
  booking: bookingApi,
  order: orderApi,
  member: memberApi,
  delivery: deliveryApi,
  product: productApi,
  payment: paymentApi,
  getCurrentTenantId,
  setCurrentTenantId,
  getCurrentMemberId,
  setCurrentMemberId,
};
