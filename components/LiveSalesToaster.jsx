'use client'

import React, { useState, useEffect } from 'react';
import { CheckCircle2, X, ShoppingBag } from 'lucide-react';
import { getSafeImageUrl } from '@/lib/imageUtils';

const BUYER_PROFILES = [
    { name: 'Sarah M.', location: 'Austin, TX', time: '3m ago' },
    { name: 'David L.', location: 'Denver, CO', time: '6m ago' },
    { name: 'Emma W.', location: 'Chicago, IL', time: '9m ago' },
    { name: 'Jessica K.', location: 'Seattle, WA', time: '14m ago' },
    { name: 'Michael T.', location: 'San Diego, CA', time: '18m ago' },
    { name: 'Ashley B.', location: 'Nashville, TN', time: '22m ago' },
    { name: 'Daniel R.', location: 'Orlando, FL', time: '29m ago' }
];

export default function LiveSalesToaster({ product, products, storeName }) {
    const [isVisible, setIsVisible] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isDismissed, setIsDismissed] = useState(false);

    // Resolve active product item
    const activeItem = product || (Array.isArray(products) && products.length > 0 ? products[0] : null);

    useEffect(() => {
        if (isDismissed || !activeItem) return;

        // Initial delay before first pop-up (5 seconds)
        const initialTimer = setTimeout(() => {
            setIsVisible(true);
        }, 5000);

        // Rotating interval: visible for 6s, hidden for 22s
        const interval = setInterval(() => {
            setIsVisible(false);
            setTimeout(() => {
                setCurrentIndex(prev => (prev + 1) % BUYER_PROFILES.length);
                setIsVisible(true);
            }, 18000); // 18s hidden
        }, 24000); // 24s total cycle

        return () => {
            clearTimeout(initialTimer);
            clearInterval(interval);
        };
    }, [isDismissed, activeItem]);

    // Auto-hide each toast after 6 seconds
    useEffect(() => {
        if (!isVisible) return;
        const hideTimer = setTimeout(() => {
            setIsVisible(false);
        }, 6000);
        return () => clearTimeout(hideTimer);
    }, [isVisible]);

    if (!activeItem || isDismissed || !isVisible) return null;

    const buyer = BUYER_PROFILES[currentIndex] || BUYER_PROFILES[0];
    const imageSrc = getSafeImageUrl(activeItem.image || (activeItem.images && activeItem.images[0]));
    const itemName = activeItem.name || activeItem.title || 'Pet Costume';
    const bundleText = currentIndex % 3 === 1 
        ? 'Purchased 2x Pack' 
        : currentIndex % 3 === 2 
            ? 'Purchased 3x Party Pack' 
            : 'Purchased 1x';

    return (
        <aside
            aria-live="polite"
            className="fixed bottom-20 sm:bottom-5 left-4 z-40 max-w-[340px] w-[calc(100vw-2rem)] sm:w-auto animate-in slide-in-from-bottom-5 fade-in duration-300"
        >
            <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3 border border-slate-200/90 shadow-[0_10px_30px_rgba(0,0,0,0.12)] flex items-center gap-3 relative group text-left">
                {/* Product Thumbnail */}
                <div className="size-12 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200/60 relative">
                    {imageSrc ? (
                        <img 
                            src={imageSrc} 
                            alt={itemName} 
                            className="w-full h-full object-cover" 
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <ShoppingBag size={18} />
                        </div>
                    )}
                </div>

                {/* Buyer & Purchase Info */}
                <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-1.5 leading-none mb-1">
                        <span className="text-xs font-black text-slate-950 truncate">
                            {buyer.name}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium truncate">
                            in {buyer.location}
                        </span>
                    </div>

                    <p className="text-[11px] font-semibold text-slate-700 truncate leading-snug">
                        {bundleText} <span className="font-bold text-slate-900">{itemName}</span>
                    </p>

                    <div className="flex items-center gap-2 mt-1 text-[10px] font-bold text-emerald-600">
                        <span className="flex items-center gap-0.5">
                            <CheckCircle2 size={11} className="text-emerald-600 shrink-0 stroke-[2.5]" />
                            Verified Buyer
                        </span>
                        <span className="text-slate-300 font-normal">•</span>
                        <span className="text-slate-500 font-medium">{buyer.time}</span>
                    </div>
                </div>

                {/* Dismiss Button */}
                <button
                    onClick={() => {
                        setIsVisible(false);
                        setIsDismissed(true);
                    }}
                    className="absolute top-2 right-2 text-slate-500 hover:text-slate-800 p-1 rounded-full hover:bg-slate-100 transition"
                    title="Dismiss"
                    aria-label="Dismiss notification"
                >
                    <X size={13} />
                </button>
            </div>
        </aside>
    );
}
