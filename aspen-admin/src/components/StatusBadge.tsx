interface StatusBadgeProps {
  status: string;
  statusMap?: Record<string, { label: string; color: string }>;
}

const defaultMap: Record<string, { label: string; color: string }> = {
  active: { label: '活跃', color: 'bg-emerald-500/20 text-emerald-400' },
  inactive: { label: '停用', color: 'bg-zinc-500/20 text-zinc-400' },
  pending: { label: '待处理', color: 'bg-yellow-500/20 text-yellow-400' },
  paid: { label: '已支付', color: 'bg-blue-500/20 text-blue-400' },
  confirmed: { label: '已确认', color: 'bg-emerald-500/20 text-emerald-400' },
  preparing: { label: '准备中', color: 'bg-orange-500/20 text-orange-400' },
  ready: { label: '就绪', color: 'bg-cyan-500/20 text-cyan-400' },
  delivering: { label: '配送中', color: 'bg-purple-500/20 text-purple-400' },
  completed: { label: '已完成', color: 'bg-emerald-500/20 text-emerald-400' },
  cancelled: { label: '已取消', color: 'bg-red-500/20 text-red-400' },
  refunded: { label: '已退款', color: 'bg-zinc-500/20 text-zinc-400' },
  frozen: { label: '冻结', color: 'bg-blue-500/20 text-blue-400' },
  maintenance: { label: '维护中', color: 'bg-yellow-500/20 text-yellow-400' },
};

export default function StatusBadge({ status, statusMap }: StatusBadgeProps) {
  const map = statusMap || defaultMap;
  const config = map[status] || { label: status, color: 'bg-zinc-500/20 text-zinc-400' };

  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
}
