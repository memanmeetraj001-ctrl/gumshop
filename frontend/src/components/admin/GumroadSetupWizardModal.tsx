import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Copy,
  KeyRound,
  ShieldCheck,
  Zap,
  ArrowRight,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { api } from '../../api/client';

interface GumroadSetupWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected?: (token: string, storeUrl: string) => void;
  initialStoreUrl?: string;
  initialToken?: string;
}

export const GumroadSetupWizardModal: React.FC<GumroadSetupWizardModalProps> = ({
  isOpen,
  onClose,
  onConnected,
  initialStoreUrl = '',
  initialToken = '',
}) => {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [storeUrl, setStoreUrl] = useState(initialStoreUrl);
  const [accessToken, setAccessToken] = useState(initialToken);
  const [testing, setTesting] = useState(false);
  const [tokenResult, setTokenResult] = useState<{ valid: boolean; user?: any; error?: string } | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleTestAndSave = async () => {
    if (!accessToken.trim()) {
      alert('Please paste your Gumroad Access Token.');
      return;
    }

    setTesting(true);
    setTokenResult(null);

    try {
      const res = await api.testGumroadToken(accessToken.trim());
      if (res.success) {
        setTokenResult({ valid: true, user: res.user });
        const finalStoreUrl = storeUrl.trim() || res.user?.url || 'https://gumroad.com';
        if (onConnected) {
          onConnected(accessToken.trim(), finalStoreUrl);
        }
      } else {
        setTokenResult({ valid: false, error: res.error || 'Invalid token' });
      }
    } catch (err: any) {
      setTokenResult({ valid: false, error: err.message || 'Verification failed. Please check your token.' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[#0E1017] border border-white/15 rounded-3xl overflow-hidden shadow-2xl shadow-black my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#141722]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white uppercase font-heading tracking-wide">
                  Gumroad Integration Wizard
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                  4 Easy Steps
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Connect your Gumroad account to enable 1-click catalog publishing & checkout
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Navigation Pill Tabs */}
        <div className="grid grid-cols-4 p-2 bg-[#090B0E] border-b border-white/10 gap-1.5 text-xs font-bold">
          {[
            { num: 1, title: 'Store URL' },
            { num: 2, title: 'Create App' },
            { num: 3, title: 'Generate Token' },
            { num: 4, title: 'Connect & Test' },
          ].map((s) => (
            <button
              key={s.num}
              type="button"
              onClick={() => setActiveStep(s.num)}
              className={`py-2 px-2 rounded-xl text-center transition-all flex items-center justify-center gap-1.5 ${
                activeStep === s.num
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40'
                  : 'bg-white/5 text-gray-400 hover:text-white'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                activeStep === s.num ? 'bg-white/20 text-white' : 'bg-white/10 text-gray-400'
              }`}>
                {s.num}
              </span>
              <span className="truncate hidden sm:inline">{s.title}</span>
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">

          {/* ──── STEP 1: Find Store URL ──── */}
          {activeStep === 1 && (
            <div className="space-y-5 animate-in fade-in">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">Step 1 of 4</span>
                  <h4 className="text-lg font-black text-white mt-0.5">Find Your Gumroad Store URL / Username</h4>
                  <p className="text-xs text-gray-400 mt-1">
                    Your Gumroad profile link looks like <code className="text-indigo-300 font-mono bg-indigo-950/50 px-1.5 py-0.5 rounded">https://yourusername.gumroad.com</code>.
                  </p>
                </div>
                <a
                  href="https://gumroad.com/settings"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition-all flex items-center gap-1.5 shrink-0"
                >
                  <span>Open Gumroad Settings</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Visual Guidance Box */}
              <div className="p-4 bg-[#141722] border border-white/10 rounded-2xl space-y-3 text-xs text-gray-300">
                <p className="font-semibold text-white">📍 How to find it in Gumroad:</p>
                <ol className="list-decimal pl-5 space-y-1.5 text-gray-400">
                  <li>Go to <strong className="text-white">Gumroad.com → Settings → Settings Tab</strong>.</li>
                  <li>Under <strong className="text-white">User details</strong>, look at your <strong className="text-white">Username</strong> (e.g. <code>ranchiguy</code>).</li>
                  <li>Your profile link is displayed right below: <code className="text-emerald-400">ranchiguy.gumroad.com</code>.</li>
                </ol>
              </div>

              {/* Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-300">
                  Enter Your Gumroad Store URL:
                </label>
                <input
                  type="url"
                  value={storeUrl}
                  onChange={(e) => setStoreUrl(e.target.value)}
                  placeholder="https://yourusername.gumroad.com"
                  className="w-full px-4 py-3 rounded-xl bg-[#090B0E] border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setActiveStep(2)}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/30"
                >
                  <span>Next: Create Application</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ──── STEP 2: Create Application ──── */}
          {activeStep === 2 && (
            <div className="space-y-5 animate-in fade-in">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">Step 2 of 4</span>
                  <h4 className="text-lg font-black text-white mt-0.5">Create a Gumroad Application</h4>
                  <p className="text-xs text-gray-400 mt-1">
                    Gumroad generates API credentials via registered applications in Advanced Settings.
                  </p>
                </div>
                <a
                  href="https://gumroad.com/settings/advanced"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition-all flex items-center gap-1.5 shrink-0"
                >
                  <span>Open Advanced Settings</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Instructions Card */}
              <div className="p-4 bg-[#141722] border border-white/10 rounded-2xl space-y-3 text-xs text-gray-300">
                <p className="font-semibold text-white">⚙️ In Gumroad Advanced Settings:</p>
                <ol className="list-decimal pl-5 space-y-2 text-gray-400">
                  <li>Scroll down to the <strong className="text-white">Applications</strong> section.</li>
                  <li>Under <strong className="text-white">Create application</strong>, enter:
                    <ul className="list-disc pl-5 mt-1 space-y-1 text-gray-300">
                      <li><strong>Application name:</strong> Your Store Name (e.g. <code>GumShop Store</code> or your brand)</li>
                      <li><strong>Redirect URI:</strong> Your store URL (e.g. <code>{storeUrl || 'https://gumshop.online'}</code>)</li>
                    </ul>
                  </li>
                  <li>Click the white <strong className="text-white">"Create application"</strong> button.</li>
                </ol>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setActiveStep(1)}
                  className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStep(3)}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/30"
                >
                  <span>Next: Generate Access Token</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ──── STEP 3: Generate Token ──── */}
          {activeStep === 3 && (
            <div className="space-y-5 animate-in fade-in">
              <div>
                <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">Step 3 of 4</span>
                <h4 className="text-lg font-black text-white mt-0.5">Click "Generate Access Token"</h4>
                <p className="text-xs text-gray-400 mt-1">
                  Once your application is created, Gumroad will display an "Edit application" screen.
                </p>
              </div>

              {/* Action Box */}
              <div className="p-5 bg-gradient-to-br from-indigo-950/40 via-[#141722] to-[#0E1017] border border-indigo-500/30 rounded-2xl space-y-3 text-xs text-gray-300">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                  <Sparkles className="w-4 h-4" />
                  <span>Click the Token Button</span>
                </div>
                <p className="text-gray-300 leading-relaxed">
                  On the <strong className="text-white">Edit application</strong> page, scroll to the bottom right next to the pink "Update application" button.
                </p>
                <div className="p-3 bg-black/50 border border-white/10 rounded-xl flex items-center justify-between">
                  <span className="text-gray-400 font-semibold">Look for the button:</span>
                  <span className="px-3.5 py-1.5 bg-[#1F222E] text-white font-bold rounded-lg border border-white/20 text-xs">
                    Generate access token
                  </span>
                </div>
                <p className="text-gray-400 text-[11px]">
                  Clicking this will instantly generate a long secret token in the <strong>Access Token (?)</strong> field.
                </p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setActiveStep(2)}
                  className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStep(4)}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/30"
                >
                  <span>Next: Paste &amp; Connect</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ──── STEP 4: Paste & Connect ──── */}
          {activeStep === 4 && (
            <div className="space-y-5 animate-in fade-in">
              <div>
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Step 4 of 4</span>
                <h4 className="text-lg font-black text-white mt-0.5">Paste Token &amp; Test Connection</h4>
                <p className="text-xs text-gray-400 mt-1">
                  Paste the generated token below to verify authorization with Gumroad.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5">
                    Gumroad Personal Access Token:
                  </label>
                  <input
                    type="password"
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    placeholder="e.g. NRgyC5m6lgt52pluc7jjATynu5IOH4dkIRxoOSHlNww"
                    className="w-full px-4 py-3 rounded-xl bg-[#090B0E] border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5">
                    Gumroad Store URL:
                  </label>
                  <input
                    type="url"
                    value={storeUrl}
                    onChange={(e) => setStoreUrl(e.target.value)}
                    placeholder="https://yourusername.gumroad.com"
                    className="w-full px-4 py-3 rounded-xl bg-[#090B0E] border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Status Alert */}
              {tokenResult && (
                <div
                  className={`p-4 rounded-2xl border text-xs font-semibold flex items-center gap-3 ${
                    tokenResult.valid
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-red-500/10 border-red-500/30 text-red-400'
                  }`}
                >
                  {tokenResult.valid ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 shrink-0" />
                      <div>
                        <p className="font-bold">🎉 Successfully connected to Gumroad Account!</p>
                        <p className="text-[11px] text-emerald-300 font-normal mt-0.5">
                          Owner: <strong>{tokenResult.user?.name || tokenResult.user?.email || 'Authorized'}</strong> · 1-click publishing enabled.
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-5 h-5 shrink-0" />
                      <div>
                        <p className="font-bold">Verification Failed</p>
                        <p className="text-[11px] text-red-300 font-normal mt-0.5">{tokenResult.error}</p>
                      </div>
                    </>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setActiveStep(3)}
                  className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white"
                >
                  Back
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleTestAndSave}
                    disabled={testing || !accessToken.trim()}
                    className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 disabled:opacity-50"
                  >
                    <Zap className="w-4 h-4" />
                    <span>{testing ? 'Testing Token…' : 'Test & Connect Gumroad'}</span>
                  </button>

                  {tokenResult?.valid && (
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase rounded-xl transition-colors"
                    >
                      Done ✓
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
