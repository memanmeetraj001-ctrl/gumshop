import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Order } from '../../types';
import { formatPrice, formatDate } from '../../utils/formatters';
import {
  PackageCheck,
  Search,
  Download,
  Copy,
  Check,
  Truck,
  Clock,
  CheckCircle2,
  XCircle,
  ExternalLink,
  MapPin,
  Mail,
  User,
  Zap,
  Tag,
  X,
  Send,
} from 'lucide-react';

export const AdminOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fulfillment Modal State
  const [fulfillModalOrder, setFulfillModalOrder] = useState<Order | null>(null);
  const [carrier, setCarrier] = useState('USPS Priority Mail');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [submittingFulfill, setSubmittingFulfill] = useState(false);

  // Recovery Message State
  const [recoverySuccess, setRecoverySuccess] = useState<string | null>(null);

  const fetchOrders = () => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (statusFilter !== 'all') params.status = statusFilter;
    if (search) params.search = search;

    api.getOrders(params)
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders();
  };

  const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
    try {
      await api.updateOrderStatus(orderId, { status: newStatus });
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
    } catch (err: any) {
      alert('Failed to update status: ' + err.message);
    }
  };

  const handleRecoverLead = async (order: Order) => {
    try {
      const res = await api.recoverOrderLead(order.id, 10);
      if (res.success) {
        navigator.clipboard.writeText(res.recoveryLink);
        setRecoverySuccess(`10% Discount Recovery Link copied to clipboard for ${order.customerName}!`);
        setOrders((prev) =>
          prev.map((o) => (o.id === order.id ? { ...o, recoveredAt: new Date().toISOString() } : o))
        );
        setTimeout(() => setRecoverySuccess(null), 5000);
      }
    } catch (err: any) {
      alert('Recovery trigger failed: ' + err.message);
    }
  };

  const handleFulfillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fulfillModalOrder) return;
    setSubmittingFulfill(true);
    try {
      const res = await api.fulfillOrder(fulfillModalOrder.id, {
        carrier,
        trackingNumber: trackingNumber.trim(),
        trackingUrl: `https://www.google.com/search?q=${encodeURIComponent(trackingNumber.trim())}`,
        status: 'fulfilled',
      });
      if (res.success && res.order) {
        setOrders((prev) =>
          prev.map((o) => (o.id === fulfillModalOrder.id ? res.order : o))
        );
        setFulfillModalOrder(null);
        setTrackingNumber('');
      }
    } catch (err: any) {
      alert('Fulfillment update failed: ' + err.message);
    } finally {
      setSubmittingFulfill(false);
    }
  };

  const copyAddress = (order: Order) => {
    const addr = `${order.customerName}
${order.shippingAddress.addressLine1}${
      order.shippingAddress.addressLine2 ? ', ' + order.shippingAddress.addressLine2 : ''
    }
${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}
${order.shippingAddress.country}`;
    navigator.clipboard.writeText(addr);
    setCopiedId(order.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const exportCSV = () => {
    if (orders.length === 0) {
      alert('No orders to export.');
      return;
    }

    const headers = [
      'Order Number',
      'Date',
      'Customer Name',
      'Email',
      'Phone',
      'Address Line 1',
      'Address Line 2',
      'City',
      'State',
      'Postal Code',
      'Country',
      'Items',
      'Total (USD)',
      'Carrier',
      'Tracking Number',
      'Status',
    ];

    const rows = orders.map((o) => [
      o.orderNumber,
      new Date(o.createdAt).toLocaleDateString(),
      `"${o.customerName}"`,
      o.customerEmail,
      o.customerPhone || '',
      `"${o.shippingAddress.addressLine1}"`,
      `"${o.shippingAddress.addressLine2 || ''}"`,
      o.shippingAddress.city,
      o.shippingAddress.state,
      o.shippingAddress.postalCode,
      o.shippingAddress.country,
      `"${o.items.map((it) => `${it.title} (x${it.quantity})`).join(', ')}"`,
      o.totalAmount.toFixed(2),
      o.carrier || '',
      o.trackingNumber || '',
      o.status,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `gumshop-orders-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'completed':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Paid &amp; Confirmed
          </span>
        );
      case 'fulfilled':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center gap-1">
            <Truck className="w-3 h-3" /> Shipped / Dispatched
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1">
            <XCircle className="w-3 h-3" /> Cancelled
          </span>
        );
      case 'pending_payment':
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Abandoned / Pending
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white uppercase tracking-wider font-heading flex items-center gap-2">
            <PackageCheck className="w-6 h-6 text-indigo-400" />
            <span>Orders &amp; Shipping Leads</span>
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Customer shipping details captured during pre-checkout with 1-click recovery &amp; courier fulfillment
          </p>
        </div>

        <button
          onClick={exportCSV}
          className="p-2.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl border border-white/10 flex items-center gap-2 text-xs font-bold transition-colors self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-indigo-400" />
          <span>Export Shipping CSV</span>
        </button>
      </div>

      {recoverySuccess && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-3 text-xs text-emerald-400 font-semibold animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{recoverySuccess}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-[#14141E] border border-white/10 rounded-3xl p-6 shadow-xl">
          <span className="text-xs font-bold uppercase text-gray-400 flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-400" />
            <span>Total Captured Leads</span>
          </span>
          <h3 className="text-3xl font-black text-white mt-2">{orders.length}</h3>
          <p className="text-[11px] text-gray-500 mt-1">Customers who submitted shipping address</p>
        </div>

        <div className="bg-[#14141E] border border-white/10 rounded-3xl p-6 shadow-xl">
          <span className="text-xs font-bold uppercase text-gray-400 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Abandoned Leads</span>
          </span>
          <h3 className="text-3xl font-black text-amber-400 mt-2">
            {orders.filter((o) => o.status === 'pending_payment').length}
          </h3>
          <p className="text-[11px] text-gray-500 mt-1">Ready for 1-click discount recovery</p>
        </div>

        <div className="bg-[#14141E] border border-white/10 rounded-3xl p-6 shadow-xl">
          <span className="text-xs font-bold uppercase text-gray-400 flex items-center gap-2">
            <Truck className="w-4 h-4 text-purple-400" />
            <span>Shipped Packages</span>
          </span>
          <h3 className="text-3xl font-black text-purple-400 mt-2">
            {orders.filter((o) => o.status === 'fulfilled').length}
          </h3>
          <p className="text-[11px] text-gray-500 mt-1">With active courier tracking numbers</p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-[#14141E] border border-white/10 rounded-3xl p-6 space-y-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Status filter tabs */}
          <div className="flex bg-[#0A0A0F] border border-white/10 rounded-2xl p-1 w-full sm:w-auto">
            {[
              { id: 'all', label: 'All Orders' },
              { id: 'pending_payment', label: '🕒 Abandoned Leads' },
              { id: 'completed', label: 'Paid & Verified' },
              { id: 'fulfilled', label: 'Shipped Packages' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === tab.id
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/40'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder="Search by order #, name, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#0A0A0F] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500"
            />
            <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-3" />
          </form>
        </div>

        {/* Orders Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-[#0A0A0F] border-b border-white/10 text-[10px] font-black uppercase tracking-widest text-gray-400">
              <tr>
                <th className="py-3.5 px-4">Order / Customer</th>
                <th className="py-3.5 px-4">Items Ordered</th>
                <th className="py-3.5 px-4">Shipping Destination</th>
                <th className="py-3.5 px-4">Total</th>
                <th className="py-3.5 px-4">Status &amp; Tracking</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-4 px-4">
                    <div className="space-y-1">
                      <span className="font-mono text-xs font-bold text-indigo-400 block">{o.orderNumber}</span>
                      <span className="font-bold text-white block">{o.customerName}</span>
                      <span className="text-[11px] text-gray-400 flex items-center gap-1">
                        <Mail className="w-3 h-3 text-gray-500" /> {o.customerEmail}
                      </span>
                    </div>
                  </td>

                  <td className="py-4 px-4 max-w-xs">
                    <div className="space-y-1">
                      {o.items.map((it, idx) => (
                        <div key={idx} className="text-xs text-gray-300 truncate">
                          • {it.title} <span className="text-gray-500 font-mono">x{it.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </td>

                  <td className="py-4 px-4">
                    <div className="text-[11px] space-y-0.5">
                      <p className="text-white font-medium">{o.shippingAddress.addressLine1}</p>
                      {o.shippingAddress.addressLine2 && (
                        <p className="text-gray-400">{o.shippingAddress.addressLine2}</p>
                      )}
                      <p className="text-gray-400">
                        {o.shippingAddress.city}, {o.shippingAddress.state} {o.shippingAddress.postalCode}
                      </p>
                      <p className="text-indigo-400 font-bold">{o.shippingAddress.country}</p>
                    </div>
                  </td>

                  <td className="py-4 px-4">
                    <span className="font-black text-white text-sm block">{formatPrice(o.totalAmount)}</span>
                    {o.discountCode && (
                      <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                        <Tag className="w-3 h-3" /> {o.discountCode}
                      </span>
                    )}
                  </td>

                  <td className="py-4 px-4 space-y-1.5">
                    {getStatusBadge(o.status)}
                    {o.trackingNumber && (
                      <div className="text-[10px] font-mono text-indigo-300 flex items-center gap-1">
                        <Truck className="w-3 h-3" /> {o.carrier}: {o.trackingNumber}
                      </div>
                    )}
                  </td>

                  <td className="py-4 px-4 text-right space-y-1.5">
                    <div className="flex items-center justify-end gap-2">
                      {/* Copy Address */}
                      <button
                        onClick={() => copyAddress(o)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                        title="Copy Shipping Label"
                      >
                        {copiedId === o.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>

                      {/* Abandoned 1-Click Recovery */}
                      {o.status === 'pending_payment' && (
                        <button
                          onClick={() => handleRecoverLead(o)}
                          className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors"
                          title="Generate 10% Discount Recovery Link"
                        >
                          <Zap className="w-3 h-3" />
                          <span>Recover Lead</span>
                        </button>
                      )}

                      {/* Add Tracking / Fulfillment */}
                      <button
                        onClick={() => {
                          setFulfillModalOrder(o);
                          setCarrier(o.carrier || 'USPS Priority Mail');
                          setTrackingNumber(o.trackingNumber || '');
                        }}
                        className="px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors"
                      >
                        <Truck className="w-3 h-3" />
                        <span>{o.trackingNumber ? 'Edit Courier' : 'Ship Order'}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {orders.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500">
                    No customer orders or abandoned shipping leads found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fulfillment Modal */}
      {fulfillModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#14171F] border border-white/10 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 relative text-gray-200">
            <button
              onClick={() => setFulfillModalOrder(null)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-white uppercase tracking-wider font-heading flex items-center gap-2">
                <Truck className="w-5 h-5 text-indigo-400" />
                <span>Courier Tracking &amp; Fulfillment</span>
              </h3>
              <p className="text-xs text-gray-400">
                Dispatch package for order <strong className="text-indigo-400 font-mono">{fulfillModalOrder.orderNumber}</strong>
              </p>
            </div>

            <form onSubmit={handleFulfillSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-400 mb-1.5">Shipping Carrier</label>
                <select
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  className="w-full bg-[#0A0C0F] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="USPS Priority Mail">USPS Priority Mail</option>
                  <option value="FedEx Express">FedEx Express</option>
                  <option value="UPS Ground">UPS Ground</option>
                  <option value="DHL Express">DHL Express</option>
                  <option value="Royal Mail">Royal Mail</option>
                  <option value="Canada Post">Canada Post</option>
                  <option value="Australia Post">Australia Post</option>
                  <option value="BlueDart Express">BlueDart Express</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-400 mb-1.5">Tracking Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 9400 1118 9922 3344 5566 77"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full bg-[#0A0C0F] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white font-mono placeholder:text-gray-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={submittingFulfill}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/40"
              >
                <Send className="w-4 h-4" />
                <span>{submittingFulfill ? 'Dispatching...' : 'Mark as Shipped & Save Tracking'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
