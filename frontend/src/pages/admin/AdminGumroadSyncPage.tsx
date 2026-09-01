import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Product, PaymentIntegration } from '../../types';
import { formatPrice } from '../../utils/formatters';
import {
  Zap,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  KeyRound,
  Lock,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export const AdminGumroadSyncPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [accessToken, setAccessToken] = useState('');
  const [storeUrl, setStoreUrl] = useState('https://gumroad.com');
  const [loading, setLoading] = useState(true);

  const [testingToken, setTestingToken] = useState(false);
  const [tokenStatus, setTokenStatus] = useState<{ valid: boolean; user?: any; error?: string } | null>(null);

  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any | null>(null);

  useEffect(() => {
    Promise.all([
      api.getProducts({ status: 'all' }),
      api.getPayments(),
    ]).then(([prods, payments]) => {
      setProducts(prods);
      const gumroad = payments.find((p) => p.provider === 'gumroad');
      if (gumroad) {
        if (gumroad.storeUrl) setStoreUrl(gumroad.storeUrl);
        if (gumroad.settingsJson?.accessToken) setAccessToken(gumroad.settingsJson.accessToken);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleTestToken = async () => {
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

  const handleSyncAll = async () => {
    if (!accessToken.trim()) {
      alert('Please paste and test your Gumroad API Access Token first.');
      return;
    }

    if (!confirm(`This will publish and link all ${products.length} products to your Gumroad store account. Proceed-`)) {
      return;
    }

    setSyncing(true);
    setSyncResult(null);

    try {
      const res = await api.syncGumroadCatalog(accessToken.trim(), storeUrl);
      setSyncResult(res);
      // Refresh products to show new Gumroad links
      const updated = await api.getProducts({ status: 'all' });
      setProducts(updated);
    } catch (err: any) {
      setSyncResult({ success: false, error: err.message });
    } finally {
      setSyncing(false);
    }
  };

  const syncedCount = products.filter((p) => Boolean(p.gumroadUrl)).length;

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white uppercase tracking-wider font-heading flex items-center gap-2">
            <Zap className="w-5 h-5 text-indigo-400" />
            <span>One-Click Gumroad Catalog Sync</span>
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Publish products to your Gumroad account automatically and sync live checkout URLs
          </p>
        </div>

        <div className="px-4 py-2 bg-[#14141E] border border-white/10 rounded-xl flex items-center gap-2 text-xs">
          <span className="text-gray-400">Sync Status:</span>
          <span className="font-bold text-white">
            {syncedCount} / {products.length} Products Linked
          </span>
        </div>
      </div>

      {/* Step 1: Connect Token Card */}
      <div className="bg-[#14141E] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-white/5">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
            1
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Connect Gumroad API</h3>
            <p className="text-[11px] text-gray-400">
              Get your Personal Access Token from Gumroad Settings &gt; Advanced &gt; Applications
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Gumroad Store Base URL
            </label>
            <input
              type="url"
              value={storeUrl}
              onChange={(e) => setStoreUrl(e.target.value)}
              placeholder="https://yourusername.gumroad.com"
              className="w-full bg-[#0A0A0F] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Gumroad API Access Token
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder="Paste token here..."
                className="w-full bg-[#0A0A0F] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={handleTestToken}
                disabled={testingToken || !accessToken}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white text-xs font-bold rounded-xl whitespace-nowrap disabled:opacity-50 transition-colors"
              >
                {testingToken  ? 'Testing...'  : 'Test Token'}
              </button>
            </div>
          </div>
        </div>

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
                  Connected to Gumroad Account: <strong>{tokenStatus.user?.name || tokenStatus.user?.email || 'Authorized'}</strong>
                </span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{tokenStatus.error || 'Token verification failed'}</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Step 2: Product Sync Checklist */}
      <div className="bg-[#14141E] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
              2
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Product Catalog Sync Checklist</h3>
              <p className="text-[11px] text-gray-400">
                Products to be published and linked with 1-click Gumroad checkout
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSyncAll}
            disabled={syncing || products.length === 0}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {syncing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Syncing {products.length} Products...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                <span>⚡ Sync All Products to Gumroad</span>
              </>
            )}
          </button>
        </div>

        {/* Sync Summary Result */}
        {syncResult && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Catalog Sync Completed: {syncResult.syncedCount} / {syncResult.totalProducts} Products Configured!</span>
            </div>
          </div>
        )}

        {/* Product Rows */}
        <div className="divide-y divide-white/5">
          {products.map((p) => (
            <div key={p.id} className="py-3.5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={p.thumbnail || p.images?.[0]}
                  alt={p.title}
                  className="w-10 h-10 rounded-xl object-cover border border-white/10 bg-black/40 shrink-0"
                  onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=80&q=80'; }}
                />
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-white truncate">{p.title}</h4>
                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-500">
                    <span>{formatPrice(p.price)}</span>
                    <span>·</span>
                    <span className="font-mono">SKU: {p.sku}</span>
                  </div>
                </div>
              </div>

              <div>
                {p.gumroadUrl ? (
                  <a
                    href={p.gumroadUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 font-bold bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1 rounded-lg border border-emerald-500/20 transition-colors"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Linked to Gumroad</span>
                    <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                  </a>
                ) : (
                  <span className="text-[11px] text-amber-400 font-semibold bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20">
                    Ready to Sync
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Step 3: Publish Live on Gumroad ─── */}
      <div className={`bg-[#14141E] border rounded-3xl p-6 sm:p-8 space-y-6 transition-all duration-500 ${syncResult ? 'border-indigo-500/50 shadow-2xl shadow-indigo-950/40' : 'border-white/10'}`}>

        {/* Step header */}
        <div className="flex items-center gap-3 pb-5 border-b border-white/5">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm transition-all duration-300 ${syncResult ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-900/40' : 'bg-indigo-500/20 text-indigo-400'}`}>
            3
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-white">Publish Your Products Live on Gumroad</h3>
              {syncResult && (
                <span className="text-[9px] bg-indigo-500 text-white px-2 py-0.5 rounded-full font-black uppercase tracking-widest animate-pulse">
                  Next Step
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Synced products are created as <strong className="text-gray-300">drafts</strong> on Gumroad. Follow these steps to make them publicly live.
            </p>
          </div>
        </div>

        {/* Post-sync success nudge */}
        {syncResult && (
          <div className="p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-indigo-200">🎉 Sync complete! Your {syncResult.syncedCount} products are on Gumroad as drafts.</p>
              <p className="text-[11px] text-indigo-400 mt-0.5 leading-relaxed">
                Complete the 4 steps below to publish them live and start accepting customer payments through Gumroad checkout.
              </p>
            </div>
          </div>
        )}

        {/* 4 sub-steps */}
        <div className="space-y-3">
          {([
            {
              num: '01',
              emoji: '🌐',
              title: 'Open Your Gumroad Products Dashboard',
              desc: 'Log into your Gumroad account and navigate to the Products tab to see all synced items listed as drafts.',
              href: 'https://app.gumroad.com/products',
              linkLabel: 'Open Gumroad Products ↗',
              border: 'border-indigo-500/20',
              bg: 'bg-indigo-500/8',
              numStyle: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/25',
            },
            {
              num: '02',
              emoji: '📋',
              title: 'Click on Each Draft Product',
              desc: 'You will see your products listed with a grey "Draft" badge. Click into each product to open its editor and review the details GumShop synced automatically.',
              href: null,
              linkLabel: null,
              border: 'border-purple-500/20',
              bg: 'bg-purple-500/8',
              numStyle: 'bg-purple-500/15 text-purple-400 border-purple-500/25',
            },
            {
              num: '03',
              emoji: '🖼️',
              title: 'Add a Cover Image (Required by Gumroad)',
              desc: 'Gumroad requires at least one cover image before a product can go live. Upload your product photo in the "Cover" section of the product editor.',
              href: null,
              linkLabel: null,
              border: 'border-violet-500/20',
              bg: 'bg-violet-500/8',
              numStyle: 'bg-violet-500/15 text-violet-400 border-violet-500/25',
            },
            {
              num: '04',
              emoji: '🚀',
              title: 'Hit "Publish" — Your Product Goes Live Instantly',
              desc: 'Click the "Publish" toggle in the top-right corner of the product editor. Your product will instantly be publicly live with a shareable Gumroad checkout URL that GumShop will use for the "Buy Now" button.',
              href: null,
              linkLabel: null,
              border: 'border-emerald-500/20',
              bg: 'bg-emerald-500/8',
              numStyle: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
            },
          ] as const).map((step) => (
            <div key={step.num} className={`flex items-start gap-4 p-4 ${step.bg} border ${step.border} rounded-2xl hover:brightness-125 transition-all group`}>
              <div className={`w-9 h-9 rounded-xl shrink-0 flex items-center justify-center text-[11px] font-black border ${step.numStyle} group-hover:scale-110 transition-transform`}>
                {step.num}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base leading-none">{step.emoji}</span>
                  <h4 className="text-sm font-bold text-white">{step.title}</h4>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">{step.desc}</p>
                {step.href && step.linkLabel && (
                  <a
                    href={step.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 mt-2.5 text-[11px] font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 px-3 py-1.5 rounded-lg transition-all"
                  >
                    <ExternalLink className="w-3 h-3" />
                    {step.linkLabel}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Pro Tip */}
        <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl flex items-start gap-3">
          <span className="text-lg shrink-0">💡</span>
          <div className="text-xs text-amber-300/80 leading-relaxed space-y-1">
            <p><strong className="text-amber-300">Pro Tip — Close the Loop:</strong> After each product goes live on Gumroad, copy its checkout URL</p>
            <p className="font-mono bg-black/30 px-2 py-1 rounded text-amber-200/70 text-[10px] w-fit">
              https://yourname.gumroad.com/l/your-product-slug
            </p>
            <p>Then go to <strong className="text-amber-300">Admin → Products</strong>, edit each product, and paste that URL into the <strong className="text-amber-300">"Gumroad Checkout URL"</strong> field. This ensures every "Buy Now" button on your GumShop storefront routes shoppers directly to your live Gumroad checkout.</p>
          </div>
        </div>

        {/* CTA buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <a
            href="https://app.gumroad.com/products"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-900/30 transition-all"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open Gumroad Products Dashboard
          </a>
          <a
            href={storeUrl || 'https://gumroad.com'}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold rounded-xl transition-all"
          >
            <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
            Preview Your Gumroad Store
          </a>
        </div>
      </div>
    </div>
  );
};
