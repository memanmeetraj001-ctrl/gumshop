import React, { useState } from 'react';
import { Settings, Globe, Shield, Save, CheckCircle2 } from 'lucide-react';

export const MasterSettingsPage: React.FC = () => {
  const [platformDomain, setPlatformDomain] = useState('gumshop.online');
  const [freeLimit, setFreeLimit] = useState(10);
  const [proLimit, setProLimit] = useState(50);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-white uppercase tracking-wider font-heading flex items-center gap-2">
          <Settings className="w-6 h-6 text-indigo-400" />
          <span>Global Platform Settings</span>
        </h2>
        <p className="text-xs text-gray-400 mt-1">
          Configure root SaaS domain parameters, default tier capacities, and platform policies
        </p>
      </div>

      {saved && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-3 text-xs text-emerald-400 font-semibold animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>Global settings updated successfully!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-[#10121A] border border-indigo-500/20 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-heading">
            Official Platform Domain
          </h3>
          <div>
            <label className="block text-xs font-bold uppercase text-gray-400 mb-1.5">Root SaaS Domain</label>
            <input
              type="text"
              value={platformDomain}
              onChange={(e) => setPlatformDomain(e.target.value)}
              className="w-full bg-[#07080B] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="pt-6 border-t border-white/10 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-heading">
            Default Plan Limits
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-gray-400 mb-1.5">Free Tier Product Cap</label>
              <input
                type="number"
                value={freeLimit}
                onChange={(e) => setFreeLimit(Number(e.target.value))}
                className="w-full bg-[#07080B] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-400 mb-1.5">Pro Tier Product Cap</label>
              <input
                type="number"
                value={proLimit}
                onChange={(e) => setProLimit(Number(e.target.value))}
                className="w-full bg-[#07080B] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-indigo-900/40 flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          <span>Save Global Configuration</span>
        </button>
      </form>
    </div>
  );
};
