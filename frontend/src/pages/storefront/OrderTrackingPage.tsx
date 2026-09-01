import React, { useState } from 'react';
import { api } from '../../api/client';
import { useTheme } from '../../context/ThemeContext';
import { formatPrice, formatDate } from '../../utils/formatters';
import {
  Truck,
  Search,
  CheckCircle2,
  Clock,
  Package,
  ExternalLink,
  ShieldCheck,
  MapPin,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

export const OrderTrackingPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<any | null>(null);
  const [error, setError] = useState('');
  const { currency } = useTheme();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setOrder(null);
    try {
      const res = await api.trackOrder(query.trim());
      if (res.success && res.order) {
        setOrder(res.order);
      } else {
        setError('No order found matching that number or email address.');
      }
    } catch (err: any) {
      setError(err.message || 'No order found matching that number or email address.');
    } finally {
      setLoading(false);
    }
  };

  const getStepIndex = (status: string) => {
    if (status === 'fulfilled') return 3;
    if (status === 'completed') return 2;
    if (status === 'pending_payment') return 1;
    return 1;
  };

  const currentStep = order ? getStepIndex(order.status) : 1;

  return (
    <div className="min-h-screen bg-[#0A0C0F] text-gray-200 py-12 sm:py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center mx-auto shadow-xl shadow-indigo-900/30">
            <Truck className="w-7 h-7" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white uppercase font-heading tracking-wide">
            Track Your Order
          </h1>
          <p className="text-sm text-gray-400 max-w-md mx-auto">
            Enter your Order Number (e.g. <span className="font-mono text-indigo-400">GUM-84920</span>) or checkout email address to see live dispatch updates.
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="bg-[#14171F] border border-white/10 rounded-2xl p-2.5 shadow-2xl flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-500 absolute left-4 top-3.5" />
            <input
              type="text"
              required
              placeholder="Enter Order # or Email Address..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-transparent text-sm text-white placeholder:text-gray-600 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-indigo-900/40 flex items-center justify-center gap-2 shrink-0"
          >
            <span>{loading ? 'Locating...' : 'Track Package'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-3 text-xs text-red-400 font-semibold animate-in fade-in">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Live Order Timeline Result */}
        {order && (
          <div className="bg-[#14171F] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-8 animate-in zoom-in-95">
            {/* Top Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-white/10 gap-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Order Reference</span>
                <h3 className="text-xl font-black text-white font-mono mt-0.5">{order.orderNumber}</h3>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Order Placed</span>
                <p className="text-xs text-white font-bold mt-0.5">{formatDate(order.createdAt)}</p>
              </div>
            </div>

            {/* Stepper Progress Bar */}
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-black uppercase tracking-wider text-gray-400">Fulfillment Timeline</span>
                <span className="text-xs font-bold text-indigo-400">Est. Delivery: {order.estimatedDelivery ? formatDate(order.estimatedDelivery) : 'TBD'}</span>
              </div>
              <div className="relative flex items-center justify-between w-full">
                {/* Connecting lines */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-white/10 rounded-full z-0" />
                <div 
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-indigo-500 rounded-full z-0 transition-all duration-500" 
                  style={{ width: `${((currentStep - 1) / 3) * 100}%` }} 
                />
                
                {[
                  { title: 'Order Placed', desc: 'Received', step: 1 },
                  { title: 'Processing', desc: 'Quality Check', step: 2 },
                  { title: 'Dispatched', desc: 'In Transit', step: 3 },
                  { title: 'Delivered', desc: 'Destination', step: 4 },
                ].map((s) => {
                  const isDone = currentStep >= s.step;
                  const isCurrent = currentStep === s.step;
                  return (
                    <div key={s.step} className="relative z-10 flex flex-col items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                        isDone ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-900/40' : 'bg-[#14171F] border-gray-600 text-gray-500'
                      }`}>
                        {isDone ? <CheckCircle2 className="w-5 h-5" /> : <div className="w-2.5 h-2.5 rounded-full bg-gray-600" />}
                      </div>
                      <div className="text-center px-1">
                        <span className={`text-[11px] font-bold block ${isCurrent ? 'text-indigo-400' : isDone ? 'text-white' : 'text-gray-500'}`}>
                          {s.title}
                        </span>
                        <span className="text-[9px] text-gray-500 hidden sm:block">{s.desc}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Carrier & Tracking Info Pill */}
            {order.trackingNumber ? (
              <div className="p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block">
                      Carrier: {order.carrier}
                    </span>
                    <span className="font-mono text-xs font-black text-white">{order.trackingNumber}</span>
                  </div>
                </div>

                <a
                  href={order.trackingUrl || `https://www.google.com/search?q=${encodeURIComponent(order.trackingNumber)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shrink-0"
                >
                  <span>Live Courier Tracking</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            ) : (
              <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-3 text-xs text-gray-400">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Your order is being packaged. Courier tracking details will appear here as soon as the label is generated.</span>
              </div>
            )}

            {/* Destination Address & Items */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-white/10">
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Delivery Destination</span>
                </span>
                <p className="text-xs text-gray-300">
                  <strong className="text-white block">{order.customerName}</strong>
                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.country}
                </p>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Items Ordered ({order.items?.length || 1})</span>
                </span>
                <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                  {order.items?.map((it: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-xs">
                      <span className="text-gray-300 truncate">{it.title} × {it.quantity}</span>
                      <span className="font-bold text-white shrink-0 ml-2">{formatPrice(it.price * it.quantity, currency)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
