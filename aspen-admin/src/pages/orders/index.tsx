import { useState, useEffect } from 'react';
import { RefreshCw, Eye } from 'lucide-react';
import { orderApi } from '../../lib/api';
import StatusBadge from '../../components/StatusBadge';
import Pagination from '../../components/Pagination';
import Modal from '../../components/Modal';

interface OrderItem {
  id: string;
  productName: string;
  price: number;
  quantity: number;
  spec?: string;
}

interface Order {
  id: string;
  orderNo: string;
  type: 'booking' | 'delivery' | 'product';
  status: string;
  memberName?: string;
  totalAmount: number;
  items: OrderItem[];
  createdAt: string;
}

const typeMap: Record<string, { label: string; color: string }> = {
  booking: { label: '预订', color: 'bg-blue-500/20 text-blue-400' },
  delivery: { label: '外卖', color: 'bg-orange-500/20 text-orange-400' },
  product: { label: '商品', color: 'bg-purple-500/20 text-purple-400' },
};

const statusOptions = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '待支付' },
  { value: 'paid', label: '已支付' },
  { value: 'confirmed', label: '已确认' },
  { value: 'preparing', label: '准备中' },
  { value: 'ready', label: '就绪' },
  { value: 'delivering', label: '配送中' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' },
  { value: 'refunded', label: '已退款' },
];

const typeOptions = [
  { value: 'all', label: '全部类型' },
  { value: 'booking', label: '预订' },
  { value: 'delivery', label: '外卖' },
  { value: 'product', label: '商品' },
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const pageSize = 20;

  useEffect(() => { loadOrders(); }, [statusFilter, typeFilter, page]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const params: any = { page, pageSize };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (typeFilter !== 'all') params.type = typeFilter;
      const data = await orderApi.list(params) as any;
      setOrders(data.orders || data.data || []);
      setTotal(data.total || 0);
    } catch (e) {
      console.error('Failed to load orders:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, action: string) => {
    try {
      if (action === 'cancel') {
        await orderApi.cancel(orderId);
      } else if (action === 'pay') {
        await orderApi.pay(orderId, 'simulate');
      } else {
        await orderApi.update(orderId, { status: action });
      }
      loadOrders();
      if (selectedOrder?.id === orderId) setSelectedOrder(null);
    } catch (e: any) {
      alert('操作失败: ' + e.message);
    }
  };

  const getActionButtons = (order: Order) => {
    const actions: { label: string; action: string; color: string }[] = [];
    switch (order.status) {
      case 'pending':
        actions.push({ label: '模拟支付', action: 'pay', color: 'bg-emerald-600 hover:bg-emerald-700' });
        actions.push({ label: '取消', action: 'cancel', color: 'bg-zinc-700 hover:bg-zinc-600' });
        break;
      case 'paid':
        actions.push({ label: '确认', action: 'confirmed', color: 'bg-blue-600 hover:bg-blue-700' });
        break;
      case 'confirmed':
        actions.push({ label: '开始准备', action: 'preparing', color: 'bg-orange-600 hover:bg-orange-700' });
        break;
      case 'preparing':
        actions.push({ label: '标记就绪', action: 'ready', color: 'bg-cyan-600 hover:bg-cyan-700' });
        break;
      case 'ready':
        if (order.type === 'delivery') {
          actions.push({ label: '开始配送', action: 'delivering', color: 'bg-purple-600 hover:bg-purple-700' });
        } else {
          actions.push({ label: '完成', action: 'completed', color: 'bg-emerald-600 hover:bg-emerald-700' });
        }
        break;
      case 'delivering':
        actions.push({ label: '完成', action: 'completed', color: 'bg-emerald-600 hover:bg-emerald-700' });
        break;
    }
    return actions;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-light text-white mb-1">订单管理</h2>
          <p className="text-sm text-zinc-400">管理所有类型的订单</p>
        </div>
        <button onClick={loadOrders} className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors">
          <RefreshCw className="w-4 h-4" /> 刷新
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {statusOptions.map(s => (
          <button key={s.value} onClick={() => { setStatusFilter(s.value); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${statusFilter === s.value ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>
            {s.label}
          </button>
        ))}
      </div>
      <div className="flex gap-2 mb-6">
        {typeOptions.map(t => (
          <button key={t.value} onClick={() => { setTypeFilter(t.value); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${typeFilter === t.value ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-zinc-500">加载中...</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 text-zinc-500">暂无订单</div>
      ) : (
        <>
          <div className="bg-zinc-900/50 rounded-lg border border-zinc-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400">
                  <th className="text-left px-4 py-3 font-medium">订单号</th>
                  <th className="text-left px-4 py-3 font-medium">类型</th>
                  <th className="text-left px-4 py-3 font-medium">状态</th>
                  <th className="text-left px-4 py-3 font-medium">会员</th>
                  <th className="text-right px-4 py-3 font-medium">金额</th>
                  <th className="text-left px-4 py-3 font-medium">时间</th>
                  <th className="text-right px-4 py-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                    <td className="px-4 py-3 text-white font-mono text-xs">{order.orderNo}</td>
                    <td className="px-4 py-3"><StatusBadge status={order.type} statusMap={typeMap} /></td>
                    <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                    <td className="px-4 py-3 text-zinc-300">{order.memberName || '-'}</td>
                    <td className="px-4 py-3 text-right text-white">¥{order.totalAmount?.toFixed(2)}</td>
                    <td className="px-4 py-3 text-zinc-400 text-xs">{new Date(order.createdAt).toLocaleString('zh-CN')}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setSelectedOrder(order)} className="text-zinc-400 hover:text-white p-1">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} pageSize={pageSize} total={total} onChange={setPage} />
        </>
      )}

      <Modal open={!!selectedOrder} onClose={() => setSelectedOrder(null)} title="订单详情" maxWidth="max-w-lg">
        {selectedOrder && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-zinc-500">订单号:</span> <span className="text-white font-mono">{selectedOrder.orderNo}</span></div>
              <div><span className="text-zinc-500">类型:</span> <StatusBadge status={selectedOrder.type} statusMap={typeMap} /></div>
              <div><span className="text-zinc-500">状态:</span> <StatusBadge status={selectedOrder.status} /></div>
              <div><span className="text-zinc-500">金额:</span> <span className="text-white">¥{selectedOrder.totalAmount?.toFixed(2)}</span></div>
              <div><span className="text-zinc-500">会员:</span> <span className="text-white">{selectedOrder.memberName || '-'}</span></div>
              <div><span className="text-zinc-500">时间:</span> <span className="text-zinc-300">{new Date(selectedOrder.createdAt).toLocaleString('zh-CN')}</span></div>
            </div>
            {selectedOrder.items?.length > 0 && (
              <div>
                <h4 className="text-zinc-400 text-xs mb-2">订单明细</h4>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm bg-zinc-800/50 rounded px-3 py-2">
                      <span className="text-zinc-300">{item.productName} {item.spec ? `(${item.spec})` : ''} x{item.quantity}</span>
                      <span className="text-white">¥{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-2 pt-2">
              {getActionButtons(selectedOrder).map((btn, i) => (
                <button key={i} onClick={() => handleStatusChange(selectedOrder.id, btn.action)}
                  className={`px-3 py-1.5 text-sm text-white rounded-lg ${btn.color}`}>
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
