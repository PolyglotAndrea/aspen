import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Layout } from 'antd';
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
} from 'lucide-react';
import TenantSwitcher from './components/TenantSwitcher';
import { apiFetch } from './lib/api';

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

const { Sider, Content, Header } = Layout;

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
  const [collapsed, setCollapsed] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItemConfig[]>(allMenuItems);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // 根据租户功能开关动态生成菜单
  useEffect(() => {
    const loadMenuItems = async () => {
      try {
        const tenantId = localStorage.getItem('current_tenant_id') || 'aspen';
        const tenantData = await apiFetch(`/tenants/${tenantId}`);

        // 获取功能开关
        const features: TenantFeatures = (tenantData as any).features || {
          booking: true,
          menu: true,
          member: true,
          comments: true,
          delivery: false,
          product: false,
          stores: false,
        };

        // 过滤菜单项
        const filteredItems = allMenuItems.filter(item => {
          // 如果没有 feature 字段，始终显示
          if (!item.feature) return true;
          // 否则根据功能开关决定是否显示
          return features[item.feature as keyof TenantFeatures] === true;
        });

        setMenuItems(filteredItems);
      } catch (error) {
        console.error('Failed to load menu items:', error);
        // 默认显示所有菜单
        setMenuItems(allMenuItems);
      } finally {
        setLoading(false);
      }
    };

    loadMenuItems();
  }, []);

  // 获取当前页面标题
  const getPageTitle = () => {
    const currentMenu = menuItems.find(m => m.key === location.pathname);
    return currentMenu?.label || '管理后台';
  };

  return (
    <Layout className="min-h-screen bg-zinc-950">
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        className="bg-zinc-900 border-r border-zinc-800"
        width={240}
        collapsedWidth={80}
        trigger={null}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-center border-b border-zinc-800">
          {collapsed ? (
            <span className="text-xl font-light text-white">A</span>
          ) : (
            <span className="text-xl font-light text-white tracking-[8px]">ASPEN</span>
          )}
        </div>

        {/* 租户切换器 */}
        <div className="p-4 border-b border-zinc-800">
          <TenantSwitcher />
        </div>

        {/* 动态菜单 */}
        {!loading && (
          <div className="py-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.key;
              return (
                <div
                  key={item.key}
                  onClick={() => navigate(item.key)}
                  className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-lg cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-zinc-800 text-white'
                      : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {!collapsed && <span className="text-sm">{item.label}</span>}
                </div>
              );
            })}
          </div>
        )}

        {/* 加载状态 */}
        {loading && (
          <div className="py-4 px-4 text-zinc-500 text-sm">
            加载中...
          </div>
        )}

        {/* 折叠按钮 */}
        <div className="absolute bottom-4 left-0 right-0 px-2">
          <div
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center justify-center gap-3 px-4 py-3 mx-2 rounded-lg cursor-pointer text-zinc-400 hover:bg-zinc-800/50 hover:text-white transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <>
                <ChevronLeft className="w-5 h-5" />
                <span className="text-sm">收起</span>
              </>
            )}
          </div>
        </div>
      </Sider>

      <Layout>
        <Header className="bg-zinc-900 border-b border-zinc-800 px-6 flex items-center justify-between h-16">
          <div className="text-lg font-medium text-white">
            {getPageTitle()}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-400">Aspen Admin</span>
          </div>
        </Header>

        <Content className="p-6 min-h-0 overflow-auto">
          <div className="max-w-4xl mx-auto">
            <Routes>
              <Route path="/bookings" element={<BookingsPage />} />
              <Route path="/menu" element={<MenuPage />} />
              <Route path="/brand" element={<BrandPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/stores" element={<StoresPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/delivery" element={<DeliveryPage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/members" element={<MembersPage />} />
              <Route path="/" element={<BookingsPage />} />
            </Routes>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}

