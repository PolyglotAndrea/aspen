/**
 * 超管后台布局
 * 平台级管理界面，无 TenantSwitcher
 */

import { useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Store,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import SuperOverview from '../pages/super/overview';
import SuperTenants from '../pages/super/tenants';

const superMenuItems = [
  { key: '/super/overview', icon: LayoutDashboard, label: '平台概览' },
  { key: '/super/tenants', icon: Store, label: '租户管理' },
];

export default function SuperLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { admin, logout } = useAuth();

  const currentPage = superMenuItems.find(m => m.key === location.pathname);

  return (
    <div className="flex h-screen bg-[#0A0A0A] text-zinc-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className={`flex flex-col border-r border-zinc-800/60 bg-[#0A0A0A]/95 backdrop-blur-xl relative transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'}`}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-center border-b border-zinc-800/60 shrink-0">
          {collapsed ? (
            <div className="w-8 h-8 bg-amber-500 text-zinc-900 rounded-lg flex items-center justify-center font-bold text-sm">S</div>
          ) : (
            <div className="flex items-center gap-3 px-6 w-full">
              <div className="w-8 h-8 bg-amber-500 text-zinc-900 rounded-lg flex items-center justify-center font-bold text-sm shadow-md">S</div>
              <div>
                <span className="text-lg font-semibold tracking-wider text-zinc-100">ASPEN</span>
                <span className="block text-xs text-amber-400 -mt-0.5">平台管理</span>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1">
          {superMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.key;
            return (
              <div
                key={item.key}
                onClick={() => navigate(item.key)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 group ${
                  isActive
                    ? 'bg-zinc-800/80 text-zinc-50 shadow-sm border border-zinc-700/50'
                    : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200'
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-amber-400' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
                {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-zinc-800/60 shrink-0 space-y-1">
          {!collapsed && admin && (
            <div className="px-3 py-2 text-xs text-zinc-500 truncate">{admin.displayName || admin.username}</div>
          )}
          <div onClick={logout} className="flex items-center justify-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-zinc-400 hover:bg-zinc-800/50 hover:text-red-400 transition-colors">
            <LogOut className="w-5 h-5" />
            {!collapsed && <span className="text-sm font-medium">退出登录</span>}
          </div>
          <div onClick={() => setCollapsed(!collapsed)} className="flex items-center justify-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 transition-colors">
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <><ChevronLeft className="w-5 h-5" /><span className="text-sm font-medium">收起侧栏</span></>}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0A0A0A]">
        <header className="h-16 shrink-0 bg-[#0A0A0A]/80 backdrop-blur-md border-b border-zinc-800/60 px-8 flex items-center justify-between sticky top-0 z-10">
          <h1 className="text-xl font-semibold text-zinc-100 tracking-tight">{currentPage?.label || '平台管理'}</h1>
          <div className="flex items-center gap-4">
            {admin && <span className="text-sm text-zinc-400">{admin.displayName || admin.username}</span>}
            <div className="flex items-center gap-2 text-sm text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              超级管理员
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-8 custom-scrollbar">
          <div className="max-w-[1200px] mx-auto">
            <Routes>
              <Route path="/overview" element={<SuperOverview />} />
              <Route path="/tenants" element={<SuperTenants />} />
              <Route path="*" element={<Navigate to="/super/overview" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}
