import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { ThemeSettings } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { Save, Check, Palette } from 'lucide-react';

export const AdminAppearancePage: React.FC = () => {
  const { theme, refreshTheme } = useTheme();
  const [form, setForm] = useState<Partial<ThemeSettings>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (theme) setForm(theme);
  }, [theme]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.updateTheme(form);
    await refreshTheme();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white uppercase tracking-wider font-heading">Appearance & Theme Studio</h2>
          <p className="text-xs text-gray-400">Live customization of brand identity, theme colors, and layout styling</p>
        </div>

        <div className="flex items-center gap-3">
          {saved && (
            <span className="flex items-center gap-1 text-xs text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1.5 rounded-xl">
              <Check className="w-4 h-4" /> Changes Applied Live
            </span>
          )}
          <button type="submit" className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center gap-2">
            <Save className="w-4 h-4" />
            <span>Save Appearance</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        {/* Brand Information */}
        <div className="bg-[#14171F] border border-white/10 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase font-heading">Brand Identity</h3>
          <div>
            <label className="block text-gray-400 font-bold uppercase mb-1">Brand Name</label>
            <input value={form.brandName || ''} onChange={e => setForm({ ...form, brandName: e.target.value })} className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-sm" />
          </div>
          <div>
            <label className="block text-gray-400 font-bold uppercase mb-1">Tagline</label>
            <input value={form.tagline || ''} onChange={e => setForm({ ...form, tagline: e.target.value })} className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white" />
          </div>
          <div>
            <label className="block text-gray-400 font-bold uppercase mb-1">Announcement Bar Text</label>
            <input value={form.announcementText || ''} onChange={e => setForm({ ...form, announcementText: e.target.value })} className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white" />
          </div>
          <div>
            <label className="block text-gray-400 font-bold uppercase mb-1">Announcement Link</label>
            <input value={form.announcementLink || ''} onChange={e => setForm({ ...form, announcementLink: e.target.value })} className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white" />
          </div>
        </div>

        {/* Colors */}
        <div className="bg-[#14171F] border border-white/10 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase font-heading">Automotive Color Palette</h3>
          <div>
            <label className="block text-gray-400 font-bold uppercase mb-1">Primary Accent Color</label>
            <div className="flex items-center gap-3">
              <input type="color" value={form.accentColor || '#EF4444'} onChange={e => setForm({ ...form, accentColor: e.target.value, buttonColor: e.target.value })} className="w-10 h-10 rounded-lg bg-transparent border-0 cursor-pointer" />
              <input value={form.accentColor || '#EF4444'} onChange={e => setForm({ ...form, accentColor: e.target.value, buttonColor: e.target.value })} className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white font-mono" />
            </div>
          </div>
          <div>
            <label className="block text-gray-400 font-bold uppercase mb-1">Background Color</label>
            <div className="flex items-center gap-3">
              <input type="color" value={form.backgroundColor || '#0A0C0F'} onChange={e => setForm({ ...form, backgroundColor: e.target.value })} className="w-10 h-10 rounded-lg bg-transparent border-0 cursor-pointer" />
              <input value={form.backgroundColor || '#0A0C0F'} onChange={e => setForm({ ...form, backgroundColor: e.target.value })} className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white font-mono" />
            </div>
          </div>
          <div>
            <label className="block text-gray-400 font-bold uppercase mb-1">Announcement Bar Background</label>
            <div className="flex items-center gap-3">
              <input type="color" value={form.announcementBg || '#EF4444'} onChange={e => setForm({ ...form, announcementBg: e.target.value })} className="w-10 h-10 rounded-lg bg-transparent border-0 cursor-pointer" />
              <input value={form.announcementBg || '#EF4444'} onChange={e => setForm({ ...form, announcementBg: e.target.value })} className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white font-mono" />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};
