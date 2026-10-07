'use client'
import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
    CheckCircle2, 
    ArrowLeft, 
    Package, 
    Printer, 
    Clock, 
    ShieldCheck, 
    Zap, 
    ExternalLink, 
    ShoppingBag, 
    Copy, 
    Mail, 
    MapPin, 
    AlertCircle,
    RefreshCw,
    XCircle,
    Sparkles,
    Share2
} from 'lucide-react';
import toast from 'react-hot-toast';

function ThankYouContent() {
    const searchParams = useSearchParams();
    const orderIdParam = searchParams.get('orderId') || searchParams.get('order_id') || searchParams.get('sale_id') || searchParams.get('order_number') || '';
    const storeSlugParam = searchParams.get('storeSlug') || searchParams.get('store') || searchParams.get('shop') || '';
    const resolvedStoreSlug = (storeSlugParam || (typeof window !== 'undefined' ? localStorage.getItem('active_store_slug') : '') || '').replace(/^store_/, '');
    const storeSlug = resolvedStoreSlug;
    const returnStoreUrl = resolvedStoreSlug ? `/shop/${encodeURIComponent(resolvedStoreSlug)}` : '/';

    // Payment Verification State Machine
    // States: 'VERIFYING' | 'SUCCESS' | 'PENDING' | 'FAILED' | 'NOT_FOUND'
    const [verificationState, setVerificationState] = useState('VERIFYING');
    const [order, setOrder] = useState(null);
    const [statusMessage, setStatusMessage] = useState('Verifying your payment with Gumroad servers...');
    const [isReverifying, setIsReverifying] = useState(false);
    const [copied, setCopied] = useState(false);

    const verifyOrderOnServer = async (orderId, storeId) => {
        if (!orderId) {
            setVerificationState('NOT_FOUND');
            setStatusMessage('No order ID provided. Directly accessing this page does not confirm a payment.');
            return;
        }

        try {
            const res = await fetch(`/api/gumroad/verify-order?orderId=${encodeURIComponent(orderId)}&storeId=${encodeURIComponent(storeId || '')}`);
            const data = await res.json().catch(() => ({}));

            if (data.verified && data.paymentStatus === 'PAID') {
                setVerificationState('SUCCESS');
                setOrder(data.order);
                setStatusMessage('Payment verified and confirmed!');
            } else if (data.paymentStatus === 'VERIFICATION_PENDING') {
                setVerificationState('PENDING');
                setOrder(data.order || null);
                setStatusMessage(data.message || 'We are still awaiting payment confirmation from Gumroad. Please check again shortly.');
            } else if (data.paymentStatus === 'NOT_FOUND') {
                setVerificationState('NOT_FOUND');
                setOrder(null);
                setStatusMessage('No transaction could be verified for this reference ID.');
            } else {
                setVerificationState('FAILED');
                setOrder(data.order || null);
                setStatusMessage(data.message || 'Payment could not be verified.');
            }
        } catch (err) {
            console.error('Verification error:', err);
            setVerificationState('PENDING');
            setStatusMessage('Network timeout contacting verification service. Please click Re-verify.');
        }
    };

    useEffect(() => {
        const cleanId = orderIdParam.trim();
        verifyOrderOnServer(cleanId, storeSlug);
    }, [orderIdParam, storeSlug]);

    const handleReverify = async () => {
        setIsReverifying(true);
        const cleanId = orderIdParam.trim();
        await verifyOrderOnServer(cleanId, storeSlug);
        setIsReverifying(false);
        toast.success("Verification refreshed!");
    };

    const handleCopyOrderId = () => {
        const idToCopy = order?.id || order?.orderId || orderIdParam;
        if (idToCopy) {
            navigator.clipboard.writeText(idToCopy);
            setCopied(true);
            toast.success("Order ID copied to clipboard!");
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handlePrint = () => {
        if (typeof window !== 'undefined') window.print();
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 py-10 px-4 sm:px-6 font-sans">
            <div className="max-w-2xl mx-auto space-y-6">

                {/* Return to Storefront Header */}
                <div className="flex items-center justify-between">
                    <Link
                        href={returnStoreUrl}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-black transition p-2 rounded-xl bg-white border border-slate-200/80 shadow-xs"
                    >
                        <ArrowLeft size={14} />
                        <span>Return to Store</span>
                    </Link>

                    <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500">
                        <ShieldCheck size={14} className="text-emerald-600" />
                        <span>Gumroad Payment Guarantee</span>
                    </div>
                </div>

                {/* 1. STATE: VERIFYING */}
                {verificationState === 'VERIFYING' && (
                    <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-10 text-center shadow-lg space-y-4 animate-in fade-in">
                        <div className="size-16 rounded-2xl bg-black text-[#ff90e8] flex items-center justify-center mx-auto shadow-md">
                            <RefreshCw size={28} className="animate-spin" />
                        </div>
                        <h2 className="text-xl font-black text-black">Verifying Payment with Gumroad...</h2>
                        <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                            Please wait a moment while our servers verify the secure payment signal from Gumroad.
                        </p>
                    </div>
                )}

                {/* 2. STATE: SUCCESS (Only when server-verified!) */}
                {verificationState === 'SUCCESS' && order && (
                    <div className="bg-white rounded-3xl border-2 border-black overflow-hidden shadow-2xl animate-in zoom-in-95 space-y-0">
                        {/* Hero Success Badge */}
                        <div className="bg-black text-white p-6 sm:p-8 text-center space-y-3 border-b border-black">
                            <div className="size-14 rounded-full bg-emerald-500 text-black flex items-center justify-center mx-auto shadow-lg">
                                <CheckCircle2 size={32} className="stroke-[2.5]" />
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                                Payment Confirmed! 🎉
                            </h1>
                            <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto font-medium">
                                Your payment has been collected and verified through Gumroad. A receipt has been sent to <strong className="text-white">{order.customer?.email || 'your email'}</strong>.
                            </p>
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-mono text-[#ff90e8]">
                                <span>Reference: {order.orderNumber || order.orderId || order.id}</span>
                                <button onClick={handleCopyOrderId} className="hover:text-white transition">
                                    <Copy size={12} />
                                </button>
                            </div>
                        </div>

                        {/* Order Details Body */}
                        <div className="p-6 sm:p-8 space-y-6">

                            {/* Status Pill Matrix */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                                    <span className="block text-[10px] uppercase font-bold text-slate-400">Payment Status</span>
                                    <span className="text-xs font-black text-emerald-600">PAID ✓</span>
                                </div>
                                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                                    <span className="block text-[10px] uppercase font-bold text-slate-400">Order Status</span>
                                    <span className="text-xs font-black text-slate-800">{order.orderStatus || 'CONFIRMED'}</span>
                                </div>
                                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                                    <span className="block text-[10px] uppercase font-bold text-slate-400">Fulfillment</span>
                                    <span className="text-xs font-black text-slate-800">{order.fulfillmentStatus || 'UNFULFILLED'}</span>
                                </div>
                                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                                    <span className="block text-[10px] uppercase font-bold text-slate-400">Shipment</span>
                                    <span className="text-xs font-black text-slate-800">{order.shipmentStatus || 'NOT_AVAILABLE'}</span>
                                </div>
                            </div>

                            {/* Items Summary */}
                            <div className="space-y-3">
                                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                                    Ordered Items
                                </h3>
                                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                                    {Array.isArray(order.orderItems) && order.orderItems.length > 0 ? (
                                        order.orderItems.map((item, idx) => (
                                            <div key={idx} className="flex items-center justify-between text-xs font-semibold text-slate-800">
                                                <span>{item.quantity || 1}x {item.name}</span>
                                                <span className="font-mono font-bold">${parseFloat(item.price || 0).toFixed(2)}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-xs font-semibold text-slate-800">{order.items || 'Standard Store Order'}</div>
                                    )}

                                    <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-black text-black">
                                        <span>Total Paid:</span>
                                        <span className="text-base font-mono">${parseFloat(order.total || 0).toFixed(2)} {order.currency || 'USD'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Delivery & Customer Info */}
                            <div className="p-4 rounded-2xl bg-[#ff90e8]/10 border border-black/20 space-y-2 text-xs">
                                <div className="flex items-center gap-2 font-bold text-black">
                                    <MapPin size={14} />
                                    <span>Delivery Destination:</span>
                                </div>
                                <p className="text-slate-700 pl-5 font-medium">
                                    {order.customer?.shippingAddress || 'Digital delivery to customer email'}
                                </p>
                            </div>

                            {/* Viral Affiliate & Referral Rewards Box (Growth Hacker Engine) */}
                            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-emerald-500/10 to-amber-500/10 border-2 border-emerald-500/30 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-1.5 text-xs font-black text-emerald-950 uppercase tracking-wider">
                                        <Sparkles size={14} className="text-amber-500 fill-amber-500" />
                                        <span>Refer Friends & Earn 15% Cash</span>
                                    </span>
                                    <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                                        Instant Commission
                                    </span>
                                </div>
                                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                                    Share your VIP referral link with friends. Whenever they make a purchase, you automatically receive a 15% payout!
                                </p>
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="text" 
                                        readOnly 
                                        value={`${typeof window !== 'undefined' ? window.location.origin : 'https://www.gumshop.online'}/shop/${encodeURIComponent(resolvedStoreSlug || 'store')}?ref=${encodeURIComponent(order?.id || orderIdParam || 'vip')}`} 
                                        className="flex-1 bg-white border border-slate-300 text-slate-800 text-xs px-3 py-2 rounded-xl font-mono select-all focus:outline-none"
                                    />
                                    <button
                                        onClick={() => {
                                            const refUrl = `${window.location.origin}/shop/${encodeURIComponent(resolvedStoreSlug || 'store')}?ref=${encodeURIComponent(order?.id || orderIdParam || 'vip')}`;
                                            navigator.clipboard.writeText(refUrl);
                                            toast.success("Referral link copied!");
                                        }}
                                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs active:scale-95 shrink-0"
                                    >
                                        <Copy size={13} />
                                        <span>Copy</span>
                                    </button>
                                </div>
                                <div className="flex gap-2 pt-1">
                                    <a
                                        href={`https://wa.me/?text=${encodeURIComponent(`Check out this store I just bought from! You can get an exclusive discount here: ${typeof window !== 'undefined' ? window.location.origin : 'https://www.gumshop.online'}/shop/${encodeURIComponent(resolvedStoreSlug || 'store')}?ref=${encodeURIComponent(order?.id || orderIdParam || 'vip')}`)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 text-[11px] font-bold flex items-center justify-center gap-1.5 transition active:scale-98"
                                    >
                                        <Share2 size={12} className="text-emerald-700" />
                                        <span>Share on WhatsApp</span>
                                    </a>
                                    <a
                                        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Just ordered something awesome from @${resolvedStoreSlug || 'gumshop'}! Check it out here: ${typeof window !== 'undefined' ? window.location.origin : 'https://www.gumshop.online'}/shop/${encodeURIComponent(resolvedStoreSlug || 'store')}?ref=${encodeURIComponent(order?.id || orderIdParam || 'vip')}`)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-black text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition active:scale-98"
                                    >
                                        <Share2 size={12} className="text-white" />
                                        <span>Post to X</span>
                                    </a>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2.5 pt-2">
                                <button
                                    onClick={handlePrint}
                                    className="flex-1 py-3 px-4 rounded-xl bg-white hover:bg-slate-50 text-black border-2 border-black font-extrabold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                                >
                                    <Printer size={14} />
                                    <span>Print Receipt</span>
                                </button>
                                <Link
                                    href={storeSlug ? `/shop/${encodeURIComponent(storeSlug)}` : '/'}
                                    className="flex-1 py-3 px-4 rounded-xl bg-black hover:bg-slate-900 text-white font-extrabold text-xs transition flex items-center justify-center gap-2 text-center shadow-xs"
                                >
                                    <span>Continue Shopping</span>
                                </Link>
                            </div>

                        </div>
                    </div>
                )}

                {/* 3. STATE: VERIFICATION_PENDING (Payment initiated but not yet confirmed by Gumroad) */}
                {verificationState === 'PENDING' && (
                    <div className="bg-white rounded-3xl border-2 border-amber-300 p-8 sm:p-10 text-center shadow-xl space-y-5 animate-in fade-in">
                        <div className="size-16 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto border border-amber-300">
                            <Clock size={32} />
                        </div>
                        <div className="space-y-1.5">
                            <h2 className="text-xl font-black text-amber-950">Payment Verification Pending</h2>
                            <p className="text-xs text-amber-900 max-w-md mx-auto leading-relaxed">
                                {statusMessage}
                            </p>
                        </div>

                        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 max-w-md mx-auto text-xs text-amber-800 text-left space-y-1">
                            <p>• If you just completed payment on Gumroad, it may take a few seconds for the webhook to reach our server.</p>
                            <p>• If you abandoned or closed checkout without paying, your order will remain in pending status.</p>
                        </div>

                        <div className="flex justify-center gap-3 pt-2">
                            <button
                                onClick={handleReverify}
                                disabled={isReverifying}
                                className="py-3 px-6 rounded-xl bg-black hover:bg-slate-900 text-white font-extrabold text-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-md"
                            >
                                <RefreshCw size={13} className={isReverifying ? 'animate-spin' : ''} />
                                <span>{isReverifying ? "Checking Server..." : "Check Payment Status Again"}</span>
                            </button>
                            <Link
                                href={storeSlug ? `/shop/${encodeURIComponent(storeSlug)}` : '/'}
                                className="py-3 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition flex items-center gap-1.5"
                            >
                                <span>Back to Store</span>
                            </Link>
                        </div>
                    </div>
                )}

                {/* 4. STATE: NOT_FOUND (Direct URL manipulation or invalid order ID) */}
                {verificationState === 'NOT_FOUND' && (
                    <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 text-center shadow-lg space-y-5 animate-in fade-in">
                        <div className="size-16 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
                            <AlertCircle size={32} />
                        </div>
                        <div className="space-y-1.5">
                            <h2 className="text-xl font-black text-slate-900">No Verified Transaction Found</h2>
                            <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                                We could not find a confirmed purchase for this reference. Directly opening this page does not create a successful order.
                            </p>
                        </div>

                        <div className="pt-2">
                            <Link
                                href={returnStoreUrl}
                                className="inline-flex items-center gap-2 py-3 px-6 rounded-xl bg-black hover:bg-slate-900 text-white font-extrabold text-xs transition shadow-md"
                            >
                                <ShoppingBag size={14} />
                                <span>Browse Store Catalog</span>
                            </Link>
                        </div>
                    </div>
                )}

                {/* 5. STATE: FAILED (Cancelled or failed transaction) */}
                {verificationState === 'FAILED' && (
                    <div className="bg-white rounded-3xl border-2 border-rose-300 p-8 sm:p-10 text-center shadow-xl space-y-5 animate-in fade-in">
                        <div className="size-16 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto border border-rose-300">
                            <XCircle size={32} />
                        </div>
                        <div className="space-y-1.5">
                            <h2 className="text-xl font-black text-rose-950">Payment Could Not Be Confirmed</h2>
                            <p className="text-xs text-rose-900 max-w-md mx-auto leading-relaxed">
                                Gumroad was unable to verify a successful charge for this order. No funds were captured.
                            </p>
                        </div>

                        <div className="pt-2">
                            <Link
                                href={storeSlug ? `/shop/${encodeURIComponent(storeSlug)}` : '/'}
                                className="inline-flex items-center gap-2 py-3 px-6 rounded-xl bg-black hover:bg-slate-900 text-white font-extrabold text-xs transition shadow-md"
                            >
                                <span>Return to Store & Try Again</span>
                            </Link>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}

export default function ThankYouPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-600 text-xs font-bold">
                Verifying payment status...
            </div>
        }>
            <ThankYouContent />
        </Suspense>
    );
}
