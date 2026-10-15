'use client'
import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Truck, RotateCcw, FileText, Lock, Mail, Smartphone, Package, CheckCircle2 } from 'lucide-react';
import { getSafeImageUrl, handleImageError } from '@/lib/imageUtils';

export default function StorefrontFooter({ store }) {
    const storeSlug = store?.username || store?.slug || store?.name?.toLowerCase().replace(/[^a-z0-9-]+/g, '') || 'shop';
    const storeName = store?.name || 'Official Store';
    const logoSrc = store?.logo || store?.avatar || store?.bioProfile?.avatar;
    const year = new Date().getFullYear();

    return (
        <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 pt-12 pb-10 text-xs">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* 4-Column Navigation Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 pb-10 border-b border-slate-800">
                    
                    {/* Brand / About Column */}
                    <div className="space-y-3">
                        <Link href={`/shop/${storeSlug}`} className="flex items-center gap-2.5 group">
                            {logoSrc ? (
                                <img
                                    src={getSafeImageUrl(logoSrc, 'avatar')}
                                    alt={storeName}
                                    className="size-8 rounded-xl object-cover border border-slate-700 group-hover:scale-105 transition-transform"
                                    onError={(e) => handleImageError(e, 'avatar', storeName)}
                                />
                            ) : (
                                <div className="size-8 rounded-xl bg-emerald-500 text-slate-950 font-black flex items-center justify-center text-xs">
                                    {storeName.charAt(0)}
                                </div>
                            )}
                            <span className="text-sm font-black text-white tracking-tight group-hover:text-emerald-400 transition">
                                {storeName}
                            </span>
                        </Link>
                        <p className="text-slate-400 text-xs leading-relaxed">
                            {store?.description || store?.bio || `Direct supplier pricing with fast tracked worldwide shipping and 30-day money-back guarantee.`}
                        </p>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/70 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                            <CheckCircle2 size={11} className="text-emerald-400" />
                            Verified Independent Merchant
                        </div>
                    </div>

                    {/* Customer Care & Policies Column */}
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3 flex items-center gap-1.5">
                            <ShieldCheck size={14} className="text-emerald-400" />
                            <span>Customer Policies</span>
                        </h4>
                        <ul className="space-y-2">
                            <li>
                                <Link 
                                    href={`/policies/shipping?store=${storeSlug}`} 
                                    className="hover:text-emerald-400 transition flex items-center gap-1.5"
                                >
                                    <Truck size={13} className="text-slate-500" />
                                    <span>Shipping & Delivery Policy</span>
                                </Link>
                            </li>
                            <li>
                                <Link 
                                    href={`/policies/refund?store=${storeSlug}`} 
                                    className="hover:text-emerald-400 transition flex items-center gap-1.5"
                                >
                                    <RotateCcw size={13} className="text-slate-500" />
                                    <span>Refund & Return Policy (30 Days)</span>
                                </Link>
                            </li>
                            <li>
                                <Link 
                                    href={`/policies/privacy?store=${storeSlug}`} 
                                    className="hover:text-emerald-400 transition flex items-center gap-1.5"
                                >
                                    <Lock size={13} className="text-slate-500" />
                                    <span>Privacy Policy (GDPR / CCPA)</span>
                                </Link>
                            </li>
                            <li>
                                <Link 
                                    href={`/policies/terms?store=${storeSlug}`} 
                                    className="hover:text-emerald-400 transition flex items-center gap-1.5"
                                >
                                    <FileText size={13} className="text-slate-500" />
                                    <span>Terms of Service</span>
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Store Quick Links Column */}
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3 flex items-center gap-1.5">
                            <Package size={14} className="text-emerald-400" />
                            <span>Shop & Support</span>
                        </h4>
                        <ul className="space-y-2">
                            <li>
                                <Link 
                                    href={`/shop/${storeSlug}`} 
                                    className="hover:text-emerald-400 transition"
                                >
                                    Catalog & All Items
                                </Link>
                            </li>
                            <li>
                                <Link 
                                    href={`/creator/${storeSlug}`} 
                                    className="hover:text-rose-400 transition flex items-center gap-1.5 font-semibold text-rose-300"
                                >
                                    <Smartphone size={13} />
                                    <span>Link-in-Bio Quick Shop</span>
                                </Link>
                            </li>
                            <li>
                                <Link 
                                    href={`/shop/${storeSlug}/track`} 
                                    className="hover:text-emerald-400 transition flex items-center gap-1.5"
                                >
                                    <Truck size={13} />
                                    <span>Track Your Order</span>
                                </Link>
                            </li>
                            <li>
                                <Link 
                                    href={`/contact?store=${storeSlug}`} 
                                    className="hover:text-emerald-400 transition flex items-center gap-1.5"
                                >
                                    <Mail size={13} />
                                    <span>Contact Merchant Support</span>
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Secure Checkout & Payment Security Column */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-1 flex items-center gap-1.5">
                            <Lock size={14} className="text-emerald-400" />
                            <span>100% Secure Checkout</span>
                        </h4>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                            Orders are processed with 256-bit bank-grade SSL encryption via Gumroad & Stripe. Your payment data is never stored.
                        </p>
                        <div className="pt-1 flex flex-wrap gap-1.5">
                            {['VISA', 'Mastercard', 'AMEX', 'Discover', 'Apple Pay', 'Google Pay', 'PayPal'].map((card, i) => (
                                <span key={i} className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-bold text-slate-300">
                                    {card}
                                </span>
                            ))}
                        </div>
                    </div>

                </div>

                {/* Bottom Bar: Copyright & Compact Legal Row */}
                <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500 text-[11px]">
                    <p>© {year} {storeName}. All rights reserved.</p>
                    <div className="flex flex-wrap items-center gap-4">
                        <Link href={`/policies/shipping?store=${storeSlug}`} className="hover:text-slate-300 transition">
                            Shipping
                        </Link>
                        <span>•</span>
                        <Link href={`/policies/refund?store=${storeSlug}`} className="hover:text-slate-300 transition">
                            Refunds & Returns
                        </Link>
                        <span>•</span>
                        <Link href={`/policies/privacy?store=${storeSlug}`} className="hover:text-slate-300 transition">
                            Privacy Policy
                        </Link>
                        <span>•</span>
                        <Link href={`/policies/terms?store=${storeSlug}`} className="hover:text-slate-300 transition">
                            Terms
                        </Link>
                    </div>
                </div>

            </div>
        </footer>
    );
}
