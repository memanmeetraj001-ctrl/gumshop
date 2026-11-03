'use client'
import React from 'react';
import Link from 'next/link';
import { 
    Sparkles, 
    Instagram, 
    Youtube, 
    Twitter, 
    Zap, 
    Truck, 
    ShieldCheck, 
    ArrowDown,
    CheckCircle2
} from 'lucide-react';

export default function StoreHeroBanner({ store, totalProducts = 0 }) {
    const themeColor = store?.themeColor || '#10B981';
    const storeName = store?.name || "Official Store";
    const storeBio = store?.description || "Curated viral essentials with fast, tracked worldwide delivery.";

    return (
        <div className="w-full">
            {/* Store Hero Banner Section */}
            <div className="relative overflow-hidden bg-slate-900 text-white py-12 sm:py-16 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
                {/* Background ambient lighting */}
                <div 
                    className="absolute -top-32 left-1/2 -translate-x-1/2 w-full max-w-3xl h-64 opacity-15 blur-3xl rounded-full pointer-events-none"
                    style={{ backgroundColor: themeColor }}
                />

                <div className="max-w-5xl mx-auto relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 sm:gap-8 text-center md:text-left">
                    
                    {/* Store Logo */}
                    <div className="shrink-0 relative group">
                        {(() => {
                            const logoSrc = store?.bioProfile?.avatar || store?.avatar || store?.logo;
                            return logoSrc ? (
                                <img 
                                    src={logoSrc} 
                                    alt={storeName} 
                                    className="size-24 sm:size-32 rounded-2xl sm:rounded-3xl object-cover border-2 border-slate-700/80 shadow-xl" 
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(storeName || 'Store')}`;
                                    }}
                                />
                            ) : (
                                <div 
                                    className="size-24 sm:size-32 rounded-2xl sm:rounded-3xl font-bold text-3xl sm:text-4xl flex items-center justify-center shadow-xl text-white border-2 border-slate-700/80"
                                    style={{ backgroundColor: themeColor }}
                                >
                                    {storeName.charAt(0)}
                                </div>
                            );
                        })()}
                    </div>

                    {/* Store Headline & Details */}
                    <div className="flex-1 space-y-3">
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                                <CheckCircle2 size={12} className="text-emerald-400" />
                                <span>Verified Merchant</span>
                            </span>
                            {totalProducts > 0 && (
                                <span className="text-xs text-slate-400 font-medium">
                                    • {totalProducts} Products
                                </span>
                            )}
                        </div>

                        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                            {storeName}
                        </h1>

                        <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
                            {storeBio}
                        </p>

                        {/* Action Buttons */}
                        <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3">
                            <a
                                href="#catalog"
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-xs sm:text-sm shadow-sm active:scale-98 transition cursor-pointer"
                            >
                                <span>Browse Catalog</span>
                                <ArrowDown size={14} />
                            </a>

                            <Link
                                href={`/shop/${store?.username || 'store'}/track`}
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-medium text-xs sm:text-sm transition cursor-pointer"
                            >
                                <Truck size={14} className="text-slate-400" />
                                <span>Track Order</span>
                            </Link>
                        </div>

                        {/* Brand Socials Links */}
                        {store?.socials && Object.values(store.socials).some(Boolean) && (
                            <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-2">
                                {store.socials.instagram && (
                                    <a
                                        href={store.socials.instagram.startsWith('http') ? store.socials.instagram : `https://instagram.com/${store.socials.instagram.replace('@', '')}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 text-xs font-medium text-slate-300 transition"
                                    >
                                        <Instagram size={12} className="text-rose-400" />
                                        <span>Instagram</span>
                                    </a>
                                )}
                                {store.socials.tiktok && (
                                    <a
                                        href={store.socials.tiktok.startsWith('http') ? store.socials.tiktok : `https://tiktok.com/@${store.socials.tiktok.replace('@', '')}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 text-xs font-medium text-slate-300 transition"
                                    >
                                        <Zap size={12} className="text-emerald-400 fill-emerald-400" />
                                        <span>TikTok</span>
                                    </a>
                                )}
                                {store.socials.youtube && (
                                    <a
                                        href={store.socials.youtube}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 text-xs font-medium text-slate-300 transition"
                                    >
                                        <Youtube size={12} className="text-red-400" />
                                        <span>YouTube</span>
                                    </a>
                                )}
                                {store.socials.twitter && (
                                    <a
                                        href={`https://x.com/${store.socials.twitter.replace('@', '')}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 text-xs font-medium text-slate-300 transition"
                                    >
                                        <Twitter size={12} className="text-cyan-400" />
                                        <span>Twitter/X</span>
                                    </a>
                                )}
                            </div>
                        )}

                    </div>

                </div>

                {/* Trust Proof Badges */}
                <div className="mt-8 pt-5 border-t border-slate-800 max-w-5xl mx-auto grid grid-cols-3 gap-2 text-center text-[11px] sm:text-xs text-slate-400">
                    <span className="flex items-center justify-center gap-1.5">
                        <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
                        <span>Encrypted Checkout</span>
                    </span>
                    <span className="flex items-center justify-center gap-1.5">
                        <Truck size={14} className="text-emerald-400 shrink-0" />
                        <span>Direct Fulfillment</span>
                    </span>
                    <span className="flex items-center justify-center gap-1.5">
                        <Sparkles size={14} className="text-emerald-400 shrink-0" />
                        <span>30-Day Guarantee</span>
                    </span>
                </div>
            </div>
        </div>
    );
}
