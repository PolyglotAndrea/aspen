/**
 * 超管租户管理
 */

import { useState, useEffect } from 'react';
import { RefreshCw, Eye } from 'lucide-react';
import Modal from '../../../components/Modal';

interface TenantData {
  id: string;
  brandName: string;
  brandNameEn: string;
  status: string;
  theme: Record<string, string>;
  features: Record<string, boolean>;
}

const featureLabel: Record<string, string> = {
  booking: '预约', menu: '菜单', member: '会员', comments: '评论',
  delivery: '外卖', product: '商品', stores: '门店',
};

export default function SuperTenants() {
  const [tenants, setTenants] = useState<TenantData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTenant, setSelectedTenant] = useState<TenantData | null>(null);

  useEffect(() => { loadTenants(); }, []);

  const loadTenants = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:3000'}/api/v1/admin/tenants`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load tenants');
      const data = await res.json();
      setTenants(data.tenants || []);
    } catch (e) {
      console.error('Failed to load tenants:', e);
    } finally {
      setLoading(false);
    }
  };

  const enterTenant = (tenantId: string) => {
    localStorage.setItem('current_tenant_id', tenantId);
    window.location.href = '/';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-light text-white mb-1">租户管理</h2>
          <p className="text-sm text-zinc-400">管理所有租户的配置与状态</p>
        </div>
        <button onClick={loadTenants} className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors">
          <RefreshCw className="w-4 h-4" /> 刷新
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-zinc-500">加载中...</div>
      ) : tenants.length === 0 ? (
        <div className="text-center py-12 text-zinc-500">暂无租户</div>
      ) : (
        <div className="bg-zinc-900/50 rounded-lg border border-zinc-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400">
                <th className="text-left px-4 py-3 font-medium">租户 ID</th>
                <th className="text-left px-4 py-3 font-medium">品牌名</th>
                <th className="text-left px-4 py-3 font-medium">状态</th>
                <th className="text-left px-4 py-3 font-medium">已启用模块</th>
                <th className="text-right px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map(tenant => {
                const enabled = Object.entries(tenant.features).filter(([_, v]) => v).map(([k]) => k);
                return (
                  <tr key={tenant.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                    <td className="px-4 py-3 font-mono text-zinc-300">{tenant.id}</td>
                    <td className="px-4 py-3">
                      <div className="text-white">{tenant.brandName}</div>
                      <div className="text-xs text-zinc-500">{tenant.brandNameEn}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">{tenant.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {enabled.map(f => (
                          <span key={f} className="px-1.5 py-0.5 bg-zinc-800 text-zinc-400 text-xs rounded">
                            {featureLabel[f] || f}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => setSelectedTenant(tenant)} className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors" title="查看详情">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => enterTenant(tenant.id)} className="px-3 py-1.5 bg-amber-600 text-white text-xs rounded-lg hover:bg-amber-700 transition-colors">
                          进入管理
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      {selectedTenant && (
        <Modal open onClose={() => setSelectedTenant(null)} title={`租户详情 — ${selectedTenant.brandName}`}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-zinc-400">ID:</span> <span className="text-white font-mono">{selectedTenant.id}</span></div>
              <div><span className="text-zinc-400">状态:</span> <span className="text-emerald-400">{selectedTenant.status}</span></div>
              <div><span className="text-zinc-400">品牌名:</span> <span className="text-white">{selectedTenant.brandName}</span></div>
              <div><span className="text-zinc-400">英文名:</span> <span className="text-white">{selectedTenant.brandNameEn}</span></div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-zinc-300 mb-2">主题色</h4>
              <div className="flex gap-2">
                {['primary', 'primaryLight', 'primaryDark', 'accent'].map(key => (
                  <div key={key} className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded border border-zinc-700" style={{ backgroundColor: selectedTenant.theme[key] }} />
                    <span className="text-xs text-zinc-500">{key}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-zinc-300 mb-2">功能模块</h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(selectedTenant.features).map(([key, enabled]) => (
                  <div key={key} className={`flex items-center gap-2 px-3 py-2 rounded-lg ${enabled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-800/50 text-zinc-500'}`}>
                    <span className={`w-2 h-2 rounded-full ${enabled ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
                    <span className="text-sm">{featureLabel[key] || key}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-800 flex justify-end">
              <button onClick={() => { enterTenant(selectedTenant.id); }} className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm">
                进入该租户后台
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
