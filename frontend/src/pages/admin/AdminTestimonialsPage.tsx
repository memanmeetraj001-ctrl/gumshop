import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Testimonial } from '../../types';
import { Plus, Edit2, Trash2, Star, ShieldCheck } from 'lucide-react';

export const AdminTestimonialsPage: React.FC = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [editing, setEditing] = useState<Partial<Testimonial> | null>(null);

  useEffect(() => {
    api.getTestimonials().then(setTestimonials).catch(() => {});
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    if (editing.id && testimonials.some(t => t.id === editing.id)) {
      const res = await api.updateTestimonial(editing.id, editing);
      setTestimonials(prev => prev.map(t => t.id === res.id  ? res  : t));
    } else {
      const res = await api.createTestimonial(editing);
      setTestimonials(prev => [...prev, res]);
    }
    setEditing(null);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete review-')) return;
    await api.deleteTestimonial(id);
    setTestimonials(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white uppercase tracking-wider font-heading">Testimonials CMS</h2>
          <p className="text-xs text-gray-400">Manage customer & detailer verified reviews</p>
        </div>
        <button
          onClick={() => setEditing({ name: '', title: 'Auto Enthusiast', review: '', rating: 5, verified: true, published: true, sortOrder: testimonials.length + 1 })}
          className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Review</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {testimonials.map((test) => (
          <div key={test.id} className="bg-[#14171F] border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex text-amber-400">
                  {[...Array(test.rating || 5)].map((_, i) => (<Star key={i} className="w-3.5 h-3.5 fill-amber-400" />))}
                </div>
                {test.verified && <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">Verified</span>}
              </div>
              <p className="text-xs text-gray-200 italic mb-4">"{test.review}"</p>
              <h4 className="text-xs font-bold text-white">{test.name}</h4>
              <p className="text-[11px] text-gray-500">{test.title}</p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/5 flex justify-end gap-2">
              <button onClick={() => setEditing(test)} className="p-1.5 text-gray-400 hover:text-white bg-white/5 rounded-lg"><Edit2 className="w-4 h-4" /></button>
              <button onClick={() => handleDelete(test.id)} className="p-1.5 text-gray-400 hover:text-red-400 bg-white/5 rounded-lg"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <form onSubmit={handleSave} className="w-full max-w-md bg-[#14171F] border border-white/15 rounded-3xl p-6 space-y-4 text-xs">
            <h3 className="text-base font-bold text-white uppercase font-heading">{editing.id  ? 'Edit Testimonial'  : 'New Testimonial'}</h3>
            <div>
              <label className="block text-gray-400 font-bold uppercase mb-1">Customer Name</label>
              <input required value={editing.name || ''} onChange={e => setEditing({ ...editing, name: e.target.value })} className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white" />
            </div>
            <div>
              <label className="block text-gray-400 font-bold uppercase mb-1">Title / Shop Name</label>
              <input value={editing.title || ''} onChange={e => setEditing({ ...editing, title: e.target.value })} className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white" />
            </div>
            <div>
              <label className="block text-gray-400 font-bold uppercase mb-1">Review</label>
              <textarea required rows={3} value={editing.review || ''} onChange={e => setEditing({ ...editing, review: e.target.value })} className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white" />
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
