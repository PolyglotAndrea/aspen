/**
 * 模块开关组件
 * 用于控制租户的功能模块启用/禁用
 */

import { Switch, Thumb } from '@radix-ui/react-switch';
import { CalendarDays, UtensilsCrossed, Users, MessageSquare, Package, ShoppingBag, Store } from 'lucide-react';

interface TenantFeatures {
  booking: boolean;
  menu: boolean;
  member: boolean;
  comments: boolean;
  delivery: boolean;
  product: boolean;
  stores: boolean;
}

interface FeatureSwitchesProps {
  features: TenantFeatures;
  onChange: (features: TenantFeatures) => void;
}

const featureConfig = [
  { key: 'booking' as const, label: '预约管理', desc: '餐厅预订与选座功能', icon: CalendarDays, color: 'bg-emerald-500/20 text-emerald-500' },
  { key: 'menu' as const, label: '堂食菜单', desc: '堂食菜品浏览与点餐', icon: UtensilsCrossed, color: 'bg-orange-500/20 text-orange-500' },
  { key: 'member' as const, label: '会员系统', desc: '会员等级、积分与权益', icon: Users, color: 'bg-blue-500/20 text-blue-500' },
  { key: 'comments' as const, label: '评论功能', desc: '用户评价与反馈', icon: MessageSquare, color: 'bg-purple-500/20 text-purple-500' },
  { key: 'delivery' as const, label: '外卖系统', desc: '在线下单与配送管理', icon: Package, color: 'bg-orange-500/20 text-orange-500' },
  { key: 'product' as const, label: '周边商品', desc: '周边商品与代金券', icon: ShoppingBag, color: 'bg-pink-500/20 text-pink-500' },
  { key: 'stores' as const, label: '多门店管理', desc: '多门店运营与管理', icon: Store, color: 'bg-cyan-500/20 text-cyan-500' },
];

export function FeatureSwitches({ features, onChange }: FeatureSwitchesProps) {
  const toggleFeature = (key: keyof TenantFeatures) => {
    onChange({ ...features, [key]: !features[key] });
  };

  return (
    <div className="space-y-3">
      {featureConfig.map(({ key, label, desc, icon: Icon, color }) => (
        <div key={key} className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-white font-medium text-sm">{label}</h3>
                <p className="text-xs text-zinc-500">{desc}</p>
              </div>
            </div>
            <Switch
              checked={features[key]}
              onCheckedChange={() => toggleFeature(key)}
              className="w-11 h-6 bg-zinc-700 rounded-full relative data-[state=checked]:bg-emerald-600 transition-colors"
            >
              <Thumb className="block w-5 h-5 bg-white rounded-full transition-transform translate-x-0.5 data-[state=checked]:translate-x-[22px]" />
            </Switch>
          </div>
        </div>
      ))}
    </div>
  );
}

export default FeatureSwitches;
