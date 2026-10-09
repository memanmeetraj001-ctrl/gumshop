'use client'
import Link from 'next/link';
import { 
    Sparkles, 
    Instagram, 
    Youtube, 
    Twitter, 
    Zap, 
    Truck, 
    ShieldCheck, 
    ArrowDown 
} from 'lucide-react';

export default function StoreHeroBanner({ store, totalProducts = 0 }) {
    const themeColor = store?.themeColor || '#10B981';
    const storeName = store?.name || "Official Store";
    const storeBio = store?.description || "Curated viral essentials with fast, tracked worldwide delivery.";

    return (
        <div className="w-full">
            {/* Flash Sale Announcement Bar */}
            {store?.flashSale?.enabled !== false && (
                <div className="bg-slate-950 text-white py-2.5 px-4 text-center text-xs font-semibold flex items-center justify-center gap-2 flex-wrap border-b border-slate-800">
                    <span className="flex items-center gap-1.5 text-emerald-400">
                        <Sparkles size={14} />
                        <span>{store?.flashSale?.text || "⚡ FLASH SALE: 25% OFF STOREWIDE — Today Only!"}</span>
                    </span>
                </div>
            )}

            {/* Store Hero Banner Section */}
            <div className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white py-12 sm:py-18 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
                {/* Background hero banner if provided */}
                {(() => {
                    const rawBanner = store?.bannerImage || store?.banner || store?.heroBanner;
                    const bannerUrl = typeof rawBanner === 'string' ? rawBanner : (rawBanner?.image || rawBanner?.url || '');
                    if (!bannerUrl) return null;
                    return (
                        <div 
                            className="absolute inset-0 bg-cover bg-center opacity-25 filter blur-[0.5px] scale-105 pointer-events-none transition duration-700"
                            style={{ backgroundImage: `url(${bannerUrl})` }}
                        />
                    );
                })()}
                {/* Background ambient lighting */}
                <div 
                    className="absolute -top-24 left-1/2 -translate-x-1/2 w-full max-w-4xl h-80 opacity-20 blur-3xl rounded-full pointer-events-none"
                    style={{ backgroundColor: themeColor }}
                />

                <div className="max-w-5xl mx-auto relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 sm:gap-10 text-center md:text-left">
                    
                    {/* Store Logo with Border */}
                    <div className="shrink-0 relative group">
                        {(() => {
                            const logoSrc = store?.logo || store?.avatar || store?.bioProfile?.avatar;
                            return logoSrc ? (
                                <img 
                                    src={logoSrc} 
                                    alt={storeName} 
                                    className="size-28 sm:size-36 rounded-3xl object-cover border-4 border-slate-800/80 shadow-2xl shadow-emerald-500/10" 
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(storeName || 'Store')}`;
                                    }}
                                />
                            ) : (
                                <div 
                                    className="size-28 sm:size-36 rounded-3xl font-black text-4xl flex items-center justify-center shadow-2xl text-white"
                                    style={{ backgroundColor: themeColor }}
                                >
                                    {storeName.charAt(0)}
                                </div>
                            );
                        })()}
                        <span className="absolute -bottom-2 -right-2 bg-emerald-500 text-slate-950 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border-2 border-slate-900 shadow-sm">
                            LIVE
                        </span>
                    </div>

                    {/* Store Headline & Details */}
                    <div className="flex-1 space-y-3">
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                👑 Verified Pioneer Store
                            </span>
                            <span className="text-xs text-slate-400 font-medium">
                                • {totalProducts} Curated Products
                            </span>
                        </div>

                        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
                            {storeName}
                        </h1>

                        <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
                            {storeBio}
                        </p>

                        {/* Action Buttons */}
                        <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3">
                            <a
                                href="#catalog"
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/20 active:scale-95 transition"
                            >
                                <span>Shop Collection</span>
                                <ArrowDown size={15} />
                            </a>

                            <Link
                                href={`/shop/${store?.username || 'store'}/track`}
                                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs sm:text-sm transition"
                            >
                                <Truck size={15} className="text-emerald-400" />
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
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300 transition"
                                    >
                                        <Instagram size={13} className="text-rose-400" />
                                        <span>Instagram</span>
                                    </a>
                                )}
                                {store.socials.tiktok && (
                                    <a
                                        href={store.socials.tiktok.startsWith('http') ? store.socials.tiktok : `https://tiktok.com/@${store.socials.tiktok.replace('@', '')}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300 transition"
                                    >
                                        <Zap size={13} className="text-emerald-400 fill-emerald-400" />
                                        <span>TikTok</span>
                                    </a>
                                )}
                                {store.socials.youtube && (
                                    <a
                                        href={store.socials.youtube}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300 transition"
                                    >
                                        <Youtube size={13} className="text-red-400" />
                                        <span>YouTube</span>
                                    </a>
                                )}
                                {store.socials.twitter && (
                                    <a
                                        href={`https://x.com/${store.socials.twitter.replace('@', '')}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300 transition"
                                    >
                                        <Twitter size={13} className="text-cyan-400" />
                                        <span>Twitter/X</span>
                                    </a>
                                )}
                            </div>
                        )}

                    </div>

                </div>

                {/* Trust Proof Badges (Honest & Verified) */}
                <div className="mt-10 pt-6 border-t border-slate-800/80 max-w-5xl mx-auto grid grid-cols-3 gap-2 text-center text-[11px] sm:text-xs text-slate-400">
                    <span className="flex items-center justify-center gap-1.5">
                        <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
                        <span>🔒 Encrypted Checkout</span>
                    </span>
                    <span className="flex items-center justify-center gap-1.5">
                        <Truck size={14} className="text-emerald-400 shrink-0" />
                        <span>📦 Direct Merchant Shipping</span>
                    </span>
                    <span className="flex items-center justify-center gap-1.5">
                        <Sparkles size={14} className="text-emerald-400 shrink-0" />
                        <span>✨ Verified Independent Store</span>
                    </span>
                </div>
            </div>
        </div>
    );
}
