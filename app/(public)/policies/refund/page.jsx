'use client'
import React from 'react';
import Link from 'next/link';
import { RotateCcw, CheckCircle2, ShieldCheck, ArrowLeft, Mail, Clock } from 'lucide-react';

export default function RefundPolicyPage() {
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
                            <RotateCcw size={24} />
                        </div>
                        <div>
                            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                                Customer Guarantee
                            </span>
                            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                                Refund & Return Policy
                            </h1>
                            <p className="text-xs text-slate-400 mt-0.5">
                                30-Day 100% Satisfaction Guarantee • Hassle-Free Returns
                            </p>
                        </div>
                    </div>

                    {/* Content Sections */}
                    <div className="mt-8 space-y-8 text-sm text-slate-600 leading-relaxed">
                        <section className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-500/20 text-slate-800 flex items-start gap-3">
                            <ShieldCheck size={20} className="text-emerald-600 shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-bold text-slate-900">Our 30-Day Money-Back Guarantee</h3>
                                <p className="text-xs text-slate-600 mt-1">
                                    We stand behind every item we ship. If you are not completely satisfied with your purchase, you may return it within 30 days of delivery for a full refund or free replacement.
                                </p>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-base font-bold text-slate-900 mb-2">
                                1. Return Eligibility
                            </h2>
                            <p>To qualify for a refund or exchange, your item must meet the following criteria:</p>
                            <ul className="list-disc list-inside space-y-1.5 pl-2 mt-2">
                                <li>The return request must be submitted within 30 days of delivery confirmation.</li>
                                <li>The item must be in its original packaging with all included cables, accessories, and user manuals.</li>
                                <li>Items showing signs of intentional abuse, water damage not covered by rating, or unauthorized alteration are ineligible.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-base font-bold text-slate-900 mb-2">
                                2. Damaged or Defective Goods
                            </h2>
                            <p>
                                If your product arrives damaged or malfunctioning during transit, please contact us immediately with a photo or short video clip. We will dispatch an immediate free replacement priority-shipped, without requiring you to return the broken item!
                            </p>
                        </section>

                        <section>
                            <h2 className="text-base font-bold text-slate-900 mb-2">
                                3. Refund Processing Times
                            </h2>
                            <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700">
                                <Clock size={16} className="text-emerald-600" />
                                <span>Once approved, refunds are credited back to your original payment method within <strong>3 to 5 business days</strong>.</span>
                            </div>
                        </section>

                        <section className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <Mail size={16} className="text-emerald-600" />
                                <span>How to Start a Return</span>
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">
                                Email our support desk at{' '}
                                <a href="mailto:support@gumshop.online" className="text-emerald-700 font-bold hover:underline">
                                    support@gumshop.online
                                </a>{' '}
                                with your Order ID (e.g. ord_1042) and reason for return. We will reply within 12 hours with return instructions.
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
