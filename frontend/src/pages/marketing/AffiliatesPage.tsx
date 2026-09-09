import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { SaaSFooter } from '../../components/common/SaaSFooter';
import {
  DollarSign,
  Gift,
  TrendingUp,
  CheckCircle2,
  Copy,
  Check,
  ArrowRight,
  Sparkles,
  Users,
  Video,
  Play,
  ShieldCheck,
  Search,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  ExternalLink,
  Wallet,
} from 'lucide-react';

export const AffiliatesPage: React.FC = () => {
  const [referredMerchants, setReferredMerchants] = useState(50);
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedRefLink, setCopiedRefLink] = useState(false);

  // Form State
  const [activeTab, setActiveTab] = useState<'signup' | 'lookup'>('signup');
  const [partnerEmail, setPartnerEmail] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [payoutAddress, setPayoutAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    code: string;
    referralUrl: string;
    name?: string;
    email: string;
    totalClicks?: number;
    totalConversions?: number;
    unpaidEarnings?: number;
  } | null>(null);

  // Lookup State
  const [lookupQuery, setLookupQuery] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookupResult, setLookupResult] = useState<{
    code: string;
    name?: string;
    email: string;
    commissionRate: number;
    totalClicks: number;
    totalConversions: number;
    totalEarnings: number;
    unpaidEarnings: number;
    paidEarnings: number;
    referralUrl: string;
    status: string;
  } | null>(null);

  // FAQ open states
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Commission math: 20% on $12/mo Pro = $2.40/mo, 20% on $29/mo Scale = $5.80/mo (avg ~$3.00/mo)
  const avgCommissionPerStore = 2.40;
  const monthlyEarnings = Math.round(referredMerchants * avgCommissionPerStore);
  const annualEarnings = monthlyEarnings * 12;

  const copyToClipboard = (text: string, isScript = false) => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text);
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
      } catch (err) {
        console.error('Fallback copy failed', err);
      }
      document.body.removeChild(textArea);
    }

    if (isScript) {
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 3000);
    } else {
      setCopiedRefLink(true);
      setTimeout(() => setCopiedRefLink(false), 3000);
    }
  };

  const handleCopyScript = () => {
    const scriptText = `Hey everyone! If you're selling merch or physical products and tired of paying Shopify $39/month plus transaction fees, check out GumShop. It connects to your Gumroad account and launches a blazing-fast headless store in literally 60 seconds with 0% extra fees. Use my link in the description for a free starter store!`;
    copyToClipboard(scriptText, true);
  };

  const handlePartnerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerEmail) return;

    setLoading(true);
    setError(null);

    try {
      const res = await api.registerAffiliate({
        email: partnerEmail.trim(),
        name: partnerName.trim() || undefined,
        customCode: customCode.trim() || undefined,
        payoutAddress: payoutAddress.trim() || undefined,
        payoutMethod: 'paypal',
      });

      setSuccessData({
        code: res.affiliate.code,
        referralUrl: res.referralUrl || `https://gumshop.online/?ref=${res.affiliate.code}`,
        name: res.affiliate.name,
        email: res.affiliate.email,
        totalClicks: res.affiliate.totalClicks || 0,
        totalConversions: res.affiliate.totalConversions || 0,
        unpaidEarnings: res.affiliate.unpaidEarnings || 0,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to register affiliate partner.');
    } finally {
      setLoading(false);
    }
  };

  const handleLookupStats = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupQuery) return;

    setLookupLoading(true);
    setLookupError(null);
    setLookupResult(null);

    try {
      const res = await api.getAffiliateStats(lookupQuery.trim());
      setLookupResult(res.affiliate as any);
    } catch (err: any) {
      setLookupError(err.message || 'No partner found with that referral handle or email.');
    } finally {
      setLookupLoading(false);
    }
  };

  const faqs = [
    {
      q: 'How does the 20% recurring commission work?',
      a: 'When a merchant signs up via your link and upgrades to a Pro ($12/mo) or Scale ($29/mo) plan, you earn 20% of their subscription every single month for as long as they stay subscribed. 50 active Pro merchants = $120/mo pure passive income.',
    },
    {
      q: 'How and when are partner payouts sent?',
      a: 'Commissions are calculated in real-time and paid out monthly via PayPal, Gumroad, or direct bank transfer on the 1st of every month with a low $20 minimum payout threshold.',
    },
    {
      q: 'How long do tracking cookies last?',
      a: 'We use 60-day attribution tracking. If a creator clicks your link today and launches their store anytime within 60 days, you are permanently credited as their referring partner.',
    },
    {
      q: 'Can I promote GumShop to my YouTube, TikTok, or Twitter audience?',
      a: 'Yes! We provide copy-paste video scripts, high-res banners, comparison slides against Shopify, and discount vouchers you can share directly with your audience.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#07080B] text-gray-200 selection:bg-indigo-500 selection:text-white">
      {/* Top Bar Navigation */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#07080B]/90 backdrop-blur-xl">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center shrink-0">
              <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-lg">
                <defs>
                  <linearGradient id="gsNavBgAff" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#6366f1"/>
                    <stop offset="100%" stopColor="#9333ea"/>
                  </linearGradient>
                </defs>
                <rect width="48" height="48" rx="12" fill="url(#gsNavBgAff)"/>
                <path d="M15 20h18l-2 14H17L15 20z" stroke="white" strokeWidth="2.2" strokeLinejoin="round" fill="none"/>
                <path d="M19 20c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="white" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
                <path d="M25.5 24l-3.5 4.5h3l-1 5 4-5.5h-3l0.5-4z" fill="white"/>
              </svg>
            </span>
            <span className="text-lg font-black tracking-tight text-white">GumShop Partner Program</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              to="/signup"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-900/40 transition-all"
            >
              Create Store
            </Link>
          </div>
        </nav>
      </header>

      <main className="pt-28 pb-20">
        {/* Hero Section */}
        <section className="max-w-5xl mx-auto px-5 lg:px-8 text-center space-y-6 pt-8 pb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black uppercase tracking-widest">
            <Gift className="w-3.5 h-3.5" />
            <span>20% LIFETIME RECURRING REVENUE SHARE</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-white uppercase tracking-tight font-heading leading-tight">
            Earn Monthly Passive Income
            <br />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-300 bg-clip-text text-transparent">
              Empowering Creators to Escape Shopify Fees
            </span>
          </h1>

          <p className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Are you a YouTuber, TikTok creator, educator, or e-commerce consultant? Refer merchants to GumShop and earn a <strong>20% recurring cut</strong> of every active paid subscription for life.
          </p>
        </section>

        {/* Interactive Earnings Calculator */}
        <section className="max-w-4xl mx-auto px-5 lg:px-8 pb-16">
          <div className="rounded-3xl border border-white/15 bg-[#0F121C] p-6 sm:p-10 shadow-2xl space-y-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-4 border-b border-white/10">
              <div>
                <h3 className="text-lg font-black text-white uppercase font-heading">
                  Creator Partner Revenue Calculator
                </h3>
                <p className="text-xs text-gray-400">Estimate your recurring monthly affiliate income</p>
              </div>
              <span className="text-2xl font-black text-emerald-400 font-mono">
                ${monthlyEarnings.toLocaleString()} / mo MRR
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-xs font-bold text-gray-400">
                <span>Active Paying Stores Referred:</span>
                <span className="text-white font-mono text-sm">{referredMerchants} Stores</span>
              </div>
              <input
                type="range"
                min={5}
                max={500}
                step={5}
                value={referredMerchants}
                onChange={(e) => setReferredMerchants(Number(e.target.value))}
                className="w-full h-3 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex justify-between text-[10px] font-mono text-gray-500">
                <span>5 stores</span>
                <span>100 stores</span>
                <span>250 stores</span>
                <span>500 stores</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <span className="text-xs font-bold uppercase text-gray-400 block">Estimated Monthly Payout</span>
                <span className="text-3xl font-black text-white font-mono">${monthlyEarnings.toLocaleString()} / mo</span>
                <span className="text-[11px] text-gray-400 block">Direct payouts via PayPal or Gumroad</span>
              </div>
              <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-1">
                <span className="text-xs font-bold uppercase text-emerald-400 block">Estimated Annual Income</span>
                <span className="text-3xl font-black text-emerald-400 font-mono">${annualEarnings.toLocaleString()} / yr</span>
                <span className="text-[11px] text-emerald-200/80 block">Passive recurring compounding income</span>
              </div>
            </div>
          </div>
        </section>

        {/* Partner Portal: Signup & Live Stats Tracker */}
        <section className="max-w-2xl mx-auto px-5 lg:px-8 pb-16">
          <div className="rounded-3xl border border-emerald-500/30 bg-[#0E131E] shadow-2xl p-6 sm:p-8 space-y-6">
            {/* Tabs */}
            <div className="flex rounded-2xl bg-black/50 p-1 border border-white/10">
              <button
                type="button"
                onClick={() => setActiveTab('signup')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  activeTab === 'signup'
                    ? 'bg-emerald-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                1. Get Instant Partner Link
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('lookup')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  activeTab === 'lookup'
                    ? 'bg-emerald-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                2. Check My Stats & Payout
              </button>
            </div>

            {/* Error banner */}
            {(error || lookupError) && (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error || lookupError}</span>
              </div>
            )}

            {/* TAB 1: Partner Link Generator */}
            {activeTab === 'signup' && (
              <>
                {successData ? (
                  <div className="space-y-5">
                    <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/40 text-center space-y-3">
                      <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400" />
                      <div>
                        <h4 className="text-base font-black text-white uppercase font-heading">
                          🎉 Your Partner Link is Active!
                        </h4>
                        <p className="text-xs text-emerald-300 mt-1">
                          Share this link in your YouTube descriptions, TikTok bio, or newsletter to earn 20% recurring MRR.
                        </p>
                      </div>

                      {/* Copyable link card */}
                      <div className="p-3 bg-black/60 rounded-xl border border-emerald-500/30 flex items-center justify-between gap-2">
                        <span className="font-mono text-xs text-emerald-300 font-bold truncate">
                          {successData.referralUrl}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(successData.referralUrl)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider shrink-0 transition-all"
                        >
                          {copiedRefLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedRefLink ? 'Copied!' : 'Copy Link'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-0.5">
                        <span className="text-[10px] text-gray-400 uppercase font-bold block">Clicks</span>
                        <span className="text-lg font-black text-white font-mono">{successData.totalClicks || 0}</span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-0.5">
                        <span className="text-[10px] text-gray-400 uppercase font-bold block">Stores Referred</span>
                        <span className="text-lg font-black text-emerald-400 font-mono">{successData.totalConversions || 0}</span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/20 space-y-0.5">
                        <span className="text-[10px] text-emerald-400 uppercase font-bold block">Unpaid Due</span>
                        <span className="text-lg font-black text-emerald-400 font-mono">${(successData.unpaidEarnings || 0).toFixed(2)}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSuccessData(null);
                        setPartnerEmail('');
                      }}
                      className="w-full py-2 text-center text-xs text-gray-400 hover:text-white"
                    >
                      ← Register another partner code
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handlePartnerSubmit} className="space-y-4 text-xs">
                    <div className="space-y-1.5">
                      <label className="font-bold text-gray-300">Creator / Influencer Email *</label>
                      <input
                        type="email"
                        required
                        placeholder="creator@youtube.com"
                        value={partnerEmail}
                        onChange={(e) => setPartnerEmail(e.target.value)}
                        className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="font-bold text-gray-300">Channel / Brand Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Ali Ecom"
                          value={partnerName}
                          onChange={(e) => setPartnerName(e.target.value)}
                          className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-gray-300">Custom Code / Handle</label>
                        <input
                          type="text"
                          placeholder="e.g. aliecom"
                          value={customCode}
                          onChange={(e) => setCustomCode(e.target.value)}
                          className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500 font-mono"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-gray-300">PayPal or Gumroad Email (For Payouts)</label>
                      <input
                        type="text"
                        placeholder="payouts@paypal.com"
                        value={payoutAddress}
                        onChange={(e) => setPayoutAddress(e.target.value)}
                        className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-950/50 hover:scale-[1.01] transition-all disabled:opacity-50"
                    >
                      {loading ? 'Activating Link...' : 'Generate My 20% Partner Link ↗'}
                    </button>
                  </form>
                )}
              </>
            )}

            {/* TAB 2: Partner Stats Lookup */}
            {activeTab === 'lookup' && (
              <div className="space-y-5">
                <form onSubmit={handleLookupStats} className="space-y-3 text-xs">
                  <div className="space-y-1.5">
                    <label className="font-bold text-gray-300">Enter Your Partner Code or Registered Email</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        placeholder="e.g. aliecom or creator@youtube.com"
                        value={lookupQuery}
                        onChange={(e) => setLookupQuery(e.target.value)}
                        className="flex-1 px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500 font-mono"
                      />
                      <button
                        type="submit"
                        disabled={lookupLoading}
                        className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider shrink-0 transition-all disabled:opacity-50"
                      >
                        {lookupLoading ? 'Checking...' : 'Lookup'}
                      </button>
                    </div>
                  </div>
                </form>

                {lookupResult && (
                  <div className="space-y-4 pt-2">
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-white font-bold text-sm">{lookupResult.name || lookupResult.email}</span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px] uppercase">
                          {lookupResult.status} Partner ({Math.round(lookupResult.commissionRate * 100)}% Rev-Share)
                        </span>
                      </div>

                      <div className="p-2.5 bg-black/40 rounded-xl border border-white/5 flex items-center justify-between gap-2">
                        <span className="font-mono text-xs text-gray-300 truncate">
                          {lookupResult.referralUrl}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(lookupResult.referralUrl)}
                          className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold shrink-0 transition-colors"
                        >
                          {copiedRefLink ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                      <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                        <span className="text-[10px] text-gray-400 uppercase font-bold block">Clicks</span>
                        <span className="text-base font-black text-white font-mono">{lookupResult.totalClicks}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                        <span className="text-[10px] text-gray-400 uppercase font-bold block">Stores Referred</span>
                        <span className="text-base font-black text-emerald-400 font-mono">{lookupResult.totalConversions}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30">
                        <span className="text-[10px] text-emerald-400 uppercase font-bold block">Unpaid Due</span>
                        <span className="text-base font-black text-emerald-400 font-mono">${lookupResult.unpaidEarnings.toFixed(2)}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                        <span className="text-[10px] text-gray-400 uppercase font-bold block">Total Paid</span>
                        <span className="text-base font-black text-gray-300 font-mono">${lookupResult.paidEarnings.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Creator Kit: Ready-to-use YouTube & TikTok Video Script */}
        <section className="max-w-4xl mx-auto px-5 lg:px-8 pb-16">
          <div className="rounded-3xl border border-white/15 bg-[#121520] p-6 sm:p-8 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-indigo-400">
                <Video className="w-5 h-5" />
                <h3 className="text-sm font-black text-white uppercase font-heading">
                  Done-For-You 30-Second Video Script (YouTube / TikTok / Reels)
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCopyScript}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all shrink-0"
              >
                {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedScript ? 'Copied to Clipboard!' : 'Copy Script'}</span>
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-black/50 border border-white/5 font-mono text-xs text-gray-300 leading-relaxed">
              &quot;Hey everyone! If you&apos;re selling merch or physical products and tired of paying Shopify $39/month plus transaction fees, check out GumShop. It connects to your Gumroad account and launches a blazing-fast headless store in literally 60 seconds with 0% extra fees. Use my link in the description for a free starter store!&quot;
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="max-w-3xl mx-auto px-5 lg:px-8 pb-12 space-y-4">
          <h3 className="text-xl font-black text-white uppercase font-heading text-center mb-6">
            Frequently Asked Partner Questions
          </h3>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} className="rounded-2xl border border-white/10 bg-[#0F1118] overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-4 text-left flex items-center justify-between gap-4 font-bold text-sm text-white"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-emerald-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 text-xs text-gray-400 leading-relaxed border-t border-white/5 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <SaaSFooter />
    </div>
  );
};
