'use client'

import React, { useState, useEffect } from 'react';
import { 
    X, 
    ShieldCheck, 
    Lock, 
    ShoppingBag, 
    AlertCircle,
    ArrowRight,
    ArrowLeft,
    CheckCircle2,
    Truck,
    User,
    Mail,
    Phone,
    MapPin,
    ExternalLink,
    Sparkles
} from 'lucide-react';
import { getActiveStoreSync } from '@/lib/activeStore';
import { getSafeImageUrl, handleImageError } from '@/lib/imageUtils';
import toast from 'react-hot-toast';

export default function GumroadIframeModal({
    isOpen,
    onClose,
    product,
    items = [],
    total,
    shippingFee = 0,
    gumroadUrl,
    orderSessionId
}) {
    // 2-Step Checkout State: 'address' -> 'payment'
    const [checkoutStep, setCheckoutStep] = useState('address'); // 'address' | 'payment'
    const [hasOrderBump, setHasOrderBump] = useState(false);
    const [isIframeLoading, setIsIframeLoading] = useState(true);
    const [iframeFailed, setIframeFailed] = useState(false);
    const [customLinkInput, setCustomLinkInput] = useState('');
    const [isSavingLink, setIsSavingLink] = useState(false);

    // Customer Information for Pre-fill and Receipts
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zip: '',
        country: 'United States'
    });

    // Prefill form from localStorage on open
    useEffect(() => {
        if (isOpen && typeof window !== 'undefined') {
            try {
                const savedEmail = localStorage.getItem('gumshop_customer_email') || '';
                const savedName = localStorage.getItem('gumshop_customer_name') || '';
                const savedPhone = localStorage.getItem('gumshop_customer_phone') || '';
                const savedAddress = localStorage.getItem('gumshop_customer_address') || '';
                const savedCity = localStorage.getItem('gumshop_customer_city') || '';
                const savedState = localStorage.getItem('gumshop_customer_state') || '';
                const savedZip = localStorage.getItem('gumshop_customer_zip') || '';
                const savedCountry = localStorage.getItem('gumshop_customer_country') || 'United States';

                if (savedEmail || savedName) {
                    setFormData(prev => ({
                        ...prev,
                        email: savedEmail || prev.email,
                        name: savedName || prev.name,
                        phone: savedPhone || prev.phone,
                        address: savedAddress || prev.address,
                        city: savedCity || prev.city,
                        state: savedState || prev.state,
                        zip: savedZip || prev.zip,
                        country: savedCountry || prev.country
                    }));
                }
            } catch (e) {}
            // Reset to address step when opened
            setCheckoutStep('address');
            setIsIframeLoading(true);
            setIframeFailed(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    // Line items list
    const orderItems = items.length > 0 ? items : (product ? [{
        id: product.id,
        name: product.name,
        price: parseFloat(product.price || 0),
        quantity: 1,
        image: product.image || (product.images && product.images[0]) || '',
        gumroadUrl: product.gumroadUrl || ''
    }] : []);

    const alreadyHasRush = orderItems.some(i => 
        i.id === 'addon_priority_rush_insurance' || 
        i.productId === 'addon_priority_rush_insurance' ||
        (i.name && (i.name.toLowerCase().includes('priority rush') || i.name.toLowerCase().includes('rush processing')))
    );

    const itemsSubtotal = orderItems.reduce((acc, item) => acc + (parseFloat(item.price || 0) * (item.quantity || 1)), 0);
    const baseOrderTotal = total !== undefined 
        ? parseFloat(total) 
        : Math.round((itemsSubtotal + parseFloat(shippingFee || 0)) * 100) / 100;
    const orderTotal = Math.round((baseOrderTotal + (!alreadyHasRush && hasOrderBump ? 4.99 : 0)) * 100) / 100;

    const activeStore = getActiveStoreSync();
    const storeName = activeStore?.name || product?.storeName || 'GumShop Store';
    const storeId = activeStore?.id || product?.storeId || 'store_default';

    // Resolve base Gumroad URL
    const persistentUrl = typeof window !== 'undefined' 
        ? (localStorage.getItem('gumshop_gumroad_url') || localStorage.getItem('gumroad_product_url') || '') 
        : '';
    const itemWithUrl = orderItems.find(i => i.gumroadUrl);
    
    let baseGumroadUrl = (
        gumroadUrl || 
        product?.gumroadUrl || 
        itemWithUrl?.gumroadUrl || 
        activeStore?.gumroadProductUrl || 
        activeStore?.gumroadUrl || 
        persistentUrl || 
        'https://gumroad.com/l/gumshop-checkout'
    ).trim();

    // Clean out known mock placeholders and default to official universal checkout gateway
    if (!baseGumroadUrl || baseGumroadUrl.includes('gumroad.com/l/gumshop-order') || baseGumroadUrl.endsWith('/gumshop-order')) {
        baseGumroadUrl = 'https://gumroad.com/l/gumshop-checkout';
    }

    // Build the final checkout URL with all real payment and redirect parameters
    const sid = orderSessionId || `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    let finalCheckoutUrl = '';

    if (baseGumroadUrl) {
        try {
            const raw = baseGumroadUrl.startsWith('http') ? baseGumroadUrl : `https://${baseGumroadUrl}`;
            const urlObj = new URL(raw);
            urlObj.searchParams.set('wanted', 'true');
            if (orderTotal > 0) {
                urlObj.searchParams.set('price', orderTotal.toFixed(2));
            }
            if (shippingFee > 0) {
                urlObj.searchParams.set('shipping_fee', parseFloat(shippingFee).toFixed(2));
            }
            if (formData.email) {
                urlObj.searchParams.set('email', formData.email.trim());
            }
            if (formData.name) {
                urlObj.searchParams.set('full_name', formData.name.trim());
            }
            urlObj.searchParams.set('order_id', sid);
            urlObj.searchParams.set('store_id', storeId);
            
            const itemsSummary = orderItems.map(i => `${i.quantity || 1}x ${i.name}`).join(', ');
            urlObj.searchParams.set('items', itemsSummary);

            if (typeof window !== 'undefined') {
                const activeCoupon = sessionStorage.getItem('active_coupon');
                if (activeCoupon) {
                    urlObj.searchParams.set('offer_code', activeCoupon.trim());
                }
                const origin = window.location.origin;
                // Redirect user to thank-you ONLY AFTER Gumroad completes actual payment
                const thankYouRedirect = `${origin}/thank-you?orderId=${encodeURIComponent(sid)}&store=${encodeURIComponent(storeId)}&total=${orderTotal.toFixed(2)}`;
                urlObj.searchParams.set('redirect_url', thankYouRedirect);
            }

            finalCheckoutUrl = urlObj.href;
        } catch {
            finalCheckoutUrl = baseGumroadUrl;
        }
    }

    const saveCustomerInfo = () => {
        if (typeof window !== 'undefined') {
            try {
                if (formData.email) localStorage.setItem('gumshop_customer_email', formData.email.trim());
                if (formData.name) localStorage.setItem('gumshop_customer_name', formData.name.trim());
                if (formData.phone) localStorage.setItem('gumshop_customer_phone', formData.phone.trim());
                if (formData.address) localStorage.setItem('gumshop_customer_address', formData.address.trim());
                if (formData.city) localStorage.setItem('gumshop_customer_city', formData.city.trim());
                if (formData.state) localStorage.setItem('gumshop_customer_state', formData.state.trim());
                if (formData.zip) localStorage.setItem('gumshop_customer_zip', formData.zip.trim());
                if (formData.country) localStorage.setItem('gumshop_customer_country', formData.country.trim());
            } catch {}
        }
    };

    // Step 1 -> Step 2 Validation Handler
    const handleProceedToPayment = (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            toast.error("Please enter your full name");
            return;
        }
        if (!formData.email.trim() || !formData.email.includes('@')) {
            toast.error("Please enter a valid email address");
            return;
        }
        if (!formData.address.trim()) {
            toast.error("Please enter your shipping address");
            return;
        }

        saveCustomerInfo();
        setCheckoutStep('payment');
        setIsIframeLoading(true);
        setIframeFailed(false);
    };

    // Quick save Gumroad product link if store didn't have one configured
    const handleSaveCustomLink = (e) => {
        e.preventDefault();
        if (!customLinkInput.trim() || !customLinkInput.includes('gumroad.com')) {
            toast.error("Please enter a valid Gumroad product link (e.g., https://gumroad.com/l/your-product)");
            return;
        }

        setIsSavingLink(true);
        try {
            const clean = customLinkInput.trim();
            if (typeof window !== 'undefined') {
                localStorage.setItem('gumshop_gumroad_url', clean);
                localStorage.setItem('gumroad_product_url', clean);
                const active = getActiveStoreSync();
                if (active) {
                    active.gumroadProductUrl = clean;
                    active.gumroadUrl = clean;
                    localStorage.setItem(`store_${active.username || active.id}`, JSON.stringify(active));
                    localStorage.setItem(`cloned_store_${active.username || active.id}`, JSON.stringify(active));
                }
            }

            toast.success("Gumroad link connected! Loading payment...");
            setCustomLinkInput('');
        } catch {
            toast.error("Failed to save Gumroad link");
        } finally {
            setIsSavingLink(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in">
            <div 
                className="bg-white rounded-3xl shadow-2xl w-full max-w-xl border-2 border-black overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Top Header */}
                <div className="p-4 sm:px-6 bg-black text-white flex items-center justify-between shrink-0 border-b border-black">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 font-black tracking-tight text-lg text-white">
                            <div className="size-7 rounded-full bg-[#ff90e8] text-black flex items-center justify-center font-black text-base shadow-xs">
                                <span>g</span>
                            </div>
                            <span className="font-extrabold text-white text-base tracking-tighter">gumroad</span>
                        </div>

                        <div className="h-4 w-px bg-slate-700 mx-1 hidden sm:block" />

                        <div className="flex items-center gap-1.5 bg-[#ff90e8]/20 border border-[#ff90e8]/40 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-[#ff90e8]">
                            <Lock size={10} />
                            <span>{checkoutStep === 'address' ? 'Step 1: Customer Details' : 'Step 2: In-Frame Payment'}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {checkoutStep === 'payment' && (
                            <button
                                type="button"
                                onClick={() => setCheckoutStep('address')}
                                className="text-[11px] text-slate-300 hover:text-white flex items-center gap-1 bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-lg transition cursor-pointer"
                                title="Edit details"
                            >
                                <ArrowLeft size={11} />
                                <span>Edit Details</span>
                            </button>
                        )}
                        {checkoutStep === 'payment' && finalCheckoutUrl && (
                            <a
                                href={finalCheckoutUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] text-slate-300 hover:text-white flex items-center gap-1 bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-lg transition cursor-pointer"
                                title="Open checkout in new window"
                            >
                                <ExternalLink size={11} />
                                <span className="hidden sm:inline">New Tab</span>
                            </a>
                        )}
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition cursor-pointer"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">

                    {/* Order Summary Ribbon */}
                    <div className="p-3.5 rounded-2xl bg-[#ff90e8]/10 border-2 border-black flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                            {orderItems[0]?.image ? (
                                <img 
                                    src={getSafeImageUrl(orderItems[0].image)} 
                                    alt={orderItems[0].name || "Order Item"} 
                                    onError={(e) => handleImageError(e, 'product')}
                                    className="size-11 rounded-xl object-cover border-2 border-black shrink-0 bg-white shadow-xs" 
                                />
                            ) : (
                                <div className="size-11 rounded-xl bg-black text-[#ff90e8] flex items-center justify-center shrink-0 border-2 border-black">
                                    <ShoppingBag size={18} />
                                </div>
                            )}
                            <div className="min-w-0">
                                <h4 className="font-black text-xs sm:text-sm text-black truncate">
                                    {orderItems.length === 1 
                                        ? orderItems[0].name 
                                        : `${orderItems[0]?.name || 'Item'} + ${orderItems.length - 1} more`}
                                </h4>
                                <p className="text-[11px] text-slate-600 font-semibold truncate">
                                    Store: <span className="text-black font-bold">{storeName}</span>
                                </p>
                            </div>
                        </div>

                        <div className="text-right shrink-0">
                            <span className="text-[10px] uppercase font-bold text-slate-500 block">Total:</span>
                            <div className="text-xl font-black text-black tracking-tight leading-none">
                                ${orderTotal.toFixed(2)}
                            </div>
                        </div>
                    </div>

                    {/* ─── STEP 1: MIDDLE PAGE TO COLLECT ADDRESS & DATA ─── */}
                    {checkoutStep === 'address' && (
                        <form onSubmit={handleProceedToPayment} className="space-y-4">
                            <div className="border-b border-slate-200 pb-2">
                                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                                    <User size={15} className="text-black" />
                                    <span>Customer & Shipping Information</span>
                                </h3>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                    Please enter your delivery details before proceeding to payment.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                        Full Name <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <User size={13} className="absolute left-3 top-3 text-slate-400" />
                                        <input
                                            type="text"
                                            required
                                            placeholder="John Doe"
                                            value={formData.name}
                                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                            className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 outline-none focus:border-black focus:bg-white transition"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                        Email Address <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Mail size={13} className="absolute left-3 top-3 text-slate-400" />
                                        <input
                                            type="email"
                                            required
                                            placeholder="john@example.com"
                                            value={formData.email}
                                            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                            className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 outline-none focus:border-black focus:bg-white transition"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                    Phone Number (Optional)
                                </label>
                                <div className="relative">
                                    <Phone size={13} className="absolute left-3 top-3 text-slate-400" />
                                    <input
                                        type="tel"
                                        placeholder="+1 (555) 000-0000"
                                        value={formData.phone}
                                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                        className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 outline-none focus:border-black focus:bg-white transition"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                    Street Address <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                    <MapPin size={13} className="absolute left-3 top-3 text-slate-400" />
                                    <input
                                        type="text"
                                        required
                                        placeholder="123 Main St, Apt 4B"
                                        value={formData.address}
                                        onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                                        className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 outline-none focus:border-black focus:bg-white transition"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-700 mb-1">City</label>
                                    <input
                                        type="text"
                                        placeholder="Austin"
                                        value={formData.city}
                                        onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 outline-none focus:border-black focus:bg-white transition"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-slate-700 mb-1">State / Prov</label>
                                    <input
                                        type="text"
                                        placeholder="TX"
                                        value={formData.state}
                                        onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 outline-none focus:border-black focus:bg-white transition"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Postal / ZIP</label>
                                    <input
                                        type="text"
                                        placeholder="78701"
                                        value={formData.zip}
                                        onChange={(e) => setFormData(prev => ({ ...prev, zip: e.target.value }))}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 outline-none focus:border-black focus:bg-white transition"
                                    />
                                </div>
                            </div>

                            {/* ⚡ High-Converting 1-Click Priority Express Shipping Bump Checkbox */}
                            <div className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${hasOrderBump ? 'bg-amber-50/90 border-amber-400 shadow-sm ring-2 ring-amber-400/20' : 'bg-slate-50 border-slate-200 hover:border-slate-300'}`}>
                                <label className="flex items-start gap-3 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={hasOrderBump}
                                        onChange={(e) => setHasOrderBump(e.target.checked)}
                                        className="mt-0.5 size-4 rounded accent-black text-black cursor-pointer"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className="text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full">
                                                🚀 PRIORITY DISPATCH & SAFE TRANSIT
                                            </span>
                                            <span className="text-xs font-bold text-slate-900">
                                                Upgrade to Priority Express Courier Shipping & Transit Insurance
                                            </span>
                                            <span className="text-xs font-black text-emerald-600">
                                                +$4.99 <span className="line-through text-slate-400 font-normal text-[11px]">$12.00</span>
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                                            Skip the fulfillment queue! Your parcel is prioritized at our warehouse, packed with heavy-duty transit protection, and dispatched within 24 hours with real-time courier tracking sent via SMS & email.
                                        </p>
                                    </div>
                                </label>
                            </div>

                            <button
                                type="submit"
                                className="w-full mt-2 py-3.5 px-6 rounded-2xl bg-black hover:bg-slate-900 active:scale-98 text-white font-extrabold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <span>Continue to Payment (${orderTotal.toFixed(2)})</span>
                                <ArrowRight size={16} />
                            </button>
                        </form>
                    )}

                    {/* ─── STEP 2: CLEAN DIRECT IN-FRAME GUMROAD CHECKOUT ─── */}
                    {checkoutStep === 'payment' && (
                        <div className="space-y-3">
                            {/* Shipping to Summary Ribbon */}
                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs text-slate-700">
                                <div className="flex items-center gap-2 min-w-0">
                                    <Truck size={14} className="text-emerald-600 shrink-0" />
                                    <span className="truncate">
                                        Shipping to: <strong className="text-black">{formData.name}</strong> • {formData.address}, {formData.city || formData.country}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setCheckoutStep('address')}
                                    className="text-[10px] font-bold text-slate-500 hover:text-black underline shrink-0 cursor-pointer"
                                >
                                    Change
                                </button>
                            </div>

                            {finalCheckoutUrl ? (
                                /* Direct Inframe Window */
                                <div className="relative rounded-2xl border-2 border-black overflow-hidden bg-white min-h-[440px] flex flex-col shadow-inner">
                                    {isIframeLoading && !iframeFailed && (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10 p-6 text-center">
                                            <div className="size-8 border-3 border-black/20 border-t-black rounded-full animate-spin mb-3" />
                                            <p className="text-xs font-bold text-black">Opening Secure Payment Terminal...</p>
                                            <p className="text-[11px] text-slate-500 mt-1">Direct Gumroad Session for ${orderTotal.toFixed(2)}</p>
                                            <a
                                                href={finalCheckoutUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="mt-3 text-[11px] font-bold text-slate-700 hover:text-black underline inline-flex items-center gap-1"
                                            >
                                                <span>Opening slow or on mobile Safari? Tap here</span>
                                                <ExternalLink size={11} />
                                            </a>
                                        </div>
                                    )}

                                    {iframeFailed ? (
                                        <div className="p-8 text-center space-y-3 my-auto">
                                            <AlertCircle size={32} className="mx-auto text-amber-500" />
                                            <h5 className="font-black text-sm text-black">Payment Terminal Window Required</h5>
                                            <p className="text-xs text-slate-600 max-w-sm mx-auto">
                                                Gumroad security policies require this transaction to open in an official window.
                                            </p>
                                            <a
                                                href={finalCheckoutUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="py-3 px-6 bg-black hover:bg-slate-900 text-white rounded-xl font-bold text-xs inline-flex items-center gap-2 cursor-pointer transition shadow-md"
                                            >
                                                <ExternalLink size={14} />
                                                <span>Complete Payment on Gumroad</span>
                                            </a>
                                        </div>
                                    ) : (
                                        <iframe
                                            src={finalCheckoutUrl}
                                            className="w-full h-[470px] border-0"
                                            onLoad={() => setIsIframeLoading(false)}
                                            onError={() => {
                                                setIsIframeLoading(false);
                                                setIframeFailed(true);
                                            }}
                                            allow="payment *"
                                            title="Gumroad Checkout"
                                        />
                                    )}
                                </div>
                            ) : (
                                /* Secure connecting fallback state */
                                <div className="p-8 text-center space-y-3 bg-white rounded-2xl border-2 border-black my-auto">
                                    <div className="size-8 border-3 border-black/20 border-t-black rounded-full animate-spin mx-auto mb-2" />
                                    <h5 className="font-black text-sm text-black">Opening Secure Payment Terminal...</h5>
                                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                                        Preparing encrypted Gumroad checkout window for ${orderTotal.toFixed(2)}.
                                    </p>
                                    <a
                                        href={`https://gumroad.com/l/gumshop-checkout?wanted=true&price=${orderTotal.toFixed(2)}&order_id=${encodeURIComponent(sid)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="py-2.5 px-5 bg-black hover:bg-slate-900 text-white rounded-xl font-bold text-xs inline-flex items-center gap-2 cursor-pointer transition shadow-md mt-2"
                                    >
                                        <ExternalLink size={13} />
                                        <span>Proceed to Gumroad Checkout</span>
                                    </a>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Trust Guarantees */}
                    <div className="p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-emerald-950">
                        <div className="flex items-center gap-2">
                            <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
                            <span className="font-bold">🔒 100% Encrypted Checkout • Verified Merchant Protection via Gumroad</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-600 font-semibold text-[10px] sm:self-center">
                            <span className="flex items-center gap-1">
                                <Lock size={11} className="text-emerald-700" />
                                <span>256-bit SSL</span>
                            </span>
                            <span>•</span>
                            <span>PCI-DSS Tier-1</span>
                            <span>•</span>
                            <span className="text-emerald-700 font-bold">Instant Receipt</span>
                        </div>
                    </div>

                </div>

                {/* Modal Bottom Footer */}
                <div className="p-3 bg-black text-white flex items-center justify-between text-[11px] px-4 sm:px-6 shrink-0 border-t border-black">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-[#ff90e8]">gumroad</span>
                        <span className="text-slate-400">• Official Checkout Engine</span>
                    </div>
                    <span className="text-slate-400">Zero fake checkout • Verified payments only</span>
                </div>
            </div>
        </div>
    );
}
