'use client'
import React from 'react';
import Link from 'next/link';
import { FileText, CheckCircle2, Shield, ArrowLeft, Mail } from 'lucide-react';

export default function TermsOfServicePage() {
    return (
        <div className="bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
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
                            <FileText size={24} />
                        </div>
                        <div>
                            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                                Terms of Use
                            </span>
                            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                                Terms of Service
                            </h1>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Effective date: October 2026 • Please read carefully before purchasing
                            </p>
                        </div>
                    </div>

                    {/* Content Sections */}
                    <div className="mt-8 space-y-8 text-sm text-slate-600 leading-relaxed">
                        <section>
                            <h2 className="text-base font-bold text-slate-900 mb-2">
                                1. Acceptance of Terms
                            </h2>
                            <p>
                                By accessing or using GumShop websites, storefronts, or checking out with products, you agree to be bound by these Terms of Service. If you do not agree to all terms and conditions, you must not access our website or order any items.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-base font-bold text-slate-900 mb-2">
                                2. Product Orders & Pricing
                            </h2>
                            <p>
                                All product descriptions, specifications, and prices are subject to change at any time without notice. While we strive to display accurate pricing and images, typographical errors may occasionally occur. We reserve the right to cancel or correct any order placed with an incorrect price.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-base font-bold text-slate-900 mb-2">
                                3. Payment Processing & Security
                            </h2>
                            <p>
                                We utilize secure PCI-DSS compliant third-party payment gateways including Gumroad and modern tokenized payment processors. By submitting an order, you represent that you are authorized to use the chosen payment method and authorize us to charge the full order total.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-base font-bold text-slate-900 mb-2">
                                4. Intellectual Property
                            </h2>
                            <p>
                                All trademarks, graphics, code, and interface designs appearing on GumShop are protected by intellectual property laws. Unauthorized reproduction or redistribution is prohibited.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-base font-bold text-slate-900 mb-2">
                                5. Limitation of Liability
                            </h2>
                            <p>
                                To the maximum extent permitted by applicable law, GumShop and its affiliates shall not be liable for indirect, incidental, or consequential damages resulting from the use or inability to use any purchased product.
                            </p>
                        </section>

                        <section className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Mail size={16} className="text-emerald-600" />
                                <span>Legal Inquiries</span>
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">
                                For inquiries regarding these terms, reach us at{' '}
                                <a href="mailto:legal@gumshop.online" className="text-emerald-700 font-bold hover:underline">
                                    legal@gumshop.online
                                </a>.
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
