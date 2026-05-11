/**
 * 插件系统 (Plugin System)
 *
 * 提供生命周期钩子的插件注册机制：
 * - onStart: 服务启动时调用
 * - onStop: 服务停止时调用
 * - onTenantChange: 租户切换时调用
 * - beforeRequest: 请求前拦截
 * - afterRequest: 请求后拦截
 */

import type { Elysia } from 'elysia';

export type PluginHook = 'onStart' | 'onStop' | 'onTenantChange' | 'beforeRequest' | 'afterRequest';

export interface Plugin {
  name: string;
  onStart?(): Promise<void> | void;
  onStop?(): Promise<void> | void;
  onTenantChange?(tenantId: string): Promise<void> | void;
  beforeRequest?(request: Request): Promise<Request | Response | void> | Request | Response | void;
  afterRequest?(request: Request, response: Response): Promise<void> | void;
}

export interface PluginRegistration {
  plugin: Plugin;
  enabled: boolean;
  priority: number;
}

export class PluginRegistry {
  private plugins: Map<string, PluginRegistration> = new Map();
  private started = false;

  /**
   * 注册插件
   */
  register(plugin: Plugin, options?: { enabled?: boolean; priority?: number }): void {
    this.plugins.set(plugin.name, {
      plugin,
      enabled: options?.enabled ?? true,
      priority: options?.priority ?? 0,
    });
  }

  /**
   * 启用/禁用插件
   */
  setEnabled(name: string, enabled: boolean): void {
    const reg = this.plugins.get(name);
    if (reg) {
      reg.enabled = enabled;
    }
  }

  /**
   * 注销插件
   */
  unregister(name: string): void {
    this.plugins.delete(name);
  }

  /**
   * 获取已注册插件
   */
  getPlugin(name: string): Plugin | null {
    return this.plugins.get(name)?.plugin ?? null;
  }

  /**
   * 获取所有已启用插件（按优先级排序）
   */
  getEnabledPlugins(): Plugin[] {
    return Array.from(this.plugins.values())
      .filter((reg) => reg.enabled)
      .sort((a, b) => b.priority - a.priority)
      .map((reg) => reg.plugin);
  }

  /**
   * 启动所有插件
   */
  async startAll(): Promise<void> {
    const plugins = this.getEnabledPlugins();
    for (const plugin of plugins) {
      if (plugin.onStart) {
        await plugin.onStart();
      }
    }
    this.started = true;
  }

  /**
   * 停止所有插件
   */
  async stopAll(): Promise<void> {
    const plugins = this.getEnabledPlugins();
    for (const plugin of plugins) {
      if (plugin.onStop) {
        await plugin.onStop();
      }
    }
    this.started = false;
  }

  /**
   * 触发租户切换事件
   */
  async triggerTenantChange(tenantId: string): Promise<void> {
    const plugins = this.getEnabledPlugins();
    for (const plugin of plugins) {
      if (plugin.onTenantChange) {
        await plugin.onTenantChange(tenantId);
      }
    }
  }
}

// 全局插件注册表实例
export const pluginRegistry = new PluginRegistry();

/**
 * Elysia 插件：为插件系统提供请求生命周期钩子
 */
export function pluginMiddleware() {
  return (app: Elysia) =>
    app
      .onBeforeHandle(async ({ request, set }) => {
        const plugins = pluginRegistry.getEnabledPlugins();
        for (const plugin of plugins) {
          if (plugin.beforeRequest) {
            const result = await plugin.beforeRequest(request);
            if (result instanceof Response) {
              set.status = result.status;
              return result;
            }
            if (result instanceof Request) {
              // 更新请求
              Object.defineProperty(app, '__request', { value: result });
            }
          }
        }
      })
      .onAfterHandle(async ({ request, response }: { request: Request; response: unknown }) => {
        const plugins = pluginRegistry.getEnabledPlugins();
        for (const plugin of plugins) {
          if (plugin.afterRequest) {
            await plugin.afterRequest(request, response as Response);
          }
        }
      });
}