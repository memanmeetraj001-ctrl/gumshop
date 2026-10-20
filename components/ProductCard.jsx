'use client'
import React, { useState, useMemo } from 'react';
import { Star, ShoppingBag, Eye, Heart, Zap, Store } from 'lucide-react';
import Link from 'next/link';
import { useDispatch } from 'react-redux';
import { addToCart } from '@/lib/features/cart/cartSlice';
import { useWishlist } from '@/lib/wishlist';
import ProductQuickView from './ProductQuickView';
import GumroadIframeModal from './GumroadIframeModal';
import { getActiveStoreSync } from '@/lib/activeStore';
import { getSafeImageUrl, handleImageError } from '@/lib/imageUtils';
import toast from 'react-hot-toast';

export default function ProductCard({ product, onOpenCart, showShopName = false, store = null, cardIndex = 0 }) {
    const dispatch = useDispatch();
    const { toggle, has } = useWishlist();
    const [showQuickView, setShowQuickView] = useState(false);
    const [checkoutModal, setCheckoutModal] = useState({ isOpen: false, gumroadUrl: '', orderSessionId: '' });

    if (!product) return null;

    const currency = '$';
    const isWishlisted = has(product.id);
    const mainImage = getSafeImageUrl(product.images?.[0] || product.image);

    const price = parseFloat(product.price !== undefined && product.price !== null && product.price !== '' ? product.price : 52.99);
    const compareAtPrice = parseFloat(product.compareAtPrice || (price === 52.99 ? 69.99 : Math.round(price * 1.35 * 100) / 100));
    const discountPercent = compareAtPrice > price ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100) : 0;

    // Deterministic Urgency & Scarcity Proof (Consistent Across Page Reloads)
    const urgencyData = useMemo(() => {
        let hash = 0;
        const str = String(product?.id || product?.name || cardIndex);
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash |= 0;
        }
        const seed = Math.abs(hash);
        const claimPercent = 65 + (seed % 24); // 65% to 88% claimed
        const leftCount = 2 + (seed % 4); // 2 to 5 left
        const badgeType = cardIndex === 0 
            ? `⚡ ONLY ${leftCount} LEFT` 
            : (cardIndex === 1 ? '🔥 BEST SELLER' : (cardIndex === 2 ? '⚡ SELLING FAST' : (product?.badge || `⚡ ONLY ${leftCount} LEFT`)));
        return { claimPercent, leftCount, badgeType };
    }, [product?.id, product?.name, cardIndex, product?.badge]);

    const handleAddToCart = (e) => {
        e.preventDefault();
        e.stopPropagation();
        dispatch(addToCart({ productId: product.id, product }));
        toast.success(`"${product.name}" added to cart! 🛍️`);
        if (onOpenCart) onOpenCart();
    };

    const handleWishlist = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const nowSaved = toggle(product);
        toast.success(nowSaved ? 'Saved to Wishlist! ❤️' : 'Removed from Wishlist');
    };

    const handleBuyNow = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            const activeStore = getActiveStoreSync();
            const storeSlug = activeStore?.username || activeStore?.id || product.storeId;
            const storeScopedUrl = storeSlug && typeof window !== 'undefined' ? (localStorage.getItem(`gumroad_url_${storeSlug}`) || localStorage.getItem(`gumroad_url_${activeStore?.id}`)) : '';
            const persistentUrl = typeof window !== 'undefined' ? (storeScopedUrl || localStorage.getItem('gumshop_gumroad_url') || localStorage.getItem('gumroad_product_url') || '') : '';
            
            const storeShipping = activeStore?.shipping || {};
            const standardShippingFee = typeof storeShipping.standardFee === 'number' ? storeShipping.standardFee : 4.99;
            const freeThreshold = typeof storeShipping.freeShippingThreshold === 'number' ? storeShipping.freeShippingThreshold : 50.00;
            const shippingFee = price >= freeThreshold ? 0 : standardShippingFee;
            const calculatedTotal = Math.round((price + shippingFee) * 100) / 100;

            const res = await fetch('/api/gumroad/dynamic-checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    storeId: product.storeId || activeStore?.id || 'store_default',
                    storeName: activeStore?.name || product.name,
                    gumroadProductUrl: product.gumroadUrl || activeStore?.gumroadProductUrl || activeStore?.gumroadUrl || persistentUrl || '',
                    items: [{
                        productId: product.id,
                        name: product.name,
                        price: price,
                        quantity: 1,
                        gumroadUrl: product.gumroadUrl || ''
                    }],
                    discountAmount: 0,
                    shippingFee: shippingFee
                })
            });
            const data = await res.json().catch(() => ({}));
            setCheckoutModal({
                isOpen: true,
                gumroadUrl: data.checkoutUrl || product.gumroadUrl || activeStore?.gumroadProductUrl || persistentUrl || '',
                orderSessionId: data.orderSessionId || `ord_${Date.now()}`,
                total: calculatedTotal,
                shippingFee: shippingFee
            });
        } catch {
            const activeStore = getActiveStoreSync();
            const storeSlug = activeStore?.username || activeStore?.id || product.storeId;
            const storeScopedUrl = storeSlug && typeof window !== 'undefined' ? (localStorage.getItem(`gumroad_url_${storeSlug}`) || localStorage.getItem(`gumroad_url_${activeStore?.id}`)) : '';
            const persistentUrl = typeof window !== 'undefined' ? (storeScopedUrl || localStorage.getItem('gumshop_gumroad_url') || '') : '';
            const storeShipping = activeStore?.shipping || {};
            const standardShippingFee = typeof storeShipping.standardFee === 'number' ? storeShipping.standardFee : 4.99;
            const freeThreshold = typeof storeShipping.freeShippingThreshold === 'number' ? storeShipping.freeShippingThreshold : 50.00;
            const shippingFee = price >= freeThreshold ? 0 : standardShippingFee;
            const calculatedTotal = Math.round((price + shippingFee) * 100) / 100;

            setCheckoutModal({
                isOpen: true,
                gumroadUrl: product.gumroadUrl || activeStore?.gumroadProductUrl || storeScopedUrl || persistentUrl || '',
                orderSessionId: `ord_${Date.now()}`,
                total: calculatedTotal,
                shippingFee: shippingFee
            });
        }
    };

    return (
        <>
            <div className="group relative flex flex-col bg-white rounded-3xl border border-slate-200/90 hover:border-emerald-500/60 hover:shadow-xl hover:shadow-slate-200/60 transition-all duration-300 overflow-hidden">
                {/* Image Container */}
                <div className="relative aspect-square w-full bg-slate-50 flex items-center justify-center p-4 overflow-hidden">
                    <Link href={`/product/${product.id}`} className="w-full h-full flex items-center justify-center">
                        <img 
                            src={mainImage}
                            alt={product.name || 'Product'}
                            loading={cardIndex < 4 ? "eager" : "lazy"}
                            fetchPriority={cardIndex < 4 ? "high" : "auto"}
                            decoding="async"
                            className="max-h-full max-w-full object-contain group-hover:scale-108 transition-transform duration-500"
                            onError={(e) => handleImageError(e, 'product')}
                        />
                    </Link>

                    {/* Scarcity & Discount Badge Stack */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1 items-start z-10 pointer-events-none">
                        {store?.urgencyEnabled !== false && urgencyData?.badgeType && (
                            <span className="bg-rose-600/95 backdrop-blur-sm text-white text-[10px] font-black tracking-wider uppercase px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1 border border-white/20">
                                {urgencyData.badgeType}
                            </span>
                        )}
                        {discountPercent > 0 && (
                            <span className="bg-slate-900/90 backdrop-blur-sm text-white text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full shadow-sm">
                                SAVE {discountPercent}%
                            </span>
                        )}
                    </div>

                    {/* Floating Action Buttons */}
                    <div className="absolute top-3 right-3 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200">
                        <button
                            onClick={handleWishlist}
                            aria-label={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
                            className={`size-8 rounded-full flex items-center justify-center shadow-md backdrop-blur-md transition outline-none focus-visible:ring-2 focus-visible:ring-rose-500 cursor-pointer ${
                                isWishlisted ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-white/90 text-slate-500 hover:text-rose-600 hover:bg-white'
                            }`}
                            title="Add to Wishlist"
                        >
                            <Heart size={14} className={isWishlisted ? 'fill-rose-600' : ''} />
                        </button>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setShowQuickView(true);
                            }}
                            aria-label="Quick View"
                            className="size-8 rounded-full bg-white/90 hover:bg-white text-slate-500 hover:text-slate-900 flex items-center justify-center shadow-md backdrop-blur-md transition outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer"
                            title="Quick View"
                        >
                            <Eye size={14} />
                        </button>
                    </div>

                    {/* Quick Add Overlay on Hover / Focus (Desktop) */}
                    <div className="absolute inset-x-3 bottom-3 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 group-focus-within:translate-y-0 hidden sm:block">
                        <button
                            onClick={handleAddToCart}
                            aria-label="Add to Cart"
                            className="w-full py-2.5 px-3 bg-slate-900/90 hover:bg-slate-900 backdrop-blur-md text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-1.5 transition active:scale-98 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer"
                        >
                            <ShoppingBag size={14} />
                            <span>Add to Cart</span>
                        </button>
                    </div>
                </div>

                {/* Content Container */}
                <div className="p-4 sm:p-5 flex flex-col justify-between flex-1">
                    <div>
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                                    {product.category || 'Featured'}
                                </span>
                                {showShopName && (product.storeName || product.storeSlug) && (
                                    <Link 
                                        href={`/shop/${product.storeSlug || product.storeId?.replace(/^store_/, '')}`}
                                        onClick={(e) => e.stopPropagation()}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold transition hover:text-emerald-700 max-w-[140px] truncate"
                                        title={`Visit ${product.storeName || product.storeSlug}`}
                                    >
                                        <Store size={10} className="shrink-0 text-slate-400" />
                                        <span className="truncate">{product.storeName || product.storeSlug}</span>
                                    </Link>
                                )}
                            </div>
                            {(() => {
                                const numRating = typeof product.rating === 'number' 
                                    ? product.rating 
                                    : (typeof product.rating === 'string' && !isNaN(parseFloat(product.rating)))
                                        ? parseFloat(product.rating)
                                        : (typeof product.rating === 'object' && product.rating && typeof product.rating.rating === 'number')
                                            ? product.rating.rating
                                            : null;
                                if (!numRating || (!product.reviewCount && !product.reviews?.length)) return null;
                                return (
                                    <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                                        <Star size={12} className="text-amber-400 fill-amber-400" />
                                        <span>{numRating.toFixed(1)}</span>
                                    </div>
                                );
                            })()}
                        </div>

                        <Link href={`/product/${product.id}`}>
                            <h3 className="font-bold text-slate-900 text-sm mt-2 line-clamp-2 hover:text-emerald-700 transition leading-snug">
                                {product.name}
                            </h3>
                        </Link>

                        {/* Claimed Scarcity Progress Bar */}
                        {store?.urgencyEnabled !== false && (
                            <div className="mt-2.5">
                                <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-1">
                                    <span className="flex items-center gap-1 text-rose-600 font-extrabold">
                                        <span className="inline-block size-1.5 rounded-full bg-rose-500 animate-pulse" />
                                        🔥 {urgencyData.claimPercent}% Claimed
                                    </span>
                                    <span className="text-slate-400 font-semibold">Selling Fast</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                    <div 
                                        className="bg-gradient-to-r from-amber-500 to-rose-500 h-full rounded-full transition-all duration-500" 
                                        style={{ width: `${urgencyData.claimPercent}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Pricing & Direct Actions */}
                    <div className="mt-4 pt-3 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                            <div className="flex items-baseline gap-1.5 flex-wrap">
                                <span className="text-base sm:text-lg font-black text-slate-900">
                                    {currency}{price.toFixed(2)}
                                </span>
                                {compareAtPrice > price && (
                                    <span className="text-xs text-slate-500 line-through font-medium">
                                        {currency}{compareAtPrice.toFixed(2)}
                                    </span>
                                )}
                                {compareAtPrice > price && (
                                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                                        Save {currency}{(compareAtPrice - price).toFixed(2)}
                                    </span>
                                )}
                            </div>

                            {/* Desktop Direct Quick Actions */}
                            <div className="hidden sm:flex items-center gap-1.5">
                                <button
                                    onClick={handleAddToCart}
                                    className="size-8 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 flex items-center justify-center transition outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer"
                                    title="Add to Cart"
                                    aria-label="Add to Cart"
                                >
                                    <ShoppingBag size={14} />
                                </button>
                                <button
                                    onClick={handleBuyNow}
                                    className="size-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white flex items-center justify-center shadow-xs transition outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer"
                                    title="Instant Buy"
                                    aria-label="Instant Buy"
                                >
                                    <Zap size={14} className="fill-white" />
                                </button>
                            </div>
                        </div>

                        {/* Mobile Buy Buttons */}
                        <div className="grid grid-cols-2 gap-1.5 mt-3 sm:hidden">
                            <button
                                onClick={handleAddToCart}
                                aria-label="Add to Cart"
                                className="py-2.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 font-bold text-[11px] rounded-xl flex items-center justify-center gap-1 transition outline-none focus-visible:ring-2 focus-visible:ring-slate-400 cursor-pointer"
                            >
                                <ShoppingBag size={13} />
                                <span>Add</span>
                            </button>
                            <button
                                onClick={handleBuyNow}
                                aria-label="Instant Buy"
                                className="py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-[11px] rounded-xl flex items-center justify-center gap-1 transition outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer shadow-xs shadow-emerald-600/20"
                            >
                                <Zap size={13} className="fill-white" />
                                <span>Buy</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick View Modal */}
            <ProductQuickView
                product={product}
                isOpen={showQuickView}
                onClose={() => setShowQuickView(false)}
                onOpenCart={onOpenCart}
            />

            {/* In-Frame Checkout Modal */}
            <GumroadIframeModal
                isOpen={checkoutModal.isOpen}
                onClose={() => setCheckoutModal({ isOpen: false, gumroadUrl: '', orderSessionId: '' })}
                product={product}
                items={[{ id: product.id, name: product.name, price: price, quantity: 1, image: mainImage }]}
                total={checkoutModal.total || price}
                shippingFee={checkoutModal.shippingFee || 0}
                gumroadUrl={checkoutModal.gumroadUrl}
                orderSessionId={checkoutModal.orderSessionId}
            />
        </>
    );
}