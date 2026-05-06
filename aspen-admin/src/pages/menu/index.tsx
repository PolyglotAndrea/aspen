/**
 * 菜单管理页面
 */

import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, DollarSign, RefreshCw } from 'lucide-react';
import { menuApi } from '../lib/api';

interface MenuItem {
  id: number;
  name: string;
  price: number;
  description?: string;
  tags: string[];
  available: boolean;
}

export default function MenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    price: '',
    description: '',
    tags: '',
  });

  useEffect(() => {
    loadMenu();
  }, []);

  const loadMenu = async () => {
    try {
      setLoading(true);
      const data = await menuApi.list() as any;
      setMenuItems(data.items || []);
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
        tags: newItem.tags.split(',').map((t) => t.trim()).filter(Boolean),
      });
      setShowCreateModal(false);
      setNewItem({ name: '', price: '', description: '', tags: '' });
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

  return (
    <div>
      {/* 顶部栏 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-light text-white mb-1">菜单管理</h2>
          <p className="text-sm text-zinc-400">管理菜品列表和价格</p>
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
                  <h3 className="text-lg font-medium text-white">{item.name}</h3>
                  <div className="flex items-center gap-1 mt-1 text-emerald-400">
                    <DollarSign className="w-4 h-4" />
                    <span className="font-semibold">{item.price}</span>
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

              {item.description && (
                <p className="text-sm text-zinc-400 mb-3">{item.description}</p>
              )}

              <div className="flex flex-wrap gap-2">
                {item.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 text-xs rounded-full bg-zinc-800 text-zinc-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="mt-3 pt-3 border-t border-zinc-800">
                <span className={`text-sm ${item.available ? 'text-green-400' : 'text-red-400'}`}>
                  {item.available ? '● 已上架' : '● 已下架'}
                </span>
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
                <label className="block text-sm text-zinc-400 mb-1">价格</label>
                <input
                  type="number"
                  value={newItem.price}
                  onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                  placeholder="输入价格"
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
                  placeholder="如: 招牌, 主菜"
                />
              </div>
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
      )}
    </div>
  );
}
