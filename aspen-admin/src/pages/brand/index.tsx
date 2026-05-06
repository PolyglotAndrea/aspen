import { useState, useEffect } from 'react';
import { Save, Image, Video, FileText } from 'lucide-react';
import { brandApi } from '../../lib/api';

interface Story {
  id: string;
  title: string;
  content: string;
}

export default function BrandPage() {
  const [brandData, setBrandData] = useState({
    videoUrl: 'https://cdn.aspen.com/brand-bg.mp4',
    tagline: '你见过白杨树吗',
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
        setBrandData({
          videoUrl: data.videoUrl || '',
          tagline: data.tagline || '',
          stories: data.stories || [],
        });
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-light text-white mb-1">品牌管理</h2>
          <p className="text-sm text-slate-400">管理品牌视觉和故事</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {isSaving ? '保存中...' : '保存修改'}
        </button>
      </div>

      <div className="space-y-6">
        {/* Video Section */}
        <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-4">
          <div className="flex items-center gap-2 mb-4">
            <Video className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-medium text-white">品牌视频</h3>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">视频 URL</label>
            <input
              type="text"
              value={brandData.videoUrl}
              onChange={(e) => setBrandData({ ...brandData, videoUrl: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
              placeholder="输入视频链接"
            />
          </div>
          <div className="mt-3 aspect-video bg-slate-900 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Video className="w-12 h-12 text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-500">视频预览区域</p>
            </div>
          </div>
        </div>

        {/* Tagline */}
        <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-4">
          <div className="flex items-center gap-2 mb-4">
            <Image className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-medium text-white">品牌标语</h3>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">主标语</label>
            <input
              type="text"
              value={brandData.tagline}
              onChange={(e) => setBrandData({ ...brandData, tagline: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
              placeholder="输入品牌标语"
            />
          </div>
        </div>

        {/* Stories */}
        <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-4">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-medium text-white">品牌故事</h3>
          </div>

          <div className="space-y-4">
            {brandData.stories.map((story, index) => (
              <div key={story.id} className="p-4 bg-slate-900 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-slate-500">故事 {index + 1}</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">标题</label>
                    <input
                      type="text"
                      value={story.title}
                      onChange={(e) => updateStory(story.id, 'title', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">内容</label>
                    <textarea
                      value={story.content}
                      onChange={(e) => updateStory(story.id, 'content', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                      rows={4}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
