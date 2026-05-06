import { useState, useEffect } from 'react';
import { RefreshCw, Plus, Edit2, Trash2, Tag } from 'lucide-react';
import { productApi } from '../../lib/api';
import StatusBadge from '../../components/StatusBadge';
import Pagination from '../../components/Pagination';
import Modal from '../../components/Modal';

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  categoryId?: string;
  stock: number;
  images?: string[];
  status: string;
  createdAt: string;
}

interface Category {
  id: string;
  name: string;
  icon?: string;
}

const defaultForm = { name: '', description: '', price: 0, categoryId: '', stock: 100, images: '', status: 'active' };

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'products' | 'categories'>('products');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [editModal, setEditModal] = useState<{ open: boolean; product?: Product }>({ open: false });
  const [catModal, setCatModal] = useState(false);
  const [formData, setFormData] = useState<any>(defaultForm);
  const [catForm, setCatForm] = useState({ name: '', icon: '' });
  const pageSize = 20;

  useEffect(() => { loadData(); }, [statusFilter, page]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      const [prodData, catData] = await Promise.all([
        productApi.list(params) as any,
        productApi.getCategories() as any,
      ]);
      setProducts(prodData.products || prodData.data || (Array.isArray(prodData) ? prodData : []));
      setTotal(prodData.total || 0);
      setCategories(catData.categories || catData.data || (Array.isArray(catData) ? catData : []));
    } catch (e) {
      console.error('Failed to load products:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProduct = async () => {
    try {
      const payload = { ...formData, images: formData.images ? formData.images.split(',').map((s: string) => s.trim()) : [] };
      if (editModal.product) {
        await productApi.update(editModal.product.id, payload);
      } else {
        await productApi.create(payload);
      }
      setEditModal({ open: false });
      loadData();
    } catch (e: any) {
      alert('保存失败: ' + e.message);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('确定删除该商品?')) return;
    try {
      await productApi.delete(id);
      loadData();
    } catch (e: any) {
      alert('删除失败: ' + e.message);
    }
  };

  const handleSaveCategory = async () => {
    try {
      await productApi.createCategory(catForm);
      setCatModal(false);
      loadData();
    } catch (e: any) {
      alert('保存失败: ' + e.message);
    }
  };

  const openEdit = (product?: Product) => {
    setFormData(product ? { ...product, images: product.images?.join(', ') || '' } : defaultForm);
    setEditModal({ open: true, product });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-light text-white mb-1">周边商品</h2>
          <p className="text-sm text-zinc-400">管理商品和分类</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadData} className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors">
            <RefreshCw className="w-4 h-4" /> 刷新
          </button>
          <button onClick={() => openEdit()} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
            <Plus className="w-4 h-4" /> 添加商品
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setActiveTab('products')}
          className={`px-4 py-2 rounded-lg text-sm transition-colors ${activeTab === 'products' ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>
          商品列表
        </button>
        <button onClick={() => setActiveTab('categories')}
          className={`px-4 py-2 rounded-lg text-sm transition-colors ${activeTab === 'categories' ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>
          分类管理
        </button>
      </div>

      {activeTab === 'products' && (
        <div className="flex gap-2 mb-4">
          {['all', 'active', 'inactive'].map(s => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${statusFilter === s ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>
              {s === 'all' ? '全部' : s === 'active' ? '上架' : '下架'}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-zinc-500">加载中...</div>
      ) : activeTab === 'products' ? (
        products.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">暂无商品</div>
        ) : (
          <>
            <div className="space-y-3">
              {products.map(product => (
                <div key={product.id} className="bg-zinc-900/50 rounded-lg border border-zinc-800 p-4 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-white font-medium">{product.name}</span>
                      <span className="text-emerald-400 text-sm">¥{product.price.toFixed(2)}</span>
                      <StatusBadge status={product.status} />
                    </div>
                    {product.description && <p className="text-xs text-zinc-500 mb-1">{product.description}</p>}
                    <div className="flex items-center gap-3 text-xs text-zinc-500">
                      {product.categoryId && <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> {product.categoryId}</span>}
                      <span>库存: {product.stock}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 ml-4">
                    <button onClick={() => openEdit(product)} className="text-zinc-400 hover:text-white p-1"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleDeleteProduct(product.id)} className="text-zinc-400 hover:text-red-400 p-1"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
            <Pagination page={page} pageSize={pageSize} total={total} onChange={setPage} />
          </>
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

      <Modal open={editModal.open} onClose={() => setEditModal({ open: false })} title={editModal.product ? '编辑商品' : '添加商品'} maxWidth="max-w-lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">商品名称</label>
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
              <select value={formData.categoryId || ''} onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-800 text-white rounded-lg border border-zinc-700 focus:border-emerald-500 focus:outline-none">
                <option value="">选择分类</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">库存</label>
              <input type="number" value={formData.stock} onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-zinc-800 text-white rounded-lg border border-zinc-700 focus:border-emerald-500 focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">图片 URL (逗号分隔)</label>
            <input value={formData.images} onChange={e => setFormData({ ...formData, images: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-800 text-white rounded-lg border border-zinc-700 focus:border-emerald-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">状态</label>
            <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-800 text-white rounded-lg border border-zinc-700 focus:border-emerald-500 focus:outline-none">
              <option value="active">上架</option>
              <option value="inactive">下架</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setEditModal({ open: false })} className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700">取消</button>
            <button onClick={handleSaveProduct} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">保存</button>
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
            <button onClick={handleSaveCategory} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">保存</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
