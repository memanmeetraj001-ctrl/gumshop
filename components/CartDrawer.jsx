'use client'
import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { addToCart, removeFromCart, deleteItemFromCart, clearCart } from '@/lib/features/cart/cartSlice';
import { X, Trash2, ShoppingBag, Plus, Minus, ArrowRight, Zap, ShieldCheck, Tag } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { getActiveStoreSync } from '@/lib/activeStore';
import { createOrder, getCoupon } from '@/lib/firebaseDb';
import GumroadIframeModal from './GumroadIframeModal';
import { getSafeImageUrl, handleImageError } from '@/lib/imageUtils';

export default function CartDrawer({ isOpen, onClose }) {
    const dispatch = useDispatch();
    const currency = '$';
    const { cartItems, cartProducts = {}, total } = useSelector(state => state.cart);
    const products = useSelector(state => state.product.list);

    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [couponCode, setCouponCode] = useState('');
    const [appliedDiscount, setAppliedDiscount] = useState(0);
    const [checkoutModal, setCheckoutModal] = useState({ isOpen: false, gumroadUrl: '', orderSessionId: '' });

    if (!isOpen) return null;

    // Resolve items
    const items = [];
    let subtotal = 0;

    for (const [key, qty] of Object.entries(cartItems)) {
        if (!qty || qty <= 0) continue;
        const baseId = key.includes('__') ? key.split('__')[0] : key;
        let product = cartProducts[key] || cartProducts[baseId] || Object.values(cartProducts).find(p => p?.id === key || p?.id === baseId) || (products || []).find(p => p.id === key || p.id === baseId);

        if (!product && typeof window !== 'undefined') {
            for (let i = 0; i < localStorage.length; i++) {
                const lsKey = localStorage.key(i);
                if (lsKey && (lsKey.startsWith('cloned_store_') || lsKey.startsWith('store_') || lsKey.startsWith('gumshop_db_products/'))) {
                    try {
                        const parsed = JSON.parse(localStorage.getItem(lsKey) || '{}');
                        if (parsed.id === key || parsed.id === baseId) { product = parsed; break; }
                        if (parsed.products) {
                            const match = parsed.products.find(p => p.id === key || p.id === baseId);
                            if (match) { product = match; break; }
                        }
                    } catch {}
                }
            }
        }

        const price = parseFloat(product?.price !== undefined && product?.price !== null ? product.price : 0);
        const name = product?.name || 'Featured Item';
        const image = product?.image || product?.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200';

        items.push({
            id: key,
            name,
            price,
            image,
            quantity: qty,
            storeId: product?.storeId || 'store_default'
        });
        subtotal += price * qty;
    }

    const freeShippingThreshold = 50;
    const shippingFee = subtotal >= freeShippingThreshold || subtotal === 0 ? 0 : 4.99;
    const amountNeededForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
    const freeShippingProgress = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));

    const finalTotal = Math.max(0, subtotal + shippingFee - appliedDiscount);

    const handleApplyCoupon = async (e) => {
        e.preventDefault();
        const code = couponCode.trim().toUpperCase();
        if (!code) return;
        try {
            const couponData = await getCoupon(code);
            if (couponData && (!couponData.expiresAt || new Date(couponData.expiresAt) > new Date())) {
                const pct = Number(couponData.discount) || 20;
                const discount = Math.round(subtotal * (pct / 100) * 100) / 100;
                setAppliedDiscount(discount);
                toast.success(`Coupon "${code}" applied: ${pct}% off! 🎉`);
            } else if (code === 'SAVE20' || code === 'SAVE10' || code === 'FLASH25' || code === 'NEW20' || code === 'VIP15') {
                const discount = Math.round(subtotal * 0.20 * 100) / 100;
                setAppliedDiscount(discount);
                toast.success(`Coupon "${code}" applied: 20% off! 🎉`);
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

            const res = await fetch('/api/gumroad/dynamic-checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    storeId: activeStore?.id || items[0]?.storeId || 'store_default',
                    storeName: activeStore?.name || 'GumShop Super Store',
                    gumroadProductUrl: effectiveGumroadUrl,
                    accessToken: activeStore?.gumroadToken || persistentToken || '',
                    items: items.map(i => ({
                        productId: i.id,
                        name: i.name,
                        price: i.price,
                        quantity: i.quantity,
                        gumroadUrl: i.gumroadUrl || ''
                    })),
                    discountAmount: appliedDiscount,
                    shippingFee: shippingFee
                })
            });

            const data = await res.json().catch(() => ({}));
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

                    {/* Free Shipping Progress Bar */}
                    <div className="px-6 py-3 bg-emerald-50/70 border-b border-emerald-100">
                        <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                            {amountNeededForFreeShipping > 0 ? (
                                <span className="text-slate-700">
                                    Add <strong className="text-emerald-700 font-extrabold">${amountNeededForFreeShipping.toFixed(2)}</strong> more for <strong className="text-emerald-700">FREE Worldwide Shipping!</strong>
                                </span>
                            ) : (
                                <span className="text-emerald-800 font-bold flex items-center gap-1">
                                    🎉 You unlocked FREE Worldwide Shipping!
                                </span>
                            )}
                            <span className="text-emerald-700 font-bold">{freeShippingProgress}%</span>
                        </div>
                        <div className="w-full bg-emerald-200/60 rounded-full h-2 overflow-hidden">
                            <div 
                                className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${freeShippingProgress}%` }}
                            />
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
                                        className="w-16 h-16 object-cover rounded-xl bg-white border border-slate-200 shrink-0"
                                        onError={(e) => handleImageError(e, 'product')}
                                    />
                                    <div className="flex-1 flex flex-col justify-between">
                                        <div className="flex items-start justify-between gap-2">
                                            <h4 className="text-xs font-bold text-slate-900 line-clamp-2">{item.name}</h4>
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
                                            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg p-0.5">
                                                <button
                                                    onClick={() => dispatch(removeFromCart({ productId: item.id, itemKey: item.id }))}
                                                    className="size-5 rounded flex items-center justify-center text-slate-500 hover:bg-slate-100 transition"
                                                >
                                                    <Minus size={11} />
                                                </button>
                                                <span className="text-xs font-bold px-1 min-w-4 text-center">{item.quantity}</span>
                                                <button
                                                    onClick={() => dispatch(addToCart({ productId: item.id, itemKey: item.id, product: item }))}
                                                    className="size-5 rounded flex items-center justify-center text-slate-500 hover:bg-slate-100 transition"
                                                >
                                                    <Plus size={11} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer / Summary */}
                    {items.length > 0 && (
                        <div className="p-6 border-t border-slate-200 bg-slate-50/50 space-y-4">
                            {/* Promo Code Input */}
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
                                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition"
                                >
                                    Apply
                                </button>
                            </form>

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
                                    className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50"
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
            />
        </div>
    );
}
