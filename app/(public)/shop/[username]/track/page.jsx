'use client'
import { useState } from "react";
import { useParams } from "next/navigation";
import { getOrder } from "@/lib/firebaseDb";
import { Package, Search, Truck, CheckCircle2, Clock, ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function PackageTrackingPage() {
    const { username } = useParams();
    const [orderId, setOrderId] = useState("");
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [orderData, setOrderData] = useState(null);
    const [searched, setSearched] = useState(false);

    const handleSearchOrder = async (e) => {
        e.preventDefault();
        if (!orderId.trim() && !email.trim()) {
            toast.error("Please enter your Order ID or Email address");
            return;
        }

        setLoading(true);
        setSearched(true);
        setOrderData(null);

        try {
            const searchId = orderId.trim();
            const found = await getOrder(searchId);

            if (found) {
                setOrderData(found);
            } else {
                setOrderData(null);
                toast.error("Order not found. Please verify your order number.");
            }
        } catch (err) {
            console.error("Order lookup error:", err);
            setOrderData(null);
            toast.error("Error looking up order");
        } finally {
            setLoading(false);
        }
    };

    const steps = [
        { id: 'placed', label: 'Order Placed', desc: 'Payment verified' },
        { id: 'processing', label: 'Processing', desc: 'Packaging & quality check' },
        { id: 'shipped', label: 'In Transit', desc: 'Handed to courier' },
        { id: 'delivered', label: 'Delivered', desc: 'Package arrived' },
    ];

    const getStepStatus = (stepIndex, status) => {
        const s = (status || 'processing').toLowerCase();
        let currentIdx = 1;
        if (s === 'paid' || s === 'placed') currentIdx = 0;
        if (s === 'processing') currentIdx = 1;
        if (s === 'shipped') currentIdx = 2;
        if (s === 'delivered') currentIdx = 3;

        if (stepIndex < currentIdx) return 'completed';
        if (stepIndex === currentIdx) return 'current';
        return 'upcoming';
    };

    return (
        <div className="min-h-screen bg-slate-50 py-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">
                
                {/* Back to Store */}
                <Link 
                    href={`/shop/${username}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 mb-8 transition"
                >
                    <ArrowLeft size={16} />
                    <span>Back to Storefront</span>
                </Link>

                {/* Tracking Box */}
                <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm">
                    <div className="text-center mb-8">
                        <div className="size-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                            <Truck size={28} />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                            Track Your Order
                        </h1>
                        <p className="text-xs text-slate-500 mt-1">
                            Enter your Order ID or email below to check real-time shipment progress.
                        </p>
                    </div>

                    <form onSubmit={handleSearchOrder} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                                Order ID / Receipt Number
                            </label>
                            <input 
                                type="text"
                                placeholder="e.g. ord_179103... or Gumroad Order #"
                                value={orderId}
                                onChange={(e) => setOrderId(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:border-emerald-500 focus:bg-white transition"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                                Email Address (Optional)
                            </label>
                            <input 
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:border-emerald-500 focus:bg-white transition"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50"
                        >
                            <Search size={16} />
                            <span>{loading ? "Searching..." : "Track Package"}</span>
                        </button>
                    </form>

                    {/* Tracking Results Card */}
                    {orderData && (
                        <div className="mt-10 pt-8 border-t border-slate-100 animate-in fade-in">
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                                        Order Found
                                    </span>
                                    <h3 className="text-lg font-bold text-slate-900 mt-1">
                                        Order #{orderData.orderId || orderId}
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        Placed on {new Date(orderData.createdAt || Date.now()).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className="text-sm font-extrabold text-slate-900">
                                        ${(orderData.total || 29.99).toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            {/* Tracking Progress Steps */}
                            <div className="mt-8 space-y-6">
                                {steps.map((step, idx) => {
                                    const state = getStepStatus(idx, orderData.status);
                                    return (
                                        <div key={step.id} className="flex items-start gap-4">
                                            <div className={`size-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                                                state === 'completed'
                                                    ? 'bg-emerald-600 text-white'
                                                    : state === 'current'
                                                        ? 'bg-emerald-100 text-emerald-700 ring-4 ring-emerald-50'
                                                        : 'bg-slate-100 text-slate-400'
                                            }`}>
                                                {state === 'completed' ? (
                                                    <CheckCircle2 size={16} />
                                                ) : (
                                                    <span className="text-xs font-bold">{idx + 1}</span>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <p className={`text-xs font-bold ${state === 'upcoming' ? 'text-slate-400' : 'text-slate-900'}`}>
                                                    {step.label}
                                                </p>
                                                <p className="text-[11px] text-slate-500">
                                                    {step.desc}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {orderData.trackingNumber && (
                                <div className="mt-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-between text-xs">
                                    <div>
                                        <p className="font-bold text-emerald-900">Tracking Code:</p>
                                        <p className="font-mono text-emerald-700 font-semibold">{orderData.trackingNumber}</p>
                                    </div>
                                    <a
                                        href={`https://parcelsapp.com/en/tracking/${orderData.trackingNumber}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-emerald-700 hover:text-emerald-900 font-bold underline flex items-center gap-1"
                                    >
                                        <span>Courier Live Tracking</span>
                                        <ExternalLink size={12} />
                                    </a>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Not Found State */}
                    {searched && !orderData && !loading && (
                        <div className="mt-8 p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center animate-in fade-in">
                            <div className="size-10 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center mx-auto mb-2">
                                <Package size={20} />
                            </div>
                            <h4 className="text-sm font-bold text-slate-800">No Matching Order</h4>
                            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                                We could not find an order for this ID or email. Please verify the information from your confirmation receipt.
                            </p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
