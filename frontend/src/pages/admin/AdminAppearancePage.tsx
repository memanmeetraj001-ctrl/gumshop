import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { ThemeSettings } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { THEME_PRESETS, ThemePreset } from '../../utils/themePresets';
import {
  Save,
  Check,
  Palette,
  Sparkles,
  Eye,
  Sliders,
  Type,
  Layers,
  RotateCcw,
  CheckCircle2,
  Tag,
  ShoppingBag,
  ExternalLink,
} from 'lucide-react';

export const AdminAppearancePage: React.FC = () => {
  const { theme, refreshTheme } = useTheme();
  const [form, setForm] = useState<Partial<ThemeSettings>>({});
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [appliedPresetId, setAppliedPresetId] = useState<string | null>('cyber-tech');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (theme) {
      setForm(theme);
    }
  }, [theme]);

  const handleApplyPreset = (preset: ThemePreset) => {
    setForm((prev) => ({
      ...prev,
      ...preset.settings,
    }));
    setAppliedPresetId(preset.id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateTheme(form);
      await refreshTheme();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save appearance settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const categories = [
    { id: 'all', label: 'All Niches (8)' },
    { id: 'tech', label: 'Tech & EDC' },
    { id: 'fashion', label: 'Luxury Fashion' },
    { id: 'wellness', label: 'Wellness & Beauty' },
    { id: 'digital', label: 'Digital Assets' },
    { id: 'gaming', label: 'Gaming & Merch' },
    { id: 'food', label: 'Coffee & Gourmet' },
    { id: 'home', label: 'Home & Living' },
    { id: 'streetwear', label: 'Streetwear Drops' },
  ];

  const filteredPresets =
    activeCategory === 'all'
      ? THEME_PRESETS
      : THEME_PRESETS.filter((p) => p.category === activeCategory);

  const previewBg = form.backgroundColor || '#0A0C0F';
  const previewSurface = form.surfaceColor || '#14171F';
  const previewAccent = form.accentColor || '#6366F1';
  const previewText = form.textColor || '#F9FAFB';
  const previewMuted = form.mutedTextColor || '#9CA3AF';
  const previewBtn = form.buttonColor || previewAccent;
  const previewBtnText = form.buttonTextColor || '#FFFFFF';
  const previewBtnRadius = form.buttonRadius || '10px';
  const previewCardRadius = form.cardRadius || '16px';
  const previewAnnouncementBg = form.announcementBg || previewAccent;
  const previewAnnouncementText = form.announcementText || '⚡ Flash Sale is Live · Limited Time Only';

  return (
    <form onSubmit={handleSubmit} className="space-y-10 max-w-6xl">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Palette className="w-3.5 h-3.5" />
            <span>Theme &amp; Brand Studio</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight font-heading">
            Storefront Appearance &amp; Presets
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Choose a prebuilt industry theme or customize colors, fonts, and component radii.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {saved && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2 rounded-xl">
              <Check className="w-4 h-4" /> Live Theme Saved
            </span>
          )}
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-900/40 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Applying Live…' : 'Save Appearance'}</span>
          </button>
        </div>
      </div>

      {/* ── Section 1: Prebuilt Category Themes ── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <h2 className="text-base font-black text-white uppercase tracking-wider">
              1-Click Category Theme Presets
            </h2>
          </div>
          <span className="text-xs text-gray-500">Click any theme to preview and apply instantly</span>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setActiveCategory(c.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                activeCategory === c.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/50'
                  : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/5'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Presets Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredPresets.map((preset) => {
            const isApplied = appliedPresetId === preset.id;
            return (
              <div
                key={preset.id}
                onClick={() => handleApplyPreset(preset)}
                className={`group cursor-pointer rounded-2xl border p-5 flex flex-col justify-between transition-all duration-200 relative ${
                  isApplied
                    ? 'border-indigo-500 bg-gradient-to-b from-indigo-950/40 to-[#14171F] ring-2 ring-indigo-500/40 shadow-xl'
                    : 'border-white/10 bg-[#12141C] hover:border-white/20 hover:bg-[#161822]'
                }`}
              >
                {preset.badge && (
                  <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-white/10 border border-white/15 text-[10px] font-black uppercase text-indigo-300">
                    {preset.badge}
                  </span>
                )}

                <div className="space-y-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{preset.icon}</span>
                    <div>
                      <h3 className="text-xs font-black text-white group-hover:text-indigo-400 transition-colors">
                        {preset.name}
                      </h3>
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                        {preset.categoryLabel}
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-gray-400 leading-relaxed line-clamp-2">
                    {preset.description}
                  </p>

                  {/* 4-Color Swatch Bar */}
                  <div className="flex items-center gap-1.5 pt-1">
                    {preset.previewColors.map((col, idx) => (
                      <div
                        key={idx}
                        className="w-5 h-5 rounded-full border border-white/20 shadow-sm"
                        style={{ backgroundColor: col }}
                        title={col}
                      />
                    ))}
                    <span className="text-[10px] text-gray-500 ml-1 font-mono">
                      {preset.settings.buttonRadius} radius
                    </span>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-white/5">
                  <div
                    className={`w-full py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider text-center transition-all ${
                      isApplied
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-white/5 text-gray-400 group-hover:bg-white/10 group-hover:text-white'
                    }`}
                  >
                    {isApplied ? '✓ Theme Applied' : 'Apply Preset'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Section 2: Live Storefront Mini-Mockup Preview ── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-white/5 pb-3">
          <Eye className="w-4 h-4 text-indigo-400" />
          <h2 className="text-base font-black text-white uppercase tracking-wider">
            Live Storefront Component Preview
          </h2>
        </div>

        <div
          className="rounded-3xl border border-white/10 p-6 sm:p-8 space-y-6 transition-colors shadow-2xl"
          style={{ backgroundColor: previewBg }}
        >
          {/* Mock Announcement Bar */}
          <div
            className="py-2 px-4 rounded-xl text-center text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2"
            style={{ backgroundColor: previewAnnouncementBg, color: '#FFFFFF' }}
          >
            <span>{previewAnnouncementText}</span>
          </div>

          {/* Mock Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shadow-md text-sm"
                style={{ backgroundColor: previewAccent }}
              >
                G
              </div>
              <div>
                <span className="text-base font-black tracking-wider uppercase" style={{ color: previewText }}>
                  {form.brandName || 'My Store'}
                </span>
                <p className="text-[11px]" style={{ color: previewMuted }}>
                  {form.tagline || 'Curated premium essentials'}
                </p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-4 text-xs font-semibold" style={{ color: previewMuted }}>
              <span className="hover:underline cursor-pointer" style={{ color: previewText }}>All Products</span>
              <span className="hover:underline cursor-pointer">Collections</span>
              <span className="hover:underline cursor-pointer">About Us</span>
              <span className="hover:underline cursor-pointer">Track Order</span>
            </div>
          </div>

          {/* Mock Product Showcase Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { title: 'Studio Wireless Headphones', tag: 'Acoustics', price: '$189.00', was: '$229.00' },
              { title: 'Full-Grain Leather Wallet', tag: 'Everyday Carry', price: '$49.00', was: '$65.00' },
              { title: 'Artisan Mech Keyboard', tag: 'Desk Setup', price: '$149.00', was: '$180.00' },
            ].map((item, i) => (
              <div
                key={i}
                className="p-5 border border-white/10 flex flex-col justify-between space-y-4 transition-all"
                style={{ backgroundColor: previewSurface, borderRadius: previewCardRadius }}
              >
                <div className="space-y-2">
                  <span
                    className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider"
                    style={{ backgroundColor: `${previewAccent}25`, color: previewAccent }}
                  >
                    {item.tag}
                  </span>
                  <h4 className="text-xs font-bold" style={{ color: previewText }}>
                    {item.title}
                  </h4>
                  <div className="flex items-baseline gap-2">
                    <span className="text-base font-black" style={{ color: previewText }}>
                      {item.price}
                    </span>
                    <span className="text-xs line-through" style={{ color: previewMuted }}>
                      {item.was}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="w-full py-2 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-md"
                  style={{
                    backgroundColor: previewBtn,
                    color: previewBtnText,
                    borderRadius: previewBtnRadius,
                  }}
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Instant Checkout</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Section 3: Fine-Tuning Studio Controls ── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-white/5 pb-3">
          <Sliders className="w-4 h-4 text-indigo-400" />
          <h2 className="text-base font-black text-white uppercase tracking-wider">
            Fine-Tune Colors &amp; Styling
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          {/* Brand Copy & Identity */}
          <div className="bg-[#14171F] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-white/5">
              <Type className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-black text-white uppercase tracking-wider">
                Store Identity &amp; Header
              </h3>
            </div>

            <div>
              <label className="block text-gray-300 font-semibold mb-1">Store Brand Name</label>
              <input
                type="text"
                value={form.brandName || ''}
                onChange={(e) => setForm({ ...form, brandName: e.target.value })}
                placeholder="e.g. AudioGear Co."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0F] border border-white/10 text-white font-bold text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-gray-300 font-semibold mb-1">Store Tagline</label>
              <input
                type="text"
                value={form.tagline || ''}
                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                placeholder="e.g. Everyday carry & studio acoustics"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0F] border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-gray-300 font-semibold mb-1">Top Announcement Bar Text</label>
              <input
                type="text"
                value={form.announcementText || ''}
                onChange={(e) => setForm({ ...form, announcementText: e.target.value })}
                placeholder="e.g. Free Worldwide Express on Orders Over $75"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0F] border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Component Radii & Geometry */}
          <div className="bg-[#14171F] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-white/5">
              <Layers className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-black text-white uppercase tracking-wider">
                Corner Radii &amp; Shape
              </h3>
            </div>

            <div>
              <label className="block text-gray-300 font-semibold mb-1.5">Button Border Radius</label>
              <div className="grid grid-cols-4 gap-2">
                {['2px', '8px', '14px', '24px'].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setForm({ ...form, buttonRadius: r })}
                    className={`py-2 rounded-xl border text-xs font-mono font-bold transition-all ${
                      form.buttonRadius === r
                        ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300'
                        : 'border-white/10 bg-[#0A0A0F] text-gray-400 hover:text-white'
                    }`}
                  >
                    {r} {r === '2px' ? '(Sharp)' : r === '24px' ? '(Pill)' : ''}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-gray-300 font-semibold mb-1.5">Product Card Border Radius</label>
              <div className="grid grid-cols-4 gap-2">
                {['4px', '12px', '18px', '24px'].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setForm({ ...form, cardRadius: r })}
                    className={`py-2 rounded-xl border text-xs font-mono font-bold transition-all ${
                      form.cardRadius === r
                        ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300'
                        : 'border-white/10 bg-[#0A0A0F] text-gray-400 hover:text-white'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Color Palette Controls */}
          <div className="bg-[#14171F] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-4 md:col-span-2">
            <div className="flex items-center gap-2 pb-2 border-b border-white/5">
              <Palette className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-black text-white uppercase tracking-wider">
                Custom Color Palette
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {/* Primary Accent */}
              <div>
                <label className="block text-gray-300 font-semibold mb-1">Primary Accent</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.accentColor || '#6366F1'}
                    onChange={(e) => setForm({ ...form, accentColor: e.target.value })}
                    className="w-9 h-9 rounded-lg bg-transparent border-0 cursor-pointer shrink-0"
                  />
                  <input
                    type="text"
                    value={form.accentColor || '#6366F1'}
                    onChange={(e) => setForm({ ...form, accentColor: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#0A0A0F] border border-white/10 text-white font-mono text-xs"
                  />
                </div>
              </div>

              {/* Background Color */}
              <div>
                <label className="block text-gray-300 font-semibold mb-1">Page Background</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.backgroundColor || '#0A0C0F'}
                    onChange={(e) => setForm({ ...form, backgroundColor: e.target.value })}
                    className="w-9 h-9 rounded-lg bg-transparent border-0 cursor-pointer shrink-0"
                  />
                  <input
                    type="text"
                    value={form.backgroundColor || '#0A0C0F'}
                    onChange={(e) => setForm({ ...form, backgroundColor: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#0A0A0F] border border-white/10 text-white font-mono text-xs"
                  />
                </div>
              </div>

              {/* Surface Color */}
              <div>
                <label className="block text-gray-300 font-semibold mb-1">Card Surface</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.surfaceColor || '#14171F'}
                    onChange={(e) => setForm({ ...form, surfaceColor: e.target.value })}
                    className="w-9 h-9 rounded-lg bg-transparent border-0 cursor-pointer shrink-0"
                  />
                  <input
                    type="text"
                    value={form.surfaceColor || '#14171F'}
                    onChange={(e) => setForm({ ...form, surfaceColor: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#0A0A0F] border border-white/10 text-white font-mono text-xs"
                  />
                </div>
              </div>

              {/* Button Color */}
              <div>
                <label className="block text-gray-300 font-semibold mb-1">Checkout Button</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.buttonColor || '#6366F1'}
                    onChange={(e) => setForm({ ...form, buttonColor: e.target.value })}
                    className="w-9 h-9 rounded-lg bg-transparent border-0 cursor-pointer shrink-0"
                  />
                  <input
                    type="text"
                    value={form.buttonColor || '#6366F1'}
                    onChange={(e) => setForm({ ...form, buttonColor: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#0A0A0F] border border-white/10 text-white font-mono text-xs"
                  />
                </div>
              </div>

              {/* Announcement Bar Background */}
              <div>
                <label className="block text-gray-300 font-semibold mb-1">Announcement Bar</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.announcementBg || '#4F46E5'}
                    onChange={(e) => setForm({ ...form, announcementBg: e.target.value })}
                    className="w-9 h-9 rounded-lg bg-transparent border-0 cursor-pointer shrink-0"
                  />
                  <input
                    type="text"
                    value={form.announcementBg || '#4F46E5'}
                    onChange={(e) => setForm({ ...form, announcementBg: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#0A0A0F] border border-white/10 text-white font-mono text-xs"
                  />
                </div>
              </div>

              {/* Main Text Color */}
              <div>
                <label className="block text-gray-300 font-semibold mb-1">Text Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.textColor || '#F9FAFB'}
                    onChange={(e) => setForm({ ...form, textColor: e.target.value })}
                    className="w-9 h-9 rounded-lg bg-transparent border-0 cursor-pointer shrink-0"
                  />
                  <input
                    type="text"
                    value={form.textColor || '#F9FAFB'}
                    onChange={(e) => setForm({ ...form, textColor: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#0A0A0F] border border-white/10 text-white font-mono text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};
