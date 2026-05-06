/**
 * 租户主题 Hook
 * 用于小程序端自动获取并应用租户主题
 */

import { ref, onMounted, type Ref } from 'vue';

interface TenantTheme {
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

interface TenantInfo {
  tenantId: string;
  brandName: string;
  brandNameEn: string;
  theme: TenantTheme;
}

interface UseTenantOptions {
  /** API 基础地址 */
  apiBase?: string;
  /** 当前租户 ID */
  tenantId?: string;
  /** 是否自动应用主题到页面 */
  autoApply?: boolean;
}

interface UseTenantReturn {
  /** 租户信息 */
  tenant: Ref<TenantInfo | null>;
  /** 主题配置 */
  theme: Ref<TenantTheme | null>;
  /** 加载状态 */
  loading: Ref<boolean>;
  /** 错误信息 */
  error: Ref<string | null>;
  /** 刷新租户信息 */
  refresh: () => Promise<void>;
  /** 应用主题到页面 */
  applyTheme: (theme: TenantTheme) => void;
  /** 切换租户 */
  switchTenant: (newTenantId: string) => Promise<void>;
}

const DEFAULT_API_BASE = 'http://localhost:3000';
const DEFAULT_TENANT = 'aspen';

/**
 * 租户主题 Hook
 *
 * @example
 * const { tenant, theme, loading, switchTenant } = useTenant({
 *   tenantId: 'volcano',
 *   autoApply: true
 * });
 */
export function useTenant(options: UseTenantOptions = {}): UseTenantReturn {
  const {
    apiBase = DEFAULT_API_BASE,
    tenantId = DEFAULT_TENANT,
    autoApply = true,
  } = options;

  const currentTenantId = ref(tenantId);
  const tenant = ref<TenantInfo | null>(null);
  const theme = ref<TenantTheme | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  /**
   * 应用主题到页面 CSS 变量
   */
  const applyTheme = (newTheme: TenantTheme) => {
    if (typeof uni === 'undefined') return;

    // 存储到本地，供下次启动使用
    uni.setStorageSync('currentTheme', JSON.stringify(newTheme));

    // H5 模式: 直接设置 CSS 变量到 documentElement
    // #ifdef H5
    if (typeof document !== 'undefined') {
      const cssVarMap: Record<string, string> = {
        primary: '--as-primary',
        primaryLight: '--as-primary-light',
        primaryDark: '--as-primary-dark',
        accent: '--as-accent',
        background: '--as-background',
        text: '--as-text',
        textMuted: '--as-text-muted',
        textSecondary: '--as-text-secondary',
        border: '--as-border',
        success: '--as-success',
        warning: '--as-warning',
        error: '--as-error',
        info: '--as-info',
        blur: '--as-blur',
      };
      Object.entries(cssVarMap).forEach(([key, cssVar]) => {
        const value = (newTheme as any)[key];
        if (value) {
          document.documentElement.style.setProperty(cssVar, value);
        }
      });
    }
    // #endif

    // 小程序模式: 存储各变量值供页面读取
    // #ifndef H5
    Object.entries(newTheme).forEach(([key, value]) => {
      uni.setStorageSync(`theme-${key}`, value);
    });
    // #endif

    console.log('[Tenant] 主题已应用:', newTheme.primary);
  };

  /**
   * 获取租户信息
   */
  const fetchTenantInfo = async (tid?: string): Promise<void> => {
    const targetTenantId = tid || currentTenantId.value;

    loading.value = true;
    error.value = null;

    try {
      // 调用 API 获取品牌/主题信息
      const response = await fetch(`${apiBase}/api/v1/brand`, {
        headers: {
          'x-tenant-id': targetTenantId,
        },
      });

      if (!response.ok) {
        throw new Error(`获取租户信息失败: ${response.status}`);
      }

      const data = await response.json();

      tenant.value = {
        tenantId: data.tenantId,
        brandName: data.brandName,
        brandNameEn: data.brandNameEn,
        theme: data.theme,
      };

      theme.value = data.theme;

      // 自动应用主题
      if (autoApply && data.theme) {
        applyTheme(data.theme);
      }

      console.log(`[Tenant] 已切换到: ${data.brandName} (${targetTenantId})`);
    } catch (err: any) {
      error.value = err.message;
      console.error('[Tenant] 获取租户信息失败:', err);

      // 如果 API 失败，尝试使用本地缓存的主题
      const cachedTheme = uni?.getStorageSync?.('currentTheme');
      if (cachedTheme) {
        try {
          theme.value = JSON.parse(cachedTheme);
          if (autoApply) {
            applyTheme(theme.value);
          }
        } catch (e) {
          // ignore parse error
        }
      }
    } finally {
      loading.value = false;
    }
  };

  /**
   * 刷新租户信息
   */
  const refresh = () => {
    return fetchTenantInfo();
  };

  /**
   * 切换租户
   */
  const switchTenant = async (newTenantId: string) => {
    currentTenantId.value = newTenantId;
    await fetchTenantInfo(newTenantId);
  };

  // 初始化时获取租户信息
  onMounted(() => {
    fetchTenantInfo();
  });

  return {
    tenant,
    theme,
    loading,
    error,
    refresh,
    applyTheme,
    switchTenant,
  };
}

/**
 * 切换主题的简便方法
 *
 * @example
 * // 在页面中切换主题
 * import { useThemeSwitcher } from '@/utils/tenant';
 *
 * const { switchTo } = useThemeSwitcher();
 *
 * // 切换到火山主题
 * switchTo('volcano');
 *
 * // 切换到深海主题
 * switchTo('ocean');
 */
export function useThemeSwitcher() {
  const { switchTenant, theme } = useTenant({ autoApply: true });

  return {
    theme,
    switchTo: switchTenant,
    /** 切换到白杨主题 */
    switchToAspen: () => switchTenant('aspen'),
    /** 切换到火山主题 */
    switchToVolcano: () => switchTenant('volcano'),
    /** 切换到深海主题 */
    switchToOcean: () => switchTenant('ocean'),
    /** 切换到金阁主题 */
    switchToGold: () => switchTenant('gold'),
  };
}

/**
 * 导出主题工具函数
 */
export const themeUtils = {
  /**
   * 获取主题颜色
   */
  getColor: (key: keyof TenantTheme): string => {
    if (typeof uni === 'undefined') return '#4a9c6d';
    return uni.getStorageSync(`theme-${key}`) || '#4a9c6d';
  },

  /**
   * 主题是否已加载
   */
  isLoaded: (): boolean => {
    if (typeof uni === 'undefined') return false;
    const theme = uni.getStorageSync('currentTheme');
    return !!theme;
  },

  /**
   * 清除主题缓存
   */
  clearCache: (): void => {
    if (typeof uni === 'undefined') return;
    uni.removeStorageSync('currentTheme');
  },
};

export default useTenant;
