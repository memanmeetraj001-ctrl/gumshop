import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Zap,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Layers,
  Sparkles,
  ShoppingBag,
  Truck,
  Globe,
  Database,
  Sliders,
  ChevronDown,
  HelpCircle,
  Star,
  Lock,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [annualBilling, setAnnualBilling] = useState<boolean>(true);

  const faqs = [
    {
      q: 'Do I need a Stripe or PayPal account-',
      a: 'No! That is the core advantage of GumShop. All your checkout transactions are handled securely through Gumroad, which pays you out directly to your bank account or PayPal anywhere in the world.',
    },
    {
      q: 'How does the free tier with 10 products work-',
      a: 'You can create your storefront, add up to 10 products, use the one-click scraper, capture customer shipping addresses, and sync with Gumroad completely free of charge. No credit card is required.',
    },
    {
      q: 'How does the Product Importer work-',
      a: 'You paste any store link (e.g. from Shopify, WooCommerce, or any standard web page) into the admin importer. GumShop scans the page, extracts the titles, prices, descriptions, and images, and lets you import them with custom discount pricing in 1 click.',
    },
    {
      q: 'Can I capture physical delivery addresses for shipping-',
      a: 'Yes! GumShop features a pre-checkout shipping modal that collects customer name, email, and full physical address before redirecting to Gumroad, and saves all leads into your Admin Orders Dashboard with one-click label export.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-gray-200 selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0F]/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-indigo-500/25">
              G
            </div>
            <span className="font-extrabold text-lg text-white tracking-tight">
              Gum<span className="text-indigo-400">Shop</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-xs font-semibold text-gray-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
            <Link to="/store/demo" className="text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1">
              <span>Live Demo Store</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/admin/login"
              className="text-xs font-bold text-gray-300 hover:text-white px-3.5 py-2 rounded-xl hover:bg-white/5 transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02]"
            >
              Start Free (10 Products)
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-36 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-indigo-600/15 blur-[120px] rounded-full pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold mb-6 animate-in fade-in duration-500">
          <Sparkles className="w-3.5 h-3.5" />
          <span>No Stripe or PayPal Account Needed  - Gumroad Powered</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.1] max-w-4xl mx-auto font-heading">
          Launch Your Online Store in <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">5 Minutes</span>
        </h1>

        <p className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto mt-6 leading-relaxed">
          The ultimate headless e-commerce store builder. Import products from any website in 1 click, collect shipping addresses on-site, and get paid instantly via Gumroad.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
          <Link
            to="/signup"
            className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl shadow-indigo-600/40 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
          >
            <span>Start Free  - 10 Products</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/store/demo"
            className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/15 text-white font-bold text-sm rounded-2xl border border-white/10 flex items-center justify-center gap-2 transition-all"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Explore Demo Storefront</span>
          </Link>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 max-w-3xl mx-auto mt-16 pt-12 border-t border-white/10 text-center">
          <div>
            <span className="text-2xl sm:text-3xl font-black text-white block">1-Click</span>
            <span className="text-xs text-gray-400 mt-1 block">Gumroad Catalog Sync</span>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-indigo-400 block">10 Products</span>
            <span className="text-xs text-gray-400 mt-1 block">Free Lifetime Tier</span>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <span className="text-2xl sm:text-3xl font-black text-emerald-400 block">Zero</span>
            <span className="text-xs text-gray-400 mt-1 block">Payment Processing Hassle</span>
          </div>
        </div>

        {/* Storefront Preview Card */}
        <div className="mt-16 bg-[#14141E] border border-white/15 rounded-3xl p-3 sm:p-4 shadow-2xl relative max-w-5xl mx-auto">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10 mb-3 text-xs text-gray-400">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
            </div>
            <div className="bg-[#0A0A0F] px-4 py-1 rounded-lg text-[11px] text-gray-300 font-mono flex-1 text-center truncate">
              https://gumshop.online/store/demo
            </div>
          </div>
          <div className="aspect-[16/9] sm:aspect-[21/9] bg-[#0A0A0F] rounded-2xl overflow-hidden relative flex flex-col justify-center items-center text-center p-8 bg-gradient-to-br from-[#14141E] to-[#0A0A0F]">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-2">Live Demo Store Preview</span>
            <h3 className="text-2xl sm:text-4xl font-black text-white font-heading">My GumShop Store</h3>
            <p className="text-xs sm:text-sm text-gray-400 max-w-lg mt-2">
              Wireless ANC Headphones, Minimalist Wallets, & Ergonomic Desking Gear.
            </p>
            <Link
              to="/store/demo"
              className="mt-6 px-6 py-2.5 bg-white text-black font-black text-xs uppercase rounded-xl hover:bg-gray-200 transition-colors"
            >
              Open Live Storefront ? </Link>
          </div>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-2 font-mono">
            Core Superpowers
          </h2>
          <h3 className="text-3xl sm:text-4xl font-black text-white font-heading">
            Everything You Need to Sell Online Fast
          </h3>
          <p className="text-sm text-gray-400 mt-3">
            Bypass traditional merchant account verifications and build a clean brand in minutes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 */}
          <div className="bg-[#14141E] border border-white/10 rounded-3xl p-6 hover:border-indigo-500/40 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Zap className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-white mb-2">One-Click Gumroad Sync</h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              Connect your Gumroad Access Token to automatically push products and sync direct checkout links in seconds.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-[#14141E] border border-white/10 rounded-3xl p-6 hover:border-purple-500/40 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Database className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-white mb-2">Import from Anywhere</h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              Secret product importer pulls titles, prices, and CDN photos from Shopify, WooCommerce, or any standard web page.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-[#14141E] border border-white/10 rounded-3xl p-6 hover:border-emerald-500/40 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Truck className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-white mb-2">Capture Shipping Addresses</h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              Collect complete physical delivery addresses on-site before checkout and export label CSVs with 1 click.
            </p>
          </div>

          {/* Card 4 */}
          <div className="bg-[#14141E] border border-white/10 rounded-3xl p-6 hover:border-pink-500/40 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-pink-500/10 text-pink-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Sliders className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-white mb-2">Full Headless CMS</h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              18+ built-in modules: Homepage Builder, Categories, Bundles, Navigation, Testimonials, Analytics, & SEO.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-2 font-mono">
            Transparent SaaS Pricing
          </h2>
          <h3 className="text-3xl sm:text-4xl font-black text-white font-heading">
            Pick the Perfect Plan for Your Store
          </h3>
          <p className="text-sm text-gray-400 mt-2 max-w-xl mx-auto">
            Start completely free with 10 products. Upgrade seamlessly when you are ready for custom domains and larger catalogs.
          </p>

          {/* Billing Cycle Toggle */}
          <div className="mt-8 inline-flex items-center gap-3 p-1.5 bg-[#14141E] border border-white/10 rounded-2xl">
            <button
              type="button"
              onClick={() => setAnnualBilling(false)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                !annualBilling  ? 'bg-indigo-600 text-white shadow-lg'  : 'text-gray-400 hover:text-white'
              }`}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              onClick={() => setAnnualBilling(true)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                annualBilling  ? 'bg-indigo-600 text-white shadow-lg'  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span>Annual Billing</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded-full uppercase font-black">
                Save 25%
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {/* 1. Starter Free */}
          <div className="bg-[#14141E] border border-white/10 rounded-3xl p-6 sm:p-7 flex flex-col justify-between hover:border-white/20 transition-all">
            <div>
              <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Starter Tier</span>
              <h4 className="text-xl font-bold text-white mt-1">Starter Free</h4>
              <p className="text-xs text-gray-400 mt-1">Ideal for side hustlers &amp; first-time sellers</p>

              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-black text-white">$0</span>
                <span className="text-xs text-gray-400">/ forever</span>
              </div>

              <ul className="mt-8 space-y-3 text-xs text-gray-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>Up to 10 Active Products</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>One-Click Gumroad API Sync</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Pre-Checkout Shipping Modal</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>1-Click Scraper Importer</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>18+ Headless CMS Modules</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-gray-500 shrink-0" />
                  <span className="text-gray-500">`gumshop.online/store/[slug]` URL</span>
                </li>
              </ul>
            </div>

            <Link
              to="/signup"
              className="mt-8 w-full py-3 bg-white/10 hover:bg-white/15 text-white font-bold text-xs uppercase tracking-wider rounded-xl text-center border border-white/10 transition-colors block"
            >
              Get Started Free
            </Link>
          </div>

          {/* 2. Pro Creator (Most Popular) */}
          <div className="bg-[#14141E] border-2 border-indigo-500 rounded-3xl p-6 sm:p-7 relative flex flex-col justify-between shadow-2xl shadow-indigo-500/10">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-[10px] font-black uppercase px-3 py-0.5 rounded-full shadow-md">
              Most Popular
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider">Growth Tier</span>
              <h4 className="text-xl font-bold text-white mt-1">Pro Creator</h4>
              <p className="text-xs text-gray-400 mt-1">For serious independent brands &amp; creators</p>

              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-black text-white">{annualBilling  ? '$9'  : '$12'}</span>
                <span className="text-xs text-gray-400">/ month {annualBilling  ? '(billed annually)'  : ''}</span>
              </div>

              <ul className="mt-8 space-y-3 text-xs text-gray-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span><strong>Up to 50 Active Products</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span><strong>Custom Domain (`yourbrand.com`)</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>100% White-Label (No GumShop badge)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Custom Accent Colors &amp; Styling</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Priority Creator Email Support</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>All Starter Free Features</span>
                </li>
              </ul>
            </div>

            <a
              href="https://manmeetraj6.gumroad.com/l/gumshop-pro?wanted=true"
              target="_blank"
              rel="noreferrer"
              className="mt-8 w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl text-center shadow-lg shadow-indigo-600/30 transition-colors block"
            >
              Start 14-Day Pro Trial
            </a>
          </div>

          {/* 3. Unlimited Scale */}
          <div className="bg-[#14141E] border border-white/10 rounded-3xl p-6 sm:p-7 flex flex-col justify-between hover:border-white/20 transition-all">
            <div>
              <span className="text-[10px] font-black uppercase text-purple-400 tracking-wider">Enterprise Scale</span>
              <h4 className="text-xl font-bold text-white mt-1">Unlimited Scale</h4>
              <p className="text-xs text-gray-400 mt-1">For scaling e-commerce catalogs &amp; agencies</p>

              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-black text-white">{annualBilling  ? '$24'  : '$29'}</span>
                <span className="text-xs text-gray-400">/ month {annualBilling  ? '(billed annually)'  : ''}</span>
              </div>

              <ul className="mt-8 space-y-3 text-xs text-gray-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                  <span><strong>Unlimited Products &amp; Bundles</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Automated Gumroad Webhook Sync</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Batch CSV Export for FedEx/UPS</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Google Analytics &amp; Meta Pixel Inject</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>VIP 1-on-1 Store Setup Onboarding</span>
                </li>
              </ul>
            </div>

            <a
              href="https://manmeetraj6.gumroad.com/l/gumshop-scale?wanted=true"
              target="_blank"
              rel="noreferrer"
              className="mt-8 w-full py-3 bg-white/10 hover:bg-white/15 text-white font-bold text-xs uppercase tracking-wider rounded-xl text-center border border-white/10 transition-colors block"
            >
              Get Unlimited Scale
            </a>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h3 className="text-2xl sm:text-3xl font-black text-white font-heading">
            Frequently Asked Questions
          </h3>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="bg-[#14141E] border border-white/10 rounded-2xl overflow-hidden"
            >
              <button
                onClick={() => setActiveFaq(activeFaq === i  ? null  : i)}
                className="w-full p-5 text-left flex items-center justify-between gap-4 text-sm font-bold text-white hover:text-indigo-400 transition-colors"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 transition-transform ${
                    activeFaq === i  ? 'rotate-180 text-indigo-400'  : ''
                  }`}
                />
              </button>
              {activeFaq === i && (
                <div className="px-5 pb-5 text-xs text-gray-400 leading-relaxed border-t border-white/5 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-xs">
            G
          </div>
          <span className="font-bold text-white">GumShop SaaS</span>
          <span> - 2026. All rights reserved.</span>
        </div>

        <div className="flex items-center gap-6">
          <Link to="/store/demo" className="hover:text-white transition-colors">Demo Store</Link>
          <Link to="/admin/login" className="hover:text-white transition-colors">Admin Login</Link>
          <Link to="/signup" className="text-indigo-400 hover:text-indigo-300 font-bold">Start Free</Link>
        </div>
      </footer>
    </div>
  );
};
