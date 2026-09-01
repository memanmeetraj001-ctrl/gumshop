import React from 'react';
import { Shield, Lock, Eye, FileText, CheckCircle2 } from 'lucide-react';

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#07080B] text-gray-300 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="border-b border-white/10 pb-8 mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold mb-4">
            <Shield className="w-3.5 h-3.5" />
            <span>Official Legal Document</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white font-heading tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Last Updated: September 1, 2026 ? Effective Immediately
          </p>
        </div>

        {/* Content */}
        <div className="space-y-10 text-sm leading-relaxed text-gray-300">
          <section className="bg-[#14171F] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Eye className="w-5 h-5 text-indigo-400" />
              <span>1. Overview & Scope</span>
            </h2>
            <p>
              GumShop (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) operates the SaaS e-commerce platform available at <strong>https://gumshop.online</strong>. We are committed to protecting your privacy and ensuring transparency regarding how customer data is processed.
            </p>
            <p>
              Because GumShop integrates directly with Gumroad for payment processing, we do not store, process, or transmit your credit card numbers or banking secrets directly on our servers.
            </p>
          </section>

          <section className="bg-[#14171F] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-400" />
              <span>2. Information We Collect</span>
            </h2>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Account Information:</strong> Name, business email, store slug, and subscription status when registering.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Order & Delivery Leads:</strong> Customer name, shipping address, and email entered on the pre-checkout modal to allow merchants to fulfill physical product deliveries.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Store Configuration Data:</strong> Catalog products, images, categories, and theme settings uploaded to your store CMS.</span>
              </li>
            </ul>
          </section>

          <section className="bg-[#14171F] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-pink-400" />
              <span>3. Payment Processing via Gumroad</span>
            </h2>
            <p>
              All merchant subscription fees and shopper checkout transactions are processed by <strong>Gumroad, Inc.</strong>. Payments are governed by Gumroad&apos;s Privacy Policy and Security Standards.
            </p>
            <p>
              We receive payment status pings via webhook containing the buyer email, product name, and order ID to automatically activate your subscription and track leads.
            </p>
          </section>

          <section className="bg-[#14171F] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-4">
            <h2 className="text-lg font-bold text-white">4. Data Retention & Deletion</h2>
            <p>
              Merchants retain full ownership of their store data. You may export your orders or request complete account deletion at any time by contacting our privacy officer at <strong className="text-indigo-400">support@gumshop.online</strong>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
