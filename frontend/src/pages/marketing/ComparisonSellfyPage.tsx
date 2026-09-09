import React from 'react';
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

export const ComparisonSellfyPage: React.FC = () => {
  const comparisonRows = [
    {
      feature: 'Starter Monthly Price',
      sellfy: '$29 / month ($348/yr)',
      gumshop: '100% Free Starter Plan',
      winner: 'gumshop',
      why: 'Sellfy forces an immediate $29/mo upfront fee just to list 1 physical product.',
    },
    {
      feature: 'Annual Revenue Limits',
      sellfy: 'Capped at $10k/yr on Starter',
      gumshop: 'No Revenue Limits',
      winner: 'gumshop',
      why: 'Sellfy forcibly upgrades you and raises your price if you exceed $10k/yr in sales.',
    },
    {
      feature: 'Gumroad Payout Integration',
      sellfy: 'Not supported (Separate merchant account)',
      gumshop: 'Native Gumroad Direct Payouts',
      winner: 'gumshop',
      why: 'Leverage your existing Gumroad balance and global payment rails.',
    },
    {
      feature: 'Physical Address Capture',
      sellfy: 'Basic form fields',
      gumshop: 'Pre-checkout lead capture engine',
      winner: 'gumshop',
      why: 'Captures and verifies customer physical address before payment routing.',
    },
    {
      feature: '1-Click Catalog Migration',
      sellfy: 'Manual CSV re-upload only',
      gumshop: '1-Click Shopify & HTML Scraper',
      winner: 'gumshop',
      why: 'Scrape and import products directly from your live store with zero CSV hassle.',
    },
    {
      feature: 'Digital Subscription Tools',
      sellfy: 'Built-in digital downloads',
      gumshop: 'Backed by Gumroad ecosystem',
      winner: 'tie',
      why: 'Both platforms handle digital items, but GumShop excels at physical merch.',
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
                  <linearGradient id="gsNavBgSellfy" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#6366f1"/>
                    <stop offset="100%" stopColor="#9333ea"/>
                  </linearGradient>
                </defs>
                <rect width="48" height="48" rx="12" fill="url(#gsNavBgSellfy)"/>
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
              Start Free Store
            </Link>
          </div>
        </nav>
      </header>

      <main className="pt-28 pb-20">
        {/* Hero Section */}
        <section className="max-w-5xl mx-auto px-5 lg:px-8 text-center space-y-6 pt-8 pb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-black uppercase tracking-widest">
            <span>SELLFY ALTERNATIVE FOR PHYSICAL MERCH</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-white uppercase tracking-tight font-heading leading-tight">
            Sellfy vs. GumShop
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">
              No Revenue Caps. Zero Forced Upgrades.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Sellfy limits your revenue and charges $29/mo right out of the gate. GumShop gives you a free-forever headless storefront backed by Gumroad direct payouts.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link
              to="/signup"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black text-sm uppercase tracking-wider shadow-xl shadow-indigo-950/60 transition-all hover:scale-105"
            >
              Launch Free Store (No Caps)
            </Link>
            <Link
              to="/store/demo"
              className="w-full sm:w-auto px-6 py-4 rounded-2xl border border-white/10 bg-white/5 text-gray-300 hover:text-white font-bold text-sm transition-colors"
            >
              View Live Storefront ↗
            </Link>
          </div>
        </section>

        {/* Detailed Comparison Table */}
        <section className="max-w-5xl mx-auto px-5 lg:px-8 pb-20 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-4xl font-black text-white uppercase font-heading">
              Sellfy vs GumShop Feature Comparison
            </h2>
            <p className="text-xs sm:text-sm text-gray-400">
              Why physical product creators choose GumShop over Sellfy.
            </p>
          </div>

          <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#0E1118] shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-300">
                <thead className="bg-[#141722] text-[11px] font-black uppercase text-gray-400 border-b border-white/10">
                  <tr>
                    <th className="p-4 sm:p-5">Feature</th>
                    <th className="p-4 sm:p-5 text-purple-400">Sellfy</th>
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
                        {row.sellfy}
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

        {/* Final CTA */}
        <section className="max-w-4xl mx-auto px-5 lg:px-8 text-center">
          <div className="p-10 rounded-3xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 via-[#10131F] to-purple-950/40 space-y-6 shadow-2xl">
            <h2 className="text-3xl sm:text-4xl font-black text-white uppercase font-heading">
              Ready to Sell Physical Goods Without Limits?
            </h2>
            <p className="text-sm text-gray-400 max-w-lg mx-auto">
              No revenue ceilings. Connect your Gumroad account and launch in 60 seconds.
            </p>
            <div className="flex justify-center">
              <Link
                to="/signup"
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black text-sm uppercase tracking-wider shadow-xl hover:scale-105 transition-transform"
              >
                Create Free Store Now ↗
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SaaSFooter />
    </div>
  );
};
