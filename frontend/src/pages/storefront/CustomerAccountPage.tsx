import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { useTheme } from '../../context/ThemeContext';
import { formatPrice, formatDate } from '../../utils/formatters';
import {
  User,
  Package,
  MapPin,
  Tag,
  HelpCircle,
  Truck,
  CheckCircle2,
  Copy,
  ExternalLink,
  ShieldCheck,
  RotateCcw,
  Clock,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export const CustomerAccountPage: React.FC = () => {
  const { currency } = useTheme();
  const [activeTab, setActiveTab] = useState<'orders' | 'addresses' | 'discounts' | 'support'>('orders');
  const [orders, setOrders] = useState<any[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Default mock user profile or stored customer details
  const [customer, setCustomer] = useState({
    name: 'Elena Vance',
    email: 'elena.vance@example.com',
    phone: '+1 (555) 234-5678',
    city: 'Springfield, OR',
  });

  const availableDiscounts = [
    { code: 'VIP20', title: 'VIP 20% Off Entire Order', desc: 'Enjoy 20% off all catalog items with no minimum spend.', badge: '20% OFF' },
    { code: 'GUM50', title: 'Flash Launch 50% Off', desc: 'Special welcome promo code for first-time shoppers.', badge: '50% OFF' },
    { code: 'SAVE10', title: '$10 Off Orders Over $50', desc: 'Save $10 instantly on orders over $50.', badge: '$10 OFF' },
  ];

  useEffect(() => {
    // Look up recent orders for this customer email
    api.getOrders()
      .then((ords) => {
        setOrders(ords);
      })
      .catch(() => {});
  }, []);

  const copyPromo = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <div className="min-h-screen bg-[#0A0C0F] text-gray-200 py-12 sm:py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Customer Profile Header */}
        <div className="bg-[#14171F] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-indigo-900/40">
              {customer.name[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white">{customer.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Verified Customer
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{customer.email} • {customer.city}</p>
            </div>
          </div>

          <Link
            to="/track"
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-indigo-900/30 flex items-center gap-2 self-stretch sm:self-auto justify-center"
          >
            <Truck className="w-4 h-4" />
            <span>Track Any Package</span>
          </Link>
        </div>

        {/* Tabbed Navigation */}
        <div className="flex bg-[#14171F] border border-white/10 rounded-2xl p-1.5 overflow-x-auto">
          {[
            { id: 'orders', label: 'My Orders & Tracking', icon: Package },
            { id: 'addresses', label: 'Saved Addresses', icon: MapPin },
            { id: 'discounts', label: 'My Discount Codes', icon: Tag },
            { id: 'support', label: 'Help & Support', icon: HelpCircle },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 py-3 px-4 text-xs font-bold transition-all border-b-2 ${
                  isActive
                    ? 'border-indigo-500 text-white'
                    : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {/* 1. Orders Tab */}
          {activeTab === 'orders' && (
            <div className="bg-[#14171F] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white uppercase tracking-wider font-heading">
                  Recent Orders &amp; Dispatches
                </h3>
                <span className="text-xs text-gray-400 font-bold">{orders.length} Total Orders</span>
              </div>

              <div className="space-y-4">
                {orders.map((o) => (
                  <div key={o.id} className="p-5 bg-[#0A0C0F] border border-white/10 rounded-2xl space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-white/5 gap-2">
                      <div>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Order Ref</span>
                        <span className="font-mono text-sm font-black text-indigo-400 block">{o.orderNumber}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400">{formatDate(o.createdAt)}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          o.status === 'fulfilled'
                            ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {o.status === 'fulfilled' ? 'Dispatched' : 'Confirmed'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block mb-1">
                          Items
                        </span>
                        <div className="space-y-1">
                          {o.items?.map((it: any, idx: number) => (
                            <p key={idx} className="text-xs text-gray-300">
                              • {it.title} <span className="text-gray-500 font-mono">×{it.quantity}</span>
                            </p>
                          ))}
                        </div>
                      </div>

                      <div className="text-left sm:text-right space-y-2">
                        <div>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">Total</span>
                          <span className="text-lg font-black text-white">{formatPrice(o.totalAmount, currency)}</span>
                        </div>

                        <Link
                          to={`/track`}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 rounded-xl text-xs font-bold transition-colors"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>View Live Tracking</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}

                {orders.length === 0 && (
                  <div className="py-12 text-center text-gray-500 space-y-2">
                    <Package className="w-10 h-10 mx-auto text-gray-600 mb-2" />
                    <p className="text-sm font-bold text-white">No orders placed yet</p>
                    <p className="text-xs">Browse our catalog and your orders will appear here automatically.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 2. Addresses Tab */}
          {activeTab === 'addresses' && (
            <div className="bg-[#14171F] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
              <h3 className="text-base font-bold text-white uppercase tracking-wider font-heading">
                Default Delivery Destination
              </h3>

              <div className="p-5 bg-[#0A0C0F] border border-indigo-500/30 rounded-2xl space-y-3 max-w-md">
                <div className="flex justify-between items-center">
                  <span className="px-2 py-0.5 bg-indigo-600/20 text-indigo-400 text-[10px] font-bold uppercase rounded-md border border-indigo-500/30">
                    Primary Address
                  </span>
                  <MapPin className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="space-y-1 text-xs text-gray-300">
                  <p className="font-bold text-white text-sm">{customer.name}</p>
                  <p>742 Evergreen Terrace</p>
                  <p>Springfield, OR 97477</p>
                  <p className="text-indigo-400 font-bold">United States</p>
                  <p className="text-gray-500 pt-1">{customer.phone}</p>
                </div>
              </div>
            </div>
          )}

          {/* 3. Discounts Tab */}
          {activeTab === 'discounts' && (
            <div className="bg-[#14171F] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
              <div>
                <h3 className="text-base font-bold text-white uppercase tracking-wider font-heading">
                  Exclusive Promo Codes
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Apply these discount codes in the cart drawer for instant savings
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {availableDiscounts.map((d) => (
                  <div key={d.code} className="p-5 bg-[#0A0C0F] border border-white/10 rounded-2xl flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="px-2.5 py-1 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-lg text-xs font-black uppercase font-mono">
                          {d.code}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                          {d.badge}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-white">{d.title}</h4>
                      <p className="text-[11px] text-gray-400 leading-relaxed">{d.desc}</p>
                    </div>

                    <button
                      onClick={() => copyPromo(d.code)}
                      className="w-full py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 border border-white/10"
                    >
                      {copiedCode === d.code ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied to Clipboard!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-gray-400" />
                          <span>Copy Promo Code</span>
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Support Tab */}
          {activeTab === 'support' && (
            <div className="bg-[#14171F] border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
              <h3 className="text-base font-bold text-white uppercase tracking-wider font-heading">
                Customer Care &amp; Warranty Guarantees
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-[#0A0C0F] border border-white/10 rounded-2xl space-y-2">
                  <Truck className="w-5 h-5 text-indigo-400" />
                  <h4 className="text-xs font-bold text-white">Free Express Shipping</h4>
                  <p className="text-[11px] text-gray-400">All orders dispatched within 24-48 business hours with live tracking.</p>
                </div>

                <div className="p-4 bg-[#0A0C0F] border border-white/10 rounded-2xl space-y-2">
                  <RotateCcw className="w-5 h-5 text-emerald-400" />
                  <h4 className="text-xs font-bold text-white">30-Day Money-Back Guarantee</h4>
                  <p className="text-[11px] text-gray-400">Hassle-free return policy if you are not 100% satisfied with your gear.</p>
                </div>

                <div className="p-4 bg-[#0A0C0F] border border-white/10 rounded-2xl space-y-2">
                  <ShieldCheck className="w-5 h-5 text-purple-400" />
                  <h4 className="text-xs font-bold text-white">Comprehensive Warranty</h4>
                  <p className="text-[11px] text-gray-400">Complete hardware defect and build quality coverage for 2 full years.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
