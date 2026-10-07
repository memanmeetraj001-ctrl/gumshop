'use client'
import { PlusIcon, SquarePenIcon, XIcon, Zap, ShieldCheck, Lock, CreditCard } from 'lucide-react';
import React, { useState, useEffect } from 'react'
import AddressModal from './AddressModal';
import { useSelector, useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { createOrder, getCoupon } from '@/lib/firebaseDb';
import { clearCart } from '@/lib/features/cart/cartSlice';
import { fetchAddresses } from '@/lib/features/address/addressSlice';
import { getActiveStoreSync } from '@/lib/activeStore';
import GumroadIframeModal from './GumroadIframeModal';

const OrderSummary = ({ totalPrice, items }) => {
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$';
    const { user } = useAuth();
    const router = useRouter();
    const dispatch = useDispatch();

    const addressList = useSelector(state => state.address.list);

    const [paymentMethod, setPaymentMethod] = useState('GUMROAD');
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [couponCodeInput, setCouponCodeInput] = useState('');
    const [coupon, setCoupon] = useState('');
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [checkoutModal, setCheckoutModal] = useState({
        isOpen: false,
        gumroadUrl: '',
        orderSessionId: ''
    });

    useEffect(() => {
        if (user) {
            dispatch(fetchAddresses(user.uid));
        }
    }, [user, dispatch]);

    useEffect(() => {
        if (addressList && addressList.length > 0 && !selectedAddress) {
            setSelectedAddress(addressList[0]);
        }
    }, [addressList, selectedAddress]);

    const handleCouponCode = async (event) => {
        event.preventDefault();
        try {
            const couponData = await getCoupon(couponCodeInput.trim().toUpperCase());
            if (couponData && (!couponData.expiresAt || new Date(couponData.expiresAt) > new Date())) {
                if (couponData.minSpend && totalPrice < Number(couponData.minSpend)) {
                    return toast.error(`Minimum cart subtotal of $${couponData.minSpend} required for coupon ${couponData.code}`);
                }
                if (couponData.productId && couponData.productId !== 'ALL') {
                    if (!items.some(item => item.id === couponData.productId)) {
                        return toast.error("This coupon is for a specific product not currently in your cart");
                    }
                } else if (couponData.storeId) {
                    const hasStoreProduct = items.some(item => !item.storeId || item.storeId === couponData.storeId);
                    if (!hasStoreProduct) {
                        return toast.error("This coupon does not apply to products in your cart");
                    }
                }

                setCoupon(couponData);
                const discountLabel = couponData.type === 'fixed' 
                    ? `$${couponData.discount} off` 
                    : couponData.type === 'shipping' 
                        ? 'Free Shipping' 
                        : `${couponData.discount}% off`;
                toast.success(`Coupon applied! ${discountLabel} 🎉`);
            } else {
                toast.error("Invalid or expired coupon");
            }
        } catch (err) {
            toast.error("Error checking coupon");
        }
    }

    const calculateDiscount = () => {
        if (!coupon) return 0;
        if (coupon.type === 'fixed') {
            return Math.min(totalPrice, Number(coupon.discount || 0));
        }
        if (coupon.productId && coupon.productId !== 'ALL') {
            const applicableTotal = items.filter(i => i.id === coupon.productId).reduce((acc, item) => acc + item.price * item.quantity, 0);
            return (Number(coupon.discount) / 100) * applicableTotal;
        }
        if (coupon.storeId) {
            const applicableTotal = items.filter(i => !i.storeId || i.storeId === coupon.storeId).reduce((acc, item) => acc + item.price * item.quantity, 0);
            return (Number(coupon.discount) / 100) * applicableTotal;
        }
        return (Number(coupon.discount) / 100) * totalPrice;
    }

    // ⚡ GumShop White-Labeled Dynamic Gumroad In-Page Checkout
    const handleDynamicCheckout = async () => {
        setIsCheckingOut(true);
        const fallbackSessionId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        try {
            const discountAmount = calculateDiscount();
            const finalTotal = totalPrice - discountAmount;
            const activeStore = getActiveStoreSync();
            const storeSlug = activeStore?.username || (typeof window !== 'undefined' ? (window.location.pathname.match(/\/shop\/([^\/]+)/)?.[1] || '') : '');
            const storeScopedUrl = (typeof window !== 'undefined' && storeSlug) ? (localStorage.getItem(`gumroad_url_${storeSlug}`) || localStorage.getItem(`gumroad_product_url_${storeSlug}`)) : '';
            const persistentUrl = activeStore?.gumroadProductUrl || storeScopedUrl || (typeof window !== 'undefined' ? (localStorage.getItem('gumshop_gumroad_url') || localStorage.getItem('gumroad_product_url') || '') : '');
            const storeScopedToken = (typeof window !== 'undefined' && storeSlug) ? localStorage.getItem(`gumroad_token_${storeSlug}`) : '';
            const persistentToken = activeStore?.gumroadToken || storeScopedToken || (typeof window !== 'undefined' ? (localStorage.getItem('gumshop_gumroad_token') || localStorage.getItem('gumroad_access_token') || '') : '');

            const res = await fetch('/api/gumroad/dynamic-checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    storeId: activeStore?.id || items[0]?.storeId || 'store_default',
                    storeName: activeStore?.name || 'GumShop Order',
                    gumroadProductUrl: activeStore?.gumroadProductUrl || persistentUrl || '',
                    accessToken: activeStore?.gumroadToken || persistentToken || '',
                    items: items.map(item => ({
                        productId: item.id,
                        name: item.name,
                        price: item.price,
                        quantity: item.quantity
                    })),
                    discountAmount: discountAmount,
                    shippingFee: 0,
                    customer: {
                        address: selectedAddress?.street || '',
                        city: selectedAddress?.city || '',
                        postalCode: selectedAddress?.zip || '',
                        country: selectedAddress?.country || 'US'
                    }
                })
            });

            const data = await res.json().catch(() => ({}));

            setCheckoutModal({
                isOpen: true,
                gumroadUrl: data.checkoutUrl || '',
                orderSessionId: data.orderSessionId || fallbackSessionId
            });
        } catch (err) {
            console.error('Checkout error:', err);
            setCheckoutModal({
                isOpen: true,
                gumroadUrl: '',
                orderSessionId: fallbackSessionId
            });
        } finally {
            setIsCheckingOut(false);
        }
    };

    const handlePlaceOrder = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        return handleDynamicCheckout();
    };

    return (
        <div className='w-full max-w-lg lg:max-w-[360px] bg-white border border-slate-200/90 text-slate-700 text-sm rounded-3xl p-6 sm:p-7 shadow-xl'>
            <h2 className='text-lg font-extrabold text-slate-900'>Order Summary</h2>

            {/* Price Calculations */}
            <div className='py-4 border-b border-slate-100 space-y-2.5 text-xs'>
                <div className='flex justify-between text-slate-600'>
                    <span>Subtotal:</span>
                    <span className="font-semibold text-slate-900">{currency}{totalPrice.toFixed(2)}</span>
                </div>
                <div className='flex justify-between text-slate-600'>
                    <span>Express Shipping:</span>
                    <span className="font-bold text-emerald-600">FREE</span>
                </div>
                {coupon && (
                    <div className='flex justify-between text-emerald-600 font-semibold'>
                        <span>Coupon ({coupon.code}):</span>
                        <span>-{currency}{calculateDiscount().toFixed(2)}</span>
                    </div>
                )}
            </div>

            {/* Coupon Code Input */}
            <div className="py-4 border-b border-slate-100">
                {!coupon ? (
                    <form onSubmit={e => toast.promise(handleCouponCode(e), { loading: 'Checking coupon...' })} className='flex gap-2'>
                        <input 
                            onChange={(e) => setCouponCodeInput(e.target.value)} 
                            value={couponCodeInput} 
                            type="text" 
                            placeholder='Promo Code (e.g. SAVE10)' 
                            className='border border-slate-200 uppercase px-3 py-2 text-xs rounded-xl w-full outline-none focus:border-emerald-500 font-mono transition' 
                        />
                        <button className='bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition'>
                            Apply
                        </button>
                    </form>
                ) : (
                    <div className='w-full flex items-center justify-between text-xs p-2.5 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200'>
                        <div className="flex items-center gap-1.5 font-bold font-mono">
                            <span>{coupon.code.toUpperCase()}</span>
                            <span className="text-[10px] text-emerald-600">({coupon.discount}% off)</span>
                        </div>
                        <XIcon size={16} onClick={() => setCoupon('')} className='hover:text-red-700 transition cursor-pointer' />
                    </div>
                )}
            </div>

            {/* Delivery Address Selector */}
            <div className="py-3 border-b border-slate-100">
                <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-bold text-slate-700">Delivery Address:</span>
                    <button 
                        type="button" 
                        onClick={() => setShowAddressModal(true)} 
                        className="text-emerald-600 hover:text-emerald-700 font-bold hover:underline"
                    >
                        {selectedAddress ? "Change" : "+ Add Address"}
                    </button>
                </div>
                {selectedAddress ? (
                    <div className="text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-slate-600">
                        <p className="font-semibold text-slate-800">{selectedAddress.name || 'Verified Customer'}</p>
                        <p>{selectedAddress.street}, {selectedAddress.city} {selectedAddress.zip}</p>
                    </div>
                ) : (
                    <p className="text-[11px] text-slate-400">
                        Express shipping destination (Optional — auto-filled at checkout)
                    </p>
                )}
            </div>

            {/* Total */}
            <div className='flex justify-between items-center py-4'>
                <span className="text-sm font-semibold text-slate-700">Total:</span>
                <span className='text-2xl font-black text-slate-900'>{currency}{(totalPrice - calculateDiscount()).toFixed(2)}</span>
            </div>

            {/* ⚡ Primary White-Labeled Instant Checkout Button */}
            <button 
                onClick={handleDynamicCheckout}
                disabled={isCheckingOut}
                className='w-full bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-extrabold py-3.5 px-4 rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50'
            >
                <Zap size={18} className="fill-white" />
                <span>{isCheckingOut ? "Loading Checkout..." : "⚡ Buy Now"}</span>
            </button>

            {/* Trust Guarantee Badges */}
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-around text-[10px] text-slate-400 font-medium text-center">
                <div className="flex flex-col items-center gap-1">
                    <Lock size={14} className="text-emerald-600" />
                    <span>256-Bit SSL</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                    <ShieldCheck size={14} className="text-emerald-600" />
                    <span>Buyer Protection</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                    <CreditCard size={14} className="text-emerald-600" />
                    <span>Cards & Apple Pay</span>
                </div>
            </div>

            {showAddressModal && <AddressModal setShowAddressModal={setShowAddressModal} />}

            {/* Gumroad Checkout In-Frame Modal */}
            <GumroadIframeModal
                isOpen={checkoutModal.isOpen}
                onClose={() => setCheckoutModal({ isOpen: false, gumroadUrl: '', orderSessionId: '' })}
                items={items.map(item => ({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    image: item.images?.[0] || item.image
                }))}
                total={totalPrice - calculateDiscount()}
                gumroadUrl={checkoutModal.gumroadUrl}
                orderSessionId={checkoutModal.orderSessionId}
            />
        </div>
    )
}

export default OrderSummary