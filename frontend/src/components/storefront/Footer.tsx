import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../api/client';
import { Category } from '../../types';
import { Truck, Lock, ShieldCheck, Headphones, Sparkles, ArrowUpRight } from 'lucide-react';

export const Footer: React.FC = () => {
  const { theme } = useTheme();
  const { slug } = useParams<{ slug?: string }>();
  const [categories, setCategories] = useState<Category[]>([]);

  const isDemo = !slug || slug === 'demo';
  const storeName = theme?.brandName || (isDemo ? 'AudioGear & EDC Store' : 'GumShop Store');
  const storeTagline =
    theme?.tagline ||
    'Curated everyday carry essentials, high-fidelity wireless audio, and minimalist desk gear engineered with obsession for craftsmanship.';

  useEffect(() => {
    api
      .getCategories()
      .then((cats) => setCategories(cats.filter((c) => c.status === 'active')))
      .catch(() => {});
  }, []);

  const storePrefix = slug ? `/store/${slug}` : '';

  return (
    <footer className="bg-[#0A0C10] border-t border-white/10 text-gray-400 text-sm">
      {/* ── Storefront Customer Trust Bar ── */}
      <div className="border-b border-white/5 bg-[#0D0F15] py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-3 p-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-white uppercase tracking-wider">Free Global Express</h5>
              <p className="text-[11px] text-gray-400">Tracked worldwide dispatch on all orders</p>
            </div>
          </div>

          <div className="flex items-center justify-center sm:justify-start gap-3 p-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-white uppercase tracking-wider">256-Bit SSL Checkout</h5>
              <p className="text-[11px] text-gray-400">Direct encrypted payment via Gumroad</p>
            </div>
          </div>

          <div className="flex items-center justify-center sm:justify-start gap-3 p-2">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-white uppercase tracking-wider">30-Day Guarantee</h5>
              <p className="text-[11px] text-gray-400">Hassle-free replacement &amp; support</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Storefront Navigation ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Storefront Brand Description */}
          <div className="lg:col-span-2 space-y-4">
            <Link to={storePrefix || '/'} className="flex items-center gap-3 group">
              <div className="w-10 h-10 shrink-0">
                <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-lg">
                  <defs>
                    <linearGradient id="gsStoreFooterMark" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#6366f1"/>
                      <stop offset="100%" stopColor="#9333ea"/>
                    </linearGradient>
                  </defs>
                  <rect width="48" height="48" rx="12" fill="url(#gsStoreFooterMark)"/>
                  <path d="M15 20h18l-2 14H17L15 20z" stroke="white" strokeWidth="2.2" strokeLinejoin="round" fill="none"/>
                  <path d="M19 20c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="white" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
                  <path d="M25.5 24l-3.5 4.5h3l-1 5 4-5.5h-3l0.5-4z" fill="white"/>
                </svg>
              </div>
              <span className="text-xl font-black text-white uppercase font-heading tracking-wider group-hover:text-indigo-400 transition-colors">
                {storeName}
              </span>
            </Link>

            <p className="text-xs text-gray-400 max-w-sm leading-relaxed">
              {storeTagline}
            </p>

            {isDemo && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>GumShop Interactive Showcase Store</span>
              </div>
            )}
          </div>

          {/* Shop Categories */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-white uppercase tracking-widest">
              Shop Catalog
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to={storePrefix ? `${storePrefix}/collections/all` : '/collections/all'} className="hover:text-white transition-colors">
                  All Products
                </Link>
              </li>
              {categories.slice(0, 5).map((cat) => (
                <li key={cat.id}>
                  <Link
                    to={storePrefix ? `${storePrefix}/collections/${cat.slug}` : `/collections/${cat.slug}`}
                    className="hover:text-white transition-colors"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link to={storePrefix ? `${storePrefix}/bundles` : '/bundles'} className="hover:text-white transition-colors">
                  Value Bundles
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Care */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-white uppercase tracking-widest">
              Customer Support
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to={storePrefix ? `${storePrefix}/track` : '/track'} className="hover:text-white transition-colors flex items-center gap-1.5 font-medium text-indigo-300">
                  <Truck className="w-3 h-3" />
                  <span>Live Order Tracker</span>
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <Headphones className="w-3 h-3" />
                  <span>Contact &amp; Help Desk</span>
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white transition-colors">
                  About Our Brand
                </Link>
              </li>
              <li>
                <Link to="/blog" className="hover:text-white transition-colors">
                  Guides &amp; Articles
                </Link>
              </li>
              <li>
                <Link to={storePrefix ? `${storePrefix}/account` : '/account'} className="hover:text-white transition-colors">
                  Customer Orders
                </Link>
              </li>
            </ul>
          </div>

          {/* Store Policies */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-white uppercase tracking-widest">
              Store Policies
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/cookies" className="hover:text-white transition-colors">
                  Cookie &amp; Refund Policy
                </Link>
              </li>
              <li className="pt-2">
                <Link to="/admin/login" className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors">
                  Merchant Portal ↗
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* ── SaaS Powered-By Banner (Acquisition CTA for Demo/Store Customers) ── */}
        <div className="mt-12 p-4 rounded-2xl bg-[#14171F] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-gray-300 text-center sm:text-left">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-600/20 text-indigo-400 font-bold">
              ⚡
            </span>
            <span>
              Powered by <strong className="text-white">GumShop SaaS</strong> — Want to build your own 60-second store?
            </span>
          </div>
          <Link
            to="/signup"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider transition-all border border-white/10 shrink-0"
          >
            <span>Create Your Free Store</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Bottom copyright line */}
        <div className="mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <p>© 2026 {storeName}. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link to="/" className="text-gray-400 hover:text-white transition-colors">
              GumShop Platform
            </Link>
            <Link to="/#pricing" className="text-gray-400 hover:text-white transition-colors">
              SaaS Pricing
            </Link>
            <Link to="/admin/login" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
              Store Owner Sign In
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
