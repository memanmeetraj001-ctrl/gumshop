import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { SiteSettings } from '../../types';
import { Save, Check, Globe, FileCode } from 'lucide-react';

export const AdminSeoPage: React.FC = () => {
  const [settings, setSettings] = useState<Partial<SiteSettings>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.getSettings().then(setSettings).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.updateSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white uppercase tracking-wider font-heading">SEO & Metadata Controls</h2>
          <p className="text-xs text-gray-400">Manage search engine optimization, OpenGraph tags, and canonical domain</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="flex items-center gap-1 text-xs text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1.5 rounded-xl">
              <Check className="w-4 h-4" /> SEO Saved
            </span>
          )}
          <button type="submit" className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center gap-2">
            <Save className="w-4 h-4" />
            <span>Save SEO Settings</span>
          </button>
        </div>
      </div>

      <div className="bg-[#14171F] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-4 text-xs">
        <div>
          <label className="block text-gray-400 font-bold uppercase mb-1">Global Site Title</label>
          <input value={settings.seoTitle || ''} onChange={e => setSettings({ ...settings, seoTitle: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-bold" />
        </div>
        <div>
          <label className="block text-gray-400 font-bold uppercase mb-1">Global Meta Description</label>
          <textarea rows={3} value={settings.seoDescription || ''} onChange={e => setSettings({ ...settings, seoDescription: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-400 font-bold uppercase mb-1">Canonical Domain</label>
            <input value={settings.canonicalUrl || 'https://gumshop.online'} onChange={e => setSettings({ ...settings, canonicalUrl: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono" />
          </div>
          <div>
            <label className="block text-gray-400 font-bold uppercase mb-1">OpenGraph OG Image URL</label>
            <input value={settings.ogImage || ''} onChange={e => setSettings({ ...settings, ogImage: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white" />
          </div>
        </div>
      </div>

      <div className="p-6 bg-[#14171F] border border-white/10 rounded-3xl flex items-center justify-between text-xs">
        <div>
          <h4 className="font-bold text-white">Dynamic Sitemap & Robots.txt</h4>
          <p className="text-gray-400 mt-0.5">Auto-generated for search engine crawlers at /sitemap.xml and /robots.txt</p>
        </div>
        <a href="/sitemap.xml" target="_blank" className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-200 font-bold rounded-xl border border-white/10">
          View Sitemap XML
        </a>
      </div>
    </form>
  );
};
