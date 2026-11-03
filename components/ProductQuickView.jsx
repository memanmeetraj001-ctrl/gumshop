'use client'
import React, { useState, useMemo, useEffect } from 'react';
import { normalizeProductOptions, getProductVariantPricing } from '@/lib/productOptions';
import { useDispatch } from 'react-redux';
import { addToCart } from '@/lib/features/cart/cartSlice';
import { X, Star, ShoppingBag, Zap, ShieldCheck, Truck, Check, Heart } from 'lucide-react';
import { useWishlist } from '@/lib/wishlist';
import toast from 'react-hot-toast';
import GumroadIframeModal from './GumroadIframeModal';
import { getActiveStoreSync } from '@/lib/activeStore';
import { getSafeImageUrl, handleImageError } from '@/lib/imageUtils';

export default function ProductQuickView({ product, isOpen, onClose, onOpenCart }) {
    const dispatch = useDispatch();
    const { toggle, has } = useWishlist();
    const [quantity, setQuantity] = useState(1);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [checkoutModal, setCheckoutModal] = useState({ isOpen: false, gumroadUrl: '', orderSessionId: '' });

    const optionInfo = useMemo(() => normalizeProductOptions(product), [product]);
    const [selectedOption, setSelectedOption] = useState('');

    useEffect(() => {
        if (optionInfo?.optionsList?.length > 0) {
            setSelectedOption(optionInfo.optionsList[0]);
        } else {
            setSelectedOption('');
        }
        setQuantity(1);
        setActiveImageIndex(0);
    }, [product?.id, optionInfo]);

    if (!isOpen || !product) return null;

    const isWishlisted = has(product.id);
    const images = product.images?.length > 0 ? product.images : [product.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600'];
    
    // Dynamic variant pricing
    const pricing = getProductVariantPricing(product, selectedOption);
    const price = pricing.effectivePrice || parseFloat(product.price !== undefined && product.price !== null ? product.price : 52.99);
    const compareAtPrice = parseFloat(product.compareAtPrice || (price === 52.99 ? 69.99 : Math.round(price * 1.35 * 100) / 100));
    const discountPercent = compareAtPrice > price ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100) : 0;

    const handleAddToCart = () => {
        const itemPayload = {
            ...product,
            price,
            selectedOption: selectedOption || null,
            variantName: selectedOption || null
        };
        const cartKey = selectedOption ? `${product.id}__${selectedOption}` : product.id;
        dispatch(addToCart({ productId: cartKey, product: itemPayload, quantity }));
        toast.success(`Added ${quantity}x "${product.name}${selectedOption ? ` (${selectedOption})` : ''}" to cart! 🛍️`);
        onClose();
        if (onOpenCart) onOpenCart();
    };

    const handleBuyNow = async () => {
        setIsCheckingOut(true);
        try {
            const activeStore = getActiveStoreSync();
            const storeSlug = activeStore?.username || activeStore?.id || product.storeId;
            const storeScopedUrl = storeSlug && typeof window !== 'undefined' ? (localStorage.getItem(`gumroad_url_${storeSlug}`) || localStorage.getItem(`gumroad_url_${activeStore?.id}`)) : '';
            const persistentUrl = typeof window !== 'undefined' ? (storeScopedUrl || localStorage.getItem('gumshop_gumroad_url') || localStorage.getItem('gumroad_product_url') || '') : '';
            
            const storeShipping = activeStore?.shipping || {};
            const standardShippingFee = typeof storeShipping.standardFee === 'number' ? storeShipping.standardFee : 4.99;
            const freeThreshold = typeof storeShipping.freeShippingThreshold === 'number' ? storeShipping.freeShippingThreshold : 50.00;
            const subtotal = price * quantity;
            const shippingFee = subtotal >= freeThreshold ? 0 : standardShippingFee;
            const calculatedTotal = Math.round((subtotal + shippingFee) * 100) / 100;

            const res = await fetch('/api/gumroad/dynamic-checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    storeId: product.storeId || activeStore?.id || 'store_default',
                    storeName: activeStore?.name || product.name,
                    gumroadProductUrl: product.gumroadUrl || activeStore?.gumroadProductUrl || activeStore?.gumroadUrl || persistentUrl || '',
                    items: [{
                        productId: product.id,
                        name: product.name + (selectedOption ? ` (${selectedOption})` : ''),
                        price: price,
                        quantity: quantity,
                        selectedOption: selectedOption || null,
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
            const persistentUrl = typeof window !== 'undefined' ? (localStorage.getItem('gumshop_gumroad_url') || '') : '';
            const storeShipping = activeStore?.shipping || {};
            const standardShippingFee = typeof storeShipping.standardFee === 'number' ? storeShipping.standardFee : 4.99;
            const freeThreshold = typeof storeShipping.freeShippingThreshold === 'number' ? storeShipping.freeShippingThreshold : 50.00;
            const subtotal = price * quantity;
            const shippingFee = subtotal >= freeThreshold ? 0 : standardShippingFee;
            const calculatedTotal = Math.round((subtotal + shippingFee) * 100) / 100;

            setCheckoutModal({
                isOpen: true,
                gumroadUrl: product.gumroadUrl || activeStore?.gumroadProductUrl || persistentUrl || '',
                orderSessionId: `ord_${Date.now()}`,
                total: calculatedTotal,
                shippingFee: shippingFee
            });
        } finally {
            setIsCheckingOut(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 animate-in fade-in duration-200">
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl z-10 overflow-hidden border border-slate-100">
                <button
                    onClick={onClose}
                    className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition z-10 cursor-pointer"
                    aria-label="Close"
                >
                    <X size={20} />
                </button>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-start">
                    {/* Media Gallery */}
                    <div className="space-y-3">
                        <div className="relative aspect-square rounded-2xl bg-slate-50 border border-slate-200/80 overflow-hidden flex items-center justify-center">
                            <img 
                                src={getSafeImageUrl(images[activeImageIndex] || images[0])} 
                                alt={product.name}
                                onError={(e) => handleImageError(e, 'product')}
                                className="w-full h-full object-contain p-4"
                            />
                            {discountPercent > 0 && (
                                <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-slate-900 text-white font-bold text-[11px] shadow-xs">
                                    -{discountPercent}%
                                </span>
                            )}
                        </div>

                        {images.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto pb-1">
                                {images.map((img, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => setActiveImageIndex(idx)}
                                        className={`size-14 rounded-xl border-2 overflow-hidden shrink-0 transition cursor-pointer ${
                                            activeImageIndex === idx ? 'border-slate-900 scale-102' : 'border-slate-200 hover:border-slate-300'
                                        }`}
                                    >
                                        <img 
                                            src={getSafeImageUrl(img)} 
                                            alt="" 
                                            onError={(e) => handleImageError(e, 'product')}
                                            className="w-full h-full object-cover" 
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Details & Actions */}
                    <div className="flex flex-col justify-between h-full">
                        <div>
                            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                                {product.category || 'Featured'}
                            </span>

                            <h3 className="text-xl font-bold text-slate-900 mt-1 leading-snug">
                                {product.name}
                            </h3>

                            {/* Ratings (if verified) */}
                            {product.reviewCount > 0 && (
                                <div className="flex items-center gap-1.5 mt-2">
                                    <div className="flex items-center text-amber-400">
                                        <Star size={13} className="fill-amber-400" />
                                    </div>
                                    <span className="text-xs font-semibold text-slate-700">{typeof product.rating === 'number' ? product.rating.toFixed(1) : '5.0'}</span>
                                    <span className="text-xs text-slate-400">({product.reviewCount} reviews)</span>
                                </div>
                            )}

                            {/* Price */}
                            <div className="flex items-baseline gap-2.5 mt-3">
                                <span className="text-2xl font-bold text-slate-900 tracking-tight">${price.toFixed(2)}</span>
                                {compareAtPrice > price && (
                                    <span className="text-sm font-normal text-slate-400 line-through">
                                        ${compareAtPrice.toFixed(2)}
                                    </span>
                                )}
                            </div>

                            {/* Description */}
                            {product.description && (
                                <p className="text-xs text-slate-600 mt-3 line-clamp-3 leading-relaxed">
                                    {product.description}
                                </p>
                            )}

                            {/* Variant / Option Selector */}
                            {optionInfo.hasOptions && optionInfo.optionsList.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-slate-100">
                                    <span className="text-xs font-semibold text-slate-700 block mb-2">Options</span>
                                    <div className="flex flex-wrap gap-2">
                                        {optionInfo.optionsList.map(opt => {
                                            const isSelected = (selectedOption || optionInfo.optionsList[0]) === opt;
                                            return (
                                                <button
                                                    key={opt}
                                                    type="button"
                                                    onClick={() => setSelectedOption(opt)}
                                                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                                                        isSelected
                                                            ? 'bg-slate-900 text-white shadow-xs'
                                                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/80'
                                                    }`}
                                                >
                                                    {opt}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Quantity Selector */}
                            <div className="flex items-center gap-4 mt-5">
                                <span className="text-xs font-semibold text-slate-700">Quantity</span>
                                <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 p-0.5">
                                    <button
                                        type="button"
                                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                        className="size-7 rounded-lg bg-white shadow-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                                    >
                                        -
                                    </button>
                                    <span className="w-9 text-center font-bold text-xs text-slate-900">{quantity}</span>
                                    <button
                                        type="button"
                                        onClick={() => setQuantity(q => q + 1)}
                                        className="size-7 rounded-lg bg-white shadow-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* CTA Buttons */}
                        <div className="space-y-2 mt-6 pt-5 border-t border-slate-100">
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={handleAddToCart}
                                    className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer"
                                >
                                    <ShoppingBag size={15} />
                                    <span>Add to Cart</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const nowSaved = toggle(product);
                                        toast.success(nowSaved ? 'Added to Wishlist! ❤️' : 'Removed from Wishlist');
                                    }}
                                    className={`p-3 rounded-xl border transition cursor-pointer ${
                                        isWishlisted ? 'border-rose-200 bg-rose-50 text-rose-600' : 'border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-slate-50'
                                    }`}
                                    title="Wishlist"
                                    aria-label="Wishlist"
                                >
                                    <Heart size={16} className={isWishlisted ? 'fill-rose-600' : ''} />
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={handleBuyNow}
                                disabled={isCheckingOut}
                                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
                            >
                                <Zap size={15} className="fill-white" />
                                <span>{isCheckingOut ? 'Loading Secure Checkout...' : 'Buy Now'}</span>
                            </button>

                            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 font-medium">
                                <span className="flex items-center gap-1">
                                    <Truck size={12} className="text-slate-400" /> Tracked Shipping
                                </span>
                                <span className="flex items-center gap-1">
                                    <ShieldCheck size={12} className="text-slate-400" /> Buyer Protection
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* In-Frame Gumroad Checkout Modal */}
            <GumroadIframeModal
                isOpen={checkoutModal.isOpen}
                onClose={() => setCheckoutModal({ isOpen: false, gumroadUrl: '', orderSessionId: '' })}
                product={product}
                items={[{ id: product.id, name: product.name, price: price, quantity: quantity, image: images[0] }]}
                total={checkoutModal.total || (price * quantity)}
                shippingFee={checkoutModal.shippingFee || 0}
                gumroadUrl={checkoutModal.gumroadUrl}
                orderSessionId={checkoutModal.orderSessionId}
            />
        </div>
    );
}
