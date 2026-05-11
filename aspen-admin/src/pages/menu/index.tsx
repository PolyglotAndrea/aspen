/**
 * 堂食菜单管理页面
 * 支持排序：推荐 > 新品 > 热销
 */

import { useState, useEffect } from 'react';
import { Plus, Trash2, DollarSign, RefreshCw, Star, Sparkles, Award } from 'lucide-react';
import { menuApi } from '../../lib/api';
import StatusBadge from '../../components/StatusBadge';

interface MenuItem {
  id: number;
  name: string;
  subtitle?: string;
  description?: string;
  price: number;
  originalPrice?: number;
  tags: string[];
  imageUrl?: string;
  images?: string[];
  isRecommend: boolean;
  isNew: boolean;
  isHot: boolean;
  available: boolean;
  soldCount?: number;
  rating?: number;
  ratingCount?: number;
}

export default function MenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    price: '',
    description: '',
    subtitle: '',
    tags: '',
    originalPrice: '',
    isRecommend: false,
    isNew: false,
    isHot: false,
  });

  useEffect(() => {
    loadMenu();
  }, []);

  const loadMenu = async () => {
    try {
      setLoading(true);
      const data = await menuApi.list() as any;
      const items = data.items || data.data || (Array.isArray(data) ? data : []);
      // 排序：推荐 > 新品 > 热销
      items.sort((a: MenuItem, b: MenuItem) => {
        const score = (m: MenuItem) =>
          (m.isRecommend ? 100 : 0) + (m.isNew ? 50 : 0) + (m.isHot ? 25 : 0);
        return score(b) - score(a);
      });
      setMenuItems(items);
    } catch (e) {
      console.error('Failed to load menu:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newItem.name || !newItem.price) {
      alert('请填写菜品名称和价格');
      return;
    }

    try {
      await menuApi.create({
        name: newItem.name,
        price: Number(newItem.price),
        description: newItem.description,
        subtitle: newItem.subtitle,
        tags: newItem.tags.split(',').map((t: string) => t.trim()).filter(Boolean),
        originalPrice: newItem.originalPrice ? Number(newItem.originalPrice) : undefined,
        isRecommend: newItem.isRecommend,
        isNew: newItem.isNew,
        isHot: newItem.isHot,
      });
      setShowCreateModal(false);
      setNewItem({ name: '', price: '', description: '', subtitle: '', tags: '', originalPrice: '', isRecommend: false, isNew: false, isHot: false });
      loadMenu();
    } catch (e: any) {
      alert('创建失败: ' + e.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这道菜吗？')) return;

    try {
      await menuApi.delete(id);
      loadMenu();
    } catch (e: any) {
      alert('删除失败: ' + e.message);
    }
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
      '养生': 'bg-teal-500/20 text-teal-400',
      '限定': 'bg-indigo-500/20 text-indigo-400',
    };
    const cls = colorMap[tag] || 'bg-zinc-800 text-zinc-300';
    return <span key={tag} className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>{tag}</span>;
  };

  const getScoreIcon = (item: MenuItem) => {
    if (item.isRecommend) return <Award className="w-4 h-4 text-amber-400" />;
    if (item.isNew) return <Sparkles className="w-4 h-4 text-blue-400" />;
    if (item.isHot) return <Star className="w-4 h-4 text-red-400" />;
    return null;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-light text-white mb-1">堂食菜单</h2>
          <p className="text-sm text-zinc-400">管理堂食菜品 — 排序：推荐 &gt; 新品 &gt; 热销</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadMenu}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            刷新
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            添加菜品
          </button>
        </div>
      </div>

      {/* 列表 */}
      {loading ? (
        <div className="text-center py-12 text-zinc-500">加载中...</div>
      ) : menuItems.length === 0 ? (
        <div className="text-center py-12 text-zinc-500">暂无菜品</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {menuItems.map((item) => (
            <div
              key={item.id}
              className={`bg-zinc-900/50 rounded-lg border border-zinc-800 p-4 ${
                !item.available ? 'opacity-50' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-medium text-white">{item.name}</h3>
                    {getScoreIcon(item)}
                    <StatusBadge status={item.available ? 'active' : 'inactive'} />
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-emerald-400">
                    <DollarSign className="w-4 h-4" />
                    <span className="font-semibold">{item.price.toFixed(2)}</span>
                    {item.originalPrice && item.originalPrice > item.price && (
                      <span className="line-through text-zinc-600 text-xs ml-1">¥{item.originalPrice.toFixed(2)}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 rounded-lg bg-zinc-800 text-red-400 hover:bg-red-500/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {item.subtitle && <p className="text-xs text-zinc-500 mb-1">{item.subtitle}</p>}
              {item.description && <p className="text-xs text-zinc-400 mb-3">{item.description}</p>}

              <div className="flex flex-wrap gap-2">
                {item.tags.map((tag) => renderTagBadge(tag))}
              </div>

              <div className="mt-3 pt-3 border-t border-zinc-800 flex items-center justify-between">
                <span className={`text-sm ${item.available ? 'text-green-400' : 'text-red-400'}`}>
                  {item.available ? '● 已上架' : '● 已下架'}
                </span>
                <div className="flex items-center gap-3 text-xs text-zinc-500">
                  {item.rating != null && item.rating > 0 && (
                    <span className="flex items-center gap-1 text-yellow-400">
                      <Star className="w-3 h-3" /> {item.rating.toFixed(1)}
                    </span>
                  )}
                  {item.soldCount != null && (
                    <span>已售 {item.soldCount}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 创建弹窗 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6 w-full max-w-md">
            <h3 className="text-xl font-light text-white mb-4">添加新菜品</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">菜品名称</label>
                <input
                  type="text"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                  placeholder="输入菜品名称"
                />
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-1">副标题/卖点</label>
                <input
                  type="text"
                  value={newItem.subtitle}
                  onChange={(e) => setNewItem({ ...newItem, subtitle: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                  placeholder="如：招牌必选 每日新鲜现做"
                />
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-1">价格</label>
                <input
                  type="number"
                  value={newItem.price}
                  onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                  placeholder="输入价格"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-1">原价 (划线价)</label>
                <input
                  type="number"
                  value={newItem.originalPrice}
                  onChange={(e) => setNewItem({ ...newItem, originalPrice: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                  placeholder="输入原价（非必填）"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-1">描述</label>
                <textarea
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                  rows={3}
                  placeholder="输入菜品描述"
                />
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-1">标签 (逗号分隔)</label>
                <input
                  type="text"
                  value={newItem.tags}
                  onChange={(e) => setNewItem({ ...newItem, tags: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                  placeholder="如: 招牌, 主菜, 新品"
                />
              </div>

              <div className="flex flex-wrap gap-4 mt-2">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newItem.isRecommend}
                    onChange={(e) => setNewItem({ ...newItem, isRecommend: e.target.checked })}
                    className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-amber-500 focus:ring-amber-500/50"
                  />
                  <Award className="w-4 h-4 text-amber-400" /> 推荐
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newItem.isNew}
                    onChange={(e) => setNewItem({ ...newItem, isNew: e.target.checked })}
                    className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-blue-500 focus:ring-blue-500/50"
                  />
                  <Sparkles className="w-4 h-4 text-blue-400" /> 新品
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newItem.isHot}
                    onChange={(e) => setNewItem({ ...newItem, isHot: e.target.checked })}
                    className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-red-500 focus:ring-red-500/50"
                  />
                  <Star className="w-4 h-4 text-red-400" /> 热销
                </label>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600"
                >
                  取消
                </button>
                <button
                  onClick={handleCreate}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  添加
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}