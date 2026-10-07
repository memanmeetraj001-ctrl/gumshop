'use client'
import React from 'react';
import Link from 'next/link';
import { Home, Search, Heart, ShoppingBag, Store } from 'lucide-react';
import { useSelector } from 'react-redux';
import { useWishlist } from '@/lib/wishlist';

export default function MobileBottomNav({ onOpenCart, onOpenWishlist, onFocusSearch }) {
    const cartCount = useSelector(state => state.cart.total);
    const { count: wishlistCount } = useWishlist();

    return (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-4 py-2 sm:hidden shadow-lg">
            <div className="flex items-center justify-around">
                <Link href="/" className="flex flex-col items-center gap-1 text-slate-700 hover:text-emerald-600 transition">
                    <Home size={20} />
                    <span className="text-[10px] font-bold">Home</span>
                </Link>

                <button 
                    onClick={onFocusSearch}
                    className="flex flex-col items-center gap-1 text-slate-700 hover:text-emerald-600 transition"
                >
                    <Search size={20} />
                    <span className="text-[10px] font-bold">Search</span>
                </button>

                <button 
                    onClick={onOpenWishlist}
                    className="relative flex flex-col items-center gap-1 text-slate-700 hover:text-rose-600 transition"
                >
                    <Heart size={20} />
                    {wishlistCount > 0 && (
                        <span className="absolute -top-1 -right-1 size-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                            {wishlistCount}
                        </span>
                    )}
                    <span className="text-[10px] font-bold">Wishlist</span>
                </button>

                <button 
                    onClick={onOpenCart}
                    className="relative flex flex-col items-center gap-1 text-slate-700 hover:text-emerald-600 transition"
                >
                    <ShoppingBag size={20} />
                    {cartCount > 0 && (
                        <span className="absolute -top-1 -right-1 size-4 bg-emerald-600 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                            {cartCount}
                        </span>
                    )}
                    <span className="text-[10px] font-bold">Cart</span>
                </button>

                <Link href="/login" className="flex flex-col items-center gap-1 text-slate-700 hover:text-emerald-600 transition">
                    <Store size={20} />
                    <span className="text-[10px] font-bold">HQ</span>
                </Link>
            </div>
        </div>
    );
}
