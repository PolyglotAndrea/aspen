import { useState, useEffect } from 'react';
import { Save, Image as ImageIcon, Video, FileText, Globe, Store, Link as LinkIcon, Plus, Trash2 } from 'lucide-react';
import { brandApi } from '../../lib/api';

interface Story {
  id: string;
  title: string;
  content: string;
}

interface SocialLink {
  platform: string;
  url: string;
}

export default function BrandPage() {
  const [brandData, setBrandData] = useState({
    name: 'ASPEN',
    logoUrl: '',
    shortDesc: '白杨树下的静谧与火焰',
    videoUrl: 'https://cdn.aspen.com/brand-bg.mp4',
    tagline: '你见过白杨树吗',
    socialLinks: [
      { platform: 'WeChat', url: '' },
      { platform: 'Xiaohongshu', url: '' },
    ] as SocialLink[],
    stories: [
      { id: 'origin', title: 'UNDER THE ASPEN', content: '白杨树下的静谧与火焰，在城市中寻找一片自然的栖息地...' },
      { id: 'philosophy', title: '自然与匠心', content: '我们相信，最好的料理源于对自然的敬畏...' },
    ] as Story[],
  });

  const [isSaving, setIsSaving] = useState(false);

  // 加载品牌数据
  useEffect(() => {
    const loadBrand = async () => {
      try {
        const data = await brandApi.get();
        setBrandData((prev) => ({
          ...prev,
          name: data.name || prev.name,
          logoUrl: data.logoUrl || prev.logoUrl,
          shortDesc: data.shortDesc || prev.shortDesc,
          videoUrl: data.videoUrl || prev.videoUrl,
          tagline: data.tagline || prev.tagline,
          socialLinks: data.socialLinks || prev.socialLinks,
          stories: data.stories || prev.stories,
        }));
      } catch (e) {
        console.error('Failed to load brand data:', e);
      }
    };
    loadBrand();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await brandApi.update(brandData);
      alert('保存成功');
    } catch (e) {
      alert('保存失败');
    } finally {
      setIsSaving(false);
    }
  };

  const updateStory = (id: string, field: 'title' | 'content', value: string) => {
    setBrandData({
      ...brandData,
      stories: brandData.stories.map((s) =>
        s.id === id ? { ...s, [field]: value } : s
      ),
    });
  };

  const addStory = () => {
    setBrandData({
      ...brandData,
      stories: [...brandData.stories, { id: Date.now().toString(), title: '', content: '' }],
    });
  };

  const removeStory = (id: string) => {
    setBrandData({
      ...brandData,
      stories: brandData.stories.filter(s => s.id !== id),
    });
  };

  const updateSocialLink = (index: number, field: 'platform' | 'url', value: string) => {
    const newLinks = [...brandData.socialLinks];
    newLinks[index][field] = value;
    setBrandData({ ...brandData, socialLinks: newLinks });
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/40 p-6 rounded-2xl border border-zinc-800/60 shadow-sm backdrop-blur-xl">
        <div>
          <h2 className="text-2xl font-semibold text-zinc-100 tracking-tight">品牌管理</h2>
          <p className="text-sm text-zinc-400 mt-1">定制您的品牌视觉、基本信息与核心故事，这将在小程序端展示给客户。</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center justify-center gap-2 px-6 py-2.5 bg-zinc-100 text-zinc-900 font-medium rounded-xl hover:bg-white transition-colors disabled:opacity-50 shadow-sm whitespace-nowrap"
        >
          <Save className="w-4 h-4" />
          {isSaving ? '保存中...' : '保存所有更改'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Basic Info & Media */}
        <div className="lg:col-span-1 space-y-8">
          
          {/* Basic Info */}
          <section className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl overflow-hidden shadow-sm backdrop-blur-xl">
            <div className="px-6 py-4 border-b border-zinc-800/60 flex items-center gap-3 bg-zinc-900/20">
              <Store className="w-5 h-5 text-zinc-400" />
              <h3 className="text-base font-semibold text-zinc-100">基本信息</h3>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">品牌名称</label>
                <input
                  type="text"
                  value={brandData.name}
                  onChange={(e) => setBrandData({ ...brandData, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-zinc-950/50 border border-zinc-800 rounded-xl text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-700 focus:border-transparent transition-all"
                  placeholder="例如: ASPEN"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">品牌一句话简介</label>
                <input
                  type="text"
                  value={brandData.shortDesc}
                  onChange={(e) => setBrandData({ ...brandData, shortDesc: e.target.value })}
                  className="w-full px-4 py-2.5 bg-zinc-950/50 border border-zinc-800 rounded-xl text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-700 focus:border-transparent transition-all"
                  placeholder="例如: 白杨树下的静谧与火焰"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">品牌标语 (Tagline)</label>
                <textarea
                  value={brandData.tagline}
                  onChange={(e) => setBrandData({ ...brandData, tagline: e.target.value })}
                  className="w-full px-4 py-2.5 bg-zinc-950/50 border border-zinc-800 rounded-xl text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-700 focus:border-transparent transition-all resize-none"
                  rows={2}
                  placeholder="输入品牌宣发标语..."
                />
              </div>
            </div>
          </section>

          {/* Media Links */}
          <section className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl overflow-hidden shadow-sm backdrop-blur-xl">
            <div className="px-6 py-4 border-b border-zinc-800/60 flex items-center gap-3 bg-zinc-900/20">
              <Globe className="w-5 h-5 text-zinc-400" />
              <h3 className="text-base font-semibold text-zinc-100">媒体与链接</h3>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-zinc-500" />
                  品牌 Logo URL
                </label>
                <input
                  type="text"
                  value={brandData.logoUrl}
                  onChange={(e) => setBrandData({ ...brandData, logoUrl: e.target.value })}
                  className="w-full px-4 py-2.5 bg-zinc-950/50 border border-zinc-800 rounded-xl text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-700 focus:border-transparent transition-all"
                  placeholder="https://cdn.example.com/logo.png"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2 flex items-center gap-2">
                  <Video className="w-4 h-4 text-zinc-500" />
                  宣传视频 URL
                </label>
                <input
                  type="text"
                  value={brandData.videoUrl}
                  onChange={(e) => setBrandData({ ...brandData, videoUrl: e.target.value })}
                  className="w-full px-4 py-2.5 bg-zinc-950/50 border border-zinc-800 rounded-xl text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-700 focus:border-transparent transition-all"
                  placeholder="输入视频链接"
                />
              </div>
              <div className="pt-2 border-t border-zinc-800/60">
                <label className="block text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-zinc-500" />
                  社交媒体
                </label>
                <div className="space-y-3">
                  {brandData.socialLinks.map((link, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-1/3 px-3 py-2 bg-zinc-800/50 rounded-lg text-xs text-zinc-400 font-medium border border-zinc-800">
                        {link.platform}
                      </div>
                      <input
                        type="text"
                        value={link.url}
                        onChange={(e) => updateSocialLink(index, 'url', e.target.value)}
                        className="w-2/3 px-3 py-2 bg-zinc-950/50 border border-zinc-800 rounded-lg text-zinc-100 text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600 transition-all"
                        placeholder="主页链接..."
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Stories */}
        <div className="lg:col-span-2">
          <section className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl overflow-hidden shadow-sm backdrop-blur-xl h-full flex flex-col">
            <div className="px-6 py-4 border-b border-zinc-800/60 flex items-center justify-between bg-zinc-900/20 shrink-0">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-zinc-400" />
                <h3 className="text-base font-semibold text-zinc-100">品牌故事集</h3>
              </div>
              <button
                onClick={addStory}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-100 bg-zinc-800 hover:bg-zinc-700 rounded-lg border border-zinc-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                添加篇章
              </button>
            </div>
            
            <div className="p-6 space-y-6 flex-1">
              {brandData.stories.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-zinc-500 border-2 border-dashed border-zinc-800 rounded-xl">
                  <FileText className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-sm">暂无品牌故事，点击右上角添加</p>
                </div>
              ) : (
                brandData.stories.map((story, index) => (
                  <div key={story.id} className="group relative bg-zinc-950/30 border border-zinc-800 rounded-xl p-5 transition-all hover:border-zinc-700">
                    <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => removeStory(story.id)}
                        className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors"
                        title="删除该篇章"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="mb-4 pr-8">
                      <span className="inline-block px-2.5 py-1 bg-zinc-800/80 text-zinc-300 text-xs font-medium rounded-md mb-3 border border-zinc-700/50">
                        篇章 {index + 1}
                      </span>
                      <input
                        type="text"
                        value={story.title}
                        onChange={(e) => updateStory(story.id, 'title', e.target.value)}
                        className="w-full bg-transparent border-b border-zinc-800 focus:border-zinc-500 text-lg font-medium text-zinc-100 placeholder:text-zinc-600 focus:outline-none transition-colors pb-1"
                        placeholder="输入故事标题..."
                      />
                    </div>
                    <div>
                      <textarea
                        value={story.content}
                        onChange={(e) => updateStory(story.id, 'content', e.target.value)}
                        className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-800/80 rounded-xl text-zinc-300 text-sm leading-relaxed placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600 transition-all min-h-[120px] resize-y"
                        placeholder="撰写动人的品牌故事..."
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
