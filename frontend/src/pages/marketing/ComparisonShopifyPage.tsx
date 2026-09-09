import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { SaaSFooter } from '../../components/common/SaaSFooter';
import {
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Zap,
  Rocket,
  Star,
  DollarSign,
  Package,
  ShoppingCart,
  Download,
  Clock,
  Sparkles,
  HelpCircle,
} from 'lucide-react';

export const ComparisonShopifyPage: React.FC = () => {
  const [monthlyRevenue, setMonthlyRevenue] = useState(15000);

  // Financial calculations
  const shopifyBase = 39 * 12; // $468/yr
  const shopifyApps = 180 * 12; // $2,160/yr typical apps (reviews, recovery, customizer)
  const shopifyTxnFee = (monthlyRevenue * 12) * 0.029; // 2.9%
  const totalShopifyCost = Math.round(shopifyBase + shopifyApps + shopifyTxnFee);

  const gumshopCost = 108; // $9/mo billed annually
  const netSaved = Math.max(0, totalShopifyCost - gumshopCost);

  const comparisonRows = [
    {
      feature: 'Base Monthly Cost',
      shopify: '$39 / month ($468/yr)',
      gumshop: '100% Free or $12/mo flat',
      winner: 'gumshop',
      why: 'No forced monthly subscription fees just to keep your store online.',
    },
    {
      feature: 'Transaction Commission',
      shopify: '2.9% + 30¢ per transaction',
      gumshop: '0% Platform Fee',
      winner: 'gumshop',
      why: 'GumShop never takes a percentage cut of your physical merchandise revenue.',
    },
    {
      feature: 'Time to Launch Store',
      shopify: '3 to 14 days (theme setup)',
      gumshop: '60 Seconds (Headless)',
      winner: 'gumshop',
      why: 'Connect Gumroad token and get an instant high-converting storefront.',
    },
    {
      feature: 'Shopify Store Catalog Import',
      shopify: 'Requires paid migration apps',
      gumshop: '1-Click Free Scraper',
      winner: 'gumshop',
      why: 'Paste any Shopify URL to instantly copy your catalog, photos & pricing.',
    },
    {
      feature: 'Physical Address Lead Capture',
      shopify: 'Standard checkout',
      gumshop: 'Pre-checkout lead capture',
      winner: 'gumshop',
      why: 'Captures physical street addresses before Gumroad redirect so you never lose buyer info.',
    },
    {
      feature: 'Built-In App Ecosystem',
      shopify: '$100–$300/mo extra for apps',
      gumshop: 'All-inclusive (Promos, Tracking)',
      winner: 'gumshop',
      why: 'Discount engines, tracking timelines, and theme studios are built-in for free.',
    },
    {
      feature: 'Enterprise POS & Retail Hardware',
      shopify: 'Extensive (Barcode scanners, iPad POS)',
      gumshop: 'Online-first (Headless)',
      winner: 'shopify',
      why: 'If you run 50 physical retail brick-and-mortar stores, Shopify POS is superior.',
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
                  <linearGradient id="gsNavBgShopify" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#6366f1"/>
                    <stop offset="100%" stopColor="#9333ea"/>
                  </linearGradient>
                </defs>
                <rect width="48" height="48" rx="12" fill="url(#gsNavBgShopify)"/>
                <path d="M15 20h18l-2 14H17L15 20z" stroke="white" strokeWidth="2.2" strokeLinejoin="round" fill="none"/>
                <path d="M19 20c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="white" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
                <path d="M25.5 24l-3.5 4.5h3l-1 5 4-5.5h-3l0.5-4z" fill="white"/>
              </svg>
            </span>
            <span className="text-lg font-black tracking-tight text-white">GumShop</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              to="/store/demo"
              className="text-xs font-bold text-gray-400 hover:text-white transition-colors hidden sm:block"
            >
              Demo Store
            </Link>
            <Link
              to="/signup"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-900/40 transition-all"
            >
              Switch from Shopify Free
            </Link>
          </div>
        </nav>
      </header>

      <main className="pt-28 pb-20">
        {/* Hero Section */}
        <section className="max-w-5xl mx-auto px-5 lg:px-8 text-center space-y-6 pt-8 pb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-black uppercase tracking-widest">
            <span>2026 UNBIASED COMPARISON</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-white uppercase tracking-tight font-heading leading-tight">
            Shopify vs. GumShop
            <br />
            <span className="bg-gradient-to-r from-red-400 via-amber-300 to-emerald-400 bg-clip-text text-transparent">
              Stop Paying the $3,480/yr Shopify Tax
            </span>
          </h1>

          <p className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Shopify is built for enterprise retailers with dedicated dev teams. GumShop is engineered for creators and merchants who want a high-converting headless store in 60 seconds with 0% extra transaction fees.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link
              to="/signup"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-sm uppercase tracking-wider shadow-xl shadow-emerald-950/60 transition-all hover:scale-105"
            >
              1-Click Migrate from Shopify
            </Link>
            <Link
              to="/store/demo"
              className="w-full sm:w-auto px-6 py-4 rounded-2xl border border-white/10 bg-white/5 text-gray-300 hover:text-white font-bold text-sm transition-colors"
            >
              Explore Demo Store ↗
            </Link>
          </div>
        </section>

        {/* Live ROI Savings Calculator */}
        <section className="max-w-4xl mx-auto px-5 lg:px-8 pb-16">
          <div className="rounded-3xl border border-white/15 bg-[#0F121C] p-6 sm:p-10 shadow-2xl space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-4 border-b border-white/10">
              <div>
                <h3 className="text-lg font-black text-white uppercase font-heading">
                  Interactive Cost Comparison Calculator
                </h3>
                <p className="text-xs text-gray-400">Calculate your exact savings by switching to GumShop</p>
              </div>
              <span className="text-2xl font-black text-emerald-400 font-mono">
                +${netSaved.toLocaleString()} / year saved
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-xs font-bold text-gray-400">
                <span>Monthly Store Revenue:</span>
                <span className="text-white font-mono text-sm">${monthlyRevenue.toLocaleString()} / mo</span>
              </div>
              <input
                type="range"
                min={1000}
                max={100000}
                step={1000}
                value={monthlyRevenue}
                onChange={(e) => setMonthlyRevenue(Number(e.target.value))}
                className="w-full h-3 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex justify-between text-[10px] font-mono text-gray-500">
                <span>$1,000/mo</span>
                <span>$50,000/mo</span>
                <span>$100,000/mo</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/20 space-y-1">
                <span className="text-xs font-bold uppercase text-red-400 block">Total Shopify Cost</span>
                <span className="text-2xl font-black text-white font-mono">${totalShopifyCost.toLocaleString()} / yr</span>
                <span className="text-[11px] text-gray-400 block">$39/mo base + $180/mo apps + 2.9% cut</span>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-1">
                <span className="text-xs font-bold uppercase text-emerald-400 block">Total GumShop Cost</span>
                <span className="text-2xl font-black text-white font-mono">${gumshopCost} / yr</span>
                <span className="text-[11px] text-emerald-200/80 block">Pro Plan ($9/mo) · 0% extra cuts</span>
              </div>
            </div>
          </div>
        </section>

        {/* Detailed Comparison Table */}
        <section className="max-w-5xl mx-auto px-5 lg:px-8 pb-20 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-4xl font-black text-white uppercase font-heading">
              Head-to-Head Feature Breakdown
            </h2>
            <p className="text-xs sm:text-sm text-gray-400">
              An honest evaluation of why creators switch from Shopify to GumShop.
            </p>
          </div>

          <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#0E1118] shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-300">
                <thead className="bg-[#141722] text-[11px] font-black uppercase text-gray-400 border-b border-white/10">
                  <tr>
                    <th className="p-4 sm:p-5">Feature</th>
                    <th className="p-4 sm:p-5 text-red-400">Shopify</th>
                    <th className="p-4 sm:p-5 text-emerald-400">GumShop</th>
                    <th className="p-4 sm:p-5 hidden md:table-cell">Why It Matters</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {comparisonRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 sm:p-5 font-bold text-white whitespace-nowrap">
                        {row.feature}
                      </td>
                      <td className="p-4 sm:p-5 text-gray-300">
                        {row.shopify}
                      </td>
                      <td className="p-4 sm:p-5 font-semibold text-emerald-300 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>{row.gumshop}</span>
                      </td>
                      <td className="p-4 sm:p-5 text-gray-400 text-[11px] hidden md:table-cell leading-relaxed">
                        {row.why}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Who Should Choose What */}
        <section className="max-w-5xl mx-auto px-5 lg:px-8 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-8 rounded-3xl border border-white/10 bg-[#0F121C] space-y-4">
              <span className="text-xs font-black uppercase tracking-wider text-red-400">
                Choose Shopify If:
              </span>
              <ul className="space-y-3 text-xs text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">●</span>
                  <span>You run multiple physical brick-and-mortar retail stores with barcode scanners.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">●</span>
                  <span>You have an in-house engineering team and budget for $300+/mo in app subscriptions.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">●</span>
                  <span>You have complex enterprise ERP and multi-warehouse logistics routing.</span>
                </li>
              </ul>
            </div>

            <div className="p-8 rounded-3xl border border-emerald-500/30 bg-emerald-950/10 space-y-4 shadow-xl shadow-emerald-950/20">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                Choose GumShop If:
              </span>
              <ul className="space-y-3 text-xs text-gray-300">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>You want a modern headless store live in 60 seconds with zero coding.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>You want to keep 100% of your merchandise revenue with 0% extra transaction fees.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>You want automated customer delivery address capture paired with Gumroad payouts.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Final Switch CTA */}
        <section className="max-w-4xl mx-auto px-5 lg:px-8 text-center">
          <div className="p-10 rounded-3xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 via-[#10131F] to-purple-950/40 space-y-6 shadow-2xl">
            <h2 className="text-3xl sm:text-4xl font-black text-white uppercase font-heading">
              Ready to Escape the Shopify Tax?
            </h2>
            <p className="text-sm text-gray-400 max-w-lg mx-auto">
              Use our 1-click scraper to import your existing Shopify products in seconds. Free forever on Starter.
            </p>
            <div className="flex justify-center">
              <Link
                to="/signup"
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-sm uppercase tracking-wider shadow-xl hover:scale-105 transition-transform"
              >
                Launch My Free GumShop Store ↗
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SaaSFooter />
    </div>
  );
};
