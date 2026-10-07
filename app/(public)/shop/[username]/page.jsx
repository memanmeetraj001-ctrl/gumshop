'use client'
import { useParams } from "next/navigation";
import { useEffect, useState, use } from "react";
import Loading from "@/components/Loading";
import ProductCard from "@/components/ProductCard";
import StorefrontNavbar from "@/components/StorefrontNavbar";
import StoreHeroBanner from "@/components/StoreHeroBanner";
import ExitIntentModal from "@/components/ExitIntentModal";
import AiShoppingAssistant from "@/components/AiShoppingAssistant";
import { getStoreByUsername, getProductsByStore, getAllStores, isProductDeleted, isJunkProductName } from "@/lib/firebaseDb";
import { useAuth } from "@/lib/AuthContext";
import Link from "next/link";
import { 
    Zap, 
    Truck, 
    ShieldCheck, 
    Sparkles, 
    Store,
    ShoppingBag
} from "lucide-react";

import { 
    STARTER_PRODUCTS, 
    RC_DRIFT_STARTER_PRODUCTS, 
    DEMO_PRESETS,
    getStoreAndCatalog,
    getStoreAndCatalogSync
} from "@/lib/storePresets";

export default function StoreShop({ params }) {
    const unwrappedParams = params ? (typeof params.then === 'function' ? use(params) : params) : null;
    const clientParams = useParams();
    const rawUsername = unwrappedParams?.username || clientParams?.username || '';
    const username = rawUsername;
    const cleanUser = rawUsername.toLowerCase().trim();
    const { user } = useAuth();

    const initialData = getStoreAndCatalogSync(rawUsername);
    const [products, setProducts] = useState(initialData.products || []);
    const [storeInfo, setStoreInfo] = useState(initialData.store || null);
    const [loading, setLoading] = useState(!initialData.store);
    const [activeCategory, setActiveCategory] = useState('All');

    useEffect(() => {
        // Safety timeout so merchant stores NEVER get stuck on loading screen
        const safetyTimer = setTimeout(() => {
            setLoading(false);
        }, 800);

        const fetchStoreData = async () => {
            try {
                const { store, products: resolvedProducts } = await getStoreAndCatalog(rawUsername);
                if (store) {
                    if (!store.gumroadToken && typeof window !== 'undefined') {
                        store.gumroadToken = localStorage.getItem('gumshop_gumroad_token') || '';
                    }
                    setStoreInfo(store);
                    setProducts(resolvedProducts || []);
                }
            } catch (err) {
                console.error("Error fetching store data:", err);
            } finally {
                clearTimeout(safetyTimer);
                setLoading(false);
            }
        };

        fetchStoreData();

        const handleSync = () => {
            fetchStoreData();
        };

        if (typeof window !== 'undefined') {
            window.addEventListener('products_updated', handleSync);
            window.addEventListener('active_store_changed', handleSync);
            window.addEventListener('storage', handleSync);
        }

        return () => {
            clearTimeout(safetyTimer);
            if (typeof window !== 'undefined') {
                window.removeEventListener('products_updated', handleSync);
                window.removeEventListener('active_store_changed', handleSync);
                window.removeEventListener('storage', handleSync);
            }
        };
    }, [username, cleanUser, rawUsername]);

    if (loading) return <Loading />;

    if (!storeInfo) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-center px-4">
                <div className="size-20 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-emerald-600 mb-4">
                    <Store size={36} />
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Store Not Found</h2>
                <p className="text-sm text-slate-500 mt-2 max-w-md leading-relaxed">
                    The store <code className="font-mono text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">@{username}</code> may have been renamed or is still propagating.
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                    <Link href="/store/import" className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition">
                        Import A Store
                    </Link>
                    <Link href="/dashboard" className="px-6 py-3 rounded-2xl bg-white border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition">
                        Master HQ
                    </Link>
                </div>
            </div>
        );
    }

    if (storeInfo.status === 'archived') {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-center px-4">
                <div className="size-20 rounded-3xl bg-amber-50 border border-amber-200 shadow-sm flex items-center justify-center text-amber-600 mb-4">
                    <Store size={36} />
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Store Inactive</h2>
                <p className="text-sm text-slate-500 mt-2 max-w-md leading-relaxed">
                    The storefront <code className="font-mono text-amber-700 font-bold bg-amber-100/60 px-2 py-0.5 rounded">@{username}</code> is currently archived and inactive.
                </p>
                <div className="mt-6 flex items-center justify-center gap-3">
                    <Link href="/dashboard" className="px-6 py-2.5 rounded-2xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition">
                        Manage in Master HQ
                    </Link>
                </div>
            </div>
        );
    }

    const getSafeCategory = (p) => typeof p?.category === 'string' ? p.category : (p?.category?.name || 'Featured');
    const categories = ['All', ...new Set(products.map(getSafeCategory))];
    const filteredProducts = activeCategory === 'All' 
        ? products 
        : products.filter(p => getSafeCategory(p) === activeCategory);

    return (
        <div className="min-h-screen bg-slate-50 pb-24 selection:bg-emerald-500 selection:text-white">
            {/* 100% White-Labeled Merchant Header */}
            <StorefrontNavbar store={storeInfo} />

            {/* Merchant High-Converting Hero Store Banner */}
            <StoreHeroBanner store={storeInfo} totalProducts={products.length} />

            {/* Main Products Catalog Section */}
            <main id="catalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14">
                
                {/* Category Filter Navigation */}
                {categories.length > 2 && (
                    <div className="flex items-center justify-between pb-6 border-b border-slate-200/80 gap-4 flex-wrap">
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                            {categories.map((cat, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setActiveCategory(cat)}
                                    className={`px-4 py-2 rounded-full text-xs font-bold transition shrink-0 ${
                                        activeCategory === cat
                                            ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                                            : 'bg-white border border-slate-200 hover:border-slate-300 text-slate-700'
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                        <span className="text-xs text-slate-400 font-medium">
                            Showing {filteredProducts.length} items
                        </span>
                    </div>
                )}

                {/* Product Catalog Grid */}
                <div className="mt-8">
                    {filteredProducts.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 shadow-sm">
                            <ShoppingBag size={40} className="mx-auto text-slate-300 mb-3" />
                            <p className="text-base font-bold text-slate-800">No products found in "{activeCategory}"</p>
                            <p className="text-xs text-slate-500 mt-1">Check back soon or explore all products from this store.</p>
                            <button
                                onClick={() => setActiveCategory('All')}
                                className="mt-4 px-5 py-2.5 rounded-full bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition"
                            >
                                View All Products
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                            {filteredProducts.map(product => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    )}
                </div>

                {/* Trust Guarantees Strip (Honest & Factual) */}
                <div className="mt-20 py-8 border-t border-slate-200/80 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center text-xs text-slate-600">
                    <div className="flex flex-col items-center">
                        <ShieldCheck size={22} className="text-emerald-600 mb-1.5" />
                        <strong className="text-slate-900 font-bold">Secure Checkout</strong>
                        <span className="text-[11px] text-slate-400">Encrypted Gumroad Window</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <Truck size={22} className="text-emerald-600 mb-1.5" />
                        <strong className="text-slate-900 font-bold">Fulfillment Updates</strong>
                        <span className="text-[11px] text-slate-400">Direct Email Confirmations</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <Zap size={22} className="text-emerald-600 mb-1.5" />
                        <strong className="text-slate-900 font-bold">Direct Pricing</strong>
                        <span className="text-[11px] text-slate-400">Straight from Merchant</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <Sparkles size={22} className="text-emerald-600 mb-1.5" />
                        <strong className="text-slate-900 font-bold">Curated Catalog</strong>
                        <span className="text-[11px] text-slate-400">Verified Independent Store</span>
                    </div>
                </div>

            </main>

            {/* Exit Intent Discount Modal */}
            <ExitIntentModal />

            {/* AI Shopping Assistant (generative_ui) */}
            <AiShoppingAssistant 
                products={products} 
                storeName={storeInfo?.name || 'Store'} 
                themeColor="#10B981" 
            />
        </div>
    );
}