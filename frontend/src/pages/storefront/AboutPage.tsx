import React, { type SVGProps } from 'react';
import { Link } from 'react-router-dom';
import {
  Zap,
  ShieldCheck,
  Globe2,
  Sparkles,
  ArrowRight,
  Package,
  Layers,
  Cpu,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

function LinkedinIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

export const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#07080B] text-gray-200 py-16 selection:bg-indigo-500 selection:text-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* ── Header ── */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-black uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" />
            <span>ABOUT GUMSHOP PLATFORM &amp; STORE</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-white uppercase tracking-tight font-heading">
            The 60-Second Headless Commerce Engine
          </h1>
          <p className="text-base sm:text-lg text-gray-300 max-w-3xl mx-auto leading-relaxed">
            GumShop empowers independent creators, digital makers, and physical product brands to launch high-converting, lightning-fast storefronts in under a minute — powered by frictionless international payments.
          </p>
        </div>

        {/* ── Mission & Vision Statement ── */}
        <div className="bg-gradient-to-br from-[#121520] via-[#0F1118] to-[#0A0C10] border border-white/10 rounded-3xl p-8 sm:p-12 space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="space-y-4 relative z-10">
            <span className="text-xs font-black text-indigo-400 uppercase tracking-widest">Our Mission</span>
            <h2 className="text-2xl sm:text-3xl font-black text-white uppercase font-heading">
              E-Commerce Should Take 60 Seconds, Not 6 Weeks
            </h2>
            <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
              Traditional e-commerce platforms force creators to endure complex setups, clunky plugin ecosystems, painful gateway approval paperwork, and exorbitant transaction cuts. GumShop was engineered to tear down these barriers: connect your Gumroad account, import your catalog in 1 click, and launch a branded storefront with modern aesthetic restraint.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-white/10 relative z-10">
            <div className="p-5 bg-white/5 border border-white/5 rounded-2xl">
              <Zap className="w-6 h-6 text-indigo-400 mb-3" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Sub-Second Speed</h3>
              <p className="text-xs text-gray-400 mt-1">Headless React architecture optimized for 99+ PageSpeed scores.</p>
            </div>
            <div className="p-5 bg-white/5 border border-white/5 rounded-2xl">
              <Globe2 className="w-6 h-6 text-emerald-400 mb-3" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Global Payments</h3>
              <p className="text-xs text-gray-400 mt-1">Collect payments from 180+ countries via Visa, MasterCard &amp; PayPal.</p>
            </div>
            <div className="p-5 bg-white/5 border border-white/5 rounded-2xl">
              <ShieldCheck className="w-6 h-6 text-purple-400 mb-3" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">0% Sales Commission</h3>
              <p className="text-xs text-gray-400 mt-1">Keep 100% of your earnings. Flat predictable SaaS pricing only.</p>
            </div>
          </div>
        </div>

        {/* ── Core Platform Functions & Capabilities ── */}
        <div className="space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-black text-indigo-400 uppercase tracking-widest">Engineered for Merchants</span>
            <h2 className="text-2xl sm:text-4xl font-black text-white uppercase font-heading">
              What Powers GumShop Storefronts
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 sm:p-8 bg-[#0E1017] border border-white/10 rounded-3xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                📥
              </div>
              <h3 className="text-lg font-bold text-white">1-Click Universal Product Importer</h3>
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                Migrate entire catalogs in seconds. Paste any Shopify store URL, WooCommerce API, or product page HTML to automatically scrape titles, images, descriptions, and variants.
              </p>
            </div>

            <div className="p-6 sm:p-8 bg-[#0E1017] border border-white/10 rounded-3xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                🎨
              </div>
              <h3 className="text-lg font-bold text-white">Theme &amp; Appearance Studio</h3>
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                Choose from 8 category presets (Cyber Tech, Luxury Fashion, Organic Wellness, Digital SaaS, Coffee, Streetwear) or customize colors, fonts, and corner radii with live previews.
              </p>
            </div>

            <div className="p-6 sm:p-8 bg-[#0E1017] border border-white/10 rounded-3xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                📦
              </div>
              <h3 className="text-lg font-bold text-white">Pre-Checkout Shipping &amp; Lead Capture</h3>
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                Capture physical delivery addresses and contact information on-site before redirecting to payment. Export batch shipping labels and track fulfillment in one click.
              </p>
            </div>

            <div className="p-6 sm:p-8 bg-[#0E1017] border border-white/10 rounded-3xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                ⚡
              </div>
              <h3 className="text-lg font-bold text-white">Multi-Tenant Store Engine</h3>
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                Host thousands of independent creator storefronts on isolated sub-paths or connect custom apex domains with free automatic SSL encryption.
              </p>
            </div>
          </div>
        </div>

        {/* ── Founder Profile Card ── */}
        <div className="bg-[#121520] border border-indigo-500/30 rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 p-1 shrink-0 shadow-xl shadow-indigo-900/40">
              <div className="w-full h-full rounded-[22px] bg-[#0A0C10] flex items-center justify-center text-3xl font-black text-white font-heading">
                MR
              </div>
            </div>

            <div className="space-y-4 text-center md:text-left flex-1">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">
                  Founder &amp; Creator
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-white uppercase font-heading">
                  Founded by Manmeet Raj
                </h3>
                <p className="text-xs text-indigo-300 font-semibold mt-0.5">
                  Full-Stack Architect &amp; Indie Software Builder
                </p>
              </div>

              <p className="text-sm text-gray-300 leading-relaxed">
                &ldquo;GumShop was built out of a direct need: creators around the world want to sell physical &amp; digital products internationally without dealing with complicated merchant accounts, heavy codebases, or high transaction fees. Our goal is to give every creator the cleanest, fastest, and most conversion-focused store possible.&rdquo;
              </p>

              <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-4">
                <a
                  href="https://www.linkedin.com/in/manmeetraj967"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0077B5]/20 hover:bg-[#0077B5]/30 text-[#00A0DC] hover:text-white border border-[#0077B5]/40 text-xs font-bold transition-all shadow-sm"
                >
                  <LinkedinIcon className="w-4 h-4" />
                  <span>Connect with Manmeet on LinkedIn</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* ── Bottom CTA Bar ── */}
        <div className="text-center p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-indigo-950/40 via-[#0F1118] to-purple-950/40 border border-white/10 space-y-6">
          <h2 className="text-2xl sm:text-4xl font-black text-white uppercase font-heading">
            Ready to Launch Your Store?
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 max-w-xl mx-auto">
            Create your free store in 60 seconds. Import your first 10 products with zero upfront cost.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/signup"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-indigo-900/40 transition-all"
            >
              <span>Create Free Store in 60s</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/store/demo"
              className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 text-xs font-bold uppercase tracking-wider transition-all"
            >
              <span>Explore Live Demo Store</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
