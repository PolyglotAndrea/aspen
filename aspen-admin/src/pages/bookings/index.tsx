/**
 * 预约管理页面
 * 展示预约列表，支持状态筛选、确认/取消操作
 * 展示门店的新增字段：评分、配送范围、起送价等
 */

import { useState, useEffect } from 'react';
import {
  CalendarDays,
  Users,
  Phone,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  MapPin,
} from 'lucide-react';
import { bookingApi } from '../../lib/api';

interface Booking {
  id: string;
  name: string;
  phone: string;
  date: string;
  time?: string;
  guests: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
  storeId?: string;
  storeName?: string;
  remarks?: string;
  type: 'booking';
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadBookings();
  }, [statusFilter]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const params = statusFilter !== 'all' ? { status: statusFilter } : undefined;
      const data = await bookingApi.list(params) as any;
      setBookings(data.bookings || []);
    } catch (e) {
      console.error('Failed to load bookings:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (id: string) => {
    try {
      await bookingApi.confirm(id);
      loadBookings();
    } catch (e: any) {
      alert('确认失败: ' + e.message);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await bookingApi.cancel(id);
      loadBookings();
    } catch (e: any) {
      alert('取消失败: ' + e.message);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400">
            <CheckCircle className="w-3 h-3" /> 已确认
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-red-500/20 text-red-400">
            <XCircle className="w-3 h-3" /> 已取消
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-yellow-500/20 text-yellow-400">
            <AlertCircle className="w-3 h-3" /> 待确认
          </span>
        );
    }
  };

  return (
    <div>
      {/* 顶部栏 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-light text-white mb-1">预约管理</h2>
          <p className="text-sm text-zinc-400">管理客户预约记录</p>
        </div>
        <button
          onClick={loadBookings}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          刷新
        </button>
      </div>

      {/* 筛选 */}
      <div className="flex gap-2 mb-6">
        {['all', 'pending', 'confirmed', 'cancelled'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              statusFilter === status
                ? 'bg-emerald-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            {status === 'all' ? '全部' : status === 'pending' ? '待确认' : status === 'confirmed' ? '已确认' : '已取消'}
          </button>
        ))}
      </div>

      {/* 列表 */}
      {loading ? (
        <div className="text-center py-12 text-zinc-500">加载中...</div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-12 text-zinc-500">暂无预约记录</div>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-white font-medium">
                    {booking.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-white font-medium">{booking.name}</div>
                    <div className="flex items-center gap-2 text-zinc-500 text-sm">
                      <Phone className="w-3 h-3" />
                      {booking.phone}
                    </div>
                  </div>
                </div>
                {getStatusBadge(booking.status)}
              </div>

              <div className="flex items-center gap-6 text-sm text-zinc-400 mb-3">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4" />
                  {booking.date} {booking.time}
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  {booking.guests} 人
                </div>
                {booking.storeName && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{booking.storeName}</span>
                  </div>
                )}
              </div>

              {booking.remarks && (
                <p className="text-xs text-zinc-500 mb-3">备注: {booking.remarks}</p>
              )}

              <div className="flex gap-2">
                {booking.status === 'pending' && (
                  <button
                    onClick={() => handleConfirm(booking.id)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600/20 text-emerald-400 rounded-lg hover:bg-emerald-600/30 text-sm"
                  >
                    <CheckCircle className="w-3 h-3" /> 确认
                  </button>
                )}
                {booking.status === 'pending' && (
                  <button
                    onClick={() => handleCancel(booking.id)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 text-sm"
                  >
                    <XCircle className="w-3 h-3" /> 取消
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}