'use client'
import Loading from "@/components/Loading"
import { CircleDollarSignIcon, ShoppingBasketIcon, StarIcon, TagsIcon, Zap, Copy, ExternalLink, Smartphone } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useAuth } from "@/lib/AuthContext"
import { getProductsByStore, getOrdersByStore, getAllRatings, getProduct, getUser, isProductDeleted } from "@/lib/firebaseDb"
import { getActiveStore } from "@/lib/activeStore"
import toast from "react-hot-toast"

export default function Dashboard() {

    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$'
    const { user, loading: authLoading } = useAuth()
    const router = useRouter()

    const [loading, setLoading] = useState(false)
    const [currentStore, setCurrentStore] = useState(null)
    const [copiedBio, setCopiedBio] = useState(false)
    const [dashboardData, setDashboardData] = useState({
        totalProducts: 0,
        totalEarnings: '0.00',
        totalOrders: 0,
        ratings: [],
    })

    const dashboardCardsData = [
        { title: 'Total Products', value: dashboardData.totalProducts, icon: ShoppingBasketIcon },
        { title: 'Total Earnings', value: currency + dashboardData.totalEarnings, icon: CircleDollarSignIcon },
        { title: 'Total Orders', value: dashboardData.totalOrders, icon: TagsIcon },
        { title: 'Total Ratings', value: dashboardData.ratings.length, icon: StarIcon },
    ]

    const fetchDashboardData = async () => {
        try {
            let store = await getActiveStore(user);
            if (!store) {
                const { getActiveStoreSync } = await import('@/lib/activeStore');
                store = getActiveStoreSync();
            }
            if (!store) {
                setLoading(false);
                return;
            }
            setCurrentStore(store);

            let [products, orders] = await Promise.all([
                getProductsByStore(store.id),
                getOrdersByStore(store.id),
            ]);

            // Fallback to locally cached store products if database query is empty
            if ((!products || products.length === 0) && store.products && store.products.length > 0) {
                products = store.products;
            }
            products = (products || []).filter(p => p && p.id && !isProductDeleted(p.id));

            // Extract and flatten authentic ratings safely
            let storeRatings = (products || []).flatMap(product => 
                (Array.isArray(product.rating) ? product.rating : []).map(r => ({
                    ...r,
                    productId: product.id,
                    product: { id: product.id, name: product.name, category: product.category }
                }))
            ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            // Merge local orders strictly filtered by storeId
            let localOrders = [];
            if (typeof window !== 'undefined') {
                try {
                    const cleanSid = (store.id || store.username || '').toLowerCase().replace(/^store_/, '');
                    const storeScopedRaw = localStorage.getItem(`gumshop_recent_orders_${store.id}`) ||
                                           localStorage.getItem(`gumshop_recent_orders_store_${cleanSid}`) ||
                                           localStorage.getItem(`gumshop_recent_orders_${cleanSid}`);
                    const storeScoped = storeScopedRaw ? JSON.parse(storeScopedRaw) : [];

                    const generalRaw = localStorage.getItem('gumshop_recent_orders');
                    const general = generalRaw ? JSON.parse(generalRaw) : [];
                    const generalFiltered = general.filter(o => {
                        if (!o.storeId) return false;
                        const oSid = o.storeId.toLowerCase().replace(/^store_/, '');
                        return oSid === cleanSid || o.storeId === store.id;
                    });

                    localOrders = [...storeScoped, ...generalFiltered];
                } catch (e) {}
            }

            const allOrdersMap = new Map();
            (orders || []).forEach(o => {
                const id = o.id || o.orderSessionId;
                if (id) allOrdersMap.set(id, o);
            });
            (localOrders || []).forEach(o => {
                const id = o.id || o.orderSessionId;
                if (id) allOrdersMap.set(id, o);
            });
            const mergedOrders = Array.from(allOrdersMap.values());

            const totalEarnings = mergedOrders.reduce((acc, o) => acc + (parseFloat(o.total) || 0), 0);

            setDashboardData({
                totalProducts: (products || []).length,
                totalEarnings: totalEarnings.toFixed(2),
                totalOrders: mergedOrders.length,
                ratings: storeRatings.slice(0, 20),
            });
        } catch (err) {
            console.error("Error fetching dashboard:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 3000);
        if (!authLoading) {
            fetchDashboardData().finally(() => clearTimeout(timer));
        }
        return () => clearTimeout(timer);
    }, [user, authLoading])

    return (
        <div className=" text-slate-500 mb-28">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-2xl">Seller <span className="text-slate-800 font-medium">Dashboard</span></h1>
                
                {/* Direct Link to Creator Bio */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => {
                            const slug = currentStore?.username || currentStore?.name?.toLowerCase().replace(/[^a-z0-9-]+/g, '-') || 'store';
                            const origin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'https://www.gumshop.online';
                            const url = `${origin}/creator/${slug}`;
                            navigator.clipboard.writeText(url);
                            setCopiedBio(true);
                            toast.success("Creator Bio Link copied!");
                            setTimeout(() => setCopiedBio(false), 2000);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition"
                    >
                        <Copy size={13} />
                        <span>{copiedBio ? "Copied!" : "Copy Bio Link"}</span>
                    </button>
                    <Link
                        href={`/creator/${currentStore?.username || currentStore?.name?.toLowerCase().replace(/[^a-z0-9-]+/g, '-') || 'store'}`}
                        target="_blank"
                        className="px-3.5 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
                    >
                        <Smartphone size={13} />
                        <span>Open Mobile Bio Store</span>
                        <ExternalLink size={12} />
                    </Link>
                </div>
            </div>

            {/* Creator Bio Feature Highlight Card */}
            <div className="bg-gradient-to-r from-rose-500/10 via-pink-500/5 to-purple-500/10 border border-rose-200/80 rounded-2xl p-4 sm:p-5 mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                    <div className="size-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-500/20">
                        <Zap size={20} className="fill-white" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-extrabold text-slate-900">Dedicated Mobile Creator Bio Mode</h3>
                            <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold uppercase tracking-wider">Active</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Single-column link-in-bio storefront designed for Instagram & TikTok bios with 1-tap in-page checkout.
                        </p>
                    </div>
                </div>
                <Link
                    href={`/creator/${currentStore?.username || currentStore?.name?.toLowerCase().replace(/[^a-z0-9-]+/g, '-') || 'demo'}`}
                    target="_blank"
                    className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 shrink-0 self-start sm:self-auto"
                >
                    <span>Preview Mobile Mode</span>
                    <ExternalLink size={12} />
                </Link>
            </div>

            <div className="flex flex-wrap gap-5 my-8">
                {
                    dashboardCardsData.map((card, index) => (
                        <div key={index} className="flex items-center gap-11 border border-slate-200 p-3 px-6 rounded-lg">
                            <div className="flex flex-col gap-3 text-xs">
                                <p>{card.title}</p>
                                <b className="text-2xl font-medium text-slate-700">{card.value}</b>
                            </div>
                            <card.icon size={50} className=" w-11 h-11 p-2.5 text-slate-400 bg-slate-100 rounded-full" />
                        </div>
                    ))
                }
            </div>

            <h2>Total Reviews</h2>

            <div className="mt-5">
                {dashboardData.ratings.length === 0 ? (
                    <div className="p-8 border border-dashed border-slate-200 rounded-3xl bg-white text-center max-w-4xl shadow-xs">
                        <div className="size-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                            <StarIcon size={22} className="fill-emerald-600/20" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-800">No customer reviews yet</h3>
                        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                            Genuine buyer reviews will appear here automatically once customers receive and rate your products.
                        </p>
                    </div>
                ) : (
                    dashboardData.ratings.map((review, index) => (
                        <div key={index} className="flex max-sm:flex-col gap-5 sm:items-center justify-between py-6 border-b border-slate-200 text-sm text-slate-600 max-w-4xl">
                            <div>
                                <div className="flex gap-3">
                                    {review.user?.image ? (
                                        <Image src={review.user.image} alt="" className="w-10 aspect-square rounded-full" width={100} height={100} />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-medium">
                                            {review.user?.name?.charAt(0)?.toUpperCase() || '?'}
                                        </div>
                                    )}
                                    <div>
                                        <p className="font-medium">{review.user?.name || "Verified Buyer"}</p>
                                        <p className="font-light text-slate-500">{new Date(review.createdAt || Date.now()).toDateString()}</p>
                                    </div>
                                </div>
                                <p className="mt-3 text-slate-500 max-w-xs leading-6">{review.review || "Great product, fast delivery!"}</p>
                            </div>
                            <div className="flex flex-col justify-between gap-6 sm:items-end">
                                <div className="flex flex-col sm:items-end">
                                    <p className="text-slate-400">{review.product?.category || "Featured"}</p>
                                    <p className="font-medium">{review.product?.name || "Curated Product"}</p>
                                    <div className='flex items-center'>
                                        {Array(5).fill('').map((_, index) => (
                                            <StarIcon key={index} size={17} className='text-transparent mt-0.5' fill={(review.rating || 5) >= index + 1 ? "#00C950" : "#D1D5DB"} />
                                        ))}
                                    </div>
                                </div>
                                {review.product?.id && (
                                    <button onClick={() => router.push(`/product/${review.product.id}`)} className="bg-slate-100 px-5 py-2 hover:bg-slate-200 rounded transition-all">View Product</button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}