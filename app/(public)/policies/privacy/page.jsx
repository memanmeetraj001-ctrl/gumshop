'use client'
import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Lock, Eye, FileText, ArrowLeft, Mail } from 'lucide-react';

export default function PrivacyPolicyPage() {
    return (
        <div className="bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Back to Shop */}
                <Link
                    href="/"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-emerald-700 transition mb-6"
                >
                    <ArrowLeft size={14} />
                    <span>Return to Home</span>
                </Link>

                <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-12 shadow-sm">
                    {/* Header */}
                    <div className="flex items-center gap-3 pb-6 border-b border-slate-100">
                        <div className="size-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                            <ShieldCheck size={24} />
                        </div>
                        <div>
                            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                                Legal & Trust
                            </span>
                            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                                Privacy Policy
                            </h1>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Last updated: October 2026 • Compliant with GDPR, CCPA & Global E-Commerce Standards
                            </p>
                        </div>
                    </div>

                    {/* Content Sections */}
                    <div className="mt-8 space-y-8 text-sm text-slate-600 leading-relaxed">
                        <section>
                            <h2 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
                                <Lock size={16} className="text-emerald-600" />
                                <span>1. Overview & Commitment to Your Privacy</span>
                            </h2>
                            <p>
                                Welcome to GumShop (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). We respect your privacy and are committed to protecting personal information collected through our online storefronts, checkout portals, and tracking systems. This Privacy Policy outlines what information we collect, why we collect it, and your legal rights regarding your personal data.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
                                <Eye size={16} className="text-emerald-600" />
                                <span>2. Information We Collect</span>
                            </h2>
                            <ul className="list-disc list-inside space-y-1.5 pl-2">
                                <li><strong>Order & Fulfillment Data:</strong> When you place an order, we collect your name, shipping address, email address, phone number, and purchased items solely to fulfill and track your package.</li>
                                <li><strong>Payment Information:</strong> All card payments and wallet transactions are processed via 256-bit encrypted checkout rails (Gumroad, Stripe, Apple Pay). We never store or view raw credit card numbers on our servers.</li>
                                <li><strong>Device & Browsing Data:</strong> We may collect browser type, IP address, and anonymized conversion analytics to optimize store speed and prevent fraudulent transactions.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
                                <FileText size={16} className="text-emerald-600" />
                                <span>3. How We Use Your Data</span>
                            </h2>
                            <p>We process customer data solely for authentic e-commerce operations:</p>
                            <ul className="list-disc list-inside space-y-1.5 pl-2 mt-2">
                                <li>Processing, shipping, and delivering orders.</li>
                                <li>Sending automated package tracking updates and receipts.</li>
                                <li>Preventing fraudulent payments and protecting store integrity.</li>
                                <li>Providing 24/7 customer care and answering refund requests.</li>
                            </ul>
                            <p className="mt-2 font-semibold text-slate-800">
                                We will NEVER sell, rent, or trade your personal data to third-party data brokers.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-base font-bold text-slate-900 mb-2">
                                4. Cookies & Tracking
                            </h2>
                            <p>
                                We use minimal essential cookies to maintain your shopping cart across page reloads and track fulfillment orders. You may configure your browser to reject cookies, though some features like persistent shopping carts may be limited.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-base font-bold text-slate-900 mb-2">
                                5. Your Data Protection Rights (GDPR & CCPA)
                            </h2>
                            <p>
                                Under GDPR and CCPA, you have the right to request access to your personal information, request deletion of your stored records, or opt out of any marketing emails at any time.
                            </p>
                        </section>

                        <section className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Mail size={16} className="text-emerald-600" />
                                <span>Questions or Data Requests?</span>
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">
                                For inquiries or to request deletion of your order records, please email our Data Protection team at{' '}
                                <a href="mailto:privacy@gumshop.online" className="text-emerald-700 font-bold hover:underline">
                                    privacy@gumshop.online
                                </a>.
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
