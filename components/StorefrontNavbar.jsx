'use client'
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ShoppingCart, Truck, Smartphone, ShieldCheck } from 'lucide-react';
import { useSelector } from 'react-redux';
import { getSafeImageUrl, handleImageError } from '@/lib/imageUtils';

export default function StorefrontNavbar({ store, onOpenCart }) {
    const cartState = useSelector(state => state?.cart) || {};
    const cartItems = (cartState.cartItems && typeof cartState.cartItems === 'object' && !Array.isArray(cartState.cartItems)) ? cartState.cartItems : {};
    const cartProducts = (cartState.cartProducts && typeof cartState.cartProducts === 'object' && !Array.isArray(cartState.cartProducts)) ? cartState.cartProducts : {};

    const storeSlug = store?.username || store?.slug || store?.name?.toLowerCase().replace(/[^a-z0-9-]+/g, '') || 'shop';
    const targetSlug = String(storeSlug).toLowerCase().trim().replace(/^store_/, '');

    const storeCartCount = useMemo(() => {
        let count = 0;
        for (const [key, qty] of Object.entries(cartItems)) {
            const numQty = parseInt(qty || 0);
            if (!numQty || numQty <= 0) continue;
            const baseId = key.includes('__') ? key.split('__')[0] : key;
            const prod = cartProducts[key] || cartProducts[baseId];
            const pSlug = prod?.storeSlug || (prod?.storeId ? String(prod.storeId).replace(/^store_/, '') : '');
            if (!pSlug || pSlug === targetSlug || prod?.storeId === `store_${targetSlug}`) {
                count += numQty;
            }
        }
        return count;
    }, [cartItems, cartProducts, targetSlug]);

    const cartCount = storeCartCount;

    return (
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-all shadow-xs">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16 sm:h-18 gap-4">
                    
                    {/* Merchant Store Logo & Brand Name */}
                    {(() => {
                        const logoSrc = store?.bioProfile?.avatar || store?.avatar || store?.logo;
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
                                    <div className="size-9 sm:size-10 rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                                        {store?.name?.charAt(0) || 'S'}
                                    </div>
                                )}
                                <div className="flex flex-col">
                                    <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 group-hover:text-emerald-600 transition">
                                        {store?.name || "Official Store"}
                                    </span>
                                    <span className="text-[10px] font-medium uppercase tracking-wider text-emerald-600 flex items-center gap-1">
                                        <span className="size-1.5 rounded-full bg-emerald-500" />
                                        Verified Store
                                    </span>
                                </div>
                            </Link>
                        );
                    })()}

                    {/* Store Navigation Links */}
                    <nav className="hidden sm:flex items-center gap-6 text-xs sm:text-sm font-medium text-slate-600">
                        <Link href={`/shop/${storeSlug}`} className="text-slate-900 hover:text-emerald-600 transition">
                            Catalog
                        </Link>
                        <Link href={`/creator/${storeSlug}`} className="hover:text-emerald-600 transition flex items-center gap-1.5">
                            <Smartphone size={14} className="text-slate-400" />
                            <span>Link-in-Bio</span>
                        </Link>
                        <Link href={`/shop/${storeSlug}/track`} className="hover:text-emerald-600 transition flex items-center gap-1.5">
                            <Truck size={14} className="text-slate-400" />
                            <span>Track Order</span>
                        </Link>
                        <Link href={`/policies/shipping?store=${storeSlug}`} className="hover:text-emerald-600 transition flex items-center gap-1.5">
                            <ShieldCheck size={14} className="text-slate-400" />
                            <span>Policies</span>
                        </Link>
                    </nav>

                    {/* Right Action: Shopping Cart Button */}
                    <div className="flex items-center gap-3">
                        {onOpenCart ? (
                            <button 
                                type="button"
                                onClick={onOpenCart} 
                                className="relative flex items-center gap-2 px-3.5 py-2 sm:py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold shadow-xs transition active:scale-98 cursor-pointer"
                                aria-label="Open Shopping Cart"
                            >
                                <ShoppingCart size={15} />
                                <span className="hidden sm:inline">Cart</span>
                                {cartCount > 0 && (
                                    <span className="bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-4 text-center">
                                        {cartCount}
                                    </span>
                                )}
                            </button>
                        ) : (
                            <Link 
                                href={`/cart`} 
                                className="relative flex items-center gap-2 px-3.5 py-2 sm:py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold shadow-xs transition active:scale-98 cursor-pointer"
                                aria-label="Open Shopping Cart"
                            >
                                <ShoppingCart size={15} />
                                <span className="hidden sm:inline">Cart</span>
                                {cartCount > 0 && (
                                    <span className="bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-4 text-center">
                                        {cartCount}
                                    </span>
                                )}
                            </Link>
                        )}
                    </div>

                </div>
            </div>
        </header>
    );
}
