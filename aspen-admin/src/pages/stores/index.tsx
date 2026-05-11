import { useState, useEffect } from 'react';
import { Store, RefreshCw, Plus, Edit2, Trash2, MapPin, Phone, Clock, Users, Image as ImageIcon, Star, Shield, Coffee, X } from 'lucide-react';
import { bookingApi } from '../../lib/api';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';

interface Table {
  id: string;
  name: string;
  capacity: number;
  position?: string;
  type: 'indoor' | 'outdoor' | 'vip';
  available: boolean;
  price?: number;
}

interface StoreData {
  id: string;
  name: string;
  shortName?: string;
  address: string;
  phone: string;
  longitude?: number;
  latitude?: number;
  businessHours?: string | Record<string, string>;
  description?: string;
  images?: string[];
  status: string;
  rating?: number;
  ratingCount?: number;
  monthlySales?: number;
  minOrderAmount?: number;
  deliveryFee?: number;
  deliveryDistance?: number;
  packPrice?: number;
  notice?: string;
  qrCode?: string;
  isOpen?: boolean;
  features?: Record<string, boolean>;
  tables?: Table[];
  sort?: number;
}

const defaultForm = {
  name: '',
  shortName: '',
  address: '',
  phone: '',
  businessHours: '',
  description: '',
  minOrderAmount: 0,
  deliveryFee: 0,
  deliveryDistance: 5,
  packPrice: 0,
  notice: '',
  qrCode: '',
  isOpen: true,
  features: {} as Record<string, boolean>,
};

const FEATURE_OPTIONS = [
  { key: 'invoice', label: '可开发票', icon: <Shield className="w-4 h-4" /> },
  { key: 'privateRoom', label: '包间', icon: <Coffee className="w-4 h-4" /> },
  { key: 'wifi', label: 'WiFi', icon: <Shield className="w-4 h-4" /> },
  { key: 'parking', label: '停车位', icon: <Shield className="w-4 h-4" /> },
  { key: 'petFriendly', label: '宠物友好', icon: <Shield className="w-4 h-4" /> },
  { key: 'deliveryOnly', label: '外卖专营', icon: <Shield className="w-4 h-4" /> },
];

function formatBusinessHours(bh: any): string {
  if (!bh) return '';
  if (typeof bh === 'string') return bh;
  if (typeof bh === 'object') {
    return Object.entries(bh).map(([k, v]) => `${k}: ${v}`).join(' | ');
  }
  return String(bh);
}

export default function StoresPage() {
  const [stores, setStores] = useState<StoreData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState<{ open: boolean; store?: StoreData }>({ open: false });
  const [tableModal, setTableModal] = useState<{ open: boolean; store?: StoreData }>({ open: false });
  const [formData, setFormData] = useState<any>(defaultForm);
  const [tableForm, setTableForm] = useState({ name: '', capacity: 4, type: 'indoor' as const, price: 0 });
  const [imageInput, setImageInput] = useState('');

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
      const payload = {
        ...formData,
        businessHours: formData.businessHours || undefined,
      };
      if (editModal.store) {
        await bookingApi.updateStore(editModal.store.id, payload);
      } else {
        await bookingApi.createStore(payload);
      }
      setEditModal({ open: false });
      setFormData(defaultForm);
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
    if (store) {
      setFormData({
        name: store.name,
        shortName: store.shortName || '',
        address: store.address,
        phone: store.phone,
        businessHours: formatBusinessHours(store.businessHours),
        description: store.description || '',
        minOrderAmount: store.minOrderAmount || 0,
        deliveryFee: store.deliveryFee || 0,
        deliveryDistance: store.deliveryDistance || 5,
        packPrice: store.packPrice || 0,
        notice: store.notice || '',
        qrCode: store.qrCode || '',
        isOpen: store.isOpen !== undefined ? store.isOpen : true,
        features: store.features || {},
        sort: store.sort || 0,
      });
    } else {
      setFormData(defaultForm);
    }
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
      setTableForm({ name: '', capacity: 4, type: 'indoor', price: 0 });
      openTables(tableModal.store);
    } catch (e: any) {
      alert('添加桌位失败: ' + e.message);
    }
  };

  const updateFeature = (key: string, checked: boolean) => {
    setFormData((prev: typeof formData) => ({
      ...prev,
      features: { ...prev.features, [key]: checked },
    }));
  };

  const addImage = (url: string) => {
    if (url.trim()) {
      setFormData((prev: typeof formData) => ({
        ...prev,
        images: [...(prev.images || []), url.trim()],
      }));
    }
    setImageInput('');
  };

  const removeImage = (index: number) => {
    setFormData((prev: typeof formData) => ({
      ...prev,
      images: (prev.images || []).filter((_: any, i: number) => i !== index),
    }));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-light text-white mb-1">门店管理</h2>
          <p className="text-sm text-zinc-400">管理门店信息、配送范围和桌位</p>
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
                {store.businessHours && <div className="flex items-center gap-2"><Clock className="w-4 h-4 flex-shrink-0" /> {formatBusinessHours(store.businessHours)}</div>}
              </div>

              {/* 新增字段展示 */}
              <div className="flex flex-wrap gap-2 mb-3 text-xs text-zinc-500">
                {store.rating != null && (
                  <span className="flex items-center gap-1 text-yellow-400">
                    <Star className="w-3 h-3" /> {store.rating?.toFixed(1)} ({store.ratingCount})
                  </span>
                )}
                {store.monthlySales != null && (
                  <span className="flex items-center gap-1 text-emerald-400">
                    月销 {store.monthlySales}
                  </span>
                )}
                {store.minOrderAmount != null && (
                  <span>起送 ¥{store.minOrderAmount}</span>
                )}
                {store.deliveryFee != null && (
                  <span>配送 ¥{store.deliveryFee}</span>
                )}
                {store.deliveryDistance != null && (
                  <span>配送范围 {store.deliveryDistance}km</span>
                )}
                {store.packPrice != null && store.packPrice > 0 && (
                  <span>包装费 ¥{store.packPrice}</span>
                )}
                {store.notice && (
                  <span className="text-amber-400">📢 {store.notice}</span>
                )}
              </div>

              {/* 门店图片 */}
              {store.images && store.images.length > 0 && (
                <div className="flex gap-2 mb-3">
                  {store.images.slice(0, 3).map((img, i) => (
                    <img key={i} src={img} alt="" className="w-12 h-12 rounded-md object-cover border border-zinc-700" />
                  ))}
                  {store.images.length > 3 && (
                    <span className="text-xs text-zinc-600 flex items-center">+{store.images.length - 3}</span>
                  )}
                </div>
              )}

              {/* 二维码 */}
              {store.qrCode && (
                <div className="mb-3">
                  <img src={store.qrCode} alt="二维码" className="w-20 h-20 rounded border border-zinc-700" />
                </div>
              )}

              {store.description && <p className="text-xs text-zinc-500 mb-4">{store.description}</p>}

              <div className="flex gap-2">
                <button onClick={() => openTables(store)} className="flex items-center gap-1 px-3 py-1.5 bg-zinc-800 text-zinc-300 text-sm rounded-lg hover:bg-zinc-700">
                  <Users className="w-3 h-3" /> 桌位 ({store.tables?.length || 0})
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

      {/* 编辑弹窗 */}
      <Modal open={editModal.open} onClose={() => { setEditModal({ open: false }); setFormData(defaultForm); }} title={editModal.store ? '编辑门店' : '添加门店'} maxWidth="max-w-2xl">
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">门店名称 *</label>
              <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-800 text-white rounded-lg border border-zinc-700 focus:border-emerald-500 focus:outline-none" placeholder="门店名称" />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">简称</label>
              <input value={formData.shortName} onChange={e => setFormData({ ...formData, shortName: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-800 text-white rounded-lg border border-zinc-700 focus:border-emerald-500 focus:outline-none" placeholder="简称" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm text-zinc-400 mb-1">地址 *</label>
              <input value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-800 text-white rounded-lg border border-zinc-700 focus:border-emerald-500 focus:outline-none" placeholder="详细地址" />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">电话 *</label>
              <input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-800 text-white rounded-lg border border-zinc-700 focus:border-emerald-500 focus:outline-none" placeholder="联系电话" />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">营业时间</label>
              <input value={formData.businessHours} onChange={e => setFormData({ ...formData, businessHours: e.target.value })} placeholder="10:00-22:00"
                className="w-full px-3 py-2 bg-zinc-800 text-white rounded-lg border border-zinc-700 focus:border-emerald-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">排序</label>
              <input type="number" value={formData.sort || 0} onChange={e => setFormData({ ...formData, sort: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-zinc-800 text-white rounded-lg border border-zinc-700 focus:border-emerald-500 focus:outline-none" />
            </div>
          </div>

          {/* 起送价/配送费/包装费 */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">起送价</label>
              <input type="number" value={formData.minOrderAmount} step="0.5" onChange={e => setFormData({ ...formData, minOrderAmount: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-zinc-800 text-white rounded-lg border border-zinc-700 focus:border-emerald-500 focus:outline-none" placeholder="¥0" />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">配送费</label>
              <input type="number" value={formData.deliveryFee} step="0.5" onChange={e => setFormData({ ...formData, deliveryFee: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-zinc-800 text-white rounded-lg border border-zinc-700 focus:border-emerald-500 focus:outline-none" placeholder="¥0" />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">配送距离 (km)</label>
              <input type="number" step="0.5" value={formData.deliveryDistance} onChange={e => setFormData({ ...formData, deliveryDistance: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-zinc-800 text-white rounded-lg border border-zinc-700 focus:border-emerald-500 focus:outline-none" placeholder="5" />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">包装费</label>
              <input type="number" value={formData.packPrice} step="0.5" onChange={e => setFormData({ ...formData, packPrice: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-zinc-800 text-white rounded-lg border border-zinc-700 focus:border-emerald-500 focus:outline-none" placeholder="¥0" />
            </div>
          </div>

          {/* 公告和二维码 */}
          <div>
            <label className="block text-sm text-zinc-400 mb-1">门店公告</label>
            <input value={formData.notice} onChange={e => setFormData({ ...formData, notice: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-800 text-white rounded-lg border border-zinc-700 focus:border-emerald-500 focus:outline-none" placeholder="如: 满100减20，仅限工作日使用" />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">二维码图片 URL</label>
            <input value={formData.qrCode} onChange={e => setFormData({ ...formData, qrCode: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-800 text-white rounded-lg border border-zinc-700 focus:border-emerald-500 focus:outline-none" placeholder="二维码图片地址" />
          </div>

          {/* 经纬度 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">经度 (longitude)</label>
              <input type="number" step="0.00001" value={formData.longitude ?? ''} onChange={e => setFormData({ ...formData, longitude: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full px-3 py-2 bg-zinc-800 text-white rounded-lg border border-zinc-700 focus:border-emerald-500 focus:outline-none" placeholder="121.4737" />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">纬度 (latitude)</label>
              <input type="number" step="0.00001" value={formData.latitude ?? ''} onChange={e => setFormData({ ...formData, latitude: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full px-3 py-2 bg-zinc-800 text-white rounded-lg border border-zinc-700 focus:border-emerald-500 focus:outline-none" placeholder="31.2304" />
            </div>
          </div>

          {/* 描述 */}
          <div>
            <label className="block text-sm text-zinc-400 mb-1">描述</label>
            <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={3}
              className="w-full px-3 py-2 bg-zinc-800 text-white rounded-lg border border-zinc-700 focus:border-emerald-500 focus:outline-none resize-none" placeholder="门店描述" />
          </div>

          {/* 图片 */}
          <div>
            <label className="block text-sm text-zinc-400 mb-2">门店图片</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {(formData.images || []).map((img: string, i: number) => (
                <div key={i} className="relative group">
                  <img src={img} alt="" className="w-16 h-16 rounded-lg object-cover border border-zinc-700" />
                  <button onClick={() => removeImage(i)} className="absolute -top-1 -right-1 bg-red-500/90 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={imageInput} onChange={e => setImageInput(e.target.value)}
                className="flex-1 px-3 py-1.5 bg-zinc-800 text-white rounded-lg border border-zinc-700 focus:border-emerald-500 focus:outline-none text-sm" placeholder="输入图片 URL" />
              <button onClick={() => addImage(imageInput)} disabled={!imageInput.trim()}
                className="px-3 py-1.5 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 disabled:opacity-40 text-sm">
                <ImageIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 门店特性 */}
          <div>
            <label className="block text-sm text-zinc-400 mb-2">门店特性</label>
            <div className="flex flex-wrap gap-2">
              {FEATURE_OPTIONS.map(f => (
                <label key={f.key} className="flex items-center gap-1.5 text-sm cursor-pointer px-2 py-1 rounded bg-zinc-800/50 hover:bg-zinc-700/50 transition-colors">
                  {f.icon}
                  <input type="checkbox" checked={formData.features?.[f.key] || false} onChange={e => updateFeature(f.key, e.target.checked)} className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-emerald-500 focus:ring-emerald-500/50" />
                  {f.label}
                </label>
              ))}
            </div>
          </div>

          {/* 状态 */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={formData.isOpen !== false} onChange={e => setFormData({ ...formData, isOpen: e.target.checked })} className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-emerald-500 focus:ring-emerald-500/50" />
              门店营业中
            </label>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={() => { setEditModal({ open: false }); setFormData(defaultForm); }}
            className="flex-1 px-4 py-2 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600">取消</button>
          <button onClick={handleSave}
            className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">保存</button>
        </div>
      </Modal>

      {/* 桌位管理弹窗 */}
      <Modal open={tableModal.open} onClose={() => setTableModal({ open: false })} title={`桌位管理 - ${tableModal.store?.name || ''}`} maxWidth="max-w-lg">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-400">管理门店桌位</p>
            <button onClick={() => setTableForm({ name: '', capacity: 4, type: 'indoor', price: 0 })}
              className="flex items-center gap-1 px-3 py-1.5 bg-zinc-800 text-zinc-300 text-sm rounded-lg hover:bg-zinc-700">
              <Plus className="w-3 h-3" /> 添加桌位
            </button>
          </div>

          {/* 添加桌位表单 */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-zinc-800/50 rounded-lg">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">桌位名称</label>
              <input value={tableForm.name} onChange={e => setTableForm({ ...tableForm, name: e.target.value })}
                className="w-full px-2 py-1 bg-zinc-900 text-white rounded border border-zinc-700 text-sm focus:border-emerald-500 focus:outline-none" placeholder="如: A1" />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">容纳人数</label>
              <input type="number" value={tableForm.capacity} onChange={e => setTableForm({ ...tableForm, capacity: Number(e.target.value) })}
                className="w-full px-2 py-1 bg-zinc-900 text-white rounded border border-zinc-700 text-sm focus:border-emerald-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">类型</label>
              <select value={tableForm.type} onChange={e => setTableForm({ ...tableForm, type: e.target.value as any })}
                className="w-full px-2 py-1 bg-zinc-900 text-white rounded border border-zinc-700 text-sm focus:border-emerald-500 focus:outline-none">
                <option value="indoor">室内</option>
                <option value="outdoor">室外</option>
                <option value="vip">VIP</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">附加费用</label>
              <input type="number" value={tableForm.price} onChange={e => setTableForm({ ...tableForm, price: Number(e.target.value) })}
                className="w-full px-2 py-1 bg-zinc-900 text-white rounded border border-zinc-700 text-sm focus:border-emerald-500 focus:outline-none" placeholder="¥0" />
            </div>
            <div className="col-span-2 flex justify-end">
              <button onClick={handleAddTable} disabled={!tableForm.name || !tableForm.capacity}
                className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm disabled:opacity-40">
                添加
              </button>
            </div>
          </div>

          {/* 桌位列表 */}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {tableModal.store?.tables?.length ? tableModal.store.tables.map(table => (
              <div key={table.id} className="flex items-center justify-between bg-zinc-800/50 rounded-lg px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full ${table.available ? 'bg-green-400' : 'bg-red-400'}`} />
                  <span className="text-white font-medium">{table.name}</span>
                  <span className="text-zinc-500 text-sm">
                    ({table.type === 'vip' ? 'VIP' : table.type === 'outdoor' ? '室外' : '室内'}, {table.capacity}人
                    {table.price ? `, +¥${table.price}` : ''})
                  </span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded ${table.available ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {table.available ? '可用' : '占用'}
                </span>
              </div>
            )) : (
              <div className="text-center py-4 text-zinc-500 text-sm">暂无桌位</div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}