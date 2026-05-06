/**
 * 租户切换器组件
 * 用于在管理后台切换当前操作的租户
 */

import { useState, useEffect } from 'react';
import { Building2, ChevronDown, Check } from 'lucide-react';
import { tenantApi, getCurrentTenantId, setCurrentTenantId } from '../lib/api';

interface Tenant {
  id: string;
  brandName: string;
  brandNameEn: string;
  status: string;
  primaryColor?: string;
}

export function TenantSwitcher() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [currentId, setCurrentId] = useState(getCurrentTenantId());
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    try {
      const data = await tenantApi.list() as any;
      setTenants(data.tenants || []);
    } catch (e) {
      console.error('Failed to load tenants:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (tenantId: string) => {
    setCurrentTenantId(tenantId);
    setCurrentId(tenantId);
    setIsOpen(false);
    // 触发页面刷新
    window.location.reload();
  };

  const currentTenant = tenants.find(t => t.id === currentId);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg hover:bg-zinc-700 transition-colors"
      >
        <Building2 className="w-4 h-4 text-zinc-400" />
        <span className="text-sm text-white">
          {loading ? '加载中...' : currentTenant?.brandName || currentId}
        </span>
        <ChevronDown className="w-4 h-4 text-zinc-400" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full mt-2 right-0 w-56 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl z-50 overflow-hidden">
            <div className="p-2 border-b border-zinc-800">
              <span className="text-xs text-zinc-500">选择租户</span>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {tenants.map((tenant) => (
                <button
                  key={tenant.id}
                  onClick={() => handleSelect(tenant.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-800 transition-colors ${
                    tenant.id === currentId ? 'bg-zinc-800' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: tenant.primaryColor || '#4a9c6d' }}
                    />
                    <span className="text-sm text-white">{tenant.brandName}</span>
                  </div>
                  {tenant.id === currentId && (
                    <Check className="w-4 h-4 text-emerald-500" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default TenantSwitcher;
