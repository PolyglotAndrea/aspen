/**
 * 示例插件 (Example Plugins)
 *
 * 提供两个内置示例插件，展示插件系统的使用方式
 */

import type { Plugin } from './index';

/**
 * 请求日志插件
 * 记录所有请求的基本信息
 */
export const requestLoggingPlugin: Plugin = {
  name: 'request-logging',
  beforeRequest(request) {
    console.log(`[Request] ${request.method} ${request.url} - ${new Date().toISOString()}`);
  },
  afterRequest(_request, response) {
    console.log(`[Response] Status: ${response.status}`);
  },
};

/**
 * 租户指标插件
 * 在租户切换时记录指标
 */
export const tenantMetricsPlugin: Plugin = {
  name: 'tenant-metrics',
  onStart() {
    console.log('[TenantMetrics] Plugin started - monitoring tenant activity');
  },
  onTenantChange(tenantId: string) {
    console.log(`[TenantMetrics] Tenant switched to: ${tenantId}`);
  },
};