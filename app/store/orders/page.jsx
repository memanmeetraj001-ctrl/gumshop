'use client'
import { useEffect, useState, useMemo } from "react";
import Loading from "@/components/Loading";
import { useAuth } from "@/lib/AuthContext";
import { getOrdersByStore, updateOrder } from "@/lib/firebaseDb";
import { getActiveStore } from "@/lib/activeStore";
import toast from "react-hot-toast";
import { 
    ShoppingBag, 
    Download, 
    CheckCircle2, 
    Clock, 
    Truck, 
    Package, 
    Search, 
    RefreshCw,
    X,
    Eye,
    SlidersHorizontal,
    Mail,
    MapPin,
    Calendar,
    DollarSign,
    Printer,
    ExternalLink
} from "lucide-react";

export default function StoreOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    
    // Status Update Modal State
    const [editingOrder, setEditingOrder] = useState(null);
    const [newStatus, setNewStatus] = useState('shipped');
    const [carrier, setCarrier] = useState('USPS');
    const [trackingNumber, setTrackingNumber] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    // Order Details Modal State
    const [viewingOrder, setViewingOrder] = useState(null);

    const { user, loading: authLoading } = useAuth();
    const [isSyncing, setIsSyncing] = useState(false);
    const [currentStore, setCurrentStore] = useState(null);

    const handleSyncGumroad = async () => {
        setIsSyncing(true);
        try {
            const token = currentStore?.gumroadToken;
            if (!token) {
                toast.error("Please add your Gumroad Access Token in Store Settings first!");
                return;
            }

            const res = await fetch('/api/gumroad/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token: token.trim(),
                    storeId: currentStore?.id || 'store_default',
                    action: 'sync'
                })
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || 'Failed to sync Gumroad sales');
            }

            toast.success(data.message || `Synced ${data.count} sales from Gumroad!`);
            if (data.orders && data.orders.length > 0) {
                setOrders(prev => {
                    const existingIds = new Set(prev.map(o => o.id || o.orderId));
                    const newOnes = data.orders.filter(o => !existingIds.has(o.id));
                    return [...newOnes, ...prev];
                });
            }
        } catch (err) {
            console.error("Gumroad sync error:", err);
            toast.error(err.message || "Failed to sync sales from Gumroad");
        } finally {
            setIsSyncing(false);
        }
    };

    useEffect(() => {
        let isMounted = true;

        const loadOrders = async () => {
            try {
                let store = await getActiveStore(user);
                if (!isMounted) return;
                setCurrentStore(store);

                const storeId = store?.id || 'store_default';
                let fetchedOrders = [];

                // 1. Fetch from database with 2.5s safe timeout to prevent any stuck spinner
                try {
                    fetchedOrders = await Promise.race([
                        getOrdersByStore(storeId),
                        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000))
                    ]);
                } catch (e) {
                    console.warn("Orders fetch fallback:", e);
                }

                // 2. Fetch from localStorage: check store-scoped orders first, then filter general orders
                let localOrders = [];
                if (typeof window !== 'undefined') {
                    try {
                        const cleanSid = storeId.toLowerCase().replace(/^store_/, '');
                        const storeScopedRaw = localStorage.getItem(`gumshop_recent_orders_${storeId}`) || 
                                               localStorage.getItem(`gumshop_recent_orders_store_${cleanSid}`) ||
                                               localStorage.getItem(`gumshop_recent_orders_${cleanSid}`);
                        const storeScoped = storeScopedRaw ? JSON.parse(storeScopedRaw) : [];

                        const generalRaw = localStorage.getItem('gumshop_recent_orders');
                        const general = generalRaw ? JSON.parse(generalRaw) : [];
                        const generalFiltered = general.filter(o => {
                            if (!o.storeId) return false;
                            const oSid = o.storeId.toLowerCase().replace(/^store_/, '');
                            return oSid === cleanSid || o.storeId === storeId;
                        });

                        localOrders = [...storeScoped, ...generalFiltered];
                    } catch (e) {}
                }

                // 3. Merge & deduplicate
                const orderMap = new Map();
                (localOrders || []).forEach(o => {
                    const id = o.id || o.orderSessionId;
                    if (id) orderMap.set(id, { id, ...o });
                });
                (fetchedOrders || []).forEach(o => {
                    const id = o.id || o.orderSessionId;
                    if (id && !orderMap.has(id)) {
                        orderMap.set(id, { id, ...o });
                    }
                });

                const list = Array.from(orderMap.values()).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
                if (isMounted) setOrders(list);
            } catch (err) {
                console.error("Orders fetch error:", err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        loadOrders();

        return () => {
            isMounted = false;
        };
    }, [user, authLoading]);

    // 1-Click Customer CSV Export
    const handleExportCsv = () => {
        if (orders.length === 0) {
            toast.error("No orders to export yet.");
            return;
        }

        const headers = ["Order ID", "Customer Name", "Customer Email", "Shipping Address", "Total ($)", "Status", "Tracking", "Date", "Items"];
        const rows = orders.map(o => [
            o.id || o.orderId,
            `"${o.customer?.name || 'Customer'}"`,
            `"${o.customer?.email || ''}"`,
            `"${(typeof o.customer?.shippingAddress === 'string' ? o.customer.shippingAddress : (o.address?.street || '')).replace(/"/g, '""')}"`,
            o.total || 0,
            o.status || 'paid',
            `"${o.trackingNumber || ''}"`,
            `"${new Date(o.createdAt || Date.now()).toLocaleDateString()}"`,
            `"${(typeof o.items === 'string' ? o.items : 'Order Items').replace(/"/g, '""')}"`
        ]);

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `gumshop_orders_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Orders CSV downloaded successfully!");
    };

    const getCarrierTrackingUrl = (carrierName, trackNum) => {
        if (!trackNum) return null;
        const cleanNum = trackNum.trim();
        const c = (carrierName || '').toLowerCase().replace(/[^a-z]/g, '');
        if (c.includes('usps')) return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${cleanNum}`;
        if (c.includes('fedex')) return `https://www.fedex.com/fedextrack/?trknbr=${cleanNum}`;
        if (c.includes('ups')) return `https://www.ups.com/track?tracknum=${cleanNum}`;
        if (c.includes('dhl')) return `https://www.dhl.com/en/express/tracking.html?AWB=${cleanNum}`;
        if (c.includes('bluedart')) return `https://www.bluedart.com/tracking?track=${cleanNum}`;
        if (c.includes('indiapost')) return `https://www.indiapost.gov.in/_layouts/15/dpt.cpt.ui/track.aspx?${cleanNum}`;
        if (c.includes('royalmail')) return `https://www.royalmail.com/track-your-item#/tracking-results/${cleanNum}`;
        return `https://www.google.com/search?q=${encodeURIComponent('tracking ' + cleanNum)}`;
    };

    const handlePrintInvoice = (order) => {
        if (!order) return;
        const storeName = currentStore?.name || "GumShop Store";
        const customerName = order.customer?.name || order.customerName || "Valued Customer";
        const customerEmail = order.customer?.email || order.email || "N/A";
        const address = typeof order.customer?.shippingAddress === 'string' 
            ? order.customer.shippingAddress 
            : (order.address?.street || order.shippingAddress || "Standard Ground Shipping");
        const orderDate = new Date(order.createdAt || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        const items = Array.isArray(order.orderItems) ? order.orderItems : 
            (typeof order.items === 'string' ? [{ name: order.items, quantity: 1, price: order.total }] : [{ name: "Catalog Product", quantity: 1, price: order.total }]);
        const totalAmount = Number(order.total || 0).toFixed(2);

        const printHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Packing Slip & Invoice #${order.id}</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; }
                    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #e2e8f0; padding-bottom: 24px; margin-bottom: 30px; }
                    .logo { font-size: 26px; font-weight: 900; color: #0f172a; }
                    .badge { display: inline-block; padding: 4px 12px; background: #ecfdf5; color: #047857; font-weight: 700; font-size: 11px; border-radius: 9999px; text-transform: uppercase; margin-top: 6px; }
                    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 30px; }
                    .section-title { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; font-weight: 800; margin-bottom: 8px; }
                    .table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                    .table th { background: #f8fafc; padding: 12px 16px; text-align: left; font-size: 11px; text-transform: uppercase; color: #475569; border-bottom: 1px solid #cbd5e1; }
                    .table td { padding: 14px 16px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
                    .total-box { margin-left: auto; width: 280px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; }
                    .total-row { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px; color: #475569; }
                    .total-row.grand { font-size: 18px; font-weight: 900; color: #0f172a; border-top: 2px solid #cbd5e1; padding-top: 10px; margin-top: 8px; }
                    .footer { text-align: center; margin-top: 60px; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div>
                        <div class="logo">${storeName}</div>
                        <span class="badge">PACKING SLIP & TAX INVOICE</span>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-weight: 800; font-size: 16px;">Order #${order.id}</div>
                        <div style="color: #64748b; font-size: 12px; margin-top: 4px;">Date: ${orderDate}</div>
                        ${order.trackingNumber ? `<div style="font-family: monospace; font-size: 11px; color: #047857; margin-top: 4px;">Carrier: ${order.carrier || 'Standard'} • ${order.trackingNumber}</div>` : ''}
                    </div>
                </div>

                <div class="grid">
                    <div>
                        <div class="section-title">Ship To Customer</div>
                        <div style="font-weight: 700; font-size: 14px;">${customerName}</div>
                        <div style="color: #475569; font-size: 13px; white-space: pre-line; margin-top: 4px;">${address}</div>
                        <div style="color: #64748b; font-size: 12px; margin-top: 4px;">Email: ${customerEmail}</div>
                    </div>
                    <div>
                        <div class="section-title">Fulfillment Details</div>
                        <div style="font-size: 13px; color: #475569;">Status: <b style="text-transform: capitalize; color: #047857;">${order.status || 'Fulfilled'}</b></div>
                        <div style="font-size: 13px; color: #475569; margin-top: 4px;">Payment Method: <b>Online Checkout (Verified)</b></div>
                    </div>
                </div>

                <table class="table">
                    <thead>
                        <tr>
                            <th>Item Description</th>
                            <th style="text-align: center;">Qty</th>
                            <th style="text-align: right;">Price</th>
                            <th style="text-align: right;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${items.map(it => `
                            <tr>
                                <td style="font-weight: 600;">${it.name || 'Catalog Item'}</td>
                                <td style="text-align: center;">${it.quantity || 1}</td>
                                <td style="text-align: right;">$${Number(it.price || 0).toFixed(2)}</td>
                                <td style="text-align: right; font-weight: 700;">$${(Number(it.quantity || 1) * Number(it.price || 0)).toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div class="total-box">
                    <div class="total-row"><span>Subtotal:</span><span>$${totalAmount}</span></div>
                    <div class="total-row"><span>Shipping:</span><span>FREE</span></div>
                    <div class="total-row grand"><span>Total Paid:</span><span>$${totalAmount}</span></div>
                </div>

                <div class="footer">
                    <p>Thank you for shopping with <b>${storeName}</b>! For any customer support questions, contact us via your store portal.</p>
                </div>

                <script>
                    window.onload = function() { window.print(); };
                </script>
            </body>
            </html>
        `;

        const printWindow = window.open('', '_blank', 'width=850,height=900');
        if (printWindow) {
            printWindow.document.open();
            printWindow.document.write(printHtml);
            printWindow.document.close();
        } else {
            toast.error("Please allow pop-ups to print packing slips.");
        }
    };

    const handleOpenStatusModal = (order) => {
        setEditingOrder(order);
        setNewStatus(order.status || 'shipped');
        setCarrier(order.carrier || 'USPS');
        setTrackingNumber(order.trackingNumber || '');
    };

    const handleSaveStatus = async (e) => {
        e.preventDefault();
        if (!editingOrder) return;
        setIsUpdating(true);

        try {
            const updates = { 
                status: newStatus,
                carrier: carrier,
                trackingNumber: trackingNumber.trim() || undefined
            };

            await updateOrder(editingOrder.id, updates);
            setOrders(prev => prev.map(o => o.id === editingOrder.id ? { ...o, ...updates } : o));
            toast.success(`Order marked as ${newStatus}! 🎉`);
            setEditingOrder(null);
        } catch (e) {
            toast.error("Failed to update order status");
        } finally {
            setIsUpdating(false);
        }
    };

    const filteredOrders = useMemo(() => {
        return orders.filter(o => {
            const query = searchTerm.toLowerCase().trim();
            const matchesQuery = !query || 
                (o.id || '').toLowerCase().includes(query) ||
                (o.customer?.name || '').toLowerCase().includes(query) ||
                (o.customer?.email || '').toLowerCase().includes(query) ||
                (typeof o.items === 'string' && o.items.toLowerCase().includes(query));

            const matchesStatus = statusFilter === 'ALL' || 
                (o.status || 'processing').toLowerCase() === statusFilter.toLowerCase();

            return matchesQuery && matchesStatus;
        });
    }, [orders, searchTerm, statusFilter]);

    if (loading) return <Loading />;

    return (
        <div className="p-4 sm:p-8 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2.5">
                        <span>Customer Orders</span>
                        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                            {orders.length} Total
                        </span>
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Track live orders, update fulfillment statuses, and manage shipments.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleSyncGumroad}
                        disabled={isSyncing}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-pink-50 hover:bg-pink-100 text-xs font-bold text-pink-700 border border-pink-200 transition disabled:opacity-50"
                        title="Fetch recent customer sales directly from your connected Gumroad account"
                    >
                        <RefreshCw size={14} className={isSyncing ? "animate-spin" : ""} />
                        <span>{isSyncing ? "Syncing..." : "Sync Gumroad"}</span>
                    </button>
                    <button
                        onClick={handleExportCsv}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition"
                    >
                        <Download size={14} />
                        <span>Export CSV</span>
                    </button>
                </div>
            </div>

            {/* Filter & Search Toolbar */}
            <div className="mt-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                {/* Search Bar */}
                <div className="flex items-center gap-2 px-3.5 py-2.5 bg-white border border-slate-200 rounded-2xl w-full md:max-w-xs text-sm shadow-xs">
                    <Search size={16} className="text-slate-400 shrink-0" />
                    <input 
                        type="text"
                        placeholder="Search by order ID, name, email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-transparent outline-none text-xs text-slate-800 placeholder:text-slate-400 font-medium"
                    />
                    {searchTerm && (
                        <button onClick={() => setSearchTerm('')} className="text-slate-400 hover:text-slate-600">
                            <X size={14} />
                        </button>
                    )}
                </div>

                {/* Status Tabs */}
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl text-xs font-bold text-slate-600 overflow-x-auto">
                    {[
                        { id: 'ALL', label: 'All Orders' },
                        { id: 'processing', label: 'Processing' },
                        { id: 'shipped', label: 'Shipped' },
                        { id: 'delivered', label: 'Delivered' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setStatusFilter(tab.id)}
                            className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap ${
                                statusFilter === tab.id
                                    ? 'bg-white text-slate-900 shadow-xs'
                                    : 'hover:text-slate-900 text-slate-500'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Orders Table */}
            <div className="mt-4 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-500">
                                <th className="py-4 px-6">Order ID & Date</th>
                                <th className="py-4 px-4">Customer Details</th>
                                <th className="py-4 px-4">Purchased Items</th>
                                <th className="py-4 px-4">Total Paid</th>
                                <th className="py-4 px-4">Fulfillment</th>
                                <th className="py-4 px-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-14 text-center text-slate-400 text-sm">
                                        <div className="size-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                                            <ShoppingBag size={22} />
                                        </div>
                                        {orders.length === 0 ? (
                                            <>
                                                <p className="font-bold text-slate-700">No customer orders yet</p>
                                                <p className="text-xs text-slate-400 mt-1">
                                                    Orders placed on your storefront will appear here instantly.
                                                </p>
                                            </>
                                        ) : (
                                            <>
                                                <p className="font-bold text-slate-700">No orders match this filter</p>
                                                <button
                                                    onClick={() => { setSearchTerm(''); setStatusFilter('ALL'); }}
                                                    className="text-xs text-emerald-600 font-bold hover:underline mt-2 inline-block"
                                                >
                                                    Clear filters
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map((order) => {
                                    const formattedDate = new Date(order.createdAt || Date.now()).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric'
                                    });

                                    const isDelivered = order.status === 'delivered';
                                    const isShipped = order.status === 'shipped';

                                    return (
                                        <tr key={order.id} className="hover:bg-slate-50/50 transition">
                                            {/* Order ID & Date */}
                                            <td className="py-4 px-6">
                                                <p className="font-mono font-bold text-xs text-slate-900 truncate max-w-28">
                                                    {order.id}
                                                </p>
                                                <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                                                    <Calendar size={11} />
                                                    <span>{formattedDate}</span>
                                                </p>
                                            </td>

                                            {/* Customer & Address */}
                                            <td className="py-4 px-4">
                                                <p className="font-bold text-xs text-slate-900">{order.customer?.name || 'Customer'}</p>
                                                <p className="text-[11px] text-slate-500 truncate max-w-xs">{order.customer?.email || 'No email'}</p>
                                                <p className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5">
                                                    {typeof order.customer?.shippingAddress === 'string' 
                                                        ? order.customer.shippingAddress 
                                                        : (order.address?.street || 'Provided at checkout')}
                                                </p>
                                            </td>

                                            {/* Items */}
                                            <td className="py-4 px-4 max-w-xs">
                                                <p className="text-xs text-slate-700 truncate font-semibold">
                                                    {typeof order.items === 'string' ? order.items : (order.orderItems?.map(i => `${i.quantity || 1}x ${i.name}`).join(', ') || 'Item')}
                                                </p>
                                                {order.trackingNumber && (
                                                    <p className="text-[10px] font-mono text-emerald-700 mt-0.5">
                                                        Track: {order.trackingNumber}
                                                    </p>
                                                )}
                                            </td>

                                            {/* Total Paid */}
                                            <td className="py-4 px-4 font-extrabold text-emerald-600">
                                                ${(Number(order.total) || 0).toFixed(2)}
                                            </td>

                                            {/* Status Badge */}
                                            <td className="py-4 px-4">
                                                <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                                                    isDelivered 
                                                        ? 'bg-emerald-100 text-emerald-800' 
                                                        : isShipped
                                                            ? 'bg-blue-100 text-blue-800'
                                                            : 'bg-amber-100 text-amber-800'
                                                }`}>
                                                    {isDelivered && <CheckCircle2 size={11} />}
                                                    {isShipped && <Truck size={11} />}
                                                    {!isDelivered && !isShipped && <Clock size={11} />}
                                                    <span>{order.status || 'processing'}</span>
                                                </span>
                                            </td>

                                            {/* Actions */}
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => setViewingOrder(order)}
                                                        className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
                                                        title="View Order Details"
                                                    >
                                                        <Eye size={15} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleOpenStatusModal(order)}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition shadow-xs"
                                                    >
                                                        <span>Update Status</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Status & Tracking Modal */}
            {editingOrder && (
                <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in" onClick={() => setEditingOrder(null)}>
                    <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 animate-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Update Fulfillment</h3>
                                <p className="text-xs text-slate-400 font-mono mt-0.5">Order #{editingOrder.id}</p>
                            </div>
                            <button
                                onClick={() => setEditingOrder(null)}
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveStatus} className="mt-5 space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                    Fulfillment Status
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['processing', 'shipped', 'delivered'].map(st => (
                                        <button
                                            key={st}
                                            type="button"
                                            onClick={() => setNewStatus(st)}
                                            className={`py-2 px-3 rounded-xl text-xs font-bold capitalize transition border ${
                                                newStatus === st
                                                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                            }`}
                                        >
                                            {st}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                    Shipping Carrier
                                </label>
                                <select
                                    value={carrier}
                                    onChange={(e) => setCarrier(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-emerald-500 focus:bg-white transition mb-3"
                                >
                                    <option value="USPS">USPS (United States Postal Service)</option>
                                    <option value="FedEx">FedEx Express / Ground</option>
                                    <option value="UPS">UPS (United Parcel Service)</option>
                                    <option value="DHL">DHL Express</option>
                                    <option value="BlueDart">BlueDart Express</option>
                                    <option value="IndiaPost">India Post Speed Post</option>
                                    <option value="RoyalMail">Royal Mail</option>
                                    <option value="CanadaPost">Canada Post</option>
                                    <option value="AustraliaPost">Australia Post</option>
                                    <option value="Custom">Other Carrier / Courier</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                    Shipping Tracking Number
                                </label>
                                <input 
                                    type="text"
                                    placeholder="e.g. USPS-9400111899223190 or YT123456789"
                                    value={trackingNumber}
                                    onChange={(e) => setTrackingNumber(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono outline-none focus:border-emerald-500 focus:bg-white transition"
                                />
                            </div>

                            <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setEditingOrder(null)}
                                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isUpdating}
                                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition disabled:opacity-50"
                                >
                                    {isUpdating ? "Saving..." : "Save Status"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Order Details View Modal */}
            {viewingOrder && (
                <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in" onClick={() => setViewingOrder(null)}>
                    <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Order Details</h3>
                                <p className="text-xs text-slate-400 font-mono mt-0.5">#{viewingOrder.id}</p>
                            </div>
                            <button
                                onClick={() => setViewingOrder(null)}
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="mt-5 space-y-4 text-xs">
                            {/* Customer info */}
                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                                <p className="font-bold text-slate-900 text-sm">{viewingOrder.customer?.name || 'Customer'}</p>
                                <p className="text-slate-600 flex items-center gap-1.5">
                                    <Mail size={13} className="text-slate-400" />
                                    <span>{viewingOrder.customer?.email || 'No email provided'}</span>
                                </p>
                                <div className="text-slate-600 flex items-start gap-1.5 pt-1 border-t border-slate-200/60">
                                    <MapPin size={13} className="text-slate-400 shrink-0 mt-0.5" />
                                    <span className="whitespace-pre-line">
                                        {typeof viewingOrder.customer?.shippingAddress === 'string' 
                                            ? viewingOrder.customer.shippingAddress 
                                            : (viewingOrder.address?.street || 'Standard Shipping')}
                                    </span>
                                </div>
                            </div>

                            {/* Items & Total */}
                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                                <p className="font-bold uppercase tracking-wider text-[11px] text-slate-500 mb-2">Items Ordered</p>
                                <p className="text-slate-800 font-semibold leading-relaxed">
                                    {typeof viewingOrder.items === 'string' 
                                        ? viewingOrder.items 
                                        : (viewingOrder.orderItems?.map(i => `${i.quantity || 1}x ${i.name} ($${i.price})`).join('\n') || 'Item')}
                                </p>
                                <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between font-bold text-sm">
                                    <span className="text-slate-600">Total Amount Paid</span>
                                    <span className="text-emerald-600 font-black text-base">${(Number(viewingOrder.total) || 0).toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Tracking info if available */}
                            {viewingOrder.trackingNumber && (
                                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between">
                                    <div>
                                        <p className="font-bold text-[11px] uppercase tracking-wider text-emerald-800">
                                            {viewingOrder.carrier || 'Carrier'} Tracking Number
                                        </p>
                                        <p className="font-mono font-bold mt-0.5">{viewingOrder.trackingNumber}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <a
                                            href={getCarrierTrackingUrl(viewingOrder.carrier, viewingOrder.trackingNumber)}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg shadow-xs transition"
                                        >
                                            <span>Track Live</span>
                                            <ExternalLink size={11} />
                                        </a>
                                        <Truck size={20} className="text-emerald-600" />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                            <button
                                type="button"
                                onClick={() => handlePrintInvoice(viewingOrder)}
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition"
                            >
                                <Printer size={13} className="text-emerald-600" />
                                <span>Print Packing Slip</span>
                            </button>

                            <button
                                onClick={() => setViewingOrder(null)}
                                className="px-5 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
