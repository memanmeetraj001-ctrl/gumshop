import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../api/client';
import { GumroadSetupWizardModal } from '../../components/admin/GumroadSetupWizardModal';
import { formatPrice } from '../../utils/formatters';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Package,
  Zap,
  Rocket,
  ExternalLink,
  ShieldCheck,
  Download,
  Trash2,
  RefreshCw,
  BookOpen,
  HelpCircle,
  AlertCircle,
} from 'lucide-react';

export const AdminOnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  // Step 1 & 2: Identity & Theme
  const [storeName, setStoreName] = useState('My GumShop Store');
  const [tagline, setTagline] = useState('Sell anything. Get paid instantly.');
  const [contactEmail, setContactEmail] = useState('');
  const [selectedColor, setSelectedColor] = useState('#6366F1');

  // Step 3: Product Importer State
  const [importUrl, setImportUrl] = useState('');
  const [scraping, setScraping] = useState(false);
  const [scrapedItems, setScrapedItems] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [productChoice, setProductChoice] = useState<'demo' | 'imported' | 'empty'>('demo');

  // Step 4: Gumroad Integration
  const [gumroadUrl, setGumroadUrl] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [testingToken, setTestingToken] = useState(false);
  const [tokenStatus, setTokenStatus] = useState<{ valid: boolean; user?: any; error?: string } | null>(null);
  const [showGumroadWizard, setShowGumroadWizard] = useState(false);

  const colors = [
    { name: 'Indigo Modern', hex: '#6366F1' },
    { name: 'Emerald Clean', hex: '#10B981' },
    { name: 'Crimson Bold', hex: '#EF4444' },
    { name: 'Amber Gold', hex: '#F59E0B' },
    { name: 'Purple Royal', hex: '#8B5CF6' },
  ];

  // Scrape URL in Step 3
  const handleScrape = async () => {
    if (!importUrl.trim()) return;
    setScraping(true);
    setImportError(null);
    setImportSuccess(null);
    setScrapedItems([]);

    try {
      const detect = await api.detectPlatform(importUrl.trim());
      let res;
      if (detect.platform === 'shopify') {
        res = await api.scrapeShopify(importUrl.trim(), 10);
      } else {
        res = await api.scrapeHtml(importUrl.trim());
      }

      if (res && res.products && res.products.length > 0) {
        setScrapedItems(res.products.slice(0, 10));
      } else {
        setImportError('Could not find product catalog at this URL. Please verify the link is accessible.');
      }
    } catch (err: any) {
      setImportError(err.message || 'Failed to scan URL. Please verify the store is online.');
    } finally {
      setScraping(false);
    }
  };

  // Import and optionally replace demo products
  const handleConfirmImport = async (replaceExisting: boolean) => {
    if (scrapedItems.length === 0) return;
    setImporting(true);
    setImportError(null);

    try {
      const res = await api.importScrapedProducts({
        products: scrapedItems,
        discountPercent: 50,
        status: 'published',
        replaceExisting,
      });

      setImportSuccess(`Successfully imported ${res.importedCount} products into your store! ${replaceExisting ? 'Demo products have been replaced.' : ''}`);
      setProductChoice('imported');
    } catch (err: any) {
      setImportError(err.message || 'Import failed.');
    } finally {
      setImporting(false);
    }
  };

  // Test Gumroad token
  const handleTestToken = async () => {
    if (!accessToken.trim()) return;
    setTestingToken(true);
    setTokenStatus(null);
    try {
      const res = await api.testGumroadToken(accessToken.trim());
      if (res.success) {
        setTokenStatus({ valid: true, user: res.user });
      } else {
        setTokenStatus({ valid: false, error: res.error });
      }
    } catch (err: any) {
      setTokenStatus({ valid: false, error: err.message });
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
    <div className="min-h-screen bg-[#07080B] text-gray-200 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto w-full">
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-8 px-2 sm:px-4">
          {[
            { num: 1, label: 'Store Identity' },
            { num: 2, label: 'Theme Colors' },
            { num: 3, label: 'Add Products', optional: true },
            { num: 4, label: 'Gumroad Sync', optional: true },
            { num: 5, label: 'Launch' },
          ].map((s) => (
            <div key={s.num} className="flex flex-col items-center gap-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                  step === s.num
                    ? 'bg-indigo-600 text-white ring-4 ring-indigo-500/20'
                    : step > s.num
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white/10 text-gray-400'
                }`}
              >
                {step > s.num ? <CheckCircle2 className="w-4 h-4" /> : s.num}
              </div>
              <span className="text-[10px] text-gray-400 hidden sm:block">
                {s.label} {s.optional && <span className="text-gray-500 text-[9px]">(Opt)</span>}
              </span>
            </div>
          ))}
        </div>

        {/* Wizard Card */}
        <div className="bg-[#12141C] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">

          {/* ──── STEP 1: Store Identity ──── */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div>
                <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">Step 1 of 5</span>
                <h3 className="text-xl font-black text-white mt-1 font-heading">Store Identity &amp; Branding</h3>
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

          {/* ──── STEP 2: Theme Colors ──── */}
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

          {/* ──── STEP 3: Add Products (OPTIONAL + INLINE IMPORTER) ──── */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">Step 3 of 5</span>
                    <span className="text-[10px] bg-white/10 text-gray-300 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      Optional
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-white mt-1 font-heading">Add Your First Products</h3>
                  <p className="text-xs text-gray-400">Import products from any website or keep demo products for now.</p>
                </div>

                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-bold hover:underline shrink-0"
                >
                  Skip this step →
                </button>
              </div>

              {/* 1-Click URL Scraper Tool Inline */}
              <div className="p-4 sm:p-5 bg-[#0A0A0F] border border-white/10 rounded-2xl space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider">
                  <Download className="w-4 h-4" />
                  <span>1-Click Universal Product Importer</span>
                </div>
                <p className="text-xs text-gray-400">
                  Paste any Shopify, WooCommerce, or web store URL to auto-extract titles, prices, and photos:
                </p>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="url"
                    value={importUrl}
                    onChange={(e) => setImportUrl(e.target.value)}
                    placeholder="https://example.com/products/my-item or Shopify URL"
                    className="flex-1 bg-[#141722] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleScrape}
                    disabled={scraping || !importUrl.trim()}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shrink-0"
                  >
                    {scraping ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                    <span>{scraping ? 'Scanning…' : 'Scrape Products'}</span>
                  </button>
                </div>

                {importError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{importError}</span>
                  </div>
                )}

                {/* Scraped Results Preview */}
                {scrapedItems.length > 0 && (
                  <div className="space-y-3 pt-2 border-t border-white/5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white">Found {scrapedItems.length} Products at URL</span>
                      <span className="text-indigo-400 font-mono text-[11px]">Ready to Import</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
                      {scrapedItems.slice(0, 6).map((item, idx) => (
                        <div key={idx} className="p-2 bg-white/5 border border-white/5 rounded-xl flex items-center gap-2">
                          <img
                            src={item.thumbnail || item.images?.[0]}
                            alt={item.title}
                            className="w-8 h-8 rounded-lg object-cover shrink-0"
                            onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=80&q=80'; }}
                          />
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold text-white truncate">{item.title}</p>
                            <p className="text-[10px] text-gray-400">{formatPrice(item.price)}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Import Confirmation Buttons */}
                    <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => handleConfirmImport(true)}
                        disabled={importing}
                        className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold uppercase rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
                      >
                        {importing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        <span>✅ Replace Demo Products &amp; Import ({scrapedItems.length})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleConfirmImport(false)}
                        disabled={importing}
                        className="w-full sm:w-auto px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white text-xs font-bold uppercase rounded-xl transition-all"
                      >
                        <span>➕ Add to Existing</span>
                      </button>
                    </div>
                  </div>
                )}

                {importSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{importSuccess}</span>
                  </div>
                )}
              </div>

              {/* Option Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setProductChoice('demo');
                    setStep(4);
                  }}
                  className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                    productChoice === 'demo' ? 'border-indigo-500/50 bg-indigo-500/5' : 'border-white/10 bg-[#0A0A0F]'
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Package className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Keep 5 Demo Products</h4>
                    <p className="text-[11px] text-gray-400 mt-0.5">Explore your store with demo gear; replace or edit anytime.</p>
                  </div>
                </button>

                <Link
                  to="/admin/import"
                  target="_blank"
                  className="p-4 rounded-2xl border border-white/10 bg-[#0A0A0F] hover:border-white/20 text-left flex items-start gap-3 transition-all group"
                >
                  <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <ExternalLink className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-bold text-white">Advanced Batch Importer</h4>
                      <ExternalLink className="w-3 h-3 text-gray-500" />
                    </div>
                    <p className="text-[11px] text-gray-400 mt-0.5">Open the full catalog importer tool in a new tab.</p>
                  </div>
                </Link>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white"
                >
                  Back
                </button>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(4)}
                    className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-white"
                  >
                    Skip
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
            </div>
          )}

          {/* ──── STEP 4: Connect Gumroad (OPTIONAL + VISUAL WIZARD TRIGGER) ──── */}
          {step === 4 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">Step 4 of 5</span>
                    <span className="text-[10px] bg-white/10 text-gray-300 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      Optional
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-white mt-1 font-heading">Connect Gumroad</h3>
                  <p className="text-xs text-gray-400">Add your Gumroad Store URL or API Token for instant checkout.</p>
                </div>

                <button
                  type="button"
                  onClick={() => setStep(5)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-bold hover:underline shrink-0"
                >
                  Skip this step →
                </button>
              </div>

              {/* Wizard Launch Banner */}
              <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-950/50 via-purple-950/40 to-black border border-indigo-500/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold">
                    <Sparkles className="w-4 h-4" />
                    <span>Need Help Finding Your Gumroad Token?</span>
                  </div>
                  <p className="text-xs text-gray-300">
                    Follow our 4-step illustrated setup wizard to create an application and generate your access token in 60 seconds.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowGumroadWizard(true)}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-indigo-900/40 whitespace-nowrap flex items-center gap-1.5"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Open Setup Wizard</span>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">Gumroad Store URL</label>
                  <input
                    type="url"
                    value={gumroadUrl}
                    onChange={(e) => setGumroadUrl(e.target.value)}
                    placeholder="https://yourusername.gumroad.com"
                    className="w-full bg-[#0A0A0F] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    Gumroad Access Token (Optional)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={accessToken}
                      onChange={(e) => setAccessToken(e.target.value)}
                      placeholder="Paste token from Gumroad Settings > Advanced > Applications"
                      className="w-full bg-[#0A0A0F] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleTestToken}
                      disabled={testingToken || !accessToken}
                      className="px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white text-xs font-bold rounded-xl whitespace-nowrap disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {testingToken && <RefreshCw className="w-3 h-3 animate-spin" />}
                      <span>{testingToken ? 'Testing…' : 'Test Token'}</span>
                    </button>
                  </div>

                  {tokenStatus && (
                    <div
                      className={`mt-2 p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                        tokenStatus.valid
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : 'bg-red-500/10 border-red-500/30 text-red-400'
                      }`}
                    >
                      {tokenStatus.valid ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span>Connected to Gumroad Account: <strong>{tokenStatus.user?.name || tokenStatus.user?.email || 'Authorized'}</strong></span>
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
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white"
                >
                  Back
                </button>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(5)}
                    className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-white"
                  >
                    Skip
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
            </div>
          )}

          {/* ──── STEP 5: Launch ──── */}
          {step === 5 && (
            <div className="text-center space-y-6 animate-in fade-in duration-200 py-4">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center mx-auto shadow-xl shadow-indigo-600/30">
                <Rocket className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-2xl font-black text-white font-heading">Your Store is Ready to Launch!</h3>
                <p className="text-xs text-gray-400 max-w-md mx-auto mt-2 leading-relaxed">
                  Your store is provisioned and ready. You can now explore your live storefront, manage your catalog, or link additional products in the CMS.
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

      {/* Gumroad Setup Wizard Modal */}
      <GumroadSetupWizardModal
        isOpen={showGumroadWizard}
        onClose={() => setShowGumroadWizard(false)}
        initialStoreUrl={gumroadUrl}
        initialToken={accessToken}
        onConnected={(tok, url) => {
          setAccessToken(tok);
          setGumroadUrl(url);
          setTokenStatus({ valid: true });
          setShowGumroadWizard(false);
        }}
      />
    </div>
  );
};
