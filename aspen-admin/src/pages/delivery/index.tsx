import { useState, useEffect } from 'react';
import { RefreshCw, Plus, Edit2, Trash2, Tag } from 'lucide-react';
import { deliveryApi } from '../../lib/api';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  stock: number;
  tags?: string[];
  image?: string;
  available: boolean;
}

interface Category {
  id: string;
  name: string;
  icon?: string;
}

const defaultMenuForm = { name: '', description: '', price: 0, category: '', stock: 100, tags: '', image: '', available: true };

export default function DeliveryPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'items' | 'categories'>('items');
  const [editModal, setEditModal] = useState<{ open: boolean; item?: MenuItem }>({ open: false });
  const [catModal, setCatModal] = useState(false);
  const [formData, setFormData] = useState<any>(defaultMenuForm);
  const [catForm, setCatForm] = useState({ name: '', icon: '' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [menuData, catData] = await Promise.all([
        deliveryApi.getMenu() as any,
        deliveryApi.getCategories() as any,
      ]);
      setItems(menuData.items || menuData.data || (Array.isArray(menuData) ? menuData : []));
      setCategories(catData.categories || catData.data || (Array.isArray(catData) ? catData : []));
    } catch (e) {
      console.error('Failed to load delivery data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveItem = async () => {
    try {
      const payload = { ...formData, tags: formData.tags ? formData.tags.split(',').map((t: string) => t.trim()) : [] };
      if (editModal.item) {
        await deliveryApi.updateMenuItem(editModal.item.id, payload);
      } else {
        await deliveryApi.createMenuItem(payload);
      }
      setEditModal({ open: false });
      loadData();
    } catch (e: any) {
      alert('保存失败: ' + e.message);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('确定删除该菜品?')) return;
    try {
      await deliveryApi.deleteMenuItem(id);
      loadData();
    } catch (e: any) {
      alert('删除失败: ' + e.message);
    }
  };

  const openEdit = (item?: MenuItem) => {
    setFormData(item ? { ...item, tags: item.tags?.join(', ') || '' } : defaultMenuForm);
    setEditModal({ open: true, item });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-light text-white mb-1">外卖菜单</h2>
          <p className="text-sm text-zinc-400">管理外卖菜品和分类</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadData} className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors">
            <RefreshCw className="w-4 h-4" /> 刷新
          </button>
          <button onClick={() => openEdit()} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
            <Plus className="w-4 h-4" /> 添加菜品
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setActiveTab('items')}
          className={`px-4 py-2 rounded-lg text-sm transition-colors ${activeTab === 'items' ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>
          菜品列表
        </button>
        <button onClick={() => setActiveTab('categories')}
          className={`px-4 py-2 rounded-lg text-sm transition-colors ${activeTab === 'categories' ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>
          分类管理
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-zinc-500">加载中...</div>
      ) : activeTab === 'items' ? (
        items.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">暂无菜品</div>
        ) : (
          <div className="space-y-3">
            {items.map(item => (
              <div key={item.id} className="bg-zinc-900/50 rounded-lg border border-zinc-800 p-4 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-white font-medium">{item.name}</span>
                    <span className="text-emerald-400 text-sm">¥{item.price.toFixed(2)}</span>
                    {!item.available && <StatusBadge status="inactive" />}
                  </div>
                  {item.description && <p className="text-xs text-zinc-500 mb-1">{item.description}</p>}
                  <div className="flex items-center gap-3 text-xs text-zinc-500">
                    <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> {item.category || '未分类'}</span>
                    <span>库存: {item.stock}</span>
                    {item.tags?.length ? <span>{item.tags.join(', ')}</span> : null}
                  </div>
                </div>
                <div className="flex gap-1 ml-4">
                  <button onClick={() => openEdit(item)} className="text-zinc-400 hover:text-white p-1"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => handleDeleteItem(item.id)} className="text-zinc-400 hover:text-red-400 p-1"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div>
          <div className="flex justify-end mb-4">
            <button onClick={() => setCatModal(true)} className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 text-zinc-300 text-sm rounded-lg hover:bg-zinc-700">
              <Plus className="w-3 h-3" /> 添加分类
            </button>
          </div>
          {categories.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">暂无分类</div>
          ) : (
            <div className="space-y-2">
              {categories.map(cat => (
                <div key={cat.id} className="bg-zinc-900/50 rounded-lg border border-zinc-800 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {cat.icon && <span className="text-lg">{cat.icon}</span>}
                    <span className="text-white">{cat.name}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <Modal open={editModal.open} onClose={() => setEditModal({ open: false })} title={editModal.item ? '编辑菜品' : '添加菜品'} maxWidth="max-w-lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">菜品名称</label>
              <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-800 text-white rounded-lg border border-zinc-700 focus:border-emerald-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">价格</label>
              <input type="number" step="0.01" value={formData.price} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-zinc-800 text-white rounded-lg border border-zinc-700 focus:border-emerald-500 focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">描述</label>
            <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={2}
              className="w-full px-3 py-2 bg-zinc-800 text-white rounded-lg border border-zinc-700 focus:border-emerald-500 focus:outline-none resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">分类</label>
              <input value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-800 text-white rounded-lg border border-zinc-700 focus:border-emerald-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">库存</label>
              <input type="number" value={formData.stock} onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-zinc-800 text-white rounded-lg border border-zinc-700 focus:border-emerald-500 focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">标签 (逗号分隔)</label>
            <input value={formData.tags} onChange={e => setFormData({ ...formData, tags: e.target.value })} placeholder="热销, 新品, 推荐"
              className="w-full px-3 py-2 bg-zinc-800 text-white rounded-lg border border-zinc-700 focus:border-emerald-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">图片 URL</label>
            <input value={formData.image} onChange={e => setFormData({ ...formData, image: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-800 text-white rounded-lg border border-zinc-700 focus:border-emerald-500 focus:outline-none" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="delivery-available" checked={formData.available} onChange={e => setFormData({ ...formData, available: e.target.checked })} />
            <label htmlFor="delivery-available" className="text-sm text-zinc-400">上架</label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setEditModal({ open: false })} className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700">取消</button>
            <button onClick={handleSaveItem} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">保存</button>
          </div>
        </div>
      </Modal>

      <Modal open={catModal} onClose={() => setCatModal(false)} title="添加分类">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-1">分类名称</label>
            <input value={catForm.name} onChange={e => setCatForm({ ...catForm, name: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-800 text-white rounded-lg border border-zinc-700 focus:border-emerald-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">图标 (emoji)</label>
            <input value={catForm.icon} onChange={e => setCatForm({ ...catForm, icon: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-800 text-white rounded-lg border border-zinc-700 focus:border-emerald-500 focus:outline-none" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setCatModal(false)} className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700">取消</button>
            <button onClick={() => { setCatModal(false); loadData(); }} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">保存</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
