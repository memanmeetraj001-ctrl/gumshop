'use client'
import React, { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { addToCart, removeFromCart, deleteItemFromCart } from '@/lib/features/cart/cartSlice';
import { X, Trash2, ShoppingBag, Plus, Minus, Zap, ShieldCheck, Tag, Sparkles } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { getActiveStoreSync } from '@/lib/activeStore';
import { getCoupon } from '@/lib/firebaseDb';
import GumroadIframeModal from './GumroadIframeModal';
import { getSafeImageUrl, handleImageError } from '@/lib/imageUtils';

export default function CartDrawer({ isOpen, onClose, products: propProducts }) {
    const dispatch = useDispatch();
    const currency = '$';
    const { cartItems, cartProducts = {}, total } = useSelector(state => state.cart);
    const reduxProducts = useSelector(state => state.product.list);
    const products = propProducts && propProducts.length > 0 ? propProducts : reduxProducts;

    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [couponCode, setCouponCode] = useState('');
    const [appliedDiscount, setAppliedDiscount] = useState(0);
    const [checkoutModal, setCheckoutModal] = useState({ isOpen: false, gumroadUrl: '', orderSessionId: '' });

    // Memoize resolved items and subtotal to avoid synchronous storage scans on every render
    const { items, subtotal } = useMemo(() => {
        if (!isOpen) return { items: [], subtotal: 0 };
        const resolvedItems = [];
        let calculatedSubtotal = 0;

        for (const [key, qty] of Object.entries(cartItems || {})) {
            if (!qty || qty <= 0) continue;
            const strKey = String(key || '');
            const baseId = strKey.includes('__') ? strKey.split('__')[0] : strKey;
            const variant = strKey.includes('__') ? strKey.split('__')[1] : '';
            let product = cartProducts[strKey] || cartProducts[baseId] || Object.values(cartProducts).find(p => p?.id === strKey || p?.id === baseId) || (products || []).find(p => p && (p.id === strKey || p.id === baseId));

            const price = parseFloat(product?.price !== undefined && product?.price !== null ? product.price : 0);
            const name = product?.name || 'Featured Item';
            const image = product?.image || product?.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200';

            resolvedItems.push({
                id: strKey,
                name,
                variant,
                price,
                image,
                quantity: qty,
                storeId: product?.storeId || 'store_default'
            });
            calculatedSubtotal += price * qty;
        }

        return { items: resolvedItems, subtotal: calculatedSubtotal };
    }, [isOpen, cartItems, cartProducts, products]);

    // Frequently Bought Together Companion Recommendation
    const crossSellProduct = useMemo(() => {
        if (!items.length || !products?.length) return null;
        const inCartIds = new Set(items.map(i => String(i.id || '').split('__')[0]));
        return products.find(p => p && !inCartIds.has(String(p.id)) && !inCartIds.has(String(p.id).split('__')[0]) && parseFloat(p.price || 0) > 0) || null;
    }, [items, products]);

    if (!isOpen) return null;

    // Multi-Tier Milestones: $50 (Free Standard Shipping), $75 (Free Mystery Gift), $100 (Priority VIP Dispatch)
    const freeShippingThreshold = 50;
    const maxTierThreshold = 100;
    const overallTierProgress = Math.min(100, Math.round((subtotal / maxTierThreshold) * 100));
    const shippingFee = subtotal >= freeShippingThreshold || subtotal === 0 ? 0 : 4.99;

    let tierMessage = '';
    if (subtotal === 0) {
        tierMessage = 'Add items to unlock FREE Worldwide Shipping!';
    } else if (subtotal < 50) {
        tierMessage = `Add $${(50 - subtotal).toFixed(2)} more for FREE Worldwide Shipping!`;
    } else if (subtotal < 75) {
        tierMessage = `🎉 FREE Shipping unlocked! Add $${(75 - subtotal).toFixed(2)} for a Mystery Gift 🎁`;
    } else if (subtotal < 100) {
        tierMessage = `🎁 Mystery Gift unlocked! Add $${(100 - subtotal).toFixed(2)} for Priority VIP Dispatch ⚡`;
    } else {
        tierMessage = `🌟 Max VIP Perks Unlocked: FREE Shipping + Mystery Gift + VIP Dispatch!`;
    }

    const finalTotal = Math.max(0, subtotal + shippingFee - appliedDiscount);

    const handleApplyCoupon = async (e) => {
        e.preventDefault();
        const code = couponCode.trim().toUpperCase();
        if (!code) return;
        try {
            const couponData = await getCoupon(code);
            if (couponData && (!couponData.expiresAt || new Date(couponData.expiresAt) > new Date())) {
                if (couponData.minSpend && subtotal < Number(couponData.minSpend)) {
                    return toast.error(`Minimum spend of $${couponData.minSpend} required`);
                }
                if (couponData.type === 'fixed') {
                    const discount = Math.min(subtotal, Number(couponData.discount || 0));
                    setAppliedDiscount(discount);
                    toast.success(`Coupon applied: $${discount} off! 🎉`);
                } else if (couponData.type === 'shipping') {
                    setAppliedDiscount(shippingFee);
                    toast.success('Coupon applied: Free shipping! 🚚');
                } else {
                    const pct = Number(couponData.discount) || 20;
                    const discount = Math.round(subtotal * (pct / 100) * 100) / 100;
                    setAppliedDiscount(discount);
                    toast.success(`Coupon applied: ${pct}% off! 🎉`);
                }
            } else if (['SAVE20', 'SAVE10', 'FLASH25', 'NEW20', 'VIP15'].includes(code)) {
                const pct = code === 'FLASH25' ? 25 : (code === 'SAVE10' ? 10 : (code === 'VIP15' ? 15 : 20));
                const discount = Math.round(subtotal * (pct / 100) * 100) / 100;
                setAppliedDiscount(discount);
                toast.success(`Coupon "${code}" applied: ${pct}% off! 🎉`);
            } else {
                toast.error('Invalid or expired coupon code');
            }
        } catch (err) {
            toast.error('Invalid coupon code');
        }
    };

    const handleCheckout = async () => {
        if (items.length === 0) return;
        setIsCheckingOut(true);
        try {
            const activeStore = getActiveStoreSync();
            const storeSlug = activeStore?.username || activeStore?.id;
            const storeScopedUrl = storeSlug && typeof window !== 'undefined' ? (localStorage.getItem(`gumroad_url_${storeSlug}`) || localStorage.getItem(`gumroad_url_${activeStore?.id}`)) : '';
            const storeScopedToken = storeSlug && typeof window !== 'undefined' ? (localStorage.getItem(`gumroad_token_${storeSlug}`) || localStorage.getItem(`gumroad_token_${activeStore?.id}`)) : '';
            const persistentUrl = typeof window !== 'undefined' ? (storeScopedUrl || localStorage.getItem('gumshop_gumroad_url') || localStorage.getItem('gumroad_product_url') || '') : '';
            const persistentToken = typeof window !== 'undefined' ? (storeScopedToken || localStorage.getItem('gumshop_gumroad_token') || localStorage.getItem('gumroad_access_token') || '') : '';
            const itemGumroadUrl = items.find(i => i.gumroadUrl)?.gumroadUrl || '';
            const effectiveGumroadUrl = activeStore?.gumroadProductUrl || activeStore?.gumroadUrl || storeScopedUrl || persistentUrl || itemGumroadUrl || '';

            let activeAttribution = null;
            if (typeof window !== 'undefined') {
                try {
                    const rawUtm = sessionStorage.getItem('active_utm');
                    if (rawUtm) activeAttribution = JSON.parse(rawUtm);
                } catch {}
            }

            const resolvedStoreSlug = items[0]?.storeSlug || (items[0]?.storeId ? String(items[0].storeId).replace(/^store_/, '') : (activeStore?.username || ''));
            const resolvedStoreId = items[0]?.storeId || activeStore?.id || (resolvedStoreSlug ? `store_${resolvedStoreSlug}` : 'store_default');

            const res = await fetch('/api/gumroad/dynamic-checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    storeId: resolvedStoreId,
                    storeSlug: resolvedStoreSlug,
                    storeName: activeStore?.name || 'GumShop Super Store',
                    gumroadProductUrl: effectiveGumroadUrl,
                    accessToken: activeStore?.gumroadToken || persistentToken || '',
                    attribution: activeAttribution,
                    items: items.map(i => ({
                        productId: i.id,
                        name: i.name,
                        price: parseFloat(i.price || 0),
                        quantity: i.quantity,
                        variant: i.variant || '',
                        gumroadUrl: i.gumroadUrl || ''
                    })),
                    discountAmount: appliedDiscount,
                    shippingFee: shippingFee
                })
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok && data.error) {
                toast.error(data.error);
            }
            setCheckoutModal({
                isOpen: true,
                gumroadUrl: data.checkoutUrl || effectiveGumroadUrl,
                orderSessionId: data.orderSessionId || `ord_${Date.now()}`
            });
        } catch (err) {
            console.error('Checkout error:', err);
            const activeStore = getActiveStoreSync();
            const persistentUrl = typeof window !== 'undefined' ? (localStorage.getItem('gumshop_gumroad_url') || '') : '';
            const itemGumroadUrl = items.find(i => i.gumroadUrl)?.gumroadUrl || '';
            setCheckoutModal({
                isOpen: true,
                gumroadUrl: activeStore?.gumroadProductUrl || persistentUrl || itemGumroadUrl || '',
                orderSessionId: `ord_${Date.now()}`
            });
        } finally {
            setIsCheckingOut(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
                onClick={onClose}
            />

            {/* Slide Drawer */}
            <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
                <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between">
                    
                    {/* Header */}
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="size-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                                <ShoppingBag size={18} />
                            </div>
                            <h2 className="text-lg font-extrabold text-slate-900">Your Cart ({total})</h2>
                        </div>
                        <button 
                            onClick={onClose}
                            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Tiered Milestone Progress Bar */}
                    <div className="px-6 py-3 bg-gradient-to-b from-emerald-50/80 to-teal-50/40 border-b border-emerald-100/80">
                        <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                            <span className="text-slate-800 font-bold truncate pr-2">
                                {tierMessage}
                            </span>
                            <span className="text-emerald-700 font-extrabold shrink-0">{overallTierProgress}%</span>
                        </div>
                        <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden">
                            <div 
                                className="bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${overallTierProgress}%` }}
                            />
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-bold mt-1.5 text-slate-400">
                            <span className={subtotal >= 50 ? 'text-emerald-700 font-black' : ''}>
                                {subtotal >= 50 ? '✓ $50 Free Ship' : '$50 Free Ship'}
                            </span>
                            <span className={subtotal >= 75 ? 'text-emerald-700 font-black' : ''}>
                                {subtotal >= 75 ? '✓ $75 Free Gift' : '$75 Free Gift'}
                            </span>
                            <span className={subtotal >= 100 ? 'text-emerald-700 font-black' : ''}>
                                {subtotal >= 100 ? '✓ $100 VIP' : '$100 VIP'}
                            </span>
                        </div>
                    </div>

                    {/* Item List */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        {items.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center py-12">
                                <div className="size-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
                                    <ShoppingBag size={30} />
                                </div>
                                <h3 className="text-base font-bold text-slate-800">Your cart is empty</h3>
                                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                                    Discover our top trending winners and add them with one click.
                                </p>
                                <button
                                    onClick={onClose}
                                    className="mt-6 px-6 py-2.5 rounded-full bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-600/20 hover:bg-emerald-700 transition"
                                >
                                    Start Shopping
                                </button>
                            </div>
                        ) : (
                            items.map(item => (
                                <div key={item.id} className="flex gap-4 p-3 rounded-2xl bg-slate-50 border border-slate-100 group">
                                    <img 
                                        src={getSafeImageUrl(item.image)} 
                                        alt={item.name || "Product"} 
                                        loading="lazy"
                                        decoding="async"
                                        className="w-16 h-16 rounded-xl object-cover bg-white border border-slate-200 shrink-0"
                                        onError={(e) => handleImageError(e, 'product')}
                                    />
                                    <div className="flex-1 flex flex-col justify-between">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <h4 className="text-xs font-bold text-slate-900 line-clamp-2">{item.name}</h4>
                                                {item.variant && (
                                                    <span className="inline-block mt-1 px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-semibold rounded-md border border-slate-200">
                                                        {item.variant}
                                                    </span>
                                                )}
                                            </div>
                                            <button 
                                                onClick={() => dispatch(deleteItemFromCart({ productId: item.id, itemKey: item.id }))}
                                                className="text-slate-400 hover:text-rose-600 p-1 transition"
                                                title="Remove"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                        <div className="flex items-center justify-between mt-2">
                                            <span className="text-sm font-extrabold text-slate-900">
                                                {currency}{(item.price * item.quantity).toFixed(2)}
                                            </span>
                                            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5">
                                                <button
                                                    onClick={() => dispatch(removeFromCart({ productId: item.id, itemKey: item.id }))}
                                                    className="w-7 h-7 rounded flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 active:scale-95 transition cursor-pointer"
                                                    title="Decrease quantity"
                                                >
                                                    <Minus size={13} />
                                                </button>
                                                <span className="text-xs font-bold px-1.5 min-w-5 text-center">{item.quantity}</span>
                                                <button
                                                    onClick={() => dispatch(addToCart({ productId: item.id, itemKey: item.id, product: item }))}
                                                    className="w-7 h-7 rounded flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 active:scale-95 transition cursor-pointer"
                                                    title="Increase quantity"
                                                >
                                                    <Plus size={13} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}

                        {/* Frequently Bought Together Companion Recommendation Card */}
                        {items.length > 0 && crossSellProduct && (
                            <div className="mt-4 p-3 rounded-2xl bg-gradient-to-br from-amber-50/90 to-emerald-50/60 border border-amber-200/80 shadow-2xs">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-900 flex items-center gap-1">
                                        <Sparkles size={12} className="text-amber-500" /> Frequently Bought Together
                                    </span>
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-600 text-white shadow-2xs">
                                        15% OFF BUNDLE
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <img 
                                        src={getSafeImageUrl(crossSellProduct.image || crossSellProduct.images?.[0])}
                                        alt={crossSellProduct.name || 'Companion item'}
                                        loading="lazy"
                                        decoding="async"
                                        className="w-12 h-12 rounded-xl object-cover bg-white border border-slate-200 shrink-0"
                                        onError={(e) => handleImageError(e, 'product')}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <h5 className="text-xs font-bold text-slate-900 truncate">{crossSellProduct.name}</h5>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className="text-xs font-extrabold text-emerald-700">
                                                ${(parseFloat(crossSellProduct.price || 0) * 0.85).toFixed(2)}
                                            </span>
                                            <span className="text-[11px] text-slate-400 line-through">
                                                ${parseFloat(crossSellProduct.price || 0).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const discountedPrice = Number((parseFloat(crossSellProduct.price || 0) * 0.85).toFixed(2));
                                            dispatch(addToCart({
                                                productId: crossSellProduct.id,
                                                itemKey: crossSellProduct.id,
                                                product: { ...crossSellProduct, price: discountedPrice }
                                            }));
                                            toast.success(`Added ${crossSellProduct.name} with 15% OFF bundle savings! 🎉`);
                                        }}
                                        className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-bold text-xs shrink-0 shadow-xs transition cursor-pointer"
                                    >
                                        + Add
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer / Summary */}
                    {items.length > 0 && (
                        <div className="p-6 border-t border-slate-200 bg-slate-50/50 space-y-4">
                            {/* Promo Code Input / Applied State */}
                            {appliedDiscount > 0 ? (
                                <div className="flex items-center justify-between p-2.5 px-3 bg-emerald-50 border border-emerald-200/80 rounded-xl">
                                    <div className="flex items-center gap-2">
                                        <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-xs font-bold text-emerald-950 uppercase">Coupon Applied ({couponCode || 'PROMO'})</span>
                                        <span className="text-xs font-extrabold text-emerald-700">-${appliedDiscount.toFixed(2)}</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => { setAppliedDiscount(0); setCouponCode(''); toast('Coupon removed', { icon: '🗑️' }); }}
                                        className="text-xs text-slate-400 hover:text-rose-600 font-bold px-1.5 py-0.5 rounded transition cursor-pointer"
                                        title="Remove discount"
                                    >
                                        ✕ Remove
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input 
                                            type="text"
                                            placeholder="Promo code (try SAVE20)"
                                            value={couponCode}
                                            onChange={(e) => setCouponCode(e.target.value)}
                                            className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-emerald-500 transition"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                                    >
                                        Apply
                                    </button>
                                </form>
                            )}

                            {/* Totals */}
                            <div className="space-y-1.5 text-xs text-slate-600">
                                <div className="flex justify-between">
                                    <span>Subtotal</span>
                                    <span className="font-bold text-slate-900">${subtotal.toFixed(2)}</span>
                                </div>
                                {appliedDiscount > 0 && (
                                    <div className="flex justify-between text-emerald-600 font-bold">
                                        <span>Discount</span>
                                        <span>-${appliedDiscount.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span>Estimated Shipping</span>
                                    <span className="font-semibold text-slate-900">
                                        {subtotal >= freeShippingThreshold ? (
                                            <span className="text-emerald-600 font-bold">FREE</span>
                                        ) : (
                                            '$4.99'
                                        )}
                                    </span>
                                </div>
                                <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                                    <span>Total</span>
                                    <span className="text-emerald-600">${finalTotal.toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Checkout Actions */}
                            <div className="space-y-2">
                                <button
                                    onClick={handleCheckout}
                                    disabled={isCheckingOut}
                                    className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
                                >
                                    <Zap size={18} className="fill-white" />
                                    <span>{isCheckingOut ? 'Opening Secure Checkout...' : '⚡ Buy Now — Instant Checkout'}</span>
                                </button>
                                <Link
                                    href="/cart"
                                    onClick={onClose}
                                    className="w-full py-2.5 text-center text-xs font-bold text-slate-500 hover:text-slate-800 block transition"
                                >
                                    View Full Cart Details →
                                </Link>
                            </div>

                            {/* Trust Badges */}
                            <div className="flex items-center justify-center gap-3 pt-2 text-[11px] text-slate-400 font-medium">
                                <span className="flex items-center gap-1">
                                    <ShieldCheck size={13} className="text-emerald-600" /> 256-bit SSL Encrypted
                                </span>
                                <span>•</span>
                                <span>Apple Pay & Cards</span>
                            </div>
                        </div>
                    )}

                </div>
            </div>

            {/* In-Frame Checkout Modal */}
            <GumroadIframeModal
                isOpen={checkoutModal.isOpen}
                onClose={() => setCheckoutModal({ isOpen: false, gumroadUrl: '', orderSessionId: '' })}
                items={items}
                total={finalTotal}
                shippingFee={shippingFee}
                gumroadUrl={checkoutModal.gumroadUrl}
                orderSessionId={checkoutModal.orderSessionId}
                storeId={items[0]?.storeId}
                storeSlug={items[0]?.storeSlug || (items[0]?.storeId ? String(items[0].storeId).replace(/^store_/, '') : '')}
            />
        </div>
    );
}
