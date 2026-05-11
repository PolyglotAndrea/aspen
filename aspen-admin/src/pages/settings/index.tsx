/**
 * 租户配置页面
 * 用于配置租户的视觉风格和功能开关
 */

import { useState, useEffect } from 'react';
import { Palette, Settings as SettingsIcon, Rocket, Save } from 'lucide-react';
import { brandApi, bookingApi, tenantApi } from '../../lib/api';
import TenantSwitcher from '../../components/TenantSwitcher';
import FeatureSwitches from '../../components/FeatureSwitches';

interface TenantFeatures {
  booking: boolean;
  menu: boolean;
  member: boolean;
  comments: boolean;
  delivery: boolean;
  product: boolean;
  stores: boolean;
}

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
  const [currentFeatures, setCurrentFeatures] = useState<TenantFeatures>({
    booking: true, menu: true, member: true, comments: true,
    delivery: false, product: false, stores: false,
  });
  const [activeTab, setActiveTab] = useState<'theme' | 'booking' | 'features'>('theme');

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const tenantId = localStorage.getItem('current_tenant_id') || 'aspen';
      const [brandData, bookingConfig, tenantData] = await Promise.all([
        brandApi.get(),
        bookingApi.getConfig(),
        tenantApi.get(tenantId),
      ]);
      setBrandInfo(brandData);
      setConfig({
        theme: brandData.theme,
        booking: {
          mode: bookingConfig.mode || 'RULES',
          enabled: bookingConfig.enabled ?? true,
          rules: bookingConfig.rules || [],
          seatTypes: bookingConfig.seatTypes || [],
        },
        bookingConfig: bookingConfig.bookingConfig || {
          maxGuests: 10,
          minAdvanceHours: 1,
          maxAdvanceDays: 30,
          autoConfirm: false,
        },
      });
      if (tenantData.features) {
        setCurrentFeatures(tenantData.features);
      }
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
      const tenantId = localStorage.getItem('current_tenant_id') || 'aspen';
      await tenantApi.update(tenantId, { features: currentFeatures });
      alert('模块配置已保存，页面将刷新以应用变更');
      window.location.reload();
    } catch (e: any) {
      alert('保存失败: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !config) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-2 border-zinc-600 border-t-zinc-200 rounded-full animate-spin mb-4"></div>
        <div className="text-zinc-500 font-medium">加载配置中...</div>
      </div>
    );
  }

  const tabs = [
    { id: 'theme', label: '视觉与主题', icon: Palette, desc: '自定义品牌颜色与 UI 风格' },
    { id: 'booking', label: '预约设置', icon: SettingsIcon, desc: '配置订座规则与限制' },
    { id: 'features', label: '模块开关', icon: Rocket, desc: '启用或禁用系统功能' },
  ] as const;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/40 p-6 rounded-2xl border border-zinc-800/60 shadow-sm backdrop-blur-xl">
        <div>
          <h2 className="text-2xl font-semibold text-zinc-100 tracking-tight">租户配置</h2>
          <p className="text-sm text-zinc-400 mt-1">管理 <span className="text-zinc-200 font-medium">{brandInfo?.brandName || '当前租户'}</span> 的全局设置与功能开关。</p>
        </div>
        <div className="flex items-center gap-4">
          <TenantSwitcher />
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 shrink-0 space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-start gap-3 p-4 rounded-xl text-left transition-all ${
                  isActive
                    ? 'bg-zinc-800/80 border border-zinc-700 shadow-sm'
                    : 'bg-transparent border border-transparent hover:bg-zinc-800/40 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <div className={`p-2 rounded-lg ${isActive ? 'bg-zinc-700/50 text-zinc-100' : 'bg-zinc-800/50 text-zinc-400'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className={`font-medium text-sm ${isActive ? 'text-zinc-100' : ''}`}>{tab.label}</div>
                  <div className="text-xs mt-1 opacity-70 line-clamp-1">{tab.desc}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl overflow-hidden shadow-sm backdrop-blur-xl h-full">
            
            {/* Theme Settings */}
            {activeTab === 'theme' && (
              <div className="flex flex-col h-full">
                <div className="px-6 py-5 border-b border-zinc-800/60 bg-zinc-900/20">
                  <h3 className="text-lg font-semibold text-zinc-100">视觉配置</h3>
                  <p className="text-sm text-zinc-400 mt-1">定制小程序的品牌颜色与视觉效果。</p>
                </div>
                
                <div className="p-6 space-y-8 flex-1">
                  <div>
                    <h4 className="text-sm font-medium text-zinc-300 mb-4 flex items-center gap-2">
                      <Palette className="w-4 h-4 text-zinc-500" />
                      品牌色彩
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                      {[
                        { key: 'primary', label: '主色调 (Primary)' },
                        { key: 'primaryLight', label: '浅色 (Light)' },
                        { key: 'primaryDark', label: '深色 (Dark)' },
                        { key: 'accent', label: '强调色 (Accent)' },
                      ].map((colorItem) => (
                        <div key={colorItem.key} className="p-4 bg-zinc-950/30 rounded-xl border border-zinc-800/60">
                          <label className="block text-xs font-medium text-zinc-400 mb-3">{colorItem.label}</label>
                          <div className="flex items-center gap-3">
                            <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-zinc-700 shrink-0 shadow-inner">
                              <input
                                type="color"
                                value={(config.theme as any)[colorItem.key] || '#000000'}
                                onChange={(e) => setConfig({ ...config, theme: { ...config.theme, [colorItem.key]: e.target.value } })}
                                className="absolute -inset-2 w-14 h-14 cursor-pointer"
                              />
                            </div>
                            <input
                              type="text"
                              value={(config.theme as any)[colorItem.key] || '#000000'}
                              onChange={(e) => setConfig({ ...config, theme: { ...config.theme, [colorItem.key]: e.target.value } })}
                              className="flex-1 w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-zinc-600 transition-all uppercase"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-zinc-800/60">
                    <h4 className="text-sm font-medium text-zinc-300 mb-4">预览效果</h4>
                    <div className="flex flex-wrap items-center gap-6 p-6 bg-zinc-950/50 rounded-xl border border-zinc-800/60">
                      <button
                        className="px-6 py-2.5 rounded-full text-white font-medium transition-transform hover:scale-105 shadow-lg"
                        style={{ backgroundColor: config.theme.primary }}
                      >
                        主要按钮
                      </button>
                      <button
                        className="px-6 py-2.5 rounded-full text-white font-medium transition-transform hover:scale-105 shadow-lg"
                        style={{ backgroundColor: config.theme.accent || config.theme.primary }}
                      >
                        强调按钮
                      </button>
                      <div className="flex-1 min-w-[200px] h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full w-2/3"
                          style={{ backgroundColor: config.theme.primaryLight || config.theme.primary }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 border-t border-zinc-800/60 bg-zinc-900/40 flex justify-end">
                  <button
                    onClick={handleSaveTheme}
                    disabled={saving}
                    className="px-6 py-2.5 bg-zinc-100 text-zinc-900 font-medium rounded-xl hover:bg-white transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? '保存中...' : '保存视觉配置'}
                  </button>
                </div>
              </div>
            )}

            {/* Booking Rules */}
            {activeTab === 'booking' && (
              <div className="flex flex-col h-full">
                <div className="px-6 py-5 border-b border-zinc-800/60 bg-zinc-900/20">
                  <h3 className="text-lg font-semibold text-zinc-100">预约规则说明</h3>
                  <p className="text-sm text-zinc-400 mt-1">设置客户在小程序进行订座时的须知和条款。</p>
                </div>
                
                <div className="p-6 flex-1">
                  <div className="bg-zinc-950/30 rounded-xl border border-zinc-800/60 p-4 h-full min-h-[300px]">
                    <textarea
                      value={config.booking.rules.join('\n')}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          booking: { ...config.booking, rules: e.target.value.split('\n').filter(Boolean) },
                        })
                      }
                      className="w-full h-full min-h-[250px] bg-transparent text-zinc-300 text-sm leading-loose focus:outline-none resize-none placeholder:text-zinc-600"
                      placeholder="每行输入一条规则条款..."
                    />
                  </div>
                  <p className="text-xs text-zinc-500 mt-3 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-600"></span>
                    每行将作为独立的一条规则在小程序端展示。
                  </p>
                </div>

                <div className="px-6 py-4 border-t border-zinc-800/60 bg-zinc-900/40 flex justify-end">
                  <button
                    onClick={handleSaveFeatures}
                    disabled={saving}
                    className="px-6 py-2.5 bg-zinc-100 text-zinc-900 font-medium rounded-xl hover:bg-white transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? '保存中...' : '保存预约规则'}
                  </button>
                </div>
              </div>
            )}

            {/* Features (Imported Component) */}
            {activeTab === 'features' && (
              <div className="flex flex-col h-full">
                <div className="px-6 py-5 border-b border-zinc-800/60 bg-zinc-900/20">
                  <h3 className="text-lg font-semibold text-zinc-100">模块开关</h3>
                  <p className="text-sm text-zinc-400 mt-1">按需启用或禁用系统的各项业务模块。</p>
                </div>
                <div className="p-6 flex-1">
                  <div className="bg-zinc-950/30 rounded-xl border border-zinc-800/60 p-6">
                    <FeatureSwitches
                      features={currentFeatures}
                      onChange={setCurrentFeatures}
                    />
                  </div>
                </div>
                <div className="px-6 py-4 border-t border-zinc-800/60 bg-zinc-900/40 flex justify-end">
                  <button
                    onClick={handleSaveFeatures}
                    disabled={saving}
                    className="px-6 py-2.5 bg-zinc-100 text-zinc-900 font-medium rounded-xl hover:bg-white transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? '保存中...' : '应用模块变更'}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
