import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { HomepageSection } from '../../types';
import {
  Layers,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  Plus,
  Check,
} from 'lucide-react';

export const AdminHomepageBuilderPage: React.FC = () => {
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [editingSection, setEditingSection] = useState<HomepageSection | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    loadSections();
  }, []);

  const loadSections = async () => {
    try {
      const res = await api.getHomepageSections();
      setSections(res.sort((a, b) => a.sortOrder - b.sortOrder));
    } catch {}
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const newIdx = direction === 'up'  ? index - 1   : index + 1;
    if (newIdx < 0 || newIdx >= sections.length) return;

    const reordered = [...sections];
    const temp = reordered[index];
    reordered[index] = reordered[newIdx];
    reordered[newIdx] = temp;

    setSections(reordered);
    await api.reorderHomepageSections(reordered.map((s) => s.id));
    triggerSuccess();
  };

  const handleToggle = async (section: HomepageSection) => {
    const updated = await api.updateHomepageSection(section.id, { enabled: !section.enabled });
    setSections((prev) => prev.map((s) => (s.id === section.id  ? updated  : s)));
    triggerSuccess();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this section-')) return;
    await api.deleteHomepageSection(id);
    setSections((prev) => prev.filter((s) => s.id !== id));
    triggerSuccess();
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSection) return;

    if (isNew) {
      const created = await api.createHomepageSection(editingSection);
      setSections((prev) => [...prev, created]);
    } else {
      const updated = await api.updateHomepageSection(editingSection.id, editingSection);
      setSections((prev) => prev.map((s) => (s.id === editingSection.id  ? updated  : s)));
    }

    setEditingSection(null);
    setIsNew(false);
    triggerSuccess();
  };

  const triggerSuccess = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white uppercase tracking-wider font-heading">
            Homepage Section Builder
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Reorder, toggle, and customize your storefront layout live from database.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {savedSuccess && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl animate-in fade-in">
              <Check className="w-4 h-4" /> Live Changes Saved
            </span>
          )}
          <button
            onClick={() => {
              setEditingSection({
                id: '',
                type: 'rich_text',
                title: 'New Section Title',
                subtitle: 'SUBTITLE',
                content: 'Description content...',
                buttonText: 'Shop Now',
                buttonUrl: '/collections/all',
                enabled: true,
                sortOrder: sections.length + 1,
                settingsJson: {},
              });
              setIsNew(true);
            }}
            className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Section</span>
          </button>
        </div>
      </div>

      {/* Sections List */}
      <div className="space-y-3">
        {sections.map((section, index) => (
          <div
            key={section.id}
            className={`bg-[#14171F] border rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4 transition-all ${
              section.enabled  ? 'border-white/10'  : 'border-white/5 opacity-50'
            }`}
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="flex flex-col gap-1">
                <button
                  disabled={index === 0}
                  onClick={() => handleMove(index, 'up')}
                  className="p-1 text-gray-400 hover:text-white disabled:opacity-20"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  disabled={index === sections.length - 1}
                  onClick={() => handleMove(index, 'down')}
                  className="p-1 text-gray-400 hover:text-white disabled:opacity-20"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
              </div>

              <span className="w-8 h-8 rounded-lg bg-white/5 text-gray-300 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                #{index + 1}
              </span>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase font-mono px-2 py-0.5 bg-red-600/20 text-red-400 rounded">
                    {section.type}
                  </span>
                  <h4 className="text-sm font-bold text-white truncate">{section.title}</h4>
                </div>
                {section.subtitle && (
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{section.subtitle}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleToggle(section)}
                className={`p-2 rounded-lg text-xs font-bold transition-colors ${
                  section.enabled  ? 'text-emerald-400 bg-emerald-500/10'  : 'text-gray-500 bg-white/5'
                }`}
                title={section.enabled  ? 'Enabled'  : 'Disabled'}
              >
                {section.enabled  ? <Eye className="w-4 h-4" />  : <EyeOff className="w-4 h-4" />}
              </button>

              <button
                onClick={() => {
                  setEditingSection({ ...section });
                  setIsNew(false);
                }}
                className="p-2 text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg"
                title="Edit Section"
              >
                <Edit2 className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleDelete(section.id)}
                className="p-2 text-gray-500 hover:text-red-400 bg-white/5 hover:bg-white/10 rounded-lg"
                title="Delete Section"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editingSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-[#14171F] border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white uppercase font-heading">
              {isNew  ? 'Create Homepage Section'  : `Edit Section: ${editingSection.title}`}
            </h3>

            <form onSubmit={handleSaveModal} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 font-bold uppercase mb-1">Section Type</label>
                  <select
                    value={editingSection.type}
                    onChange={(e) => setEditingSection({ ...editingSection, type: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white"
                  >
                    <option value="hero">Hero Banner</option>
                    <option value="social_proof">Social Proof Badges</option>
                    <option value="product_grid">Product Grid</option>
                    <option value="bundle_grid">Bundle Grid</option>
                    <option value="category_grid">Category Grid</option>
                    <option value="benefits">Benefits Breakdown</option>
                    <option value="testimonials">Testimonials Slider</option>
                    <option value="community">Community Gallery</option>
                    <option value="faq">FAQ Accordion</option>
                    <option value="newsletter">Newsletter Banner</option>
                    <option value="rich_text">Rich Text</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 font-bold uppercase mb-1">Section Title</label>
                  <input
                    required
                    value={editingSection.title}
                    onChange={(e) => setEditingSection({ ...editingSection, title: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 font-bold uppercase mb-1">Subtitle / Badge</label>
                <input
                  value={editingSection.subtitle || ''}
                  onChange={(e) => setEditingSection({ ...editingSection, subtitle: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white"
                />
              </div>

              <div>
                <label className="block text-gray-400 font-bold uppercase mb-1">Content / Paragraph</label>
                <textarea
                  rows={3}
                  value={editingSection.content || ''}
                  onChange={(e) => setEditingSection({ ...editingSection, content: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white"
                />
              </div>

              <div>
                <label className="block text-gray-400 font-bold uppercase mb-1">Image URL</label>
                <input
                  value={editingSection.image || ''}
                  onChange={(e) => setEditingSection({ ...editingSection, image: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 font-bold uppercase mb-1">CTA Button Text</label>
                  <input
                    value={editingSection.buttonText || ''}
                    onChange={(e) => setEditingSection({ ...editingSection, buttonText: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 font-bold uppercase mb-1">CTA Button URL</label>
                  <input
                    value={editingSection.buttonUrl || ''}
                    onChange={(e) => setEditingSection({ ...editingSection, buttonUrl: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingSection(null)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg"
                >
                  Save Section
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
