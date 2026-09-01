import React from 'react';
import { Cookie, Shield, CheckCircle2 } from 'lucide-react';

export const CookiePolicyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#07080B] text-gray-300 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="border-b border-white/10 pb-8 mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold mb-4">
            <Cookie className="w-3.5 h-3.5" />
            <span>Cookie & Storage Policy</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white font-heading tracking-tight">
            Cookie Policy
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Last Updated: September 1, 2026 ? Effective Immediately
          </p>
        </div>

        {/* Content */}
        <div className="space-y-10 text-sm leading-relaxed text-gray-300">
          <section className="bg-[#14171F] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-400" />
              <span>1. How We Use Cookies & Local Storage</span>
            </h2>
            <p>
              GumShop utilizes minimal, privacy-friendly browser cookies and LocalStorage items strictly necessary to power your storefront experience. We do not sell your personal browsing habits to third-party data brokers.
            </p>
          </section>

          <section className="bg-[#14171F] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-4">
            <h2 className="text-lg font-bold text-white">2. Essential Storage Items</h2>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>`gumshop_cart`:</strong> Maintains the items in your shopping cart across page refreshes.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>`gumshop_admin_token`:</strong> Stores the encrypted JWT session token for authenticated store admins.</span>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
};
