import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { BlogPost } from '../../types';
import { formatDate } from '../../utils/formatters';
import { Plus, Edit2, Trash2, BookOpen } from 'lucide-react';

export const AdminBlogPage: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [editing, setEditing] = useState<Partial<BlogPost> | null>(null);

  useEffect(() => {
    api.getBlogPosts().then(setPosts).catch(() => {});
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    if (editing.id && posts.some(p => p.id === editing.id)) {
      const res = await api.updateBlogPost(editing.id, editing);
      setPosts(prev => prev.map(p => p.id === res.id  ? res  : p));
    } else {
      const res = await api.createBlogPost(editing);
      setPosts(prev => [...prev, res]);
    }
    setEditing(null);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete article-')) return;
    await api.deleteBlogPost(id);
    setPosts(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white uppercase tracking-wider font-heading">Blog & Fitment Articles</h2>
          <p className="text-xs text-gray-400">Publish guides, product breakdowns, and workspace articles</p>
        </div>
        <button
          onClick={() => setEditing({ title: '', slug: '', excerpt: '', content: '## Article Title\n\nArticle content here...', featuredImage: 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9-auto=format&fit=crop&w=1200&q=80', status: 'published', readTime: '4 min read' })}
          className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Article</span>
        </button>
      </div>

      <div className="space-y-4">
        {posts.map((post) => (
          <div key={post.id} className="bg-[#14171F] border border-white/10 rounded-2xl p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <img src={post.featuredImage} alt={post.title} className="w-16 h-16 object-cover rounded-xl shrink-0 bg-black" />
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-mono text-red-400 bg-red-600/10 px-2 py-0.5 rounded font-bold">/{post.slug}</span>
                <h3 className="text-sm font-bold text-white truncate mt-1">{post.title}</h3>
                <p className="text-xs text-gray-400 truncate">{post.excerpt}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setEditing(post)} className="p-1.5 text-gray-400 hover:text-white bg-white/5 rounded-lg"><Edit2 className="w-4 h-4" /></button>
              <button onClick={() => handleDelete(post.id)} className="p-1.5 text-gray-400 hover:text-red-400 bg-white/5 rounded-lg"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <form onSubmit={handleSave} className="w-full max-w-2xl bg-[#14171F] border border-white/15 rounded-3xl p-6 space-y-4 text-xs max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-white uppercase font-heading">{editing.id  ? 'Edit Article'  : 'New Article'}</h3>
            <div>
              <label className="block text-gray-400 font-bold uppercase mb-1">Title</label>
              <input required value={editing.title || ''} onChange={e => setEditing({ ...editing, title: e.target.value })} className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-bold" />
            </div>
            <div>
              <label className="block text-gray-400 font-bold uppercase mb-1">Excerpt</label>
              <textarea rows={2} value={editing.excerpt || ''} onChange={e => setEditing({ ...editing, excerpt: e.target.value })} className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white" />
            </div>
            <div>
              <label className="block text-gray-400 font-bold uppercase mb-1">Content (Markdown)</label>
              <textarea rows={6} value={editing.content || ''} onChange={e => setEditing({ ...editing, content: e.target.value })} className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 bg-white/10 text-white rounded-xl">Cancel</button>
              <button type="submit" className="px-6 py-2 bg-red-600 text-white font-bold rounded-xl">Save Article</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
