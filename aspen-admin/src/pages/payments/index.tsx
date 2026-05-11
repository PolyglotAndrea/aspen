/**
 * 支付管理页面
 * 查看交易流水、处理退款、模拟支付确认
 */

import { useState, useEffect } from 'react';
import { RefreshCw, Eye, RotateCcw, CheckCircle } from 'lucide-react';
import { paymentApi } from '../../lib/api';
import StatusBadge from '../../components/StatusBadge';
import Pagination from '../../components/Pagination';
import Modal from '../../components/Modal';

interface Transaction {
  id: string;
  tenantId: string;
  orderId: string;
  channel: string;
  transactionNo: string;
  amount: number;
  type: string;
  status: string;
  createdAt: string;
}

const channelMap: Record<string, { label: string; color: string }> = {
  wechat: { label: '微信支付', color: 'bg-emerald-500/20 text-emerald-400' },
  alipay: { label: '支付宝', color: 'bg-blue-500/20 text-blue-400' },
  unionpay: { label: '银联', color: 'bg-red-500/20 text-red-400' },
  simulate: { label: '模拟', color: 'bg-zinc-500/20 text-zinc-400' },
};

const statusMap: Record<string, { label: string; color: string }> = {
  pending: { label: '待处理', color: 'bg-yellow-500/20 text-yellow-400' },
  success: { label: '成功', color: 'bg-emerald-500/20 text-emerald-400' },
  failed: { label: '失败', color: 'bg-red-500/20 text-red-400' },
};

const typeMap: Record<string, { label: string; color: string }> = {
  pay: { label: '支付', color: 'bg-blue-500/20 text-blue-400' },
  refund: { label: '退款', color: 'bg-orange-500/20 text-orange-400' },
};

const channelOptions = [
  { value: 'all', label: '全部渠道' },
  { value: 'wechat', label: '微信支付' },
  { value: 'alipay', label: '支付宝' },
  { value: 'unionpay', label: '银联' },
  { value: 'simulate', label: '模拟' },
];

const statusOptions = [
  { value: 'all', label: '全部状态' },
  { value: 'pending', label: '待处理' },
  { value: 'success', label: '成功' },
  { value: 'failed', label: '失败' },
];

export default function PaymentsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [channelFilter, setChannelFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [refundModal, setRefundModal] = useState<Transaction | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const pageSize = 20;

  useEffect(() => { loadTransactions(); }, [channelFilter, statusFilter, page]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const params: any = { page, pageSize };
      if (channelFilter !== 'all') params.channel = channelFilter;
      if (statusFilter !== 'all') params.status = statusFilter;
      const data = await paymentApi.listTransactions(params) as any;
      setTransactions(data.transactions || []);
      setTotal(data.total || 0);
    } catch (e) {
      console.error('Failed to load transactions:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (transactionNo: string) => {
    try {
      setActionLoading(true);
      await paymentApi.confirm(transactionNo);
      loadTransactions();
    } catch (e: any) {
      alert('确认失败: ' + e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefund = async () => {
    if (!refundModal) return;
    try {
      setActionLoading(true);
      await paymentApi.refund(refundModal.orderId);
      setRefundModal(null);
      setRefundReason('');
      loadTransactions();
    } catch (e: any) {
      alert('退款失败: ' + e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  const formatAmount = (amount: number) => `¥${amount.toFixed(2)}`;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-light text-white mb-1">支付管理</h2>
          <p className="text-sm text-zinc-400">查看交易流水与处理退款</p>
        </div>
        <button onClick={loadTransactions} className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors">
          <RefreshCw className="w-4 h-4" /> 刷新
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {channelOptions.map(c => (
          <button key={c.value} onClick={() => { setChannelFilter(c.value); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${channelFilter === c.value ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>
            {c.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 mb-6">
        {statusOptions.map(s => (
          <button key={s.value} onClick={() => { setStatusFilter(s.value); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${statusFilter === s.value ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-zinc-500">加载中...</div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-12 text-zinc-500">暂无交易记录</div>
      ) : (
        <>
          <div className="bg-zinc-900/50 rounded-lg border border-zinc-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400">
                  <th className="text-left px-4 py-3 font-medium">交易号</th>
                  <th className="text-left px-4 py-3 font-medium">关联订单</th>
                  <th className="text-left px-4 py-3 font-medium">渠道</th>
                  <th className="text-left px-4 py-3 font-medium">类型</th>
                  <th className="text-left px-4 py-3 font-medium">状态</th>
                  <th className="text-right px-4 py-3 font-medium">金额</th>
                  <th className="text-left px-4 py-3 font-medium">时间</th>
                  <th className="text-right px-4 py-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(tx => (
                  <tr key={tx.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                    <td className="px-4 py-3 text-white font-mono text-xs">{tx.transactionNo || tx.id}</td>
                    <td className="px-4 py-3 text-zinc-300 font-mono text-xs">{tx.orderId}</td>
                    <td className="px-4 py-3"><StatusBadge status={tx.channel} statusMap={channelMap} /></td>
                    <td className="px-4 py-3"><StatusBadge status={tx.type} statusMap={typeMap} /></td>
                    <td className="px-4 py-3"><StatusBadge status={tx.status} statusMap={statusMap} /></td>
                    <td className="px-4 py-3 text-right text-white">{formatAmount(tx.amount)}</td>
                    <td className="px-4 py-3 text-zinc-400 text-xs">{formatDate(tx.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => setSelectedTx(tx)} className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors" title="查看详情">
                          <Eye className="w-4 h-4" />
                        </button>
                        {tx.status === 'pending' && tx.type === 'pay' && (
                          <button
                            onClick={() => handleConfirm(tx.transactionNo)}
                            disabled={actionLoading}
                            className="p-1.5 rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-emerald-900/30 transition-colors"
                            title="确认支付"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {tx.status === 'success' && tx.type === 'pay' && (
                          <button
                            onClick={() => setRefundModal(tx)}
                            className="p-1.5 rounded-lg text-orange-400 hover:text-orange-300 hover:bg-orange-900/30 transition-colors"
                            title="退款"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4">
            <Pagination page={page} pageSize={pageSize} total={total} onChange={setPage} />
          </div>
        </>
      )}

      {/* Detail Modal */}
      {selectedTx && (
        <Modal open onClose={() => setSelectedTx(null)} title="交易详情">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-zinc-400">交易号</span><span className="text-white font-mono">{selectedTx.transactionNo || selectedTx.id}</span></div>
            <div className="flex justify-between"><span className="text-zinc-400">关联订单</span><span className="text-white font-mono">{selectedTx.orderId}</span></div>
            <div className="flex justify-between"><span className="text-zinc-400">渠道</span><StatusBadge status={selectedTx.channel} statusMap={channelMap} /></div>
            <div className="flex justify-between"><span className="text-zinc-400">类型</span><StatusBadge status={selectedTx.type} statusMap={typeMap} /></div>
            <div className="flex justify-between"><span className="text-zinc-400">状态</span><StatusBadge status={selectedTx.status} statusMap={statusMap} /></div>
            <div className="flex justify-between"><span className="text-zinc-400">金额</span><span className="text-white">{formatAmount(selectedTx.amount)}</span></div>
            <div className="flex justify-between"><span className="text-zinc-400">创建时间</span><span className="text-zinc-300">{formatDate(selectedTx.createdAt)}</span></div>
          </div>
        </Modal>
      )}

      {/* Refund Modal */}
      {refundModal && (
        <Modal open onClose={() => { setRefundModal(null); setRefundReason(''); }} title="确认退款">
          <div className="space-y-4">
            <p className="text-sm text-zinc-300">
              确定要对订单 <span className="font-mono text-white">{refundModal.orderId}</span> 发起退款吗？
            </p>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">退款原因（可选）</label>
              <input
                type="text"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-zinc-600"
                placeholder="请输入退款原因"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => { setRefundModal(null); setRefundReason(''); }} className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors text-sm">
                取消
              </button>
              <button
                onClick={handleRefund}
                disabled={actionLoading}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm disabled:opacity-50"
              >
                {actionLoading ? '处理中...' : '确认退款'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
