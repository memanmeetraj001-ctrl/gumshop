import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { PaymentIntegration } from '../../types';
import {
  Save,
  Check,
  ExternalLink,
  ShieldCheck,
  Zap,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Truck,
} from 'lucide-react';

export const AdminPaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<PaymentIntegration[]>([]);
  const [saved, setSaved] = useState(false);

  // Gumroad API Sync state
  const [accessToken, setAccessToken] = useState('');
  const [testingToken, setTestingToken] = useState(false);
  const [tokenStatus, setTokenStatus] = useState<{ valid: boolean; user?: any; error?: string } | null>(null);

  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    success: boolean;
    totalProducts?: number;
    syncedCount?: number;
    results?: any[];
    error?: string;
  } | null>(null);

  useEffect(() => {
    api.getPayments().then((data) => {
      setPayments(data);
      const gumroad = data.find((p) => p.provider === 'gumroad');
      if (gumroad?.settingsJson?.accessToken) {
        setAccessToken(gumroad.settingsJson.accessToken);
      }
    }).catch(() => {});
  }, []);

  const handleUpdate = (id: string, field: string, value: any) => {
    setPayments((prev) =>
      prev.map((p) => (p.id === id  ? { ...p, [field] : value } : p))
    );
  };

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    for (const p of payments) {
      if (p.provider === 'gumroad') {
        p.settingsJson = {
          ...(p.settingsJson || {}),
          accessToken: accessToken.trim(),
        };
      }
      await api.updatePayment(p.id, p);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleTestConnection = async () => {
    if (!accessToken.trim()) {
      alert('Please enter a Gumroad Access Token.');
      return;
    }
    setTestingToken(true);
    setTokenStatus(null);
    try {
      const res = await api.testGumroadToken(accessToken.trim());
      setTokenStatus({ valid: true, user: res.user });
    } catch (err: any) {
      setTokenStatus({ valid: false, error: err.message });
    } finally {
      setTestingToken(false);
    }
  };

  const handleSyncCatalog = async () => {
    if (!accessToken.trim()) {
      alert('Please enter and test your Gumroad Access Token before syncing.');
      return;
    }
    if (!confirm('This will create / link all 43 GumShop products on your Gumroad account with 50% discount prices. Proceed-')) {
      return;
    }

    setSyncing(true);
    setSyncResult(null);

    const gumroad = payments.find((p) => p.provider === 'gumroad');
    try {
      const res = await api.syncGumroadCatalog(accessToken.trim(), gumroad?.storeUrl);
      setSyncResult(res);
    } catch (err: any) {
      setSyncResult({ success: false, error: err.message });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <form onSubmit={handleSaveAll} className="space-y-8 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white uppercase tracking-wider font-heading">
            Payment & Checkout Integrations
          </h2>
          <p className="text-xs text-gray-400">
            Configure pre-checkout address collection and automated Gumroad API product synchronization
          </p>
        </div>

        <div className="flex items-center gap-3">
          {saved && (
            <span className="flex items-center gap-1 text-xs text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1.5 rounded-xl">
              <Check className="w-4 h-4" /> Settings Saved
            </span>
          )}
          <button
            type="submit"
            className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center gap-2 transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </div>
      </div>

      <div className="space-y-6 text-xs">
        {/* Gumroad Integration Card */}
        {payments.filter((p) => p.provider === 'gumroad').map((p) => (
          <div
            key={p.id}
            className="bg-[#14171F] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6"
          >
            <div className="flex items-center justify-between pb-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-600/20 text-red-400 flex items-center justify-center font-bold">
                  <ExternalLink className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{p.label}</h3>
                  <p className="text-[11px] text-gray-400">
                    Primary external payment provider for instant checkout
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={p.enabled}
                  onChange={(e) => handleUpdate(p.id, 'enabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
              </label>
            </div>

            {/* General Gumroad Settings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-gray-300 font-semibold mb-1.5">
                  Gumroad Store Base URL
                </label>
                <input
                  type="url"
                  value={p.storeUrl || ''}
                  onChange={(e) => handleUpdate(p.id, 'storeUrl', e.target.value)}
                  placeholder="https://gumroad.com"
                  className="w-full bg-[#0F1115] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-gray-600 focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1.5">
                  Default Button Text
                </label>
                <input
                  type="text"
                  value={p.buttonText}
                  onChange={(e) => handleUpdate(p.id, 'buttonText', e.target.value)}
                  placeholder="Buy on Gumroad"
                  className="w-full bg-[#0F1115] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-gray-600 focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            {/* Address Capture Banner */}
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-start gap-3">
              <Truck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Pre-Checkout Shipping Address Capture is Active
                </h4>
                <p className="text-[11px] text-gray-300 mt-0.5 leading-relaxed">
                  When a customer clicks &quot;Buy Now&quot;, an on-site address form captures their full delivery information before redirecting to Gumroad with email &amp; quantity prefilled. All captured leads appear in{' '}
                  <span className="text-emerald-400 font-semibold">/admin/orders</span>.
                </p>
              </div>
            </div>

            {/* Automated Gumroad API Synchronization Section */}
            <div className="pt-6 border-t border-white/10 space-y-4">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                <h4 className="text-sm font-bold text-white uppercase tracking-wider font-heading">
                  Automated Gumroad API Catalog Sync
                </h4>
              </div>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                Connect your Gumroad API Access Token to automatically publish and sync all 43 GumShop products with 50% discount prices to your Gumroad store in one click.
              </p>

              <div>
                <label className="block text-gray-300 font-semibold mb-1.5">
                  Gumroad API Access Token (from Gumroad Settings &gt; Advanced &gt; Applications)
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="password"
                      value={accessToken}
                      onChange={(e) => setAccessToken(e.target.value)}
                      placeholder="Paste Gumroad Personal Access Token here..."
                      className="w-full bg-[#0F1115] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-white placeholder:text-gray-600 focus:outline-none focus:border-red-500"
                    />
                    <KeyRound className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
                  </div>
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testingToken}
                    className="px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white font-bold rounded-xl border border-white/10 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    {testingToken ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <ShieldCheck className="w-4 h-4" />
                    )}
                    <span>Test Token</span>
                  </button>
                </div>
              </div>

              {/* Token test feedback */}
              {tokenStatus && (
                <div
                  className={`p-3.5 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
                    tokenStatus.valid
                       ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-red-500/10 border-red-500/30 text-red-400'
                  }`}
                >
                  {tokenStatus.valid ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>
                        Connected to Gumroad user: {tokenStatus.user?.name || tokenStatus.user?.email || 'Authorized'}
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{tokenStatus.error || 'Invalid Gumroad Access Token'}</span>
                    </>
                  )}
                </div>
              )}

              {/* Sync Action Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSyncCatalog}
                  disabled={syncing}
                  className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-black uppercase tracking-wider rounded-xl shadow-lg shadow-amber-900/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {syncing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Syncing 43 Products to Gumroad API...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span> - Sync All 43 Products to Gumroad</span>
                    </>
                  )}
                </button>
              </div>

              {/* Sync Results Box */}
              {syncResult && (
                <div className="p-4 bg-[#0F1115] border border-white/10 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Catalog Sync Summary</span>
                    </span>
                    <span className="text-[11px] text-gray-400">
                      {syncResult.syncedCount} / {syncResult.totalProducts} Products Configured
                    </span>
                  </div>
                  {syncResult.results && (
                    <div className="max-h-40 overflow-y-auto space-y-1 text-[11px] divide-y divide-white/5 pr-1">
                      {syncResult.results.map((r, i) => (
                        <div key={i} className="flex items-center justify-between py-1.5">
                          <span className="text-gray-300 truncate max-w-[240px]">{r.title}</span>
                          <span
                            className={`font-bold uppercase text-[10px] px-2 py-0.5 rounded ${
                              r.status === 'created'
                                 ? 'bg-emerald-500/10 text-emerald-400'
                                : r.status === 'linked'
                                 ? 'bg-blue-500/10 text-blue-400'
                                : 'bg-red-500/10 text-red-400'
                            }`}
                          >
                            {r.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </form>
  );
};
