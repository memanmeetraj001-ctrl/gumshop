'use client'
import { useParams } from "next/navigation";
import { useEffect, useState, use } from "react";
import Loading from "@/components/Loading";
import ProductCard from "@/components/ProductCard";
import StorefrontNavbar from "@/components/StorefrontNavbar";
import StoreHeroBanner from "@/components/StoreHeroBanner";
import ExitIntentModal from "@/components/ExitIntentModal";
import AiShoppingAssistant from "@/components/AiShoppingAssistant";
import LiveSalesToaster from "@/components/LiveSalesToaster";
import CartDrawer from "@/components/CartDrawer";
import StorefrontFooter from "@/components/StorefrontFooter";
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
    getStoreAndCatalogSync
} from "@/lib/storePresets";

export default function ShopClient({ initialStore, initialProducts, username: propUsername }) {
    const clientParams = useParams();
    const rawUsername = propUsername || clientParams?.username || '';
    const username = rawUsername;
    const cleanUser = rawUsername.toLowerCase().trim();
    const { user } = useAuth();

    const initialData = getStoreAndCatalogSync(rawUsername);
    const [products, setProducts] = useState(initialProducts || initialData.products || []);
    const [storeInfo, setStoreInfo] = useState(initialStore || initialData.store || null);
    const [loading, setLoading] = useState(!initialStore && !initialData.store);
    const [activeCategory, setActiveCategory] = useState('All');
    const [cartDrawerOpen, setCartDrawerOpen] = useState(false);

    useEffect(() => {
        if (initialStore && initialProducts) {
            setLoading(false);
            return;
        }

        const safetyTimer = setTimeout(() => {
            setLoading(false);
        }, 3000);

        const fetchStoreData = async () => {
            try {
                const res = await fetch(`/api/store/data?slug=${encodeURIComponent(rawUsername)}`, { cache: 'no-store' });
                if (res.ok) {
                    const apiData = await res.json();
                    if (apiData.success && apiData.store) {
                        const s = apiData.store;
                        setStoreInfo(s);
                        setProducts(Array.isArray(apiData.products) ? apiData.products : []);
                        return;
                    }
                }
            } catch (err) {
                console.warn('Storefront data fetch warning:', err);
            } finally {
                clearTimeout(safetyTimer);
                setLoading(false);
            }
        };

        fetchStoreData();
        return () => clearTimeout(safetyTimer);
    }, [rawUsername, initialStore, initialProducts]);

    if (loading) return <Loading />;

    if (!storeInfo) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
                <div className="size-16 rounded-3xl bg-slate-100 flex items-center justify-center text-slate-400 mb-4 shadow-inner">
                    <Store size={32} />
                </div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Store Not Found</h1>
                <p className="text-sm text-slate-500 max-w-sm mt-2">
                    We could not find a creator or merchant store matching <span className="font-mono font-bold text-slate-700">@{username}</span>.
                </p>
                <Link 
                    href="/" 
                    className="mt-6 px-6 py-2.5 rounded-full bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition shadow-md"
                >
                    Return to Marketplace
                </Link>
            </div>
        );
    }

    const categories = ['All', ...new Set((products || []).map(p => p.category).filter(Boolean))];
    const filteredProducts = activeCategory === 'All'
        ? products
        : products.filter(p => p.category === activeCategory);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <StorefrontNavbar store={storeInfo} onOpenCart={() => setCartDrawerOpen(true)} />
            
            <main className="flex-1 pb-20">
                <StoreHeroBanner store={storeInfo} />

                {/* Products Section */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
                    {/* Category Filter Pills */}
                    {categories.length > 2 && (
                        <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none mb-8">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setActiveCategory(cat)}
                                    className={`px-4 py-2 rounded-full text-xs font-bold transition whitespace-nowrap ${
                                        activeCategory === cat
                                            ? 'bg-slate-900 text-white shadow-sm'
                                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Products Grid */}
                    {filteredProducts.length === 0 ? (
                        <div className="py-20 text-center">
                            <ShoppingBag className="mx-auto size-12 text-slate-300 mb-3" />
                            <h3 className="text-base font-bold text-slate-700">No products found</h3>
                            <p className="text-xs text-slate-400 mt-1">This collection does not have any items listed yet.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                            {filteredProducts.map(prod => (
                                <ProductCard key={prod.id} product={prod} showShopName={false} />
                            ))}
                        </div>
                    )}
                </div>
            </main>

            <StorefrontFooter store={storeInfo} />
            <CartDrawer 
                isOpen={cartDrawerOpen} 
                onClose={() => setCartDrawerOpen(false)} 
                products={products}
                storeSlug={storeInfo.username || storeInfo.slug || rawUsername}
                store={storeInfo}
            />
            <ExitIntentModal storeName={storeInfo.name} />
            <AiShoppingAssistant store={storeInfo} products={products} />
            <LiveSalesToaster storeSlug={storeInfo.username || storeInfo.slug} />
        </div>
    );
}
