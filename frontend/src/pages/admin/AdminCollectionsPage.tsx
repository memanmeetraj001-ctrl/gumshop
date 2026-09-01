import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Collection } from '../../types';
import { Plus, Edit2, Trash2 } from 'lucide-react';

export const AdminCollectionsPage: React.FC = () => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [editing, setEditing] = useState<Partial<Collection> | null>(null);

  useEffect(() => {
    api.getCollections().then(setCollections).catch(() => {});
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    if (editing.id && collections.some(c => c.id === editing.id)) {
      const res = await api.updateCollection(editing.id, editing);
      setCollections(prev => prev.map(c => c.id === res.id  ? res  : c));
    } else {
      const res = await api.createCollection(editing);
      setCollections(prev => [...prev, res]);
    }
    setEditing(null);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete collection-')) return;
    await api.deleteCollection(id);
    setCollections(prev => prev.filter(c => c.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white uppercase tracking-wider font-heading">Collections</h2>
          <p className="text-xs text-gray-400">Curated product showcases (Best Sellers, Pro Detailing Series)</p>
        </div>
        <button
          onClick={() => setEditing({ title: '', slug: '', description: '', productIds: [], sortOrder: collections.length + 1, status: 'published' })}
          className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Collection</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {collections.map((col) => (
          <div key={col.id} className="bg-[#14171F] border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
            <div>
              <span className="text-[10px] uppercase font-mono text-red-400 bg-red-600/10 px-2 py-0.5 rounded font-bold">/{col.slug}</span>
              <h3 className="text-base font-bold text-white mt-2">{col.title}</h3>
              <p className="text-xs text-gray-400 mt-1">{col.description}</p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/5 flex justify-end gap-2">
              <button onClick={() => setEditing(col)} className="p-1.5 text-gray-400 hover:text-white bg-white/5 rounded-lg"><Edit2 className="w-4 h-4" /></button>
              <button onClick={() => handleDelete(col.id)} className="p-1.5 text-gray-400 hover:text-red-400 bg-white/5 rounded-lg"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <form onSubmit={handleSave} className="w-full max-w-md bg-[#14171F] border border-white/15 rounded-3xl p-6 space-y-4 text-xs">
            <h3 className="text-base font-bold text-white uppercase font-heading">{editing.id  ? 'Edit Collection'  : 'Create Collection'}</h3>
            <div>
              <label className="block text-gray-400 font-bold uppercase mb-1">Title</label>
              <input required value={editing.title || ''} onChange={e => setEditing({ ...editing, title: e.target.value })} className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white" />
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
