import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { NavigationItem } from '../../types';
import { Plus, Edit2, Trash2, Check, ArrowUp, ArrowDown } from 'lucide-react';

export const AdminNavigationPage: React.FC = () => {
  const [items, setItems] = useState<NavigationItem[]>([]);
  const [editing, setEditing] = useState<Partial<NavigationItem> | null>(null);

  useEffect(() => {
    api.getNavigation().then(setItems).catch(() => {});
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    if (editing.id && items.some(i => i.id === editing.id)) {
      const res = await api.updateNavItem(editing.id, editing);
      setItems(prev => prev.map(i => i.id === res.id  ? res  : i));
    } else {
      const res = await api.createNavItem(editing);
      setItems(prev => [...prev, res]);
    }
    setEditing(null);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete navigation item-')) return;
    await api.deleteNavItem(id);
    setItems(prev => prev.filter(i => i.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white uppercase tracking-wider font-heading">Navigation Menu Builder</h2>
          <p className="text-xs text-gray-400">Add, remove, and reorder header menu items without modifying source code</p>
        </div>
        <button
          onClick={() => setEditing({ label: '', url: '/', sortOrder: items.length + 1, visible: true, openNewTab: false, parentId: null })}
          className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Menu Item</span>
        </button>
      </div>

      <div className="bg-[#14171F] border border-white/10 rounded-2xl divide-y divide-white/5 overflow-hidden">
        {items.map((item) => (
          <div key={item.id} className="p-4 flex items-center justify-between hover:bg-white/5 text-xs">
            <div className="flex items-center gap-3">
              <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${item.parentId  ? 'bg-blue-500/20 text-blue-400'  : 'bg-red-600/20 text-red-400'}`}>
                {item.parentId  ? 'Sub-Item'  : 'Parent Item'}
              </span>
              <span className="font-bold text-white text-sm">{item.label}</span>
              <span className="text-gray-500 font-mono">{item.url}</span>
              {item.badge && <span className="px-1.5 py-0.5 bg-red-600 text-white text-[10px] rounded font-bold">{item.badge}</span>}
            </div>

            <div className="flex items-center gap-2">
              <button onClick={() => setEditing(item)} className="p-1.5 text-gray-400 hover:text-white bg-white/5 rounded-lg"><Edit2 className="w-4 h-4" /></button>
              <button onClick={() => handleDelete(item.id)} className="p-1.5 text-gray-400 hover:text-red-400 bg-white/5 rounded-lg"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <form onSubmit={handleSave} className="w-full max-w-md bg-[#14171F] border border-white/15 rounded-3xl p-6 space-y-4 text-xs">
            <h3 className="text-base font-bold text-white uppercase font-heading">{editing.id  ? 'Edit Menu Item'  : 'Create Menu Item'}</h3>
            <div>
              <label className="block text-gray-400 font-bold uppercase mb-1">Label</label>
              <input required value={editing.label || ''} onChange={e => setEditing({ ...editing, label: e.target.value })} className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white" />
            </div>
            <div>
              <label className="block text-gray-400 font-bold uppercase mb-1">URL Path</label>
              <input required value={editing.url || ''} onChange={e => setEditing({ ...editing, url: e.target.value })} className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white" />
            </div>
            <div>
              <label className="block text-gray-400 font-bold uppercase mb-1">Parent Item (For Dropdown)</label>
              <select value={editing.parentId || ''} onChange={e => setEditing({ ...editing, parentId: e.target.value || null })} className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white">
                <option value="">None (Top Level)</option>
                {items.filter(i => !i.parentId && i.id !== editing.id).map(p => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-gray-400 font-bold uppercase mb-1">Badge Text (e.g. Save 25%)</label>
              <input value={editing.badge || ''} onChange={e => setEditing({ ...editing, badge: e.target.value })} className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white" />
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
