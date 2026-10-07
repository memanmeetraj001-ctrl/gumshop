'use client'
import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
    Search, 
    Truck, 
    CheckCircle2, 
    Package, 
    Clock, 
    MapPin, 
    ArrowLeft, 
    ShieldCheck,
    ShoppingBag,
    Copy,
    ExternalLink
} from 'lucide-react';
import { getOrder } from '@/lib/firebaseDb';
import toast from 'react-hot-toast';

function TrackOrderContent() {
    const searchParams = useSearchParams();
    const queryOrderId = searchParams.get('orderId') || searchParams.get('id') || '';

    const [orderNumber, setOrderNumber] = useState(queryOrderId);
    const [loading, setLoading] = useState(false);
    const [orderInfo, setOrderInfo] = useState(null);
    const [searched, setSearched] = useState(false);

    const lookupOrder = async (idToSearch) => {
        const id = (idToSearch || orderNumber).trim();
        if (!id) {
            toast.error('Please enter an Order ID or Tracking Number');
            return;
        }

        setLoading(true);
        setSearched(true);
        try {
            const found = await getOrder(id);

            if (!found) {
                setOrderInfo(null);
                toast.error('No order found with this Order ID or Tracking Number');
                return;
            }

            const formattedItems = found.orderItems?.map(i => `${i.quantity || 1}x ${i.name}`).join(', ') 
                || (typeof found.items === 'string' ? found.items : 'Order Items');
            const customerAddress = found.customer?.shippingAddress || found.shippingAddress || (typeof found.customer?.address === 'string' ? found.customer.address : null);
            const addressObj = found.address || (typeof found.customer?.address === 'object' ? found.customer.address : null);
            const dest = customerAddress 
                ? customerAddress
                : (addressObj 
                    ? `${addressObj.street || ''}, ${addressObj.city || ''} ${addressObj.country || 'US'}`.replace(/^,\s*/, '') 
                    : 'Customer Delivery Address');

            const createdDate = found.createdAt ? new Date(found.createdAt) : new Date();
            const createdStr = createdDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

            const defaultCheckpoints = [
                { 
                    title: 'Order Placed & Verified', 
                    location: 'GumShop Order Management', 
                    time: createdStr, 
                    status: 'completed' 
                }
            ];

            if (found.status === 'processing' || found.status === 'shipped' || found.status === 'delivered') {
                defaultCheckpoints.unshift({
                    title: 'Fulfillment Processing',
                    location: 'Merchant Fulfillment Hub',
                    time: 'In Progress',
                    status: 'completed'
                });
            }

            if (found.status === 'shipped' || found.status === 'delivered') {
                defaultCheckpoints.unshift({
                    title: 'Dispatched to Carrier',
                    location: found.carrier || 'Logistics Center',
                    time: 'In Transit',
                    status: 'completed'
                });
            }

            if (found.status === 'delivered') {
                defaultCheckpoints.unshift({
                    title: 'Delivered',
                    location: dest,
                    time: 'Delivered',
                    status: 'completed'
                });
            }

            const enriched = {
                id: found.id || id,
                orderId: found.id || id,
                status: found.status || 'placed',
                carrier: found.carrier || (found.trackingNumber ? 'Standard Courier' : 'Pending Carrier Allocation'),
                trackingNumber: found.trackingNumber || 'Pending Assignment',
                estimatedDelivery: found.estimatedDelivery || 'Calculated after dispatch',
                destination: dest,
                total: typeof found.total === 'number' ? found.total : parseFloat(found.total || 0),
                items: formattedItems,
                checkpoints: found.checkpoints || defaultCheckpoints
            };

            setOrderInfo(enriched);
        } catch (err) {
            console.error('Track lookup error:', err);
            setOrderInfo(null);
            toast.error('Unable to locate order');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (queryOrderId) {
            lookupOrder(queryOrderId);
        }
    }, [queryOrderId]);

    const handleCopyTracking = () => {
        if (orderInfo?.trackingNumber) {
            navigator.clipboard.writeText(orderInfo.trackingNumber);
            toast.success('Tracking number copied to clipboard!');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">
                
                {/* Back to Shop */}
                <div className="mb-6 flex items-center justify-between">
                    <Link href="/#catalog" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition">
                        <ArrowLeft size={16} />
                        <span>Return to Storefront</span>
                    </Link>
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                        Live Tracking Portal
                    </span>
                </div>

                {/* Search Card */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="size-10 bg-slate-900 rounded-2xl flex items-center justify-center text-white">
                            <Truck size={20} />
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-black text-slate-900">Track Your Package</h1>
                            <p className="text-xs text-slate-500">Enter your order ID or tracking number for real-time delivery status</p>
                        </div>
                    </div>

                    <form onSubmit={(e) => { e.preventDefault(); lookupOrder(); }} className="flex gap-2">
                        <div className="relative flex-1">
                            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="e.g. GS-849201 or ord_1042"
                                value={orderNumber}
                                onChange={(e) => setOrderNumber(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 outline-none focus:border-emerald-500 focus:bg-white transition"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading || !orderNumber.trim()}
                            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-2xl shadow-md shadow-emerald-600/20 transition disabled:opacity-50 whitespace-nowrap"
                        >
                            {loading ? 'Locating...' : 'Track Order'}
                        </button>
                    </form>
                </div>

                {/* Order Status Display */}
                {orderInfo && (
                    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xl space-y-6 animate-in fade-in duration-300">
                        
                        {/* Header Box */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
                            <div>
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                                    orderInfo.status === 'delivered' 
                                        ? 'text-emerald-700 bg-emerald-50'
                                        : orderInfo.status === 'shipped'
                                            ? 'text-blue-700 bg-blue-50'
                                            : 'text-amber-700 bg-amber-50'
                                }`}>
                                    {orderInfo.status === 'delivered' ? 'Delivered' : orderInfo.status === 'shipped' ? 'In Transit' : 'Order Processing'}
                                </span>
                                <h3 className="text-xl font-black text-slate-900 mt-2">
                                    Order #{orderInfo.id}
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Carrier: <strong className="text-slate-800">{orderInfo.carrier}</strong>
                                </p>
                            </div>

                            <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-200/80">
                                <span className="font-mono text-xs font-bold text-slate-800">
                                    {orderInfo.trackingNumber}
                                </span>
                                {orderInfo.trackingNumber !== 'Pending Assignment' && (
                                    <button
                                        onClick={handleCopyTracking}
                                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition"
                                        title="Copy Tracking"
                                    >
                                        <Copy size={13} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Estimated Delivery Banner */}
                        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Clock size={20} className="text-emerald-600" />
                                <div>
                                    <div className="text-[11px] font-semibold text-emerald-900">Delivery Status / ETA</div>
                                    <div className="text-sm font-extrabold text-emerald-950">{orderInfo.estimatedDelivery}</div>
                                </div>
                            </div>
                            <span className="text-xs font-bold text-emerald-700 bg-white/80 px-3 py-1 rounded-full shadow-2xs">
                                {orderInfo.status === 'delivered' ? 'Completed' : 'Tracked Order'}
                            </span>
                        </div>

                        {/* Live Checkpoint Journey */}
                        <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                                Tracking Timeline & Checkpoints
                            </h4>

                            <div className="space-y-4">
                                {(orderInfo.checkpoints || []).map((cp, idx) => (
                                    <div key={idx} className="flex items-start gap-3">
                                        <div className="size-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs shrink-0 mt-0.5 shadow-xs">
                                            ✓
                                        </div>
                                        <div className="flex-1 pb-3 border-b border-slate-100 last:border-0">
                                            <div className="flex items-baseline justify-between">
                                                <h5 className="text-xs font-bold text-slate-900">{cp.title}</h5>
                                                <span className="text-[11px] text-slate-400 font-medium">{cp.time}</span>
                                            </div>
                                            <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                                                <MapPin size={11} className="text-slate-400" />
                                                <span>{cp.location}</span>
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-3">
                            <Link
                                href="/#catalog"
                                className="w-full sm:flex-1 py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
                            >
                                <ShoppingBag size={15} />
                                <span>Return to Storefront</span>
                            </Link>
                            <a
                                href="mailto:support@gumshop.online"
                                className="w-full sm:flex-1 py-3 px-4 rounded-2xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs text-center transition"
                            >
                                Contact Support
                            </a>
                        </div>

                    </div>
                )}

                {/* Not Found State */}
                {searched && !orderInfo && !loading && (
                    <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center animate-in fade-in">
                        <div className="size-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                            <Package size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">Order Not Located</h3>
                        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                            We couldn't find an order matching <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700 font-mono">{orderNumber}</code>. Please double-check your receipt or Gumroad order reference.
                        </p>
                    </div>
                )}

            </div>
        </div>
    );
}

export default function TrackOrderPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="size-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <TrackOrderContent />
        </Suspense>
    );
}
