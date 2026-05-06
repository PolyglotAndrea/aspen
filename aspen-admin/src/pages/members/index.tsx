import { useState, useEffect } from 'react';
import { RefreshCw, Plus, Edit2, Trash2, Search, Coins } from 'lucide-react';
import { memberApi } from '../../lib/api';
import StatusBadge from '../../components/StatusBadge';
import Pagination from '../../components/Pagination';
import Modal from '../../components/Modal';

interface Member {
  id: string;
  nickname: string;
  phone: string;
  level: string;
  points: number;
  status: string;
  avatar?: string;
  birthday?: string;
  createdAt: string;
}

const levelMap: Record<string, { label: string; color: string }> = {
  normal: { label: '普通会员', color: 'bg-zinc-500/20 text-zinc-400' },
  silver: { label: '银卡会员', color: 'bg-gray-400/20 text-gray-300' },
  gold: { label: '金卡会员', color: 'bg-yellow-500/20 text-yellow-400' },
  platinum: { label: '铂金会员', color: 'bg-blue-400/20 text-blue-300' },
  diamond: { label: '钻石会员', color: 'bg-purple-500/20 text-purple-400' },
};

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [editModal, setEditModal] = useState<{ open: boolean; member?: Member }>({ open: false });
  const [pointsModal, setPointsModal] = useState<{ open: boolean; member?: Member }>({ open: false });
  const [formData, setFormData] = useState<any>({});
  const [pointsData, setPointsData] = useState({ points: 0, reason: '' });
  const pageSize = 20;

  useEffect(() => { loadMembers(); }, [statusFilter, page]);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const params: any = { page, pageSize };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (search) params.search = search;
      const data = await memberApi.adminList?.(params) || await memberApi.getProfile();
      setMembers(data.members || data.data || (Array.isArray(data) ? data : []));
      setTotal(data.total || 0);
    } catch (e) {
      console.error('Failed to load members:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => { setPage(1); loadMembers(); };

  const handleSave = async () => {
    try {
      if (editModal.member) {
        await memberApi.adminUpdate?.(editModal.member.id, formData);
      } else {
        await memberApi.adminCreate?.(formData);
      }
      setEditModal({ open: false });
      loadMembers();
    } catch (e: any) {
      alert('保存失败: ' + e.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除该会员?')) return;
    try {
      await memberApi.adminDelete?.(id);
      loadMembers();
    } catch (e: any) {
      alert('删除失败: ' + e.message);
    }
  };

  const handleAdjustPoints = async () => {
    if (!pointsModal.member) return;
    try {
      await memberApi.adminAdjustPoints?.(pointsModal.member.id, pointsData);
      setPointsModal({ open: false });
      loadMembers();
    } catch (e: any) {
      alert('调整失败: ' + e.message);
    }
  };

  const openEdit = (member?: Member) => {
    setFormData(member ? { ...member } : { nickname: '', phone: '', level: 'normal', status: 'active' });
    setEditModal({ open: true, member });
  };

  const openPoints = (member: Member) => {
    setPointsData({ points: 0, reason: '' });
    setPointsModal({ open: true, member });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-light text-white mb-1">会员管理</h2>
          <p className="text-sm text-zinc-400">管理会员信息和积分</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadMembers} className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors">
            <RefreshCw className="w-4 h-4" /> 刷新
          </button>
          <button onClick={() => openEdit()} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
            <Plus className="w-4 h-4" /> 添加会员
          </button>
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        <div className="flex-1 flex gap-2">
          <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="搜索手机号/昵称" className="flex-1 px-4 py-2 bg-zinc-800 text-white rounded-lg border border-zinc-700 focus:border-emerald-500 focus:outline-none" />
          <button onClick={handleSearch} className="px-3 py-2 bg-zinc-800 text-zinc-400 rounded-lg hover:bg-zinc-700">
            <Search className="w-4 h-4" />
          </button>
        </div>
        <div className="flex gap-2">
          {['all', 'active', 'frozen', 'cancelled'].map(s => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${statusFilter === s ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>
              {s === 'all' ? '全部' : s === 'active' ? '活跃' : s === 'frozen' ? '冻结' : '注销'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-zinc-500">加载中...</div>
      ) : members.length === 0 ? (
        <div className="text-center py-12 text-zinc-500">暂无会员</div>
      ) : (
        <>
          <div className="bg-zinc-900/50 rounded-lg border border-zinc-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400">
                  <th className="text-left px-4 py-3 font-medium">昵称</th>
                  <th className="text-left px-4 py-3 font-medium">手机号</th>
                  <th className="text-left px-4 py-3 font-medium">等级</th>
                  <th className="text-right px-4 py-3 font-medium">积分</th>
                  <th className="text-left px-4 py-3 font-medium">状态</th>
                  <th className="text-left px-4 py-3 font-medium">注册时间</th>
                  <th className="text-right px-4 py-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {members.map(member => (
                  <tr key={member.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                    <td className="px-4 py-3 text-white">{member.nickname}</td>
                    <td className="px-4 py-3 text-zinc-300 font-mono">{member.phone}</td>
                    <td className="px-4 py-3"><StatusBadge status={member.level} statusMap={levelMap} /></td>
                    <td className="px-4 py-3 text-right text-yellow-400">{member.points}</td>
                    <td className="px-4 py-3"><StatusBadge status={member.status} /></td>
                    <td className="px-4 py-3 text-zinc-400 text-xs">{new Date(member.createdAt).toLocaleDateString('zh-CN')}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openPoints(member)} className="text-zinc-400 hover:text-yellow-400 p-1" title="积分管理"><Coins className="w-4 h-4" /></button>
                        <button onClick={() => openEdit(member)} className="text-zinc-400 hover:text-white p-1" title="编辑"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(member.id)} className="text-zinc-400 hover:text-red-400 p-1" title="删除"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} pageSize={pageSize} total={total} onChange={setPage} />
        </>
      )}

      <Modal open={editModal.open} onClose={() => setEditModal({ open: false })} title={editModal.member ? '编辑会员' : '添加会员'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-1">手机号</label>
            <input value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} disabled={!!editModal.member}
              className="w-full px-3 py-2 bg-zinc-800 text-white rounded-lg border border-zinc-700 focus:border-emerald-500 focus:outline-none disabled:opacity-50" />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">昵称</label>
            <input value={formData.nickname || ''} onChange={e => setFormData({ ...formData, nickname: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-800 text-white rounded-lg border border-zinc-700 focus:border-emerald-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">等级</label>
            <select value={formData.level || 'normal'} onChange={e => setFormData({ ...formData, level: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-800 text-white rounded-lg border border-zinc-700 focus:border-emerald-500 focus:outline-none">
              {Object.entries(levelMap).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">生日</label>
            <input type="date" value={formData.birthday || ''} onChange={e => setFormData({ ...formData, birthday: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-800 text-white rounded-lg border border-zinc-700 focus:border-emerald-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">状态</label>
            <select value={formData.status || 'active'} onChange={e => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-800 text-white rounded-lg border border-zinc-700 focus:border-emerald-500 focus:outline-none">
              <option value="active">活跃</option>
              <option value="frozen">冻结</option>
              <option value="cancelled">注销</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setEditModal({ open: false })} className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700">取消</button>
            <button onClick={handleSave} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">保存</button>
          </div>
        </div>
      </Modal>

      <Modal open={pointsModal.open} onClose={() => setPointsModal({ open: false })} title={`积分调整 - ${pointsModal.member?.nickname || ''}`}>
        <div className="space-y-4">
          <div className="text-sm text-zinc-400">当前积分: <span className="text-yellow-400 text-lg font-medium">{pointsModal.member?.points || 0}</span></div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">调整积分 (正数增加, 负数扣减)</label>
            <input type="number" value={pointsData.points} onChange={e => setPointsData({ ...pointsData, points: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-zinc-800 text-white rounded-lg border border-zinc-700 focus:border-emerald-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">原因</label>
            <input value={pointsData.reason} onChange={e => setPointsData({ ...pointsData, reason: e.target.value })}
              placeholder="管理员手动调整" className="w-full px-3 py-2 bg-zinc-800 text-white rounded-lg border border-zinc-700 focus:border-emerald-500 focus:outline-none" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setPointsModal({ open: false })} className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700">取消</button>
            <button onClick={handleAdjustPoints} className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700">确认调整</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
