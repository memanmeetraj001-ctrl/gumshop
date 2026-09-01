import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Promotion } from '../../types';
import { Plus, Edit2, Trash2, Tag } from 'lucide-react';

export const AdminPromotionsPage: React.FC = () => {
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [editing, setEditing] = useState<Partial<Promotion>>({ title: '', description: '', ctaText: 'Shop Now', ctaUrl: '/collections/all', discountCode: 'SAVE10', enabled: true, type: 'banner' });
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    api.getPromotions().then(setPromos).catch(() => {});
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing.id) {
      const res = await api.updatePromotion(editing.id, editing);
      setPromos(prev => prev.map(p => p.id === res.id  ? res  : p));
    } else {
      const res = await api.createPromotion(editing);
      setPromos(prev => [...prev, res]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete promotion-')) return;
    await api.deletePromotion(id);
    setPromos(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white uppercase tracking-wider font-heading">Promotions & Popups</h2>
          <p className="text-xs text-gray-400">Manage site-wide announcement banners, discount codes, and welcome popups</p>
        </div>
        <button
          onClick={() => { setEditing({ title: '', description: '', ctaText: 'Shop Now', ctaUrl: '/collections/all', discountCode: 'SAVE10', enabled: true, type: 'banner' }); setIsModalOpen(true); }}
          className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Promotion</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {promos.map((promo) => (
          <div key={promo.id} className="bg-[#14171F] border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold uppercase text-red-400 bg-red-600/20 px-2 py-0.5 rounded">
                  {promo.type}
                </span>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${promo.enabled  ? 'bg-emerald-500/20 text-emerald-400'  : 'bg-gray-500/20 text-gray-400'}`}>
                  {promo.enabled  ? 'Active'  : 'Disabled'}
                </span>
              </div>
              <h3 className="text-base font-bold text-white mt-2">{promo.title}</h3>
              <p className="text-xs text-gray-400 mt-1">{promo.description}</p>
              {promo.discountCode && (
                <div className="mt-3 inline-block bg-black/40 border border-white/10 px-2.5 py-1 rounded text-xs font-mono font-bold text-amber-400">
                  Code: {promo.discountCode}
                </div>
              )}
            </div>
            <div className="mt-4 pt-3 border-t border-white/5 flex justify-end gap-2">
              <button onClick={() => { setEditing(promo); setIsModalOpen(true); }} className="p-1.5 text-gray-400 hover:text-white bg-white/5 rounded-lg"><Edit2 className="w-4 h-4" /></button>
              <button onClick={() => handleDelete(promo.id)} className="p-1.5 text-gray-400 hover:text-red-400 bg-white/5 rounded-lg"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <form onSubmit={handleSave} className="w-full max-w-md bg-[#14171F] border border-white/15 rounded-3xl p-6 space-y-4 text-xs">
            <h3 className="text-base font-bold text-white uppercase font-heading">{editing.id  ? 'Edit Promotion'  : 'New Promotion'}</h3>
            <div>
              <label className="block text-gray-400 font-bold uppercase mb-1">Title</label>
              <input required value={editing.title || ''} onChange={e => setEditing({ ...editing, title: e.target.value })} className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white" />
            </div>
            <div>
              <label className="block text-gray-400 font-bold uppercase mb-1">Description</label>
              <textarea value={editing.description || ''} onChange={e => setEditing({ ...editing, description: e.target.value })} className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white" rows={2} />
            </div>
            <div>
              <label className="block text-gray-400 font-bold uppercase mb-1">Discount Code</label>
              <input value={editing.discountCode || ''} onChange={e => setEditing({ ...editing, discountCode: e.target.value })} className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-white/10 text-white rounded-xl">Cancel</button>
              <button type="submit" className="px-6 py-2 bg-red-600 text-white font-bold rounded-xl">Save</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
