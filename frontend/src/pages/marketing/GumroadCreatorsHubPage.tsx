import React from 'react';
import { Link } from 'react-router-dom';
import { SaaSFooter } from '../../components/common/SaaSFooter';
import {
  Package,
  ShoppingBag,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Truck,
  CheckCircle2,
  Zap,
  Star,
  Copy,
} from 'lucide-react';

export const GumroadCreatorsHubPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#07080B] text-gray-200 selection:bg-indigo-500 selection:text-white">
      {/* Top Bar Navigation */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#07080B]/90 backdrop-blur-xl">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center shrink-0">
              <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-lg">
                <defs>
                  <linearGradient id="gsNavBgCreators" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#6366f1"/>
                    <stop offset="100%" stopColor="#9333ea"/>
                  </linearGradient>
                </defs>
                <rect width="48" height="48" rx="12" fill="url(#gsNavBgCreators)"/>
                <path d="M15 20h18l-2 14H17L15 20z" stroke="white" strokeWidth="2.2" strokeLinejoin="round" fill="none"/>
                <path d="M19 20c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="white" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
                <path d="M25.5 24l-3.5 4.5h3l-1 5 4-5.5h-3l0.5-4z" fill="white"/>
              </svg>
            </span>
            <span className="text-lg font-black tracking-tight text-white">GumShop for Creators</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              to="/store/demo"
              className="text-xs font-bold text-gray-400 hover:text-white transition-colors hidden sm:block"
            >
              Live Demo Store
            </Link>
            <Link
              to="/signup"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-900/40 transition-all"
            >
              Launch Merch Store
            </Link>
          </div>
        </nav>
      </header>

      <main className="pt-28 pb-20">
        {/* Hero Section */}
        <section className="max-w-5xl mx-auto px-5 lg:px-8 text-center space-y-6 pt-8 pb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-black uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" />
            <span>EXPAND YOUR DIGITAL GUMROAD BUSINESS</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-white uppercase tracking-tight font-heading leading-tight">
            Selling Digital on Gumroad?
            <br />
            <span className="bg-gradient-to-r from-pink-400 via-purple-300 to-indigo-400 bg-clip-text text-transparent">
              Add Physical Merch in 60 Seconds
            </span>
          </h1>

          <p className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Your audience loves your templates and courses. Now sell them premium physical apparel, desk gear, and collectibles without leaving Gumroad or paying Shopify subscriptions.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link
              to="/signup"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black text-sm uppercase tracking-wider shadow-xl shadow-indigo-950/60 transition-all hover:scale-105"
            >
              Launch My Physical Store (Free)
            </Link>
            <Link
              to="/store/demo"
              className="w-full sm:w-auto px-6 py-4 rounded-2xl border border-white/10 bg-white/5 text-gray-300 hover:text-white font-bold text-sm transition-colors"
            >
              Explore Live Demo Store ↗
            </Link>
          </div>
        </section>

        {/* 3 Steps for Gumroad Creators */}
        <section className="max-w-5xl mx-auto px-5 lg:px-8 pb-20">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl border border-white/10 bg-[#0F121C] space-y-3">
              <span className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-black text-base">
                1
              </span>
              <h3 className="text-base font-black text-white uppercase font-heading">
                Connect Gumroad API
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Paste your Gumroad access token. GumShop instantly syncs your account and verifies payouts.
              </p>
            </div>

            <div className="p-6 rounded-3xl border border-white/10 bg-[#0F121C] space-y-3">
              <span className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center font-black text-base">
                2
              </span>
              <h3 className="text-base font-black text-white uppercase font-heading">
                Add Physical Merch
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Upload your apparel, hardware, or print-on-demand items with high-res photos and variant matrices.
              </p>
            </div>

            <div className="p-6 rounded-3xl border border-white/10 bg-[#0F121C] space-y-3">
              <span className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-black text-base">
                3
              </span>
              <h3 className="text-base font-black text-white uppercase font-heading">
                Automated Shipping Leads
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                GumShop captures the buyer’s physical address before checkout so you can dispatch orders instantly.
              </p>
            </div>
          </div>
        </section>

        {/* Direct Outreach Script / Generator for Partner Outreach */}
        <section className="max-w-4xl mx-auto px-5 lg:px-8 pb-20">
          <div className="rounded-3xl border border-indigo-500/20 bg-[#121522] p-8 space-y-4">
            <div className="flex items-center gap-2 text-indigo-400">
              <Sparkles className="w-5 h-5" />
              <h3 className="text-sm font-black text-white uppercase font-heading">
                Creator DM Outreach Template (For Affiliates &amp; Outreach)
              </h3>
            </div>
            <div className="p-4 rounded-2xl bg-black/60 border border-white/5 font-mono text-xs text-gray-300 leading-relaxed">
              &quot;Hey [Creator Name]! Love your Gumroad store. If you ever plan to drop physical merch or desk accessories, check out GumShop (gumshop.online). It gives you a headless store that captures physical shipping addresses and connects directly to Gumroad with 0% extra fees. Let me know if you want a free demo setup!&quot;
            </div>
          </div>
        </section>
      </main>

      <SaaSFooter />
    </div>
  );
};
