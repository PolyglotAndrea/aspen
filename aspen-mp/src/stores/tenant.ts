/**
 * 租户 Store
 * 管理当前租户信息、主题配置、功能开关
 */

import { defineStore } from 'pinia';
import { brandApi, getCurrentTenantId, setCurrentTenantId } from '../utils/api';

export interface TenantTheme {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  accent: string;
  background: string;
  text: string;
  textMuted: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  blur: string;
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

export const useTenantStore = defineStore('tenant', {
  state: () => ({
    tenantId: 'aspen',
    brandName: '白杨树',
    brandNameEn: 'Aspen',
    theme: null as TenantTheme | null,
    features: null as TenantFeatures | null,
  }),

  actions: {
    async fetchTenant(tenantId?: string) {
      const id = tenantId || this.tenantId || getCurrentTenantId();
      try {
        const data = await brandApi.get() as any;
        this.tenantId = id;
        this.brandName = data.brandName || '白杨树';
        this.brandNameEn = data.brandNameEn || 'Aspen';
        this.theme = data.theme || null;
        setCurrentTenantId(id);
        this.applyTheme();
      } catch (e) {
        console.error('Failed to fetch tenant:', e);
      }
    },

    switchTenant(id: string) {
      this.tenantId = id;
      setCurrentTenantId(id);
      this.fetchTenant(id);
    },

    applyTheme() {
      if (!this.theme) return;

      // #ifdef H5
      if (typeof document !== 'undefined') {
        const root = document.documentElement;
        root.style.setProperty('--color-primary', this.theme.primary);
        root.style.setProperty('--color-primary-light', this.theme.primaryLight);
        root.style.setProperty('--color-primary-dark', this.theme.primaryDark);
        root.style.setProperty('--color-accent', this.theme.accent);
        root.style.setProperty('--color-background', this.theme.background);
        root.style.setProperty('--color-text', this.theme.text);
        root.style.setProperty('--color-text-muted', this.theme.textMuted);
        root.style.setProperty('--color-text-secondary', this.theme.textSecondary);
        root.style.setProperty('--color-border', this.theme.border);
        root.style.setProperty('--color-success', this.theme.success);
        root.style.setProperty('--color-warning', this.theme.warning);
        root.style.setProperty('--color-error', this.theme.error);
        root.style.setProperty('--color-info', this.theme.info);
      }
      // #endif

      // 小程序模式：存储主题 ID 供页面级访问
      // #ifndef H5
      try {
        uni.setStorageSync('current_theme', this.tenantId);
      } catch {}
      // #endif
    },
  },

  persist: {
    key: 'aspen-tenant',
    storage: {
      getItem: (key: string) => {
        try { return uni.getStorageSync(key); } catch { return null; }
      },
      setItem: (key: string, value: string) => {
        try { uni.setStorageSync(key, value); } catch {}
      },
    },
  },
});
