import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { SaaSFooter } from '../../components/common/SaaSFooter';
import {
  DollarSign,
  Gift,
  Share2,
  TrendingUp,
  CheckCircle2,
  Copy,
  Check,
  ArrowRight,
  Sparkles,
  Users,
  Video,
  Play,
} from 'lucide-react';

export const AffiliatesPage: React.FC = () => {
  const [referredMerchants, setReferredMerchants] = useState(50);
  const [copiedScript, setCopiedScript] = useState(false);
  const [partnerEmail, setPartnerEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Commission math: 20% on $12/mo Pro = $2.40/mo/user, 20% on $29/mo Scale = $5.80/mo/user
  const avgCommissionPerStore = 2.40; // $2.40/mo recurring
  const monthlyEarnings = Math.round(referredMerchants * avgCommissionPerStore);
  const annualEarnings = monthlyEarnings * 12;

  const handleCopyScript = () => {
    const scriptText = `Hey everyone! If you're selling merch or physical products and tired of paying Shopify $39/month plus transaction fees, check out GumShop. It connects to your Gumroad account and launches a blazing-fast headless store in literally 60 seconds with 0% extra fees. Use my link in the description for a free starter store!`;
    navigator.clipboard.writeText(scriptText);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 3000);
  };

  const handlePartnerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerEmail) return;
    setSubmitted(true);
  };

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
              Join Program Free
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

        {/* Creator Kit: Ready-to-use YouTube & TikTok Video Script */}
        <section className="max-w-4xl mx-auto px-5 lg:px-8 pb-16">
          <div className="rounded-3xl border border-white/15 bg-[#121520] p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-400">
                <Video className="w-5 h-5" />
                <h3 className="text-sm font-black text-white uppercase font-heading">
                  Done-For-You 30-Second Video Script (YouTube / TikTok / Reels)
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCopyScript}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all"
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

        {/* Quick Partner Signup Form */}
        <section className="max-w-xl mx-auto px-5 lg:px-8 text-center space-y-4">
          <div className="p-8 rounded-3xl border border-emerald-500/30 bg-[#0E131E] shadow-2xl space-y-5">
            <h3 className="text-2xl font-black text-white uppercase font-heading">
              Get Your Instant Affiliate Link
            </h3>
            <p className="text-xs text-gray-400">
              Enter your email to receive your dedicated tracking link and promo asset pack.
            </p>

            {submitted ? (
              <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold space-y-1">
                <CheckCircle2 className="w-6 h-6 mx-auto text-emerald-400" />
                <p>Welcome to the GumShop Partner Program!</p>
                <p className="text-gray-400 font-normal">
                  Your custom referral link is: <strong className="text-white">https://gumshop.online/?ref={partnerEmail.split('@')[0]}</strong>
                </p>
              </div>
            ) : (
              <form onSubmit={handlePartnerSubmit} className="space-y-3">
                <input
                  type="email"
                  required
                  placeholder="creator@youtube.com"
                  value={partnerEmail}
                  onChange={(e) => setPartnerEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500 font-mono"
                />
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-xs uppercase tracking-wider shadow-lg hover:scale-[1.02] transition-transform"
                >
                  Generate My Referral Link ↗
                </button>
              </form>
            )}
          </div>
        </section>
      </main>

      <SaaSFooter />
    </div>
  );
};
