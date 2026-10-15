'use client';

import React, { useState, useEffect } from 'react';
import { Zap, ShoppingBag } from 'lucide-react';

/**
 * ⚡ MobileStickyBuyBar
 * High-Converting Sticky Bottom Drawer for Mobile Viewports.
 * Slides up smoothly when the buyer scrolls past the fold.
 */
export default function MobileStickyBuyBar({
    product,
    selectedBundle = null,
    onBuyNow,
    themeColor = '#10B981'
}) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            // Show after scrolling 280px down past the main product header
            if (window.scrollY > 280) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    if (!product) return null;

    const price = selectedBundle?.totalPrice !== undefined
        ? selectedBundle.totalPrice
        : (product.price || 52.99);

    const compareAtPrice = selectedBundle?.compareAtPrice !== undefined
        ? selectedBundle.compareAtPrice
        : (product.compareAtPrice || Math.round(price * 1.35 * 100) / 100);

    const imageSrc = product.image || product.images?.[0] || '';
    const title = product.name || product.title || 'Product';
    const bundleLabel = selectedBundle?.label || `${selectedBundle?.qty || 1} Item`;

    // Contrast calculation for Buy Now button text
    const rawColor = (themeColor && typeof themeColor === 'string' && themeColor.trim()) ? themeColor.trim() : '#10B981';
    let hex = rawColor.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    const r = parseInt(hex.substring(0, 2), 16) || 0;
    const g = parseInt(hex.substring(2, 4), 16) || 0;
    const b = parseInt(hex.substring(4, 6), 16) || 0;
    const lum = (r * 299 + g * 587 + b * 114) / 1000;
    const isLight = lum >= 135;
    const btnTextColor = isLight ? '#020617' : '#ffffff';
    const btnFillClass = isLight ? 'fill-slate-950' : 'fill-white';

    return (
        <div
            className={`fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 backdrop-blur-md border-t border-gray-200 px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] transition-transform duration-300 ease-in-out ${
                isVisible ? 'translate-y-0' : 'translate-y-full pointer-events-none'
            }`}
        >
            <div className="flex items-center justify-between gap-3 max-w-md mx-auto">
                {/* Thumbnail & Product Info */}
                <div className="flex items-center gap-3 min-w-0">
                    {imageSrc ? (
                        <img
                            src={imageSrc}
                            alt={title}
                            className="w-12 h-12 object-cover rounded-lg border border-gray-100 flex-shrink-0"
                            loading="lazy"
                        />
                    ) : (
                        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <ShoppingBag className="w-5 h-5 text-gray-400" />
                        </div>
                    )}
                    <div className="min-w-0">
                        <h4 className="text-xs font-semibold text-gray-900 truncate">{title}</h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-sm font-bold text-emerald-600">
                                ${price.toFixed(2)}
                            </span>
                            {compareAtPrice > price && (
                                <span className="text-[11px] text-gray-400 line-through">
                                    ${compareAtPrice.toFixed(2)}
                                </span>
                            )}
                            {selectedBundle && (
                                <span className="text-[10px] bg-emerald-50 text-emerald-700 font-medium px-1.5 py-0.5 rounded">
                                    {bundleLabel}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Instant Buy CTA */}
                <button
                    onClick={() => onBuyNow && onBuyNow(selectedBundle)}
                    className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs shadow-md active:scale-95 transition-transform"
                    style={{ backgroundColor: rawColor, color: btnTextColor }}
                >
                    <Zap className={`w-4 h-4 ${btnFillClass}`} style={{ fill: btnTextColor }} />
                    <span>Buy Now</span>
                </button>
            </div>
        </div>
    );
}
