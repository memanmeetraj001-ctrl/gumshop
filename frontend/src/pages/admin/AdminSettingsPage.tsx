import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { SiteSettings } from '../../types';
import {
  Save,
  Check,
  ShieldAlert,
  Mail,
  Zap,
  CheckCircle2,
  Globe,
  DollarSign,
  Sparkles,
  ArrowRight,
  ExternalLink,
  KeyRound,
  RefreshCw,
  AlertCircle,
  Lock,
} from 'lucide-react';

export const AdminSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<Partial<SiteSettings>>({});
  const [customDomain, setCustomDomain] = useState('');
  const [saved, setSaved] = useState(false);
  const [activePlan, setActivePlan] = useState<'free' | 'pro' | 'scale'>('free');
  const [productCount, setProductCount] = useState(5);
  const [productLimit, setProductLimit] = useState(10);
  const [planLoading, setPlanLoading] = useState(true);

  // License key claim state
  const [licenseKey, setLicenseKey] = useState('');
  const [claimEmail, setClaimEmail] = useState('');
  const [claiming, setClaiming] = useState(false);
  const [claimResult, setClaimResult] = useState<{ success: boolean; message: string } | null>(null);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdResult, setPwdResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    api.getSettings().then(setSettings).catch(() => {});
    api.getProducts({ status: 'all' }).then((p) => setProductCount(p.length)).catch(() => {});
    // Load REAL plan from backend
    api.getBillingPlan().then((data) => {
      setActivePlan(data.plan);
      setProductLimit(data.productLimit);
    }).catch(() => {}).finally(() => setPlanLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.updateSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleClaimLicense = async () => {
    if (!claimEmail.trim() || !licenseKey.trim()) {
      setClaimResult({ success: false, message: 'Please enter both your account email and license key.' });
      return;
    }
    setClaiming(true);
    setClaimResult(null);
    try {
      const res = await api.claimLicense(claimEmail.trim(), licenseKey.trim());
      setClaimResult({ success: true, message: res.message || 'Plan activated successfully!' });
      // Refresh plan
      const planData = await api.getBillingPlan();
      setActivePlan(planData.plan);
      setProductLimit(planData.productLimit);
    } catch (err: any) {
      setClaimResult({ success: false, message: err.message || 'Failed to activate license. Check your email and key.' });
    } finally {
      setClaiming(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      setPwdResult({ success: false, message: 'Please enter both current and new password.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdResult({ success: false, message: 'New password and confirmation do not match.' });
      return;
    }
    if (newPassword.length < 6) {
      setPwdResult({ success: false, message: 'New password must be at least 6 characters long.' });
      return;
    }
    setPwdLoading(true);
    setPwdResult(null);
    try {
      const res = await api.changePassword({ currentPassword, newPassword });
      setPwdResult({ success: true, message: res.message || 'Password updated successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPwdResult({ success: false, message: err.message || 'Failed to update password. Please check your current password.' });
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white uppercase tracking-wider font-heading">
            Store Settings &amp; SaaS Subscription
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Manage your store subscription plan, custom domain, currency, and maintenance mode
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="flex items-center gap-1 text-xs text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
              <Check className="w-4 h-4" /> Settings Saved Live
            </span>
          )}
          <button
            type="submit"
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </div>
      </div>

      <div className="space-y-6 text-xs">
        {/* Plan & Subscription Card */}
        <div className="bg-[#14141E] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/5 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Active SaaS Plan</h3>
                <p className="text-gray-400 text-[11px]">
                  Current tier: <strong className="text-indigo-400 uppercase">{activePlan} Plan</strong> ({productCount} of {productLimit === 9999  ? 'Unlimited'  : productLimit} product slots used)
                </p>
              </div>
            </div>

            <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 font-black text-xs uppercase rounded-full border border-indigo-500/20 self-start sm:self-auto">
              {activePlan === 'free'  ? 'Starter Free ($0/mo)'  : activePlan === 'pro'  ? 'Pro Creator ($12/mo)'  : 'Unlimited Scale ($29/mo)'}
            </span>
          </div>

          {/* Pricing Tier Selector */}
          {planLoading ? (
            <div className="flex items-center gap-2 text-xs text-gray-500 py-2">
              <RefreshCw className="w-4 h-4 animate-spin" /> Loading your current plan...
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Free Card */}
            <div className={`p-4 rounded-2xl border transition-all ${activePlan === 'free' ? 'border-indigo-500 bg-indigo-500/5' : 'border-white/10 bg-[#0A0A0F]'}`}>
              <div className="flex justify-between items-center">
                <span className="font-bold text-white">Starter Free</span>
                <span className="font-black text-sm text-white">$0</span>
              </div>
              <p className="text-[11px] text-gray-500 mt-1">10 Active Products</p>
              <div className="w-full mt-4 py-1.5 rounded-lg text-[10px] font-bold uppercase text-center bg-white/5 text-gray-400 opacity-60">
                {activePlan === 'free' ? '✓ Current Plan' : 'Free Tier'}
              </div>
            </div>

            {/* Pro Card */}
            <div className={`p-4 rounded-2xl border transition-all ${activePlan === 'pro' ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/10 bg-[#0A0A0F]'}`}>
              <div className="flex justify-between items-center">
                <span className="font-bold text-indigo-400">Pro Creator</span>
                <span className="font-black text-sm text-white">$12/mo</span>
              </div>
              <p className="text-[11px] text-gray-400 mt-1">50 Products + Custom Domain</p>
              {activePlan === 'pro' ? (
                <div className="w-full mt-4 py-2 rounded-xl text-[11px] font-bold uppercase text-center bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  ✓ Active Plan
                </div>
              ) : (
                <Link
                  to="/admin/upgrade"
                  className="w-full mt-4 py-2 rounded-xl text-[11px] font-bold uppercase transition-all bg-indigo-600 hover:bg-indigo-500 text-white text-center shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-1.5"
                >
                  <span>Upgrade to Pro</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>

            {/* Scale Card */}
            <div className={`p-4 rounded-2xl border transition-all ${activePlan === 'scale' ? 'border-purple-500 bg-purple-500/10' : 'border-white/10 bg-[#0A0A0F]'}`}>
              <div className="flex justify-between items-center">
                <span className="font-bold text-purple-400">Unlimited Scale</span>
                <span className="font-black text-sm text-white">$29/mo</span>
              </div>
              <p className="text-[11px] text-gray-400 mt-1">Unlimited Products + Webhooks</p>
              {activePlan === 'scale' ? (
                <div className="w-full mt-4 py-2 rounded-xl text-[11px] font-bold uppercase text-center bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  ✓ Active Plan
                </div>
              ) : (
                <Link
                  to="/admin/upgrade"
                  className="w-full mt-4 py-2 rounded-xl text-[11px] font-bold uppercase transition-all bg-purple-600 hover:bg-purple-500 text-white text-center shadow-lg shadow-purple-600/30 flex items-center justify-center gap-1.5"
                >
                  <span>Upgrade to Scale</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          </div>
          )}

          {/* ── License Key Activation ── */}
          <div className="pt-5 border-t border-white/10 space-y-3">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-black text-white uppercase tracking-wider">Manual License Activation</h4>
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              If you purchased via direct invoice or lifetime key, enter your license key below to unlock your Pro or Scale tier.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="email"
                value={claimEmail}
                onChange={(e) => setClaimEmail(e.target.value)}
                placeholder="Your account email (used to sign up)"
                className="w-full bg-[#0F1115] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-gray-600 focus:outline-none focus:border-amber-500 text-xs"
              />
              <input
                type="text"
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value)}
                placeholder="License Key"
                className="w-full bg-[#0F1115] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-gray-600 focus:outline-none focus:border-amber-500 text-xs font-mono"
              />
            </div>
            <button
              type="button"
              onClick={handleClaimLicense}
              disabled={claiming}
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-black text-xs uppercase tracking-wider rounded-xl flex items-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-amber-900/30"
            >
              {claiming ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              {claiming ? 'Activating…' : 'Activate License Key'}
            </button>
            {claimResult && (
              <div className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-semibold ${claimResult.success ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                {claimResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                {claimResult.message}
              </div>
            )}
          </div>
        </div>

        {/* Custom Domain Settings — Plan Gated */}
        <div className={`relative bg-[#14141E] border rounded-3xl overflow-hidden transition-all duration-300 ${activePlan !== 'free' ? 'border-indigo-500/30' : 'border-white/10'}`}>

          {/* FREE TIER LOCK OVERLAY */}
          {activePlan === 'free' && (
            <div className="absolute inset-0 z-10 backdrop-blur-[2px] bg-[#0A0A0F]/80 flex flex-col items-center justify-center text-center px-6 py-8 rounded-3xl">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-4">
                <span className="text-2xl">🔒</span>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full mb-3">
                Pro &amp; Scale Feature
              </span>
              <h4 className="text-base font-black text-white mb-1">Custom Domain is Locked on Free Plan</h4>
              <p className="text-xs text-gray-400 max-w-xs leading-relaxed mb-4">
                Upgrade to connect <code className="text-indigo-300 bg-black/30 px-1 rounded">shop.yourbrand.com</code> or any custom domain to your GumShop storefront.
              </p>

              {/* Feature bullets */}
              <div className="flex flex-wrap justify-center gap-2 mb-5 text-[11px]">
                {['🌐 Custom Domain', '🔒 SSL Certificate', '📧 Email Matching', '⚡ Instant DNS'].map((f) => (
                  <span key={f} className="bg-white/5 border border-white/10 px-2.5 py-1 rounded-full text-gray-300 font-medium">{f}</span>
                ))}
              </div>

              {/* Upgrade CTAs */}
              <div className="flex flex-col sm:flex-row gap-2">
                <Link
                  to="/admin/upgrade"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-900/40 transition-all"
                >
                  <Zap className="w-3.5 h-3.5" />
                  Upgrade to Pro ($12/mo)
                  <ArrowRight className="w-3 h-3" />
                </Link>
                <Link
                  to="/admin/upgrade"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 text-xs font-bold rounded-xl transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Scale ($29/mo)
                </Link>
              </div>
            </div>
          )}

          {/* DOMAIN FORM (always rendered, blurred under overlay for free) */}
          <div className={`p-6 sm:p-8 space-y-4 ${activePlan === 'free' ? 'pointer-events-none select-none' : ''}`}>
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-3">
                <Globe className={`w-5 h-5 ${activePlan !== 'free' ? 'text-indigo-400' : 'text-gray-600'}`} />
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    Custom Domain
                    {activePlan !== 'free' ? (
                      <span className="text-[9px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Active on {activePlan}</span>
                    ) : (
                      <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Pro &amp; Scale Only</span>
                    )}
                  </h3>
                  <p className="text-gray-400 text-[11px] mt-0.5">Connect your personal domain e.g. <code className="text-indigo-300">shop.yourbrand.com</code></p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 font-semibold mb-1.5">Custom Domain Hostname</label>
                <input
                  type="text"
                  value={customDomain}
                  onChange={(e) => activePlan !== 'free' && setCustomDomain(e.target.value)}
                  placeholder="store.mybrand.com"
                  disabled={activePlan === 'free'}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-white focus:outline-none transition-all ${
                    activePlan !== 'free'
                      ? 'bg-[#0A0A0F] border-white/10 focus:border-indigo-500'
                      : 'bg-white/3 border-white/5 text-gray-600 cursor-not-allowed'
                  }`}
                />
                {activePlan !== 'free' && (
                  <p className="text-[10px] text-gray-500 mt-1">Enter the exact hostname you want to point to your store.</p>
                )}
              </div>
              <div className={`p-3.5 rounded-xl border text-[11px] space-y-1.5 ${activePlan !== 'free' ? 'bg-[#0A0A0F] border-white/5 text-gray-400' : 'bg-white/3 border-white/5 text-gray-700'}`}>
                <strong className={`block font-mono ${activePlan !== 'free' ? 'text-white' : 'text-gray-600'}`}>DNS CNAME Configuration:</strong>
                <div className="space-y-1">
                  <p>Type: <span className={`font-mono ${activePlan !== 'free' ? 'text-indigo-400' : 'text-gray-600'}`}>CNAME</span></p>
                  <p>Host: <span className={`font-mono ${activePlan !== 'free' ? 'text-indigo-400' : 'text-gray-600'}`}>store</span> <span className="text-gray-600">(or @ for root)</span></p>
                  <p>Value: <span className={`font-mono ${activePlan !== 'free' ? 'text-indigo-400' : 'text-gray-600'}`}>cname.gumshop.online</span></p>
                  <p>TTL: <span className={`font-mono ${activePlan !== 'free' ? 'text-indigo-400' : 'text-gray-600'}`}>3600</span></p>
                </div>
                {activePlan !== 'free' && (
                  <p className="text-[10px] text-emerald-400 font-semibold pt-1 border-t border-white/5">✓ SSL certificate provisioned automatically after DNS propagation (up to 48h)</p>
                )}
              </div>
            </div>

            {activePlan !== 'free' && customDomain && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2 text-xs text-emerald-400 font-semibold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Custom domain <strong>{customDomain}</strong> saved — point your CNAME to <strong>cname.gumshop.online</strong> to activate.</span>
              </div>
            )}
          </div>
        </div>

        {/* Store Information */}
        <div className="bg-[#14141E] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-4">
          <h3 className="text-base font-bold text-white">Store Information &amp; Currency</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 font-semibold mb-1.5">Support Contact Email</label>
              <input
                value={settings.contactEmail || ''}
                onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                placeholder="support@yourstore.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0F] border border-white/10 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-gray-300 font-semibold mb-1.5">Currency Code</label>
              <select
                value={settings.currency || 'USD'}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0F] border border-white/10 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="USD">USD ($) — US Dollar</option>
                <option value="EUR">EUR (€) — Euro</option>
                <option value="GBP">GBP (£) — British Pound</option>
                <option value="CAD">CAD (CA$) — Canadian Dollar</option>
                <option value="AUD">AUD (AU$) — Australian Dollar</option>
                <option value="INR">INR (Rs.) — Indian Rupee</option>
                <option value="JPY">JPY (¥) — Japanese Yen</option>
              </select>
            </div>
          </div>
        </div>

        {/* ─── Google Analytics, Google Search Console & SEO Tools ─── */}
        <div className="bg-[#14141E] border border-indigo-500/20 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Google Analytics &amp; Search Console</h3>
                <p className="text-gray-400 text-xs">
                  Connect Google Search Console indexing, GA4 visitor tracking, and custom conversion pixels.
                </p>
              </div>
            </div>
            <span className="hidden sm:inline-flex px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase border border-emerald-500/20">
              Auto-Injected Across Storefront
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Google Search Console */}
            <div className="space-y-1.5">
              <label className="flex items-center justify-between text-xs font-bold text-gray-300">
                <span>Google Search Console Verification Tag / Code</span>
                <a
                  href="https://search.google.com/search-console"
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-400 hover:text-indigo-300 text-[11px] flex items-center gap-1 font-semibold"
                >
                  <span>Open Search Console ↗</span>
                </a>
              </label>
              <input
                value={settings.googleSearchConsoleTag || ''}
                onChange={(e) => setSettings({ ...settings, googleSearchConsoleTag: e.target.value })}
                placeholder='e.g. google-site-verification=abc123xyz or ABCDEFGHIJKLMNOPQRSTUVWXYZ'
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0F] border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
              />
              <p className="text-[11px] text-gray-500">
                Paste your HTML tag verification code or token from Google Search Console.
              </p>
            </div>

            {/* Google Analytics 4 */}
            <div className="space-y-1.5">
              <label className="flex items-center justify-between text-xs font-bold text-gray-300">
                <span>Google Analytics 4 Measurement ID</span>
                <a
                  href="https://analytics.google.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-400 hover:text-indigo-300 text-[11px] flex items-center gap-1 font-semibold"
                >
                  <span>Open GA4 ↗</span>
                </a>
              </label>
              <input
                value={settings.googleAnalyticsId || ''}
                onChange={(e) => setSettings({ ...settings, googleAnalyticsId: e.target.value })}
                placeholder="e.g. G-XXXXXXXXXX"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0F] border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
              />
              <p className="text-[11px] text-gray-500">
                Tracks live visitors, storefront pageviews, and product conversions in Google Analytics.
              </p>
            </div>

            {/* Meta / Facebook Pixel */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-300">
                Meta / Facebook Pixel ID (Optional)
              </label>
              <input
                value={settings.metaPixelId || ''}
                onChange={(e) => setSettings({ ...settings, metaPixelId: e.target.value })}
                placeholder="e.g. 123456789012345"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0F] border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
              />
              <p className="text-[11px] text-gray-500">
                Fires PageView events for Facebook/Instagram retargeting ads.
              </p>
            </div>

            {/* Canonical Base URL */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-300">
                Canonical Base URL &amp; Sitemap Origin
              </label>
              <input
                value={settings.canonicalUrl || 'https://gumshop.online'}
                onChange={(e) => setSettings({ ...settings, canonicalUrl: e.target.value })}
                placeholder="https://gumshop.online"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0F] border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500"
              />
              <p className="text-[11px] text-gray-500">
                Used in <code className="text-indigo-300">/sitemap.xml</code> and <code className="text-indigo-300">/robots.txt</code>.
              </p>
            </div>
          </div>

          {/* Quick Links to Sitemap & Robots */}
          <div className="pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-4 text-gray-400">
              <span className="text-gray-300 font-semibold">Live Index Files:</span>
              <a
                href="/sitemap.xml"
                target="_blank"
                rel="noreferrer"
                className="text-indigo-400 hover:underline flex items-center gap-1"
              >
                <span>/sitemap.xml ↗</span>
              </a>
              <a
                href="/robots.txt"
                target="_blank"
                rel="noreferrer"
                className="text-indigo-400 hover:underline flex items-center gap-1"
              >
                <span>/robots.txt ↗</span>
              </a>
            </div>
            <span className="text-[11px] text-emerald-400 font-semibold">
              ✓ Ready for Google Search Console indexing
            </span>
          </div>
        </div>

        {/* Maintenance Mode */}
        <div className="bg-[#14141E] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="text-base font-bold text-white">Maintenance Mode</h3>
                <p className="text-gray-400 text-[11px]">
                  When enabled, public storefront visitors see a &quot;Store Under Maintenance&quot; message
                </p>
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={settings.maintenanceMode || false}
                onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                className="w-4 h-4 rounded accent-indigo-600"
              />
              <span className="text-white font-bold">{settings.maintenanceMode ? 'Enabled' : 'Disabled'}</span>
            </label>
          </div>
        </div>

        {/* Account Security & Password */}
        <div className="bg-[#14141E] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-white/5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Admin Account Security</h3>
              <p className="text-gray-400 text-[11px]">Change your merchant login password</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-gray-300 font-semibold mb-1.5">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0F] border border-white/10 text-white focus:outline-none focus:border-indigo-500 text-xs"
              />
            </div>
            <div>
              <label className="block text-gray-300 font-semibold mb-1.5">New Password (6+ chars)</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0F] border border-white/10 text-white focus:outline-none focus:border-indigo-500 text-xs"
              />
            </div>
            <div>
              <label className="block text-gray-300 font-semibold mb-1.5">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-type new password"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0F] border border-white/10 text-white focus:outline-none focus:border-indigo-500 text-xs"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handlePasswordChange}
              disabled={pwdLoading}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {pwdLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              <span>{pwdLoading ? 'Updating…' : 'Update Password'}</span>
            </button>

            {pwdResult && (
              <div className={`flex items-center gap-2 p-2.5 px-3.5 rounded-xl border text-xs font-semibold ${pwdResult.success ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                {pwdResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{pwdResult.message}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </form>
  );
};
