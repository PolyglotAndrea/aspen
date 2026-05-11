import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import {
  CalendarDays,
  UtensilsCrossed,
  Settings,
  Store,
  Users,
  ShoppingCart,
  Package,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  LogOut,
} from 'lucide-react';
import TenantSwitcher from './components/TenantSwitcher';
import { apiFetch } from './lib/api';
import { AuthProvider, useAuth } from './lib/auth';

// 页面组件
import BookingsPage from './pages/bookings';
import MenuPage from './pages/menu';
import SettingsPage from './pages/settings';
import BrandPage from './pages/brand';
import OrdersPage from './pages/orders';
import MembersPage from './pages/members';
import StoresPage from './pages/stores';
import DeliveryPage from './pages/delivery';
import ProductsPage from './pages/products';
import PaymentsPage from './pages/payments';
import LoginPage from './pages/login';

// 超管后台
import SuperLayout from './layouts/SuperLayout';

// 菜单配置接口
interface MenuItemConfig {
  key: string;
  icon: any;
  label: string;
  feature?: string; // 功能开关名称
}

// 动态菜单配置
const allMenuItems: MenuItemConfig[] = [
  { key: '/bookings', icon: CalendarDays, label: '预约管理', feature: 'booking' },
  { key: '/stores', icon: Store, label: '门店管理', feature: 'stores' },
  { key: '/orders', icon: ShoppingCart, label: '订单管理', feature: undefined },
  { key: '/payments', icon: CreditCard, label: '支付管理', feature: undefined },
  { key: '/menu', icon: UtensilsCrossed, label: '菜单管理', feature: 'menu' },
  { key: '/delivery', icon: Package, label: '外卖菜单', feature: 'delivery' },
  { key: '/products', icon: Package, label: '周边商品', feature: 'product' },
  { key: '/members', icon: Users, label: '会员管理', feature: 'member' },
  { key: '/brand', icon: LayoutDashboard, label: '品牌管理', feature: undefined },
  { key: '/settings', icon: Settings, label: '租户配置', feature: undefined },
];

// 租户功能开关类型
interface TenantFeatures {
  booking: boolean;
  menu: boolean;
  member: boolean;
  comments: boolean;
  delivery: boolean;
  product: boolean;
  stores: boolean;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function ProtectedRoute({ children, requiredRole }: { children: React.ReactNode; requiredRole?: 'admin' | 'super_admin' }) {
  const { isAuthenticated, isSuperAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0A0A0A]">
        <div className="w-8 h-8 border-2 border-zinc-600 border-t-zinc-200 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // super_admin 可以访问所有路由
  if (requiredRole === 'super_admin' && !isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AppContent() {
  const { isAuthenticated, isSuperAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0A0A0A]">
        <div className="w-8 h-8 border-2 border-zinc-600 border-t-zinc-200 rounded-full animate-spin"></div>
      </div>
    );
  }

  // 未登录 → 登录页
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // 超管后台路由
  if (isSuperAdmin) {
    return (
      <Routes>
        <Route path="/super/*" element={<ProtectedRoute requiredRole="super_admin"><SuperLayout /></ProtectedRoute>} />
        {/* 超管也可以访问租户后台（进入管理时） */}
        <Route path="/*" element={<ProtectedRoute><TenantLayout /></ProtectedRoute>} />
      </Routes>
    );
  }

  // 租户管理员后台路由
  return (
    <Routes>
      <Route path="/super/*" element={<Navigate to="/" replace />} />
      <Route path="/*" element={<ProtectedRoute><TenantLayout /></ProtectedRoute>} />
    </Routes>
  );
}

/**
 * 租户后台布局（原 AppContent 的侧栏+内容区域）
 */
function TenantLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItemConfig[]>(allMenuItems);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { admin, logout, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    const loadMenuItems = async () => {
      try {
        const tenantId = localStorage.getItem('current_tenant_id') || 'aspen';
        const tenantData = await apiFetch(`/tenants/${tenantId}`);

        const features: TenantFeatures = (tenantData as any).features || {
          booking: true,
          menu: true,
          member: true,
          comments: true,
          delivery: false,
          product: false,
          stores: false,
        };

        const filteredItems = allMenuItems.filter(item => {
          if (!item.feature) return true;
          return features[item.feature as keyof TenantFeatures] === true;
        });

        setMenuItems(filteredItems);
      } catch (error) {
        console.error('Failed to load menu items:', error);
        setMenuItems(allMenuItems);
      } finally {
        setLoading(false);
      }
    };

    loadMenuItems();
  }, [isAuthenticated]);

  const getPageTitle = () => {
    const currentMenu = menuItems.find(m => m.key === location.pathname);
    return currentMenu?.label || 'Overview';
  };

  return (
    <div className="flex h-screen bg-[#0A0A0A] text-zinc-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside
        className={`flex flex-col border-r border-zinc-800/60 bg-[#0A0A0A]/95 backdrop-blur-xl relative transition-all duration-300 ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Logo Section */}
        <div className="h-16 flex items-center justify-center border-b border-zinc-800/60 shrink-0">
          {collapsed ? (
            <div className="w-8 h-8 bg-zinc-100 text-zinc-900 rounded-lg flex items-center justify-center font-bold text-sm">
              A
            </div>
          ) : (
            <div className="flex items-center gap-3 px-6 w-full">
              <div className="w-8 h-8 bg-zinc-100 text-zinc-900 rounded-lg flex items-center justify-center font-bold text-sm shadow-md">
                A
              </div>
              <span className="text-lg font-semibold tracking-wider text-zinc-100">ASPEN</span>
            </div>
          )}
        </div>

        {/* Tenant Switcher */}
        <div className={`p-4 ${collapsed ? 'hidden' : 'block'}`}>
          <div className="text-xs font-medium text-zinc-500 mb-2 uppercase tracking-wider">Workspace</div>
          <TenantSwitcher />
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1 custom-scrollbar">
          {!loading ? (
            menuItems.map((item) => {
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
                  <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-zinc-100' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
                  {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                </div>
              );
            })
          ) : (
            <div className="px-4 py-8 flex justify-center">
              <div className="w-5 h-5 border-2 border-zinc-600 border-t-zinc-300 rounded-full animate-spin"></div>
            </div>
          )}
        </div>

        {/* Footer Toggle + Logout */}
        <div className="p-3 border-t border-zinc-800/60 shrink-0 space-y-1">
          {!collapsed && admin && (
            <div className="px-3 py-2 text-xs text-zinc-500 truncate">
              {admin.displayName || admin.username}
            </div>
          )}
          <div
            onClick={logout}
            className="flex items-center justify-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-zinc-400 hover:bg-zinc-800/50 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            {!collapsed && <span className="text-sm font-medium">退出登录</span>}
          </div>
          <div
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center justify-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <>
                <ChevronLeft className="w-5 h-5" />
                <span className="text-sm font-medium">收起侧栏</span>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0A0A0A]">
        {/* Header */}
        <header className="h-16 shrink-0 bg-[#0A0A0A]/80 backdrop-blur-md border-b border-zinc-800/60 px-8 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-zinc-100 tracking-tight">
              {getPageTitle()}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {admin && (
              <span className="text-sm text-zinc-400">{admin.displayName || admin.username}</span>
            )}
            <div className="flex items-center gap-2 text-sm text-zinc-400 bg-zinc-900/50 px-3 py-1.5 rounded-full border border-zinc-800/50">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Admin Portal
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-8 custom-scrollbar">
          <div className="max-w-[1200px] mx-auto">
            <Routes>
              <Route path="/bookings" element={<BookingsPage />} />
              <Route path="/menu" element={<MenuPage />} />
              <Route path="/brand" element={<BrandPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/stores" element={<StoresPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/payments" element={<PaymentsPage />} />
              <Route path="/delivery" element={<DeliveryPage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/members" element={<MembersPage />} />
              <Route path="/" element={<BookingsPage />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}
