'use client'
import PageTitle from "@/components/PageTitle"
import { useEffect, useState } from "react";
import OrderItem from "@/components/OrderItem";
import { useAuth } from "@/lib/AuthContext";
import { getOrdersByUser, getProduct } from "@/lib/firebaseDb";
import Loading from "@/components/Loading";
import Link from "next/link";
import { PackageX, ShoppingBag, Truck } from "lucide-react";

export default function Orders() {
    const { user, loading: authLoading } = useAuth()
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchOrders = async () => {
        if (!user) {
            if (typeof window !== 'undefined') {
                try {
                    const localRaw = localStorage.getItem('gumshop_recent_orders');
                    if (localRaw) {
                        const localOrders = JSON.parse(localRaw);
                        if (Array.isArray(localOrders) && localOrders.length > 0) {
                            setOrders(localOrders);
                        }
                    }
                } catch {}
            }
            return setLoading(false);
        }

        try {
            const userOrders = await getOrdersByUser(user.uid);

            // Enrich order items with product data
            const enrichedOrders = await Promise.all(
                (userOrders || []).map(async (order) => {
                    const rawItems = (Array.isArray(order.orderItems) && order.orderItems.length > 0) 
                        ? order.orderItems 
                        : (order.orderItems && Object.values(order.orderItems).length > 0)
                            ? Object.values(order.orderItems)
                            : [{
                                name: typeof order.items === 'string' ? order.items : (order.productName || 'Store Order Item'),
                                price: order.total || order.amount || 0,
                                quantity: order.quantity || 1,
                                productId: order.productId || `prod_${order.id || 0}`,
                                image: order.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'
                            }];

                    const enrichedItems = await Promise.all(
                        rawItems.map(async (item) => {
                            const product = item.productId ? await getProduct(item.productId).catch(() => null) : null;
                            return { ...item, product: product || { name: item.name || 'Store Order Item', images: item.image ? [item.image] : [], id: item.productId } };
                        })
                    );
                    return { ...order, orderItems: enrichedItems, address: order.address || {} };
                })
            );

            setOrders(enrichedOrders);
        } catch (err) {
            console.error("Error fetching orders:", err);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (!authLoading) fetchOrders()
    }, [user, authLoading]);

    if (loading) return <Loading />

    return (
        <div className="min-h-[70vh] mx-4 sm:mx-6 pb-20">
            {orders.length > 0 ? (
                <div className="my-12 max-w-7xl mx-auto">
                    <PageTitle heading="My Orders" text={`Showing ${orders.length} order${orders.length > 1 ? 's' : ''}`} linkText={'Browse more stores'} />

                    <div className="overflow-x-auto mt-6 rounded-2xl border border-slate-200 bg-white shadow-xs">
                        <table className="w-full text-slate-600 text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-bold text-slate-500">
                                <tr>
                                    <th className="py-4 px-6 text-left">Product</th>
                                    <th className="py-4 px-6 text-center">Total Price</th>
                                    <th className="py-4 px-6 text-left">Delivery Address</th>
                                    <th className="py-4 px-6 text-left">Fulfillment Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {orders.map((order) => (
                                    <OrderItem order={order} key={order.id} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 my-10">
                    <div className="size-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
                        <PackageX size={30} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">You have no active orders</h2>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm">
                        Placed an order recently? It will automatically sync here once your payment is confirmed.
                    </p>
                    <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                        <Link href="/shop" className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-emerald-600 text-white font-semibold text-xs shadow-md hover:bg-emerald-500 transition">
                            <ShoppingBag size={14} />
                            <span>Browse Stores</span>
                        </Link>
                    </div>
                </div>
            )}
        </div>
    )
}