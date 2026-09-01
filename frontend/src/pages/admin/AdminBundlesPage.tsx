import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Bundle } from '../../types';
import { formatPrice } from '../../utils/formatters';
import { Plus, Edit2, Trash2 } from 'lucide-react';

export const AdminBundlesPage: React.FC = () => {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [editing, setEditing] = useState<Partial<Bundle> | null>(null);

  useEffect(() => {
    api.getBundles().then(setBundles).catch(() => {});
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    if (editing.id && bundles.some(b => b.id === editing.id)) {
      const res = await api.updateBundle(editing.id, editing);
      setBundles(prev => prev.map(b => b.id === res.id  ? res  : b));
    } else {
      const res = await api.createBundle(editing);
      setBundles(prev => [...prev, res]);
    }
    setEditing(null);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete bundle-')) return;
    await api.deleteBundle(id);
    setBundles(prev => prev.filter(b => b.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white uppercase tracking-wider font-heading">Bundles & Kits</h2>
          <p className="text-xs text-gray-400">Manage upgrade packages and Gumroad bundle checkout URLs</p>
        </div>
        <button
          onClick={() => setEditing({ name: '', slug: '', description: '', price: 149.99, compareAtPrice: 199.99, ctaText: 'Buy Bundle on Gumroad', gumroadUrl: 'https://gumroad.com/l/demo-bundle', image: 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9-auto=format&fit=crop&w=1200&q=80', status: 'published', sortOrder: bundles.length + 1 })}
          className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Bundle</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {bundles.map((bundle) => (
          <div key={bundle.id} className="bg-[#14171F] border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-base font-bold text-white">{bundle.name}</h3>
                <span className="text-sm font-black text-red-400">{formatPrice(bundle.price)}</span>
              </div>
              <p className="text-xs text-gray-400 line-clamp-2">{bundle.description}</p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/5 flex justify-end gap-2">
              <button onClick={() => setEditing(bundle)} className="p-1.5 text-gray-400 hover:text-white bg-white/5 rounded-lg"><Edit2 className="w-4 h-4" /></button>
              <button onClick={() => handleDelete(bundle.id)} className="p-1.5 text-gray-400 hover:text-red-400 bg-white/5 rounded-lg"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <form onSubmit={handleSave} className="w-full max-w-md bg-[#14171F] border border-white/15 rounded-3xl p-6 space-y-4 text-xs">
            <h3 className="text-base font-bold text-white uppercase font-heading">{editing.id  ? 'Edit Bundle'  : 'Create Bundle'}</h3>
            <div>
              <label className="block text-gray-400 font-bold uppercase mb-1">Bundle Name</label>
              <input required value={editing.name || ''} onChange={e => setEditing({ ...editing, name: e.target.value })} className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-400 font-bold uppercase mb-1">Price ($)</label>
                <input type="number" step="0.01" value={editing.price || 0} onChange={e => setEditing({ ...editing, price: parseFloat(e.target.value) })} className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white" />
              </div>
              <div>
                <label className="block text-gray-400 font-bold uppercase mb-1">Compare Price ($)</label>
                <input type="number" step="0.01" value={editing.compareAtPrice || 0} onChange={e => setEditing({ ...editing, compareAtPrice: parseFloat(e.target.value) })} className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white" />
              </div>
            </div>
            <div>
              <label className="block text-gray-400 font-bold uppercase mb-1">Gumroad URL</label>
              <input value={editing.gumroadUrl || ''} onChange={e => setEditing({ ...editing, gumroadUrl: e.target.value })} className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white" />
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
