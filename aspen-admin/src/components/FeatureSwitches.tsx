/**
 * 功能开关组件
 * 用于控制租户的预约模式等功能
 */

import { Switch } from '@radix-ui/react-switch';
import { Settings, CreditCard, Users, Clock } from 'lucide-react';

interface FeatureSwitchesProps {
  config: {
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
  };
  onChange: (updates: any) => void;
  onSave: () => void;
}

export function FeatureSwitches({ config, onChange, onSave }: FeatureSwitchesProps) {
  return (
    <div className="space-y-6">
      {/* 预约模式 */}
      <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <Settings className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h3 className="text-white font-medium">预约模式</h3>
              <p className="text-xs text-zinc-500">选择用户预约的方式</p>
            </div>
          </div>
          <Switch
            checked={config.booking.mode === 'SEATING'}
            onCheckedChange={(checked) =>
              onChange({
                booking: {
                  ...config.booking,
                  mode: checked ? 'SEATING' : 'RULES',
                },
              })
            }
            className="w-11 h-6 bg-zinc-700 rounded-full relative data-[state=checked]:bg-emerald-600 transition-colors"
          >
            <Switch.Thumb className="block w-5 h-5 bg-white rounded-full transition-transform translate-x-0.5 data-[state=checked]:translate-x-[22px]" />
          </Switch>
        </div>
        <div className="flex gap-2">
          <span className={`px-3 py-1 rounded-full text-xs ${
            config.booking.mode === 'RULES' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-500'
          }`}>
            规则预约 (RULES)
          </span>
          <span className={`px-3 py-1 rounded-full text-xs ${
            config.booking.mode === 'SEATING' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-500'
          }`}>
            在线订座 (SEATING)
          </span>
        </div>
      </div>

      {/* 自动确认 */}
      <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <CreditCard className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h3 className="text-white font-medium">自动确认预约</h3>
              <p className="text-xs text-zinc-500">新预约自动标记为已确认</p>
            </div>
          </div>
          <Switch
            checked={config.bookingConfig.autoConfirm}
            onCheckedChange={(checked) =>
              onChange({
                bookingConfig: { ...config.bookingConfig, autoConfirm: checked },
              })
            }
            className="w-11 h-6 bg-zinc-700 rounded-full relative data-[state=checked]:bg-blue-600 transition-colors"
          >
            <Switch.Thumb className="block w-5 h-5 bg-white rounded-full transition-transform translate-x-0.5 data-[state=checked]:translate-x-[22px]" />
          </Switch>
        </div>
      </div>

      {/* 人数限制 */}
      <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <Users className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <h3 className="text-white font-medium">人数限制</h3>
            <p className="text-xs text-zinc-500">设置预约人数范围</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-zinc-500">最少人数</label>
            <input
              type="number"
              value={1}
              disabled
              className="w-full mt-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500">最多人数</label>
            <input
              type="number"
              value={config.bookingConfig.maxGuests}
              onChange={(e) =>
                onChange({
                  bookingConfig: { ...config.bookingConfig, maxGuests: Number(e.target.value) },
                })
              }
              className="w-full mt-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500">提前时间(小时)</label>
            <input
              type="number"
              value={config.bookingConfig.minAdvanceHours}
              onChange={(e) =>
                onChange({
                  bookingConfig: { ...config.bookingConfig, minAdvanceHours: Number(e.target.value) },
                })
              }
              className="w-full mt-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm"
            />
          </div>
        </div>
      </div>

      {/* 用餐时限 */}
      <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <Clock className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <h3 className="text-white font-medium">用餐时限</h3>
              <p className="text-xs text-zinc-500">设置用餐时间限制 (分钟)</p>
            </div>
          </div>
          <input
            type="number"
            value={config.bookingConfig.timeLimit || 0}
            onChange={(e) =>
              onChange({
                bookingConfig: { ...config.bookingConfig, timeLimit: Number(e.target.value) },
              })
            }
            className="w-24 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm text-center"
            placeholder="0 = 不限时"
          />
        </div>
      </div>

      {/* 保存按钮 */}
      <button
        onClick={onSave}
        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
      >
        保存配置
      </button>
    </div>
  );
}

export default FeatureSwitches;
