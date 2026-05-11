/**
 * 超管平台概览
 */

import { useState, useEffect } from 'react';
import { Store, Users, RefreshCw } from 'lucide-react';

interface TenantSummary {
  id: string;
  brandName: string;
  brandNameEn: string;
  status: string;
  features: Record<string, boolean>;
}

interface PlatformStats {
  tenantCount: number;
  adminCount: number;
  tenants: TenantSummary[];
}

export default function SuperOverview() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:3000'}/api/v1/admin/stats`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load stats');
      setStats(await res.json());
    } catch (e) {
      console.error('Failed to load stats:', e);
    } finally {
      setLoading(false);
    }
  };

  const enterTenant = (tenantId: string) => {
    localStorage.setItem('current_tenant_id', tenantId);
    window.location.href = '/';
  };

  const enabledFeatures = (features: Record<string, boolean>) =>
    Object.entries(features).filter(([_, v]) => v).map(([k]) => k);

  const featureLabel: Record<string, string> = {
    booking: '预约', menu: '菜单', member: '会员', comments: '评论',
    delivery: '外卖', product: '商品', stores: '门店',
  };

  if (loading) {
    return <div className="text-center py-12 text-zinc-500">加载中...</div>;
  }

  if (!stats) {
    return <div className="text-center py-12 text-zinc-500">加载失败</div>;
  }

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-6 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-500/20 rounded-xl">
              <Store className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="text-3xl font-bold text-zinc-100">{stats.tenantCount}</div>
              <div className="text-sm text-zinc-400">活跃租户</div>
            </div>
          </div>
        </div>
        <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-6 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/20 rounded-xl">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <div className="text-3xl font-bold text-zinc-100">{stats.adminCount}</div>
              <div className="text-sm text-zinc-400">管理员账号</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tenant Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-zinc-100">租户列表</h2>
          <button onClick={loadStats} className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors text-sm">
            <RefreshCw className="w-4 h-4" /> 刷新
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stats.tenants.map(tenant => (
            <div key={tenant.id} className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-5 hover:border-zinc-700 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-white font-medium">{tenant.brandName}</div>
                  <div className="text-xs text-zinc-500">{tenant.brandNameEn} · {tenant.id}</div>
                </div>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">{tenant.status}</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {enabledFeatures(tenant.features).map(f => (
                  <span key={f} className="px-2 py-0.5 bg-zinc-800 text-zinc-400 text-xs rounded-full">
                    {featureLabel[f] || f}
                  </span>
                ))}
              </div>
              <button
                onClick={() => enterTenant(tenant.id)}
                className="w-full py-2 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors text-sm"
              >
                进入管理后台
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
