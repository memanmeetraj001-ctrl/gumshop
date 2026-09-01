import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Category } from '../../types';
import { Plus, Edit2, Trash2, Check, FolderTree } from 'lucide-react';

export const AdminCategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [editing, setEditing] = useState<Partial<Category> | null>(null);

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => {});
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    if (editing.id && categories.some(c => c.id === editing.id)) {
      const res = await api.updateCategory(editing.id, editing);
      setCategories(prev => prev.map(c => c.id === res.id  ? res  : c));
    } else {
      const res = await api.createCategory(editing);
      setCategories(prev => [...prev, res]);
    }
    setEditing(null);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete category-')) return;
    await api.deleteCategory(id);
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white uppercase tracking-wider font-heading">Categories</h2>
          <p className="text-xs text-gray-400">Manage catalog taxonomy and navigation categories</p>
        </div>
        <button
          onClick={() => setEditing({ name: '', slug: '', description: '', icon: 'Shield', sortOrder: categories.length + 1, status: 'active' })}
          className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Category</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <div key={cat.id} className="bg-[#14171F] border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-red-400 bg-red-600/10 px-2 py-0.5 rounded font-bold">#{cat.sortOrder}</span>
                <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">{cat.status}</span>
              </div>
              <h3 className="text-base font-bold text-white">{cat.name}</h3>
              <p className="text-xs text-gray-400 mt-1">{cat.description}</p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/5 flex justify-end gap-2">
              <button onClick={() => setEditing(cat)} className="p-1.5 text-gray-400 hover:text-white bg-white/5 rounded-lg"><Edit2 className="w-4 h-4" /></button>
              <button onClick={() => handleDelete(cat.id)} className="p-1.5 text-gray-400 hover:text-red-400 bg-white/5 rounded-lg"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <form onSubmit={handleSave} className="w-full max-w-md bg-[#14171F] border border-white/15 rounded-3xl p-6 space-y-4 text-xs">
            <h3 className="text-base font-bold text-white uppercase font-heading">{editing.id  ? 'Edit Category'  : 'Create Category'}</h3>
            <div>
              <label className="block text-gray-400 font-bold uppercase mb-1">Name</label>
              <input required value={editing.name || ''} onChange={e => setEditing({ ...editing, name: e.target.value })} className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white" />
            </div>
            <div>
              <label className="block text-gray-400 font-bold uppercase mb-1">Description</label>
              <textarea value={editing.description || ''} onChange={e => setEditing({ ...editing, description: e.target.value })} className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white" rows={2} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 bg-white/10 text-white rounded-xl">Cancel</button>
              <button type="submit" className="px-6 py-2 bg-red-600 text-white font-bold rounded-xl">Save</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
