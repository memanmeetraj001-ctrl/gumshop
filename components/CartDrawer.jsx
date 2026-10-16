'use client'
import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useSelector, useDispatch } from 'react-redux';
import { addToCart, removeFromCart, deleteItemFromCart } from '@/lib/features/cart/cartSlice';
import { X, Trash2, ShoppingBag, Plus, Minus, Zap, ShieldCheck, Tag, Sparkles, Store } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { getActiveStoreSync } from '@/lib/activeStore';
import { getCoupon } from '@/lib/firebaseDb';
import GumroadIframeModal from './GumroadIframeModal';
import { getSafeImageUrl, handleImageError } from '@/lib/imageUtils';
import { trackEvent } from './AnalyticsTracker';

export default function CartDrawer({ isOpen, open, onClose, products: propProducts, storeSlug, store }) {
    const isVisible = Boolean(isOpen || open);
    if (!isVisible) return null;

    return (
        <CartDrawerErrorBoundary onClose={onClose}>
            <CartDrawerInner 
                isOpen={isVisible} 
                onClose={onClose} 
                products={propProducts} 
                storeSlug={storeSlug} 
                store={store} 
            />
        </CartDrawerErrorBoundary>
    );
}

// Resilient Error Boundary so cart drawer rendering errors never crash the entire page
class CartDrawerErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error("[CartDrawer Caught Error]:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            const fallback = (
                <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
                    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity" onClick={this.props.onClose} />
                    <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl flex flex-col justify-between h-full p-6 z-10 overflow-hidden">
                        <div className="flex items-center justify-between border-b pb-4">
                            <h3 className="text-base font-bold text-slate-900">Your Cart</h3>
                            <button onClick={this.props.onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl">✕</button>
                        </div>
                        <div className="text-center py-12">
                            <p className="text-sm text-slate-600 mb-4">Cart temporarily re-synced.</p>
                            <button 
                                onClick={() => { this.setState({ hasError: false }); if (this.props.onClose) this.props.onClose(); }} 
                                className="px-6 py-2.5 rounded-full bg-emerald-600 text-white font-bold text-xs"
                            >
                                Continue Shopping
                            </button>
                        </div>
                    </div>
                </div>
            );
            if (typeof document !== 'undefined' && document.body) {
                return createPortal(fallback, document.body);
            }
            return fallback;
        }
        return this.props.children;
    }
}

function CartDrawerInner({ isOpen, onClose, products: propProducts, storeSlug: propStoreSlug, store: propStore }) {
    const dispatch = useDispatch();
    const currency = '$';
    const cartState = useSelector(state => state?.cart) || {};
    const cartItems = (cartState.cartItems && typeof cartState.cartItems === 'object' && !Array.isArray(cartState.cartItems)) ? cartState.cartItems : {};
    const cartProducts = (cartState.cartProducts && typeof cartState.cartProducts === 'object' && !Array.isArray(cartState.cartProducts)) ? cartState.cartProducts : {};
    const total = Number(cartState.total) || 0;
    const reduxProducts = useSelector(state => state?.product?.list);
    const products = Array.isArray(propProducts) && propProducts.length > 0 
        ? propProducts 
        : (Array.isArray(reduxProducts) ? reduxProducts : []);

    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [couponCode, setCouponCode] = useState('');
    const [appliedDiscount, setAppliedDiscount] = useState(0);
    const [hasPriorityProtection, setHasPriorityProtection] = useState(true);
    const [checkoutModal, setCheckoutModal] = useState({ isOpen: false, gumroadUrl: '', orderSessionId: '' });

    const normalizedPropSlug = (propStoreSlug && propStoreSlug !== 'all')
        ? String(propStoreSlug).toLowerCase().trim().replace(/^store_/, '')
        : '';
    const [viewAllStores, setViewAllStores] = useState(false);
    const effectiveScope = (viewAllStores || !normalizedPropSlug) ? 'all' : normalizedPropSlug;

    const formatPrice = (val) => (Number(val) || 0).toFixed(2);

    // Auto-detect and activate stored coupon (e.g. SAVE20 from Flash Deals)
    useEffect(() => {
        if (!isOpen) return;
        if (typeof window !== 'undefined') {
            const activeCoupon = sessionStorage.getItem('active_coupon');
            if (activeCoupon && !couponCode) {
                const code = activeCoupon.trim().toUpperCase();
                setCouponCode(code);
            }
        }
    }, [isOpen, couponCode]);

    // Memoize resolved items and subtotal to avoid synchronous storage scans on every render
    const { allResolvedItems, items, subtotal, otherStoresCount } = useMemo(() => {
        if (!isOpen) return { allResolvedItems: [], items: [], subtotal: 0, otherStoresCount: 0 };
        const resolvedItems = [];

        for (const [rawKey, qty] of Object.entries(cartItems || {})) {
            const numQty = parseInt(qty || 0);
            if (!numQty || numQty <= 0) continue;
            const key = String(rawKey || '');
            if (!key) continue;
            const baseId = key.includes('__') ? key.split('__')[0] : key;
            const variant = key.includes('__') ? key.split('__')[1] : '';
            let product = cartProducts[key] || cartProducts[baseId] || Object.values(cartProducts).find(p => p && (p.id === key || p.id === baseId)) || (products || []).find(p => p && (p.id === key || p.id === baseId));

            const rawPrice = product?.price !== undefined && product?.price !== null ? product.price : 0;
            const price = parseFloat(rawPrice) || 0;
            const name = product?.name || 'Featured Item';
            const image = product?.image || (Array.isArray(product?.images) && product.images[0]) || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200';

            const rawStoreSlug = product?.storeSlug || product?.storeUsername || (product?.storeId ? String(product.storeId).replace(/^store_/, '') : (product?.store_id ? String(product.store_id).replace(/^store_/, '') : ''));
            const cleanSlug = rawStoreSlug ? String(rawStoreSlug).toLowerCase().trim().replace(/^store_/, '') : '';
            const cleanStoreId = product?.storeId || (cleanSlug ? `store_${cleanSlug}` : 'store_default');

            resolvedItems.push({
                id: key,
                name,
                variant,
                price,
                image,
                quantity: numQty,
                storeId: cleanStoreId,
                storeSlug: cleanSlug,
                storeName: product?.storeName || cleanSlug,
                gumroadUrl: product?.gumroadUrl || ''
            });
        }

        let filtered = resolvedItems;
        let otherCount = 0;
        if (effectiveScope !== 'all') {
            filtered = resolvedItems.filter(i => !i.storeSlug || i.storeSlug === effectiveScope || i.storeId === `store_${effectiveScope}`);
            const otherItems = resolvedItems.filter(i => i.storeSlug && i.storeSlug !== effectiveScope && i.storeId !== `store_${effectiveScope}`);
            otherCount = otherItems.reduce((acc, curr) => acc + curr.quantity, 0);
        }

        const calculatedSubtotal = filtered.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        return { 
            allResolvedItems: resolvedItems, 
            items: filtered, 
            subtotal: Math.round(calculatedSubtotal * 100) / 100, 
            otherStoresCount: otherCount 
        };
    }, [isOpen, cartItems, cartProducts, products, effectiveScope]);

    // Frequently Bought Together Companion Recommendation
    const crossSellProduct = useMemo(() => {
        if (!items.length || !Array.isArray(products) || !products.length) return null;
        const inCartIds = new Set(items.map(i => String(i.id || '').split('__')[0]));
        return products.find(p => p && p.id && !inCartIds.has(String(p.id)) && !inCartIds.has(String(p.id).split('__')[0]) && (parseFloat(p.price || 0) || 0) > 0) || null;
    }, [items, products]);

    if (!isOpen) return null;

    // Multi-Tier Milestones: $50 (Free Standard Shipping), $75 (Free Mystery Gift), $100 (Priority VIP Dispatch)
    const freeShippingThreshold = 50;
    const maxTierThreshold = 100;
    const overallTierProgress = Math.min(100, Math.round(((subtotal || 0) / maxTierThreshold) * 100)) || 0;
    const shippingFee = (subtotal >= freeShippingThreshold || subtotal === 0) ? 0 : 4.99;
    const priorityFee = (hasPriorityProtection && items.length > 0) ? 4.99 : 0;

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

    // Auto-calculate discount if couponCode is active and subtotal changes
    useEffect(() => {
        if (!couponCode || subtotal <= 0) {
            if (!couponCode) setAppliedDiscount(0);
            return;
        }
        const code = couponCode.trim().toUpperCase();
        if (['SAVE25', 'FLASH25', 'SAVE20', 'SAVE10', 'NEW20', 'VIP15'].includes(code)) {
            const pct = (code === 'SAVE25' || code === 'FLASH25') ? 25 : (code === 'SAVE10' ? 10 : (code === 'VIP15' ? 15 : 20));
            const calculated = Math.round(subtotal * (pct / 100) * 100) / 100;
            setAppliedDiscount(calculated);
        }
    }, [couponCode, subtotal]);

    // Listen for custom coupon applied events from navbar or modals
    useEffect(() => {
        const handleCouponEvent = (e) => {
            const { code } = e.detail || {};
            if (code) {
                const cleanCode = String(code).trim().toUpperCase();
                setCouponCode(cleanCode);
            }
        };
        window.addEventListener('gumshop_coupon_applied', handleCouponEvent);
        return () => window.removeEventListener('gumshop_coupon_applied', handleCouponEvent);
    }, []);

    const finalTotal = Math.max(0, Math.round(((subtotal || 0) + shippingFee + priorityFee - (appliedDiscount || 0)) * 100) / 100);

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
                if (typeof window !== 'undefined') {
                    sessionStorage.setItem('active_coupon', code);
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
            } else if (['SAVE25', 'FLASH25', 'SAVE20', 'SAVE10', 'NEW20', 'VIP15'].includes(code)) {
                if (typeof window !== 'undefined') {
                    sessionStorage.setItem('active_coupon', code);
                }
                const pct = (code === 'SAVE25' || code === 'FLASH25') ? 25 : (code === 'SAVE10' ? 10 : (code === 'VIP15' ? 15 : 20));
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
            const targetStoreSlug = (effectiveScope !== 'all' ? effectiveScope : (items[0]?.storeSlug || activeStore?.username || ''));
            const storeScopedUrl = targetStoreSlug && typeof window !== 'undefined' ? (localStorage.getItem(`gumroad_url_${targetStoreSlug}`) || localStorage.getItem(`gumroad_url_store_${targetStoreSlug}`)) : '';
            const storeScopedToken = targetStoreSlug && typeof window !== 'undefined' ? (localStorage.getItem(`gumroad_token_${targetStoreSlug}`) || localStorage.getItem(`gumroad_token_store_${targetStoreSlug}`)) : '';
            const persistentUrl = typeof window !== 'undefined' ? (storeScopedUrl || localStorage.getItem('gumshop_gumroad_url') || localStorage.getItem('gumroad_product_url') || '') : '';
            const persistentToken = typeof window !== 'undefined' ? (storeScopedToken || localStorage.getItem('gumshop_gumroad_token') || localStorage.getItem('gumroad_access_token') || '') : '';
            const itemGumroadUrl = items.find(i => i.gumroadUrl)?.gumroadUrl || '';
            const effectiveGumroadUrl = propStore?.gumroadProductUrl || propStore?.gumroadUrl || activeStore?.gumroadProductUrl || activeStore?.gumroadUrl || storeScopedUrl || persistentUrl || itemGumroadUrl || '';

            let activeAttribution = null;
            if (typeof window !== 'undefined') {
                try {
                    const rawUtm = sessionStorage.getItem('active_utm');
                    if (rawUtm) activeAttribution = JSON.parse(rawUtm);
                } catch {}
            }

            const resolvedStoreSlug = targetStoreSlug || items[0]?.storeSlug || (items[0]?.storeId ? String(items[0].storeId).replace(/^store_/, '') : (activeStore?.username || ''));
            const resolvedStoreId = items[0]?.storeId || (resolvedStoreSlug ? `store_${resolvedStoreSlug}` : (activeStore?.id || 'store_default'));

            trackEvent('initiate_checkout', {
                storeId: resolvedStoreId,
                storeSlug: resolvedStoreSlug,
                productName: items.map(i => `${i.quantity}x ${i.name}`).join(', '),
                price: finalTotal
            });

            const res = await fetch('/api/gumroad/dynamic-checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    storeId: resolvedStoreId,
                    storeSlug: resolvedStoreSlug,
                    storeName: propStore?.name || activeStore?.name || 'GumShop Super Store',
                    gumroadProductUrl: effectiveGumroadUrl,
                    accessToken: propStore?.gumroadToken || activeStore?.gumroadToken || persistentToken || '',
                    attribution: activeAttribution,
                    items: items.map(i => ({
                        productId: i.id,
                        name: i.name,
                        price: parseFloat(i.price || 0),
                        quantity: i.quantity,
                        variant: i.variant || '',
                        gumroadUrl: i.gumroadUrl || '',
                        storeId: i.storeId || resolvedStoreId,
                        storeSlug: i.storeSlug || resolvedStoreSlug
                    })),
                    couponCode: couponCode || (typeof window !== 'undefined' ? sessionStorage.getItem('active_coupon') : '') || '',
                    discountAmount: appliedDiscount,
                    shippingFee: shippingFee,
                    rushFee: priorityFee
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

    const displayedItemsCount = items.reduce((s, i) => s + i.quantity, 0);

    const drawerMarkup = (
        <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
                onClick={onClose}
            />

            {/* Slide Drawer */}
            <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl flex flex-col justify-between h-full z-10 overflow-hidden">
                
                {/* Header */}
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="size-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                                <ShoppingBag size={18} />
                            </div>
                            <h2 className="text-lg font-extrabold text-slate-900">Your Cart ({displayedItemsCount})</h2>
                        </div>
                        <button 
                            onClick={onClose}
                            aria-label="Close cart drawer"
                            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition outline-none focus-visible:ring-2 focus-visible:ring-slate-400 cursor-pointer"
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
                        {/* Store Scoping Banner */}
                        {otherStoresCount > 0 && !viewAllStores && (
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2 text-xs">
                                <span className="text-[11px] font-medium text-slate-600 truncate">
                                    🛒 Scoped to <strong>@{effectiveScope}</strong> ({otherStoresCount} other {otherStoresCount === 1 ? 'item' : 'items'} in cart)
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setViewAllStores(true)}
                                    className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 underline shrink-0 cursor-pointer"
                                >
                                    View all
                                </button>
                            </div>
                        )}
                        {viewAllStores && normalizedPropSlug && (
                            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-2 text-xs">
                                <span className="text-[11px] font-medium text-emerald-900 truncate">
                                    Showing all stores ({allResolvedItems.reduce((s, i) => s + i.quantity, 0)} items total)
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setViewAllStores(false)}
                                    className="text-[11px] font-bold text-slate-600 hover:text-slate-900 underline shrink-0 cursor-pointer"
                                >
                                    Filter to @{normalizedPropSlug}
                                </button>
                            </div>
                        )}

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
                                                <div className="flex items-center gap-1.5 flex-wrap mt-1">
                                                    {item.variant && (
                                                        <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-semibold rounded-md border border-slate-200">
                                                            {item.variant}
                                                        </span>
                                                    )}
                                                    {item.storeSlug && (
                                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 text-emerald-800 text-[10px] font-bold rounded-md border border-emerald-200/60">
                                                            <Store size={10} className="text-emerald-600" />
                                                            @{item.storeSlug}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => dispatch(deleteItemFromCart({ productId: item.id, itemKey: item.id }))}
                                                className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg transition outline-none focus-visible:ring-2 focus-visible:ring-rose-500 cursor-pointer"
                                                title="Remove"
                                                aria-label={`Remove ${item.name} from cart`}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                        <div className="flex items-center justify-between mt-2">
                                            <span className="text-sm font-extrabold text-slate-900">
                                                {currency}{formatPrice(Number(item.price || 0) * Number(item.quantity || 1))}
                                            </span>
                                            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
                                                <button
                                                    onClick={() => dispatch(removeFromCart({ productId: item.id, itemKey: item.id }))}
                                                    className="w-7 h-7 rounded flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 active:scale-95 transition outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer"
                                                    title="Decrease quantity"
                                                    aria-label={`Decrease quantity of ${item.name}`}
                                                >
                                                    <Minus size={13} />
                                                </button>
                                                <span className="text-xs font-bold px-1.5 min-w-5 text-center select-none">{item.quantity}</span>
                                                <button
                                                    onClick={() => dispatch(addToCart({ productId: item.id, itemKey: item.id, product: item }))}
                                                    className="w-7 h-7 rounded flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 active:scale-95 transition outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer"
                                                    title="Increase quantity"
                                                    aria-label={`Increase quantity of ${item.name}`}
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
                                                ${((parseFloat(crossSellProduct.price || 0) || 0) * 0.85).toFixed(2)}
                                            </span>
                                            <span className="text-[11px] text-slate-400 line-through">
                                                ${(parseFloat(crossSellProduct.price || 0) || 0).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const discountedPrice = Number(((parseFloat(crossSellProduct.price || 0) || 0) * 0.85).toFixed(2));
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
                                        onClick={() => { 
                                            setAppliedDiscount(0); 
                                            setCouponCode(''); 
                                            if (typeof window !== 'undefined') {
                                                sessionStorage.removeItem('active_coupon');
                                            }
                                            toast('Coupon removed', { icon: '🗑️' }); 
                                        }}
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
                                            aria-label="Promo code input"
                                            className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500/20 transition"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        aria-label="Apply promo code"
                                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-bold text-xs rounded-xl transition outline-none focus-visible:ring-2 focus-visible:ring-slate-900 cursor-pointer"
                                    >
                                        Apply
                                    </button>
                                </form>
                            )}

                            {/* Totals */}
                            <div className="space-y-2 text-xs text-slate-600">
                                {/* Priority Safe Transit Protection Checkbox */}
                                <label className={`p-2.5 rounded-xl border-2 flex items-center justify-between cursor-pointer transition select-none ${
                                    hasPriorityProtection ? 'border-amber-300 bg-amber-50/70' : 'border-slate-200 bg-white hover:border-slate-300'
                                }`}>
                                    <div className="flex items-center gap-2">
                                        <input 
                                            type="checkbox"
                                            checked={hasPriorityProtection}
                                            onChange={(e) => setHasPriorityProtection(e.target.checked)}
                                            className="size-4 accent-amber-500 rounded cursor-pointer"
                                        />
                                        <div className="text-[11px] leading-tight">
                                            <span className="font-bold text-slate-900 flex items-center gap-1">
                                                <ShieldCheck size={13} className="text-amber-600" />
                                                Priority Dispatch & Protection
                                            </span>
                                            <span className="text-slate-500 text-[10px]">Guaranteed safe delivery, lost/damaged reship</span>
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold text-slate-900 shrink-0">+$4.99</span>
                                </label>

                                <div className="space-y-1.5 pt-1">
                                    <div className="flex justify-between">
                                        <span>Subtotal</span>
                                        <span className="font-bold text-slate-900">${formatPrice(subtotal)}</span>
                                    </div>
                                    {appliedDiscount > 0 && (
                                        <div className="flex justify-between text-emerald-600 font-bold">
                                            <span>Discount</span>
                                            <span>-${formatPrice(appliedDiscount)}</span>
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
                                    {hasPriorityProtection && items.length > 0 && (
                                        <div className="flex justify-between text-amber-800 font-medium">
                                            <span className="flex items-center gap-1">⚡ Priority Dispatch</span>
                                            <span className="font-bold">+$4.99</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                                        <span>Total</span>
                                        <span className="text-emerald-600">${formatPrice(finalTotal)}</span>
                                    </div>
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
                                    <span>{isCheckingOut ? 'Opening Secure Checkout...' : `⚡ Buy Now • $${finalTotal.toFixed(2)}`}</span>
                                </button>
                                <Link
                                    href="/cart"
                                    onClick={onClose}
                                    className="w-full py-2.5 text-center text-xs font-bold text-slate-500 hover:text-slate-800 block transition rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
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

            {/* In-Frame Checkout Modal */}
            <GumroadIframeModal
                isOpen={checkoutModal.isOpen}
                onClose={() => setCheckoutModal({ isOpen: false, gumroadUrl: '', orderSessionId: '' })}
                items={items}
                total={finalTotal}
                shippingFee={shippingFee}
                rushFee={priorityFee}
                gumroadUrl={checkoutModal.gumroadUrl}
                orderSessionId={checkoutModal.orderSessionId}
                storeId={items[0]?.storeId || (effectiveScope !== 'all' ? `store_${effectiveScope}` : 'store_default')}
                storeSlug={items[0]?.storeSlug || (effectiveScope !== 'all' ? effectiveScope : (items[0]?.storeId ? String(items[0].storeId).replace(/^store_/, '') : ''))}
            />
        </div>
    );

    if (typeof document !== 'undefined' && document.body) {
        return createPortal(drawerMarkup, document.body);
    }
    return drawerMarkup;
}
