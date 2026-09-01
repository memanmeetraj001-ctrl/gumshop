import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { FooterColumn } from '../../types';
import { Save, Plus, Trash2, Check } from 'lucide-react';

export const AdminFooterPage: React.FC = () => {
  const [columns, setColumns] = useState<FooterColumn[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.getFooter().then(setColumns).catch(() => {});
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.updateFooter(columns);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleAddLink = (colIndex: number) => {
    const newCols = [...columns];
    newCols[colIndex].links.push({
      id: 'fl_' + Date.now().toString(36),
      label: 'New Link',
      url: '/',
    });
    setColumns(newCols);
  };

  const handleRemoveLink = (colIndex: number, linkIndex: number) => {
    const newCols = [...columns];
    newCols[colIndex].links.splice(linkIndex, 1);
    setColumns(newCols);
  };

  return (
    <form onSubmit={handleSave} className="space-y-8 max-w-4xl">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white uppercase tracking-wider font-heading">Footer Builder</h2>
          <p className="text-xs text-gray-400">Manage multi-column footer navigation and legal links</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="flex items-center gap-1 text-xs text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1.5 rounded-xl">
              <Check className="w-4 h-4" /> Saved Live
            </span>
          )}
          <button type="submit" className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center gap-2">
            <Save className="w-4 h-4" />
            <span>Save Footer</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
        {columns.map((col, colIdx) => (
          <div key={col.id} className="bg-[#14171F] border border-white/10 rounded-2xl p-5 space-y-4">
            <div>
              <label className="block text-gray-400 font-bold uppercase mb-1">Column Title</label>
              <input
                value={col.title}
                onChange={e => {
                  const updated = [...columns];
                  updated[colIdx].title = e.target.value;
                  setColumns(updated);
                }}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white font-bold"
              />
            </div>

            <div className="space-y-2 pt-2 border-t border-white/5">
              {col.links.map((link, linkIdx) => (
                <div key={link.id} className="flex items-center gap-2">
                  <input
                    value={link.label}
                    onChange={e => {
                      const updated = [...columns];
                      updated[colIdx].links[linkIdx].label = e.target.value;
                      setColumns(updated);
                    }}
                    placeholder="Label"
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs"
                  />
                  <input
                    value={link.url}
                    onChange={e => {
                      const updated = [...columns];
                      updated[colIdx].links[linkIdx].url = e.target.value;
                      setColumns(updated);
                    }}
                    placeholder="URL"
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveLink(colIdx, linkIdx)}
                    className="p-1 text-gray-500 hover:text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() => handleAddLink(colIdx)}
                className="w-full py-2 bg-white/5 hover:bg-white/10 text-gray-300 font-bold rounded-lg flex items-center justify-center gap-1 mt-2"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Link</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </form>
  );
};
