import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../api/client';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Palette,
  Package,
  Zap,
  Rocket,
  Store,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

export const AdminOnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  // Form State
  const [storeName, setStoreName] = useState('My GumShop Store');
  const [tagline, setTagline] = useState('Sell anything. Get paid instantly.');
  const [contactEmail, setContactEmail] = useState('');
  const [selectedColor, setSelectedColor] = useState('#6366F1');
  const [gumroadUrl, setGumroadUrl] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [testingToken, setTestingToken] = useState(false);
  const [tokenStatus, setTokenStatus] = useState<string | null>(null);

  const colors = [
    { name: 'Indigo Modern', hex: '#6366F1' },
    { name: 'Emerald Clean', hex: '#10B981' },
    { name: 'Crimson Bold', hex: '#EF4444' },
    { name: 'Amber Gold', hex: '#F59E0B' },
    { name: 'Purple Royal', hex: '#8B5CF6' },
  ];

  const handleTestToken = async () => {
    if (!accessToken.trim()) return;
    setTestingToken(true);
    setTokenStatus(null);
    try {
      const res = await api.testGumroadToken(accessToken.trim());
      if (res.success) {
        setTokenStatus(`Connected to ${res.user?.name || res.user?.email || 'Gumroad'}!`);
      }
    } catch (err: any) {
      setTokenStatus(`Token invalid: ${err.message}`);
    } finally {
      setTestingToken(false);
    }
  };

  const handleFinish = async () => {
    try {
      await api.updateTheme({ primaryColor: selectedColor });
      await api.updateSettings({ contactEmail });
      navigate('/admin/dashboard');
    } catch {
      navigate('/admin/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-gray-200 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto w-full">
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-8 px-4">
          {[
            { num: 1, label: 'Store Identity' },
            { num: 2, label: 'Theme Colors' },
            { num: 3, label: 'Add Products' },
            { num: 4, label: 'Gumroad Sync' },
            { num: 5, label: 'Launch' },
          ].map((s) => (
            <div key={s.num} className="flex flex-col items-center gap-1.5">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                  step === s.num
                     ? 'bg-indigo-600 text-white ring-4 ring-indigo-500/20'
                    : step > s.num
                     ? 'bg-emerald-500 text-white'
                    : 'bg-white/10 text-gray-400'
                }`}
              >
                {step > s.num  ? <CheckCircle2 className="w-4 h-4" />  : s.num}
              </div>
              <span className="text-[10px] text-gray-400 hidden sm:block">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Wizard Card */}
        <div className="bg-[#14141E] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          {/* Step 1: Store Identity */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div>
                <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">Step 1 of 5</span>
                <h3 className="text-xl font-black text-white mt-1 font-heading">Store Identity & Branding</h3>
                <p className="text-xs text-gray-400">Give your new storefront a recognizable name and tagline.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">Store Name</label>
                  <input
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="e.g. Sarah's Artisan Goods"
                    className="w-full bg-[#0A0A0F] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">Store Tagline</label>
                  <input
                    type="text"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    placeholder="e.g. Handcrafted minimalist essentials"
                    className="w-full bg-[#0A0A0F] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">Customer Support Email</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="support@yourbrand.com"
                    className="w-full bg-[#0A0A0F] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase rounded-xl flex items-center gap-1.5 shadow-lg shadow-indigo-600/30"
                >
                  <span>Continue to Colors</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Theme Colors */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div>
                <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">Step 2 of 5</span>
                <h3 className="text-xl font-black text-white mt-1 font-heading">Choose Color Accent</h3>
                <p className="text-xs text-gray-400">Select a primary color scheme for buttons, badges, and highlights.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {colors.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setSelectedColor(c.hex)}
                    className={`p-4 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                      selectedColor === c.hex
                         ? 'border-indigo-500 bg-indigo-500/10'
                        : 'border-white/10 bg-[#0A0A0F] hover:border-white/20'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl shrink-0" style={{ backgroundColor: c.hex }} />
                    <div>
                      <span className="text-xs font-bold text-white block">{c.name}</span>
                      <span className="text-[10px] font-mono text-gray-500">{c.hex}</span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase rounded-xl flex items-center gap-1.5 shadow-lg shadow-indigo-600/30"
                >
                  <span>Continue to Products</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Add Products */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div>
                <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">Step 3 of 5</span>
                <h3 className="text-xl font-black text-white mt-1 font-heading">Add Your First Products</h3>
                <p className="text-xs text-gray-400">Choose how you want to populate your initial inventory (up to 10 products).</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 bg-[#0A0A0F] border border-white/10 rounded-2xl space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-2">
                      <Zap className="w-5 h-5" />
                    </div>
                    <h4 className="text-xs font-bold text-white">Import from URL (1-Click)</h4>
                    <p className="text-[11px] text-gray-400 mt-1">
                      Paste a Shopify or web store link to automatically extract products and photography.
                    </p>
                  </div>
                  <Link
                    to="/admin/import"
                    target="_blank"
                    className="w-full py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 rounded-xl text-center text-xs font-bold block"
                  >
                    Open Importer in Tab ? </Link>
                </div>

                <div className="p-5 bg-[#0A0A0F] border border-white/10 rounded-2xl space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2">
                      <Package className="w-5 h-5" />
                    </div>
                    <h4 className="text-xs font-bold text-white">Keep Demo Products for Now</h4>
                    <p className="text-[11px] text-gray-400 mt-1">
                      Start with our 5 pre-configured demo products and edit them anytime in the CMS.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(4)}
                    className="w-full py-2 bg-white/10 hover:bg-white/15 text-white rounded-xl text-center text-xs font-bold"
                  >
                    Use Demo Catalog
                  </button>
                </div>
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase rounded-xl flex items-center gap-1.5 shadow-lg shadow-indigo-600/30"
                >
                  <span>Continue to Gumroad</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Gumroad Sync */}
          {step === 4 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div>
                <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">Step 4 of 5</span>
                <h3 className="text-xl font-black text-white mt-1 font-heading">Connect Gumroad</h3>
                <p className="text-xs text-gray-400">Add your Gumroad Store URL or API Token for instant checkout.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">Gumroad Store URL</label>
                  <input
                    type="url"
                    value={gumroadUrl}
                    onChange={(e) => setGumroadUrl(e.target.value)}
                    placeholder="https://yourusername.gumroad.com"
                    className="w-full bg-[#0A0A0F] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    Gumroad Access Token (Optional  - for automated 1-click product creation)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={accessToken}
                      onChange={(e) => setAccessToken(e.target.value)}
                      placeholder="Paste token from Gumroad Settings > Advanced > Applications"
                      className="w-full bg-[#0A0A0F] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={handleTestToken}
                      disabled={testingToken || !accessToken}
                      className="px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white text-xs font-bold rounded-xl whitespace-nowrap disabled:opacity-50"
                    >
                      {testingToken  ? 'Testing...'  : 'Test Token'}
                    </button>
                  </div>
                  {tokenStatus && (
                    <p className="text-[11px] text-indigo-400 mt-1 font-semibold">{tokenStatus}</p>
                  )}
                </div>
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(5)}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase rounded-xl flex items-center gap-1.5 shadow-lg shadow-indigo-600/30"
                >
                  <span>Ready to Launch</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Launch */}
          {step === 5 && (
            <div className="text-center space-y-6 animate-in fade-in duration-200 py-4">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center mx-auto shadow-xl shadow-indigo-600/30">
                <Rocket className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-2xl font-black text-white font-heading">Your Store is Ready to Launch!</h3>
                <p className="text-xs text-gray-400 max-w-md mx-auto mt-2">
                  All 5 setup steps are complete. You can now explore your live storefront or manage your products and orders in the CMS.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleFinish}
                  className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-600/30"
                >
                  Open Admin Dashboard
                </button>
                <Link
                  to="/store/demo"
                  target="_blank"
                  className="w-full sm:w-auto px-6 py-3.5 bg-white/10 hover:bg-white/15 text-white font-bold text-xs uppercase tracking-wider rounded-xl border border-white/10 flex items-center justify-center gap-1.5"
                >
                  <span>Preview Storefront</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
