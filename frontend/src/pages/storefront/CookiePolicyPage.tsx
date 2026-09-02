import React from 'react';
import { Link } from 'react-router-dom';
import {
  Cookie,
  Shield,
  CheckCircle2,
  Lock,
  Sliders,
  Settings,
  Info,
  Mail,
  ArrowRight,
} from 'lucide-react';

export const CookiePolicyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#07080B] text-gray-300 py-20 px-4 sm:px-6 lg:px-8 selection:bg-indigo-500 selection:text-white">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header */}
        <div className="border-b border-white/10 pb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider mb-4">
            <Cookie className="w-3.5 h-3.5" />
            <span>COOKIE &amp; LOCAL STORAGE POLICY</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white font-heading tracking-tight uppercase">
            Cookie &amp; Tracking Policy
          </h1>
          <p className="text-sm text-gray-400 mt-3">
            Last Updated: September 2026 · Effective for all GumShop visitors and merchants
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-8 text-sm leading-relaxed text-gray-300">
          {/* Section 1 */}
          <section className="bg-[#0E1017] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
            <h2 className="text-lg font-black text-white uppercase tracking-wide flex items-center gap-2.5">
              <Shield className="w-5 h-5 text-indigo-400" />
              <span>1. Overview &amp; Privacy-First Philosophy</span>
            </h2>
            <p>
              GumShop (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;platform&rdquo;) believes in transparent, privacy-respecting e-commerce. We only use browser cookies, LocalStorage, and SessionStorage items that are strictly necessary to deliver a fast, secure, and reliable shopping and store management experience.
            </p>
            <p>
              <strong className="text-white">We do not sell your personal data or browsing history to third-party advertising brokers.</strong>
            </p>
          </section>

          {/* Section 2: Detailed Table of Storage Items */}
          <section className="bg-[#0E1017] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-5 shadow-xl">
            <h2 className="text-lg font-black text-white uppercase tracking-wide flex items-center gap-2.5">
              <Sliders className="w-5 h-5 text-emerald-400" />
              <span>2. Storage Keys &amp; Essential Cookies We Use</span>
            </h2>
            <p className="text-xs text-gray-400">
              The table below outlines the minimal browser storage keys GumShop utilizes:
            </p>

            <div className="overflow-x-auto rounded-2xl border border-white/10">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#141722] border-b border-white/10 text-white font-bold uppercase tracking-wider">
                    <th className="p-3.5">Key / Cookie Name</th>
                    <th className="p-3.5">Type &amp; Duration</th>
                    <th className="p-3.5">Purpose &amp; Function</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-normal">
                  <tr className="hover:bg-white/5 transition-colors">
                    <td className="p-3.5 font-mono text-indigo-300 font-bold">gumshop_cart</td>
                    <td className="p-3.5 text-gray-400">LocalStorage (Persistent)</td>
                    <td className="p-3.5 text-gray-300">Preserves products in your customer shopping cart across page refreshes and visits.</td>
                  </tr>
                  <tr className="hover:bg-white/5 transition-colors">
                    <td className="p-3.5 font-mono text-indigo-300 font-bold">gumshop_currency</td>
                    <td className="p-3.5 text-gray-400">LocalStorage (Persistent)</td>
                    <td className="p-3.5 text-gray-300">Remembers your preferred display currency (USD, EUR, GBP, CAD, AUD, INR, JPY).</td>
                  </tr>
                  <tr className="hover:bg-white/5 transition-colors">
                    <td className="p-3.5 font-mono text-indigo-300 font-bold">gumshop_admin_token</td>
                    <td className="p-3.5 text-gray-400">LocalStorage (7 Days)</td>
                    <td className="p-3.5 text-gray-300">Stores the encrypted JWT session token for authenticated merchant store administrators.</td>
                  </tr>
                  <tr className="hover:bg-white/5 transition-colors">
                    <td className="p-3.5 font-mono text-indigo-300 font-bold">gumshop_theme_preview</td>
                    <td className="p-3.5 text-gray-400">SessionStorage (Session)</td>
                    <td className="p-3.5 text-gray-300">Maintains temporary theme customizer previews while styling storefront appearance.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 3: Payment Gateway & Third-Party Cookies */}
          <section className="bg-[#0E1017] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
            <h2 className="text-lg font-black text-white uppercase tracking-wide flex items-center gap-2.5">
              <Lock className="w-5 h-5 text-purple-400" />
              <span>3. Third-Party Payment Partners</span>
            </h2>
            <p>
              When completing an order or upgrading a SaaS subscription, you interact directly with secure checkout portals operated by our trusted payment processors:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                <h3 className="font-bold text-white text-xs uppercase tracking-wider">Gumroad Subscriptions</h3>
                <p className="text-xs text-gray-400">
                  Handles automated recurring subscription billing and international tax compliance with 256-bit SSL encryption.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                <h3 className="font-bold text-white text-xs uppercase tracking-wider">Gumroad Direct Checkout</h3>
                <p className="text-xs text-gray-400">
                  Processes direct consumer checkouts via credit card, PayPal, Apple Pay, and Google Pay with fraud prevention cookies.
                </p>
              </div>
            </div>
          </section>

          {/* Section 4: How to Manage or Disable Cookies */}
          <section className="bg-[#0E1017] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
            <h2 className="text-lg font-black text-white uppercase tracking-wide flex items-center gap-2.5">
              <Settings className="w-5 h-5 text-amber-400" />
              <span>4. How to Manage or Clear Cookies</span>
            </h2>
            <p>
              You can instruct your web browser to refuse all cookies, delete LocalStorage, or prompt you when a cookie is sent. Please note that disabling essential storage may prevent shopping carts from retaining items or admin dashboards from staying logged in.
            </p>
            <p className="text-xs text-gray-400">
              For step-by-step instructions on managing cookies in your browser, refer to your browser&apos;s help documentation (Google Chrome, Apple Safari, Mozilla Firefox, or Microsoft Edge).
            </p>
          </section>

          {/* Section 5: Contact & Inquiries */}
          <section className="bg-gradient-to-r from-indigo-950/40 via-[#0F1118] to-purple-950/40 border border-white/10 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
            <h2 className="text-lg font-black text-white uppercase tracking-wide flex items-center gap-2.5">
              <Mail className="w-5 h-5 text-indigo-400" />
              <span>5. Questions &amp; Data Privacy Inquiries</span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-300">
              If you have any questions regarding our Cookie Policy or data storage practices, please reach out to our privacy desk:
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <a
                href="mailto:support@gumshop.online"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>support@gumshop.online</span>
              </a>
              <Link
                to="/contact"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 font-bold text-xs uppercase tracking-wider transition-all"
              >
                <span>Contact Help Desk</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
