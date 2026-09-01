import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { MediaItem } from '../../types';
import { Plus, Trash2, Copy, Check, Image as ImageIcon } from 'lucide-react';

export const AdminMediaPage: React.FC = () => {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [newUrl, setNewUrl] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    api.getMedia().then(setMedia).catch(() => {});
  }, []);

  const handleAddMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl) return;
    const item = await api.uploadMedia({
      filename: 'asset-' + Date.now().toString(36) + '.jpg',
      url: newUrl,
      type: 'image',
      size: 250000,
      folder: 'general',
    });
    setMedia(prev => [item, ...prev]);
    setNewUrl('');
  };

  const handleCopy = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (id: string) => {
    await api.deleteMedia(id);
    setMedia(prev => prev.filter(m => m.id !== id));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white uppercase tracking-wider font-heading">Media Library</h2>
        <p className="text-xs text-gray-400">Store and manage high-resolution product photography and gallery assets</p>
      </div>

      <form onSubmit={handleAddMedia} className="flex gap-3 max-w-xl">
        <input
          required
          value={newUrl}
          onChange={e => setNewUrl(e.target.value)}
          placeholder="Paste Image URL (e.g. Unsplash, CDN)..."
          className="flex-1 px-4 py-2.5 rounded-xl bg-[#14171F] border border-white/10 text-white text-xs"
        />
        <button type="submit" className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase rounded-xl">
          Add Media
        </button>
      </form>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
        {media.map((item) => (
          <div key={item.id} className="bg-[#14171F] border border-white/10 rounded-2xl overflow-hidden group">
            <div className="aspect-square bg-black relative">
              <img src={item.url} alt={item.filename} className="w-full h-full object-cover" />
            </div>
            <div className="p-3 flex items-center justify-between text-xs">
              <span className="font-mono text-[10px] text-gray-400 truncate max-w-[120px]">{item.filename}</span>
              <div className="flex gap-1">
                <button onClick={() => handleCopy(item.url, item.id)} className="p-1 text-gray-400 hover:text-white" title="Copy URL">
                  {copiedId === item.id  ? <Check className="w-3.5 h-3.5 text-emerald-400" />  : <Copy className="w-3.5 h-3.5" />}
                </button>
                <button onClick={() => handleDelete(item.id)} className="p-1 text-gray-500 hover:text-red-400">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
