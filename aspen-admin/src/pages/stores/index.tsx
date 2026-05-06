import { useState, useEffect } from 'react';
import { Store, RefreshCw, Plus, Edit2, Trash2, MapPin, Phone, Clock, Users } from 'lucide-react';
import { bookingApi } from '../../lib/api';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';

interface Table {
  id: string;
  name: string;
  capacity: number;
  available: boolean;
}

interface StoreData {
  id: string;
  name: string;
  shortName?: string;
  address: string;
  phone: string;
  businessHours?: string;
  description?: string;
  status: string;
  tables?: Table[];
}

const defaultForm = { name: '', shortName: '', address: '', phone: '', businessHours: '', description: '' };

export default function StoresPage() {
  const [stores, setStores] = useState<StoreData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState<{ open: boolean; store?: StoreData }>({ open: false });
  const [tableModal, setTableModal] = useState<{ open: boolean; store?: StoreData }>({ open: false });
  const [formData, setFormData] = useState<any>(defaultForm);
  const [tableForm, setTableForm] = useState({ name: '', capacity: 4 });

  useEffect(() => { loadStores(); }, []);

  const loadStores = async () => {
    try {
      setLoading(true);
      const data = await bookingApi.listStores() as any;
      setStores(data.stores || data.data || (Array.isArray(data) ? data : []));
    } catch (e) {
      console.error('Failed to load stores:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (editModal.store) {
        await bookingApi.updateStore(editModal.store.id, formData);
      } else {
        await bookingApi.createStore(formData);
      }
      setEditModal({ open: false });
      loadStores();
    } catch (e: any) {
      alert('保存失败: ' + e.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除该门店?')) return;
    try {
      await bookingApi.deleteStore(id);
      loadStores();
    } catch (e: any) {
      alert('删除失败: ' + e.message);
    }
  };

  const openEdit = (store?: StoreData) => {
    setFormData(store ? { name: store.name, shortName: store.shortName || '', address: store.address, phone: store.phone, businessHours: store.businessHours || '', description: store.description || '' } : defaultForm);
    setEditModal({ open: true, store });
  };

  const openTables = async (store: StoreData) => {
    try {
      const data = await bookingApi.listTables(store.id) as any;
      setTableModal({ open: true, store: { ...store, tables: data.tables || data.data || (Array.isArray(data) ? data : []) } });
    } catch (e) {
      setTableModal({ open: true, store: { ...store, tables: [] } });
    }
  };

  const handleAddTable = async () => {
    if (!tableModal.store) return;
    try {
      await bookingApi.addTable(tableModal.store.id, tableForm);
      setTableForm({ name: '', capacity: 4 });
      openTables(tableModal.store);
    } catch (e: any) {
      alert('添加桌位失败: ' + e.message);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-light text-white mb-1">门店管理</h2>
          <p className="text-sm text-zinc-400">管理门店信息和桌位</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadStores} className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors">
            <RefreshCw className="w-4 h-4" /> 刷新
          </button>
          <button onClick={() => openEdit()} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
            <Plus className="w-4 h-4" /> 添加门店
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-zinc-500">加载中...</div>
      ) : stores.length === 0 ? (
        <div className="text-center py-12 text-zinc-500">暂无门店</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stores.map(store => (
            <div key={store.id} className="bg-zinc-900/50 rounded-lg border border-zinc-800 p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-600/20 flex items-center justify-center">
                    <Store className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-white font-medium">{store.name}</div>
                    {store.shortName && <div className="text-xs text-zinc-500">{store.shortName}</div>}
                  </div>
                </div>
                <StatusBadge status={store.status || 'active'} />
              </div>
              <div className="space-y-2 text-sm text-zinc-400 mb-4">
                <div className="flex items-center gap-2"><MapPin className="w-4 h-4 flex-shrink-0" /> {store.address}</div>
                <div className="flex items-center gap-2"><Phone className="w-4 h-4 flex-shrink-0" /> {store.phone}</div>
                {store.businessHours && <div className="flex items-center gap-2"><Clock className="w-4 h-4 flex-shrink-0" /> {store.businessHours}</div>}
              </div>
              {store.description && <p className="text-xs text-zinc-500 mb-4">{store.description}</p>}
              <div className="flex gap-2">
                <button onClick={() => openTables(store)} className="flex items-center gap-1 px-3 py-1.5 bg-zinc-800 text-zinc-300 text-sm rounded-lg hover:bg-zinc-700">
                  <Users className="w-3 h-3" /> 桌位管理
                </button>
                <button onClick={() => openEdit(store)} className="flex items-center gap-1 px-3 py-1.5 bg-zinc-800 text-zinc-300 text-sm rounded-lg hover:bg-zinc-700">
                  <Edit2 className="w-3 h-3" /> 编辑
                </button>
                <button onClick={() => handleDelete(store.id)} className="flex items-center gap-1 px-3 py-1.5 bg-zinc-800 text-red-400 text-sm rounded-lg hover:bg-zinc-700">
                  <Trash2 className="w-3 h-3" /> 删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={editModal.open} onClose={() => setEditModal({ open: false })} title={editModal.store ? '编辑门店' : '添加门店'} maxWidth="max-w-lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">门店名称</label>
              <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-800 text-white rounded-lg border border-zinc-700 focus:border-emerald-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">简称</label>
              <input value={formData.shortName} onChange={e => setFormData({ ...formData, shortName: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-800 text-white rounded-lg border border-zinc-700 focus:border-emerald-500 focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">地址</label>
            <input value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-800 text-white rounded-lg border border-zinc-700 focus:border-emerald-500 focus:outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">电话</label>
              <input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-800 text-white rounded-lg border border-zinc-700 focus:border-emerald-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">营业时间</label>
              <input value={formData.businessHours} onChange={e => setFormData({ ...formData, businessHours: e.target.value })} placeholder="10:00-22:00"
                className="w-full px-3 py-2 bg-zinc-800 text-white rounded-lg border border-zinc-700 focus:border-emerald-500 focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">描述</label>
            <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={3}
              className="w-full px-3 py-2 bg-zinc-800 text-white rounded-lg border border-zinc-700 focus:border-emerald-500 focus:outline-none resize-none" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setEditModal({ open: false })} className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700">取消</button>
            <button onClick={handleSave} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">保存</button>
          </div>
        </div>
      </Modal>

      <Modal open={tableModal.open} onClose={() => setTableModal({ open: false })} title={`桌位管理 - ${tableModal.store?.name || ''}`} maxWidth="max-w-lg">
        <div className="space-y-4">
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {tableModal.store?.tables?.length ? tableModal.store.tables.map(table => (
              <div key={table.id} className="flex items-center justify-between bg-zinc-800/50 rounded-lg px-4 py-3">
                <div>
                  <span className="text-white">{table.name}</span>
                  <span className="text-zinc-500 text-sm ml-2">{table.capacity}人桌</span>
                </div>
                <StatusBadge status={table.available ? 'active' : 'inactive'} />
              </div>
            )) : <div className="text-center py-6 text-zinc-500">暂无桌位</div>}
          </div>
          <div className="border-t border-zinc-800 pt-4">
            <h4 className="text-sm text-zinc-400 mb-3">添加桌位</h4>
            <div className="flex gap-3">
              <input value={tableForm.name} onChange={e => setTableForm({ ...tableForm, name: e.target.value })} placeholder="桌号"
                className="flex-1 px-3 py-2 bg-zinc-800 text-white rounded-lg border border-zinc-700 focus:border-emerald-500 focus:outline-none" />
              <input type="number" value={tableForm.capacity} onChange={e => setTableForm({ ...tableForm, capacity: Number(e.target.value) })} min={1} max={20}
                className="w-24 px-3 py-2 bg-zinc-800 text-white rounded-lg border border-zinc-700 focus:border-emerald-500 focus:outline-none" />
              <button onClick={handleAddTable} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">添加</button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
