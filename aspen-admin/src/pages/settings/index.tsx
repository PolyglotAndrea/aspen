/**
 * 租户配置页面
 * 用于配置租户的视觉风格和功能开关
 */

import { useState, useEffect } from 'react';
import { Save, Palette, Settings, Rocket, MessageSquare } from 'lucide-react';
import { brandApi, bookingApi } from '../lib/api';
import TenantSwitcher from '../components/TenantSwitcher';
import FeatureSwitches from '../components/FeatureSwitches';

interface TenantConfig {
  theme: {
    primary: string;
    primaryLight: string;
    primaryDark: string;
    accent: string;
  };
  booking: {
    mode: 'RULES' | 'SEATING';
    enabled: boolean;
    rules: string[];
    seatTypes: any[];
  };
  bookingConfig: {
    maxGuests: number;
    minAdvanceHours: number;
    maxAdvanceDays: number;
    autoConfirm: boolean;
    requireDeposit?: boolean;
    depositAmount?: number;
    timeLimit?: number;
  };
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<TenantConfig | null>(null);
  const [brandInfo, setBrandInfo] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'theme' | 'booking' | 'features'>('theme');

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const [brandData, bookingConfig] = await Promise.all([
        brandApi.get(),
        bookingApi.getConfig(),
      ]);
      setBrandInfo(brandData);
      setConfig({
        theme: brandData.theme,
        booking: bookingConfig.booking,
        bookingConfig: bookingConfig.bookingConfig,
      });
    } catch (e) {
      console.error('Failed to load config:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTheme = async () => {
    if (!brandInfo) return;
    setSaving(true);
    try {
      await brandApi.update({
        theme: config?.theme,
      });
      alert('主题配置已保存');
    } catch (e: any) {
      alert('保存失败: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveFeatures = async () => {
    setSaving(true);
    try {
      // 通过租户管理 API 更新配置
      const { tenantApi } = await import('../lib/api');
      const tenantId = localStorage.getItem('current_tenant_id') || 'aspen';
      await tenantApi.update(tenantId, {
        booking: config?.booking,
        bookingConfig: config?.bookingConfig,
      });
      alert('功能配置已保存');
    } catch (e: any) {
      alert('保存失败: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !config) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-zinc-500">加载中...</div>
      </div>
    );
  }

  return (
    <div>
      {/* 顶部栏 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-light text-white">租户配置</h2>
          <p className="text-sm text-zinc-500">管理 {brandInfo?.brandName || '当前租户'} 的配置</p>
        </div>
        <TenantSwitcher />
      </div>

      {/* Tab 切换 */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('theme')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'theme'
              ? 'bg-emerald-600 text-white'
              : 'bg-zinc-800 text-zinc-400 hover:text-white'
          }`}
        >
          <Palette className="w-4 h-4" />
          视觉配置
        </button>
        <button
          onClick={() => setActiveTab('booking')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'booking'
              ? 'bg-emerald-600 text-white'
              : 'bg-zinc-800 text-zinc-400 hover:text-white'
          }`}
        >
          <Settings className="w-4 h-4" />
          预约规则
        </button>
        <button
          onClick={() => setActiveTab('features')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'features'
              ? 'bg-emerald-600 text-white'
              : 'bg-zinc-800 text-zinc-400 hover:text-white'
          }`}
        >
          <Rocket className="w-4 h-4" />
          功能开关
        </button>
      </div>

      {/* 视觉配置 */}
      {activeTab === 'theme' && (
        <div className="space-y-6">
          <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800">
            <h3 className="text-white font-medium mb-4">主题颜色</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-zinc-500">主色调</label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="color"
                    value={config.theme.primary}
                    onChange={(e) => setConfig({ ...config, theme: { ...config.theme, primary: e.target.value } })}
                    className="w-10 h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={config.theme.primary}
                    onChange={(e) => setConfig({ ...config, theme: { ...config.theme, primary: e.target.value } })}
                    className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-zinc-500">浅色</label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="color"
                    value={config.theme.primaryLight}
                    onChange={(e) => setConfig({ ...config, theme: { ...config.theme, primaryLight: e.target.value } })}
                    className="w-10 h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={config.theme.primaryLight}
                    onChange={(e) => setConfig({ ...config, theme: { ...config.theme, primaryLight: e.target.value } })}
                    className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-zinc-500">深色</label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="color"
                    value={config.theme.primaryDark}
                    onChange={(e) => setConfig({ ...config, theme: { ...config.theme, primaryDark: e.target.value } })}
                    className="w-10 h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={config.theme.primaryDark}
                    onChange={(e) => setConfig({ ...config, theme: { ...config.theme, primaryDark: e.target.value } })}
                    className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 预览 */}
          <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800">
            <h3 className="text-white font-medium mb-4">预览效果</h3>
            <div className="flex items-center gap-4">
              <button
                className="px-6 py-3 rounded-full text-white font-medium transition-colors"
                style={{ backgroundColor: config.theme.primary }}
              >
                按钮预览
              </button>
              <div className="flex-1 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ backgroundColor: config.theme.primary }}
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleSaveTheme}
            disabled={saving}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
          >
            {saving ? '保存中...' : '保存主题配置'}
          </button>
        </div>
      )}

      {/* 预约规则 */}
      {activeTab === 'booking' && (
        <div className="space-y-6">
          <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800">
            <h3 className="text-white font-medium mb-4">预约规则说明</h3>
            <textarea
              value={config.booking.rules.join('\n')}
              onChange={(e) =>
                setConfig({
                  ...config,
                  booking: { ...config.booking, rules: e.target.value.split('\n').filter(Boolean) },
                })
              }
              className="w-full h-40 px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm resize-none"
              placeholder="每行一条规则..."
            />
            <p className="text-xs text-zinc-500 mt-2">每行一条规则，用户可在小程序中查看</p>
          </div>

          <button
            onClick={handleSaveFeatures}
            disabled={saving}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
          >
            {saving ? '保存中...' : '保存预约规则'}
          </button>
        </div>
      )}

      {/* 功能开关 */}
      {activeTab === 'features' && (
        <FeatureSwitches
          config={config}
          onChange={(updates) => setConfig({ ...config, ...updates })}
          onSave={handleSaveFeatures}
        />
      )}
    </div>
  );
}
