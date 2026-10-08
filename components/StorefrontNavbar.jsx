'use client'
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingCart, Truck, Search, Sparkles, Smartphone } from 'lucide-react';
import { useSelector } from 'react-redux';
import { getSafeImageUrl, handleImageError } from '@/lib/imageUtils';

export default function StorefrontNavbar({ store }) {
    const reduxCartCount = useSelector(state => state.cart?.total || 0);
    const [localCount, setLocalCount] = useState(0);

    useEffect(() => {
        try {
            if (typeof window !== 'undefined') {
                const raw = localStorage.getItem('cart');
                if (raw) {
                    const parsed = JSON.parse(raw);
                    if (Array.isArray(parsed)) {
                        setLocalCount(parsed.reduce((sum, item) => sum + (item.quantity || 1), 0));
                    }
                }
            }
        } catch {}
    }, []);

    const cartCount = reduxCartCount > 0 ? reduxCartCount : localCount;
    const storeSlug = store?.username || store?.name?.toLowerCase().replace(/[^a-z0-9-]+/g, '') || 'shop';

    return (
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-all shadow-xs">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
                    
                    {/* Merchant Store Logo & Brand Name */}
                    {(() => {
                        const logoSrc = store?.logo || store?.avatar || store?.bioProfile?.avatar;
                        return (
                            <Link href={`/shop/${storeSlug}`} className="flex items-center gap-3 group">
                                {logoSrc ? (
                                    <img 
                                        src={getSafeImageUrl(logoSrc, 'avatar')} 
                                        alt={store?.name || "Store"} 
                                        className="size-9 sm:size-10 rounded-xl object-cover border border-slate-200 shadow-xs group-hover:scale-105 transition-transform" 
                                        onError={(e) => handleImageError(e, 'avatar', store?.name || 'Store')}
                                    />
                                ) : (
                                    <div className="size-9 sm:size-10 rounded-xl bg-gradient-to-tr from-slate-900 to-slate-700 text-white font-extrabold flex items-center justify-center text-sm shadow-xs">
                                        {store?.name?.charAt(0) || 'S'}
                                    </div>
                                )}
                                <div className="flex flex-col">
                                    <span className="text-base sm:text-lg font-black tracking-tight text-slate-900 group-hover:text-emerald-600 transition">
                                        {store?.name || "Official Store"}
                                    </span>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1">
                                        <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        Verified Merchant
                                    </span>
                                </div>
                            </Link>
                        );
                    })()}

                    {/* Store Navigation Links */}
                    <nav className="hidden sm:flex items-center gap-5 text-xs sm:text-sm font-semibold text-slate-600">
                        <Link href={`/shop/${storeSlug}`} className="text-slate-900 hover:text-emerald-600 transition">
                            All Products
                        </Link>
                        <Link href={`/creator/${storeSlug}`} className="text-rose-600 hover:text-rose-700 transition flex items-center gap-1.5 font-bold">
                            <Smartphone size={15} />
                            <span>Link-in-Bio</span>
                        </Link>
                        <Link href={`/shop/${storeSlug}/track`} className="hover:text-emerald-600 transition flex items-center gap-1.5">
                            <Truck size={15} className="text-slate-400" />
                            <span>Track Package</span>
                        </Link>
                    </nav>

                    {/* Right Action: Shopping Cart Button */}
                    <div className="flex items-center gap-3">
                        <Link 
                            href="/cart" 
                            className="relative flex items-center gap-2 px-4 py-2 sm:py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold shadow-sm transition active:scale-95"
                            aria-label="View Shopping Cart"
                        >
                            <ShoppingCart size={16} />
                            <span className="hidden sm:inline">Cart</span>
                            {cartCount > 0 && (
                                <span className="bg-emerald-500 text-white text-[11px] font-black px-1.5 py-0.2 rounded-full min-w-4 text-center">
                                    {cartCount}
                                </span>
                            )}
                        </Link>
                    </div>

                </div>
            </div>
        </header>
    );
}
