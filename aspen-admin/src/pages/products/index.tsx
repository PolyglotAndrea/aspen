import { useState, useEffect } from 'react';
import { RefreshCw, Plus, Edit2, Trash2, Tag, Star, Award, Sparkles, Image as ImageIcon, X } from 'lucide-react';
import { productApi } from '../../lib/api';
import StatusBadge from '../../components/StatusBadge';
import Pagination from '../../components/Pagination';
import Modal from '../../components/Modal';

interface Product {
  id: string;
  name: string;
  subtitle?: string;
  description?: string;
  price: number;
  originalPrice?: number;
  categoryId?: string;
  stock: number;
  unit?: string;
  images?: string[];
  videoUrl?: string;
  tags: string[];
  specs?: any[];
  isRecommend: boolean;
  isNew: boolean;
  isHot: boolean;
  soldCount: number;
  rating: number;
  ratingCount: number;
  status: string;
  sort: number;
  createdAt: string;
}

interface Sku {
  id: string;
  name: string;
  price: number;
  stock: number;
  sort: number;
}

interface Category {
  id: string;
  name: string;
  icon?: string;
  image?: string;
  description?: string;
  parentId?: string;
}

interface ProductForm {
  name: string;
  subtitle: string;
  description: string;
  price: number;
  originalPrice: number;
  categoryId: string;
  stock: number;
  unit: string;
  images: string[];
  videoUrl: string;
  tags: string[];
  isRecommend: boolean;
  isNew: boolean;
  isHot: boolean;
  sort: number;
  status: string;
  specs: any[];
  skus: Sku[];
}

const defaultForm: ProductForm = {
  name: '',
  subtitle: '',
  description: '',
  price: 0,
  originalPrice: 0,
  categoryId: '',
  stock: 999,
  unit: '份',
  images: [],
  videoUrl: '',
  tags: [],
  isRecommend: false,
  isNew: false,
  isHot: false,
  sort: 0,
  status: 'active',
  specs: [],
  skus: [],
};

const TAG_OPTIONS = ['招牌', '新品', '热销', '推荐', '必点', '辣', '甜', '酸', '养生', '限定'];
const UNIT_OPTIONS = ['份', '碗', '杯', '个', '盘', '套', '瓶', '盒', '斤', 'kg'];

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
  const [skuModal, setSkuModal] = useState(false);
  const [formData, setFormData] = useState<ProductForm>(defaultForm);
  const [catForm, setCatForm] = useState({ name: '', icon: '', image: '', description: '', parentId: '' });
  const [tagInput, setTagInput] = useState('');
  const [imageInput, setImageInput] = useState('');

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
      const payload = {
        ...formData,
        skus: formData.skus,
      };
      if (editModal.product) {
        await productApi.update(editModal.product.id, payload);
      } else {
        await productApi.create(payload);
      }
      setEditModal({ open: false });
      setFormData(defaultForm);
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
      setCatForm({ name: '', icon: '', image: '', description: '', parentId: '' });
      loadData();
    } catch (e: any) {
      alert('保存失败: ' + e.message);
    }
  };

  const openEdit = (product?: Product) => {
    if (product) {
      setFormData({
        name: product.name,
        subtitle: product.subtitle || '',
        description: product.description || '',
        price: product.price,
        originalPrice: product.originalPrice || 0,
        categoryId: product.categoryId || '',
        stock: product.stock,
        unit: product.unit || '份',
        images: product.images || [],
        videoUrl: product.videoUrl || '',
        tags: product.tags || [],
        isRecommend: product.isRecommend || false,
        isNew: product.isNew || false,
        isHot: product.isHot || false,
        sort: product.sort || 0,
        status: product.status,
        specs: product.specs || [],
        skus: [],
      });
      // 加载 SKU
      productApi.getSkus(product.id).then((res: any) => {
        setFormData(prev => ({ ...prev, skus: res.skus || [] }));
      }).catch(() => {
        // SKU 加载失败也继续
      });
    } else {
      setFormData(defaultForm);
    }
    setEditModal({ open: true, product });
  };

  const addTag = (tag: string) => {
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }));
    }
    setTagInput('');
  };

  const addImage = (url: string) => {
    if (url.trim()) {
      setFormData(prev => ({ ...prev, images: [...prev.images, url.trim()] }));
    }
    setImageInput('');
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  // SKU 操作
  const openSkuModal = () => {
    setSkuModal(true);
  };

  const addSku = () => {
    setFormData(prev => ({
      ...prev,
      skus: [...prev.skus, { id: '', name: '', price: 0, stock: 999, sort: prev.skus.length }],
    }));
  };

  const updateSku = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const skus = [...prev.skus];
      skus[index] = { ...skus[index], [field]: value };
      return { ...prev, skus };
    });
  };

  const removeSku = (index: number) => {
    setFormData(prev => ({
      ...prev,
      skus: prev.skus.filter((_, i) => i !== index),
    }));
  };

  const formatCurrency = (value: number) => {
    return value != null ? `¥${value.toFixed(2)}` : '-';
  };

  const renderTagBadge = (tag: string) => {
    const colorMap: Record<string, string> = {
      '招牌': 'bg-amber-500/20 text-amber-400',
      '新品': 'bg-blue-500/20 text-blue-400',
      '热销': 'bg-red-500/20 text-red-400',
      '推荐': 'bg-emerald-500/20 text-emerald-400',
      '必点': 'bg-purple-500/20 text-purple-400',
      '辣': 'bg-orange-500/20 text-orange-400',
      '甜': 'bg-pink-500/20 text-pink-400',
      '酸': 'bg-yellow-500/20 text-yellow-400',
      '养生': 'bg-teal-500/20 text-teal-400',
      '限定': 'bg-indigo-500/20 text-indigo-400',
    };
    const cls = colorMap[tag] || 'bg-zinc-800 text-zinc-300';
    return <span key={tag} className={`px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{tag}</span>;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-light text-white mb-1">周边商品</h2>
          <p className="text-sm text-zinc-400">管理商品和分类 — 支持 SKU、营销标签、富文本</p>
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
                <div key={product.id} className="bg-zinc-900/50 rounded-lg border border-zinc-800 p-4">
                  <div className="flex items-start gap-4">
                    {/* 图片预览 */}
                    {product.images?.[0] && (
                      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-zinc-800">
                        <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      {/* 名称 + 状态 + 营销标签 */}
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-white font-medium truncate">{product.name}</span>
                        {product.isRecommend && <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded">荐</span>}
                        {product.isNew && <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded">新</span>}
                        {product.isHot && <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-xs rounded">热</span>}
                        <StatusBadge status={product.status} />
                      </div>
                      {/* 副标题 */}
                      {product.subtitle && <p className="text-xs text-zinc-500 mb-1 truncate">{product.subtitle}</p>}
                      {/* 价格 + 原价 + 销量评分 */}
                      <div className="flex items-center gap-3 text-sm text-zinc-400 flex-wrap">
                        <span className="text-emerald-400 font-semibold">{formatCurrency(product.price)}</span>
                        {(product.originalPrice && product.originalPrice > product.price) && (
                          <span className="line-through text-zinc-600 text-xs">{formatCurrency(product.originalPrice!)}</span>
                        )}
                        {product.rating > 0 && (
                          <span className="flex items-center gap-1 text-yellow-400 text-xs">
                            <Star className="w-3 h-3" /> {product.rating.toFixed(1)} ({product.ratingCount})
                          </span>
                        )}
                        <span className="text-zinc-600 text-xs">销量: {product.soldCount}</span>
                        {product.categoryId && <span className="flex items-center gap-1 text-zinc-600 text-xs"><Tag className="w-3 h-3" />{product.categoryId}</span>}
                        {product.tags?.map(t => <span key={t} className="text-xs px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-400">{t}</span>)}
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => openEdit(product)} className="text-zinc-400 hover:text-white p-1" title="编辑"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteProduct(product.id)} className="text-zinc-400 hover:text-red-400 p-1" title="删除"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Pagination page={page} pageSize={20} total={total} onChange={setPage} />
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
                    <div className="flex flex-col">
                      <span className="text-white font-medium">{cat.name}</span>
                      {cat.description && <span className="text-xs text-zinc-500">{cat.description}</span>}
                    </div>
                  </div>
                  <button onClick={() => { productApi.deleteCategory(cat.id).then(loadData); }} className="text-zinc-500 hover:text-red-400 text-sm px-2 py-1 rounded hover:bg-zinc-800">删除</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 商品编辑弹窗 */}
      <Modal open={editModal.open} onClose={() => { setEditModal({ open: false }); setFormData(defaultForm); }} title={editModal.product ? '编辑商品' : '添加商品'} maxWidth="max-w-2xl">
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          {/* 商品基本信息 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm text-zinc-400 mb-1">商品名称 *</label>
              <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-800 text-white rounded-lg border border-zinc-700 focus:border-emerald-500 focus:outline-none" placeholder="输入商品名称" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm text-zinc-400 mb-1">副标题/卖点</label>
              <input value={formData.subtitle} onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-800 text-white rounded-lg border border-zinc-700 focus:border-emerald-500 focus:outline-none" placeholder="如: 招牌必点 每日新鲜现做" />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">价格 *</label>
              <input type="number" step="0.01" value={formData.price} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-zinc-800 text-white rounded-lg border border-zinc-700 focus:border-emerald-500 focus:outline-none" placeholder="0.00" />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">原价/划线价</label>
              <input type="number" step="0.01" value={formData.originalPrice || ''} onChange={e => setFormData({ ...formData, originalPrice: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-zinc-800 text-white rounded-lg border border-zinc-700 focus:border-emerald-500 focus:outline-none" placeholder="0.00" />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">分类</label>
              <select value={formData.categoryId} onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-800 text-white rounded-lg border border-zinc-700 focus:border-emerald-500 focus:outline-none">
                <option value="">未分类</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">单位</label>
              <select value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-800 text-white rounded-lg border border-zinc-700 focus:border-emerald-500 focus:outline-none">
                {UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">库存</label>
              <input type="number" value={formData.stock} onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-zinc-800 text-white rounded-lg border border-zinc-700 focus:border-emerald-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">排序</label>
              <input type="number" value={formData.sort} onChange={e => setFormData({ ...formData, sort: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-zinc-800 text-white rounded-lg border border-zinc-700 focus:border-emerald-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">状态</label>
              <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-800 text-white rounded-lg border border-zinc-700 focus:border-emerald-500 focus:outline-none">
                <option value="active">上架</option>
                <option value="inactive">下架</option>
                <option value="offline">售罄</option>
              </select>
            </div>
          </div>

          {/* 富文本描述 */}
          <div>
            <label className="block text-sm text-zinc-400 mb-1">商品描述 (富文本)</label>
            <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
              rows={6}
              className="w-full px-3 py-2 bg-zinc-800 text-white rounded-lg border border-zinc-700 focus:border-emerald-500 focus:outline-none resize-none"
              placeholder="支持 HTML 格式，粘贴富文本内容..." />
          </div>

          {/* 营销标签 */}
          <div>
            <label className="block text-sm text-zinc-400 mb-2">营销标签</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags.map(tag => renderTagBadge(tag))}
              {formData.tags.length === 0 && <span className="text-zinc-600 text-xs">暂无标签</span>}
            </div>
            <div className="flex gap-2">
              <select value={tagInput} onChange={e => setTagInput(e.target.value)}
                className="flex-1 px-3 py-1.5 bg-zinc-800 text-white rounded-lg border border-zinc-700 focus:border-emerald-500 focus:outline-none text-sm">
                <option value="">选择标签</option>
                {TAG_OPTIONS.filter(t => !formData.tags.includes(t)).map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <button onClick={() => addTag(tagInput)} disabled={!tagInput}
                className="px-3 py-1.5 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 disabled:opacity-40 text-sm">
                <Tag className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-1 flex gap-2">
              {['推荐', '新品', '热销'].map(flag => (
                <label key={flag} className="flex items-center gap-1 text-sm cursor-pointer">
                  <input type="checkbox"
                    checked={flag === '推荐' ? formData.isRecommend : flag === '新品' ? formData.isNew : formData.isHot}
                    onChange={e => setFormData(prev => ({
                      ...prev,
                      [flag === '推荐' ? 'isRecommend' : flag === '新品' ? 'isNew' : 'isHot']: e.target.checked,
                    }))}
                    className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-emerald-500 focus:ring-emerald-500/50"
                  />
                  {flag === '推荐' && <Award className="w-3 h-3 text-amber-400" />}
                  {flag === '新品' && <Sparkles className="w-3 h-3 text-blue-400" />}
                  {flag === '热销' && <Star className="w-3 h-3 text-red-400" />}
                  <span>{flag === '推荐' ? '推荐' : flag === '新品' ? '新品' : '热销'}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 图片管理 */}
          <div>
            <label className="block text-sm text-zinc-400 mb-2">商品图片</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.images.map((img, i) => (
                <div key={i} className="relative group">
                  <img src={img} alt="" className="w-16 h-16 rounded-lg object-cover border border-zinc-700" />
                  <button onClick={() => removeImage(i)} className="absolute -top-1 -right-1 bg-red-500/90 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {formData.images.length === 0 && <span className="text-zinc-600 text-xs">暂无图片</span>}
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

          {/* 视频 */}
          <div>
            <label className="block text-sm text-zinc-400 mb-1">视频 URL</label>
            <input value={formData.videoUrl} onChange={e => setFormData({ ...formData, videoUrl: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-800 text-white rounded-lg border border-zinc-700 focus:border-emerald-500 focus:outline-none text-sm" placeholder="视频地址（可选）" />
          </div>

          {/* SKU 管理 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm text-zinc-400 mb-0">商品规格 (SKU)</label>
              <button onClick={openSkuModal} className="text-xs text-zinc-400 hover:text-white px-2 py-0.5 rounded bg-zinc-800">
                管理 SKU ({formData.skus.length})
              </button>
            </div>
            {formData.skus.length > 0 && (
              <div className="space-y-1">
                {formData.skus.map(sku => (
                  <div key={sku.id} className="flex items-center justify-between bg-zinc-800/50 rounded px-3 py-2 text-sm">
                    <span className="text-zinc-300">{sku.name}</span>
                    <span className="text-emerald-400 font-medium">{formatCurrency(sku.price)}</span>
                  </div>
                ))}
              </div>
            )}
            {formData.skus.length === 0 && (
              <p className="text-zinc-600 text-xs">暂未设置规格</p>
            )}
          </div>

          {/* 规格选项 (specs) */}
          <div>
            <label className="block text-sm text-zinc-400 mb-1">规格选项 (JSON)</label>
            <textarea value={JSON.stringify(formData.specs, null, 2)} onChange={e => {
              try {
                setFormData(prev => ({ ...prev, specs: JSON.parse(e.target.value) }));
              } catch {
                // 无效 JSON
              }
            }} rows={3}
              className="w-full px-3 py-2 bg-zinc-800 text-white rounded-lg border border-zinc-700 focus:border-emerald-500 focus:outline-none resize-none font-mono text-xs"
              placeholder='[{"name":"颜色","options":[{"label":"红色","price":0},{"label":"蓝色","price":0}]}]' />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={() => { setEditModal({ open: false }); setFormData(defaultForm); }}
            className="flex-1 px-4 py-2 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600">取消</button>
          <button onClick={handleSaveProduct}
            className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">保存</button>
        </div>
      </Modal>

      {/* SKU 管理弹窗 */}
      <Modal open={skuModal} onClose={() => setSkuModal(false)} title="管理商品规格 (SKU)" maxWidth="max-w-lg">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-400">为商品添加不同规格选项（如尺寸、口味等）</p>
            <button onClick={addSku} className="flex items-center gap-1 px-3 py-1.5 bg-zinc-800 text-zinc-300 text-sm rounded-lg hover:bg-zinc-700">
              <Plus className="w-3 h-3" /> 添加规格
            </button>
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {formData.skus.map((sku, index) => (
              <div key={index} className="bg-zinc-800/50 rounded-lg p-3 flex items-center gap-3">
                <div className="flex flex-col gap-1 flex-1">
                  <input value={sku.name} onChange={e => updateSku(index, 'name', e.target.value)}
                    className="px-2 py-1 bg-zinc-900 text-white rounded border border-zinc-700 text-sm focus:border-emerald-500 focus:outline-none" placeholder="规格名称 如: 大杯" />
                  <div className="flex gap-2">
                    <input type="number" step="0.01" value={sku.price} onChange={e => updateSku(index, 'price', Number(e.target.value))}
                      className="px-2 py-1 bg-zinc-900 text-white rounded border border-zinc-700 text-sm w-24 focus:border-emerald-500 focus:outline-none" placeholder="价格" />
                    <input type="number" value={sku.stock} onChange={e => updateSku(index, 'stock', Number(e.target.value))}
                      className="px-2 py-1 bg-zinc-900 text-white rounded border border-zinc-700 text-sm w-24 focus:border-emerald-500 focus:outline-none" placeholder="库存" />
                    <input type="number" value={sku.sort} onChange={e => updateSku(index, 'sort', Number(e.target.value))}
                      className="px-2 py-1 bg-zinc-900 text-white rounded border border-zinc-700 text-sm w-16 focus:border-emerald-500 focus:outline-none" placeholder="排序" />
                  </div>
                </div>
                <button onClick={() => removeSku(index)} className="text-red-400 hover:text-red-300 p-1 flex-shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setSkuModal(false)} className="px-4 py-2 bg-zinc-700 text-zinc-300 rounded-lg hover:bg-zinc-600">关闭</button>
            <button onClick={() => setSkuModal(false)} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">确认</button>
          </div>
        </div>
      </Modal>

      {/* 分类弹窗 */}
      <Modal open={catModal} onClose={() => setCatModal(false)} title="添加分类" maxWidth="max-w-md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-1">分类名称</label>
            <input value={catForm.name} onChange={e => setCatForm({ ...catForm, name: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-800 text-white rounded-lg border border-zinc-700 focus:border-emerald-500 focus:outline-none" placeholder="分类名称" />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">图标</label>
            <input value={catForm.icon} onChange={e => setCatForm({ ...catForm, icon: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-800 text-white rounded-lg border border-zinc-700 focus:border-emerald-500 focus:outline-none" placeholder="图标 emoji，如 🍔" />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">分类图片 URL</label>
            <input value={catForm.image} onChange={e => setCatForm({ ...catForm, image: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-800 text-white rounded-lg border border-zinc-700 focus:border-emerald-500 focus:outline-none" placeholder="分类图片 URL" />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">描述</label>
            <input value={catForm.description} onChange={e => setCatForm({ ...catForm, description: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-800 text-white rounded-lg border border-zinc-700 focus:border-emerald-500 focus:outline-none" placeholder="分类描述" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setCatModal(false)} className="px-4 py-2 bg-zinc-700 text-zinc-300 rounded-lg hover:bg-zinc-600">取消</button>
            <button onClick={handleSaveCategory} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">保存</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}