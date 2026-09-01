import React from 'react';
import { ShieldCheck, Scale, FileCheck, AlertTriangle } from 'lucide-react';

export const TermsOfServicePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#07080B] text-gray-300 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="border-b border-white/10 pb-8 mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold mb-4">
            <Scale className="w-3.5 h-3.5" />
            <span>Merchant Agreement</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white font-heading tracking-tight">
            Terms of Service
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Last Updated: September 1, 2026 ? Effective Immediately
          </p>
        </div>

        {/* Content */}
        <div className="space-y-10 text-sm leading-relaxed text-gray-300">
          <section className="bg-[#14171F] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-indigo-400" />
              <span>1. Acceptance of Terms</span>
            </h2>
            <p>
              By accessing, creating a store, or subscribing to GumShop (&ldquo;the Platform&rdquo;), you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not use our services.
            </p>
          </section>

          <section className="bg-[#14171F] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>2. Merchant Responsibilities</span>
            </h2>
            <p>
              Merchants are solely responsible for all products listed on their storefronts, order fulfillment, shipping logistics, and compliance with local commercial regulations.
            </p>
            <p>
              GumShop provides storefront rendering and CMS tools. Merchant payouts and customer card transactions are executed via Gumroad according to Gumroad&apos;s Terms of Sale.
            </p>
          </section>

          <section className="bg-[#14171F] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <span>3. Prohibited Content & Activities</span>
            </h2>
            <p>
              You agree not to use GumShop to sell illegal goods, counterfeit items, fraudulent products, or unauthorized intellectual property. Violation of this rule results in immediate store suspension.
            </p>
          </section>

          <section className="bg-[#14171F] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-4">
            <h2 className="text-lg font-bold text-white">4. Subscription Billing & Cancellations</h2>
            <p>
              GumShop Pro ($12/mo) and Scale ($29/mo) plans are billed on a recurring monthly or annual basis via Gumroad. You may cancel your subscription at any time with no lock-in contract.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
