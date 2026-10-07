'use client'
import React, { useState, useEffect, useMemo } from 'react';
import { 
    Users, 
    Search, 
    Download, 
    ShoppingBag, 
    DollarSign, 
    TrendingUp, 
    Mail, 
    MapPin, 
    Calendar, 
    X, 
    ExternalLink, 
    UserCheck, 
    Sparkles, 
    Filter,
    ArrowUpRight,
    CheckCircle2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/AuthContext';
import { getActiveStore } from '@/lib/activeStore';
import { getOrdersByStore } from '@/lib/firebaseDb';
import Loading from '@/components/Loading';

export default function StoreCustomersPage() {
    const { user } = useAuth();
    const [currentStore, setCurrentStore] = useState(null);
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState([]);
    const [bioLeads, setBioLeads] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSegment, setSelectedSegment] = useState('all'); // 'all' | 'vip' | 'repeat' | 'first-time' | 'leads'
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    useEffect(() => {
        let isMounted = true;
        const loadCustomerData = async () => {
            try {
                const store = await getActiveStore(user);
                if (!isMounted) return;
                setCurrentStore(store);

                const storeId = store?.id || 'store_default';
                const cleanSlug = (store?.username || store?.name || '').toLowerCase().replace(/[^a-z0-9_-]/g, '');
                let fetchedOrders = [];

                try {
                    fetchedOrders = await Promise.race([
                        getOrdersByStore(storeId),
                        new Promise(res => setTimeout(() => res([]), 2500))
                    ]);
                } catch {}

                // Merge edge orders from localStorage
                if (typeof window !== 'undefined') {
                    try {
                        const localOrdersRaw = localStorage.getItem(`gumshop_recent_orders_${storeId}`) || 
                                              localStorage.getItem('gumshop_recent_orders');
                        if (localOrdersRaw) {
                            const parsed = JSON.parse(localOrdersRaw);
                            if (Array.isArray(parsed)) {
                                const seenIds = new Set(fetchedOrders.map(o => o.id));
                                parsed.forEach(p => {
                                    if (p && p.id && !seenIds.has(p.id)) {
                                        fetchedOrders.push(p);
                                    }
                                });
                            }
                        }
                    } catch {}
                }

                // Load Stan Store Lead Magnet Subscribers
                let loadedLeads = [];
                if (typeof window !== 'undefined') {
                    try {
                        const raw1 = localStorage.getItem(`gumshop_customers_${cleanSlug}`);
                        const raw2 = localStorage.getItem(`gumshop_customers_${storeId}`);
                        const list1 = raw1 ? JSON.parse(raw1) : [];
                        const list2 = raw2 ? JSON.parse(raw2) : [];
                        loadedLeads = Array.isArray(list1) ? [...list1] : [];
                        if (Array.isArray(list2)) {
                            list2.forEach(l => {
                                if (l && l.email && !loadedLeads.some(x => x.email === l.email)) {
                                    loadedLeads.push(l);
                                }
                            });
                        }
                    } catch {}
                }

                if (isMounted) {
                    setOrders(fetchedOrders);
                    setBioLeads(loadedLeads);
                }
            } catch (err) {
                console.warn('Failed to load customers:', err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        loadCustomerData();
        return () => { isMounted = false; };
    }, [user]);

    // Aggregate orders and Stan Store leads into customer profiles
    const customers = useMemo(() => {
        const map = new Map();

        orders.forEach(order => {
            if (!order) return;
            const email = (order.customerEmail || order.email || order.buyerEmail || '').toLowerCase().trim();
            const name = order.customerName || order.name || order.buyerName || (email ? email.split('@')[0] : 'Guest Customer');
            const key = email || `customer_${name.toLowerCase().replace(/[^a-z0-9]/g, '')}`;

            const orderTotal = Number(order.total || order.amount || order.price || 0);

            if (!map.has(key)) {
                map.set(key, {
                    id: key,
                    name,
                    email: email || 'No email provided',
                    phone: order.customerPhone || order.phone || '',
                    city: order.shippingCity || order.city || order.shippingAddress?.city || 'Unknown',
                    country: order.shippingCountry || order.country || order.shippingAddress?.country || '',
                    address: order.shippingAddress?.line1 || order.shippingAddress || '',
                    source: 'Storefront Order',
                    ordersCount: 1,
                    totalSpent: orderTotal,
                    orders: [order],
                    firstOrderDate: order.createdAt || new Date().toISOString(),
                    lastOrderDate: order.createdAt || new Date().toISOString(),
                });
            } else {
                const existing = map.get(key);
                existing.ordersCount += 1;
                existing.totalSpent += orderTotal;
                existing.orders.push(order);
                if (new Date(order.createdAt || 0) > new Date(existing.lastOrderDate)) {
                    existing.lastOrderDate = order.createdAt;
                }
                if (new Date(order.createdAt || 0) < new Date(existing.firstOrderDate)) {
                    existing.firstOrderDate = order.createdAt;
                }
            }
        });

        // Merge Stan Store Bio Leads
        bioLeads.forEach(lead => {
            if (!lead || !lead.email) return;
            const email = lead.email.toLowerCase().trim();
            if (map.has(email)) {
                const existing = map.get(email);
                existing.source = 'Storefront & Bio Lead';
            } else {
                map.set(email, {
                    id: lead.id || `lead_${email}`,
                    name: lead.name || email.split('@')[0],
                    email: email,
                    phone: lead.phone || '',
                    city: 'Digital Lead',
                    country: '',
                    address: '',
                    source: lead.source || 'Stan Bio Lead Magnet',
                    ordersCount: 0,
                    totalSpent: 0,
                    orders: [],
                    firstOrderDate: lead.lastOrderDate || new Date().toISOString(),
                    lastOrderDate: lead.lastOrderDate || new Date().toISOString(),
                });
            }
        });

        return Array.from(map.values()).map(c => ({
            ...c,
            aov: c.ordersCount > 0 ? (c.totalSpent / c.ordersCount) : 0
        })).sort((a, b) => b.totalSpent - a.totalSpent || (b.ordersCount - a.ordersCount));
    }, [orders, bioLeads]);

    // Filter customers
    const filteredCustomers = useMemo(() => {
        return customers.filter(c => {
            // Search
            const query = searchTerm.toLowerCase();
            const matchesSearch = 
                c.name.toLowerCase().includes(query) || 
                c.email.toLowerCase().includes(query) || 
                c.city.toLowerCase().includes(query) ||
                (c.source && c.source.toLowerCase().includes(query));
            if (!matchesSearch) return false;

            // Segment filter
            if (selectedSegment === 'vip') return c.totalSpent >= 100;
            if (selectedSegment === 'repeat') return c.ordersCount > 1;
            if (selectedSegment === 'first-time') return c.ordersCount === 1;
            if (selectedSegment === 'leads') return c.ordersCount === 0 || c.source?.includes('Lead');
            return true;
        });
    }, [customers, searchTerm, selectedSegment]);

    // KPI Metrics
    const totalCustomersCount = customers.length;
    const totalRevenue = customers.reduce((acc, c) => acc + c.totalSpent, 0);
    const overallAov = totalCustomersCount > 0 ? (totalRevenue / orders.length) : 0;
    const repeatCustomersCount = customers.filter(c => c.ordersCount > 1).length;
    const repeatRate = totalCustomersCount > 0 ? Math.round((repeatCustomersCount / totalCustomersCount) * 100) : 0;

    // Export Customers to CSV
    const handleExportCSV = () => {
        if (customers.length === 0) {
            toast.error("No customer records to export");
            return;
        }

        const headers = ["Customer Name", "Email", "Orders Count", "Total Spent ($)", "AOV ($)", "Source", "City", "First Order", "Last Order"];
        const rows = customers.map(c => [
            `"${c.name.replace(/"/g, '""')}"`,
            `"${c.email}"`,
            c.ordersCount,
            c.totalSpent.toFixed(2),
            c.aov.toFixed(2),
            `"${(c.source || 'Storefront Order').replace(/"/g, '""')}"`,
            `"${c.city}"`,
            `"${new Date(c.firstOrderDate).toLocaleDateString()}"`,
            `"${new Date(c.lastOrderDate).toLocaleDateString()}"`
        ]);

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `customers_${currentStore?.username || 'store'}_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(`Exported ${customers.length} customer profiles to CSV!`);
    };

    if (loading) return <Loading />;

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 font-sans">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                            <Users size={20} />
                        </span>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Customers CRM Directory</h1>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                        Track customer lifetime value, repeat buyer retention, and purchase histories for {currentStore?.name || 'My Store'}
                    </p>
                </div>

                <div className="flex items-center gap-2.5">
                    <button
                        onClick={handleExportCSV}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:border-slate-300 font-bold text-xs shadow-xs transition"
                    >
                        <Download size={14} className="text-emerald-600" />
                        <span>Export CSV</span>
                    </button>
                </div>
            </div>

            {/* KPI Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Customers</span>
                        <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600"><Users size={16} /></span>
                    </div>
                    <p className="text-2xl font-black text-slate-900 mt-2">{totalCustomersCount}</p>
                    <span className="text-[11px] text-slate-400 font-medium">Distinct merchant buyers</span>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Customer Lifetime Value</span>
                        <span className="p-2 rounded-xl bg-blue-50 text-blue-600"><DollarSign size={16} /></span>
                    </div>
                    <p className="text-2xl font-black text-slate-900 mt-2">${totalRevenue.toFixed(2)}</p>
                    <span className="text-[11px] text-slate-400 font-medium">Cumulative gross spend</span>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Average Order Value</span>
                        <span className="p-2 rounded-xl bg-purple-50 text-purple-600"><TrendingUp size={16} /></span>
                    </div>
                    <p className="text-2xl font-black text-slate-900 mt-2">${overallAov.toFixed(2)}</p>
                    <span className="text-[11px] text-slate-400 font-medium">Per processed transaction</span>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Repeat Customer Rate</span>
                        <span className="p-2 rounded-xl bg-amber-50 text-amber-600"><UserCheck size={16} /></span>
                    </div>
                    <p className="text-2xl font-black text-slate-900 mt-2">{repeatRate}%</p>
                    <span className="text-[11px] text-slate-400 font-medium">{repeatCustomersCount} returning shoppers</span>
                </div>
            </div>

            {/* Controls Bar: Search & Segments */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                {/* Search Input */}
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                    <input 
                        type="text" 
                        placeholder="Search by name, email, or city..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-500 focus:bg-white transition"
                    />
                </div>

                {/* Segment Filter Buttons */}
                <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
                    {[
                        { id: 'all', label: `All (${customers.length})` },
                        { id: 'vip', label: `VIP $100+ (${customers.filter(c => c.totalSpent >= 100).length})` },
                        { id: 'repeat', label: `Repeat (${customers.filter(c => c.ordersCount > 1).length})` },
                        { id: 'first-time', label: `New (${customers.filter(c => c.ordersCount === 1).length})` },
                        { id: 'leads', label: `Bio Leads (${customers.filter(c => c.ordersCount === 0 || c.source?.includes('Lead')).length})` }
                    ].map(seg => (
                        <button
                            key={seg.id}
                            onClick={() => setSelectedSegment(seg.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                                selectedSegment === seg.id
                                    ? 'bg-slate-900 text-white shadow-xs'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            {seg.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Customers Table */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                                <th className="py-3.5 px-6">Customer</th>
                                <th className="py-3.5 px-4">Contact</th>
                                <th className="py-3.5 px-4">Orders</th>
                                <th className="py-3.5 px-4">Total Spend</th>
                                <th className="py-3.5 px-4">AOV</th>
                                <th className="py-3.5 px-4">Last Active</th>
                                <th className="py-3.5 px-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredCustomers.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-slate-400">
                                        <Users size={32} className="mx-auto mb-2 opacity-40" />
                                        <p className="font-semibold text-slate-600">No customers found</p>
                                        <p className="text-[11px] text-slate-400 mt-0.5">
                                            {searchTerm ? "No customers match your search criteria" : "Customers will appear here automatically when orders are placed"}
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                filteredCustomers.map(customer => (
                                    <tr 
                                        key={customer.id}
                                        className="hover:bg-slate-50/60 transition cursor-pointer"
                                        onClick={() => setSelectedCustomer(customer)}
                                    >
                                        {/* Customer Name */}
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="size-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white font-extrabold flex items-center justify-center text-xs shadow-xs">
                                                    {customer.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <span className="font-bold text-slate-900 block">{customer.name}</span>
                                                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                                        <MapPin size={9} /> {customer.city}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Contact */}
                                        <td className="py-4 px-4 text-slate-600 font-mono">
                                            {customer.email}
                                        </td>

                                        {/* Orders Count & Source */}
                                        <td className="py-4 px-4">
                                            {customer.ordersCount > 0 ? (
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                                    customer.ordersCount > 1 
                                                        ? 'bg-purple-100 text-purple-700' 
                                                        : 'bg-slate-100 text-slate-600'
                                                }`}>
                                                    {customer.ordersCount} {customer.ordersCount === 1 ? 'order' : 'orders'}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                                    Bio Lead Magnet
                                                </span>
                                            )}
                                        </td>

                                        {/* Total Spend */}
                                        <td className="py-4 px-4 font-extrabold text-emerald-600">
                                            ${customer.totalSpent.toFixed(2)}
                                        </td>

                                        {/* AOV */}
                                        <td className="py-4 px-4 text-slate-600 font-medium">
                                            ${customer.aov.toFixed(2)}
                                        </td>

                                        {/* Last Active */}
                                        <td className="py-4 px-4 text-slate-400 text-[11px]">
                                            {new Date(customer.lastOrderDate).toLocaleDateString()}
                                        </td>

                                        {/* Actions */}
                                        <td className="py-4 px-6 text-right">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedCustomer(customer);
                                                }}
                                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition"
                                            >
                                                <span>View History</span>
                                                <ArrowUpRight size={12} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Customer Details & History Modal */}
            {selectedCustomer && (
                <div 
                    className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
                    onClick={() => setSelectedCustomer(null)}
                >
                    <div 
                        className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-slate-200 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-start justify-between pb-5 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="size-12 rounded-2xl bg-emerald-500 text-white font-extrabold flex items-center justify-center text-lg shadow-sm">
                                    {selectedCustomer.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900">{selectedCustomer.name}</h3>
                                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                                        <a href={`mailto:${selectedCustomer.email}`} className="text-emerald-600 hover:underline flex items-center gap-1 font-mono">
                                            <Mail size={12} /> {selectedCustomer.email}
                                        </a>
                                        {selectedCustomer.city !== 'Unknown' && (
                                            <span className="flex items-center gap-1">
                                                <MapPin size={12} /> {selectedCustomer.city}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedCustomer(null)}
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Customer Metrics Strip */}
                        <div className="grid grid-cols-3 gap-3 my-5 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Spent</span>
                                <p className="text-lg font-black text-emerald-600 mt-0.5">${selectedCustomer.totalSpent.toFixed(2)}</p>
                            </div>
                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Orders</span>
                                <p className="text-lg font-black text-slate-800 mt-0.5">{selectedCustomer.ordersCount}</p>
                            </div>
                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Average Spend</span>
                                <p className="text-lg font-black text-slate-800 mt-0.5">${selectedCustomer.aov.toFixed(2)}</p>
                            </div>
                        </div>

                        {/* Order History Timeline or Lead Status */}
                        <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                                {selectedCustomer.orders.length > 0 ? "Order History Timeline" : "Subscriber Information"}
                            </h4>
                            {selectedCustomer.orders.length === 0 ? (
                                <div className="p-4 rounded-2xl border border-rose-100 bg-rose-50/50 text-slate-700 space-y-1 text-xs">
                                    <p className="font-bold text-rose-800 flex items-center gap-1.5">
                                        <Sparkles size={14} /> Source: {selectedCustomer.source || 'Stan Bio Lead Magnet'}
                                    </p>
                                    <p className="text-slate-500 text-[11px]">
                                        Subscribed on {new Date(selectedCustomer.firstOrderDate).toLocaleDateString()}. No checkout orders placed yet.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {selectedCustomer.orders.map((ord, idx) => (
                                        <div key={idx} className="p-4 rounded-2xl border border-slate-100 bg-white hover:border-slate-200 transition shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono font-bold text-xs text-slate-900">Order #{ord.id || ord.orderId || `ORD-${idx+1}`}</span>
                                                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                                        {ord.status || 'completed'}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                                                    <Calendar size={11} /> {new Date(ord.createdAt || Date.now()).toLocaleDateString()}
                                                    {ord.items && <span>• {ord.items.length} items</span>}
                                                </p>
                                            </div>
                                            <div className="text-right flex items-center gap-3">
                                                <span className="font-black text-emerald-600 text-sm">
                                                    ${(Number(ord.total || ord.amount || ord.price) || 0).toFixed(2)}
                                                </span>
                                                {ord.trackingNumber && (
                                                    <span className="text-[10px] font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100">
                                                        {ord.trackingNumber}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Direct Actions */}
                        <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-end gap-2.5">
                            <a 
                                href={`mailto:${selectedCustomer.email}?subject=Message regarding your order from ${currentStore?.name || 'GumShop'}`}
                                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition shadow-xs"
                            >
                                <Mail size={14} />
                                <span>Send Direct Email</span>
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
