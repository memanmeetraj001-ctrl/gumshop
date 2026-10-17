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
import toast from "react-hot-toast";
import { 
    Zap, 
    Truck, 
    ShieldCheck, 
    Sparkles, 
    Store,
    ShoppingBag,
    Tag,
    Clock
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
    const [visibleCount, setVisibleCount] = useState(24);
    const [cartDrawerOpen, setCartDrawerOpen] = useState(false);

    // High-Converting Sticky Flash Sale Announcement Bar State
    const [flashCountdown, setFlashCountdown] = useState({
        hours: '02',
        minutes: '44',
        seconds: '19',
        totalSecs: 9859
    });
    const [isCouponApplied, setIsCouponApplied] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const stored = sessionStorage.getItem('active_coupon');
            if (stored && stored.toUpperCase() === 'SAVE20') {
                setIsCouponApplied(true);
            }
        }
    }, []);

    useEffect(() => {
        const updateCountdown = () => {
            const now = new Date();
            const curSecs = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
            const cycleSecs = 4 * 3600; // 4 hour cycle
            const remaining = cycleSecs - (curSecs % cycleSecs);
            const h = Math.floor(remaining / 3600);
            const m = Math.floor((remaining % 3600) / 60);
            const s = remaining % 60;
            setFlashCountdown({
                hours: String(h).padStart(2, '0'),
                minutes: String(m).padStart(2, '0'),
                seconds: String(s).padStart(2, '0'),
                totalSecs: remaining
            });
        };
        updateCountdown();
        const timer = setInterval(updateCountdown, 1000);
        return () => clearInterval(timer);
    }, []);

    const handleApplyFlashCoupon = () => {
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('active_coupon', 'SAVE20');
        }
        setIsCouponApplied(true);
        toast.success('Coupon "SAVE20" applied! 20% OFF activated across your order 🎉');
    };

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

    const categoryList = Array.from(new Set((products || []).map(p => p.category).filter(Boolean)));
    const hasFeatured = (products || []).some(p => p.is_featured);
    const categories = ['All', ...(hasFeatured ? ['Featured'] : []), ...categoryList.filter(c => c !== 'Featured')];
    const filteredProducts = activeCategory === 'All'
        ? products
        : activeCategory === 'Featured'
            ? products.filter(p => p.is_featured)
            : products.filter(p => p.category === activeCategory);
    const displayedProducts = filteredProducts.slice(0, visibleCount);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* ⚡ Sticky Flash Sale Announcement Bar */}
            {storeInfo?.urgencyEnabled !== false && (
                <div className="bg-slate-950 text-white py-2 px-3 sm:px-4 text-xs font-semibold border-b border-slate-800 sticky top-0 z-50 backdrop-blur-md bg-slate-950/95">
                    <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                        <div className="flex items-center gap-2 text-xs">
                            <span className="flex items-center gap-1.5 text-amber-400 font-extrabold uppercase tracking-wider text-[11px] sm:text-xs">
                                <Zap size={14} className="fill-amber-400 text-amber-400 animate-pulse" />
                                <span>FLASH SALE: 20% OFF STOREWIDE</span>
                            </span>
                            <span className="text-slate-500 hidden md:inline">•</span>
                            <span className="text-slate-300 font-medium text-[11px] sm:text-xs">
                                Ends in <strong className="font-mono text-white tracking-widest bg-slate-800/90 px-2 py-0.5 rounded-md border border-slate-700/80">{flashCountdown.hours}:{flashCountdown.minutes}:{flashCountdown.seconds}</strong>
                            </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleApplyFlashCoupon}
                                className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider transition active:scale-95 cursor-pointer flex items-center gap-1.5 shadow-sm ${
                                    isCouponApplied 
                                        ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400' 
                                        : 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950'
                                }`}
                            >
                                {isCouponApplied ? (
                                    <>
                                        <span>✓ APPLIED: 20% OFF</span>
                                    </>
                                ) : (
                                    <>
                                        <span>⚡ APPLY: SAVE20</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <StorefrontNavbar store={storeInfo} onOpenCart={() => setCartDrawerOpen(true)} />
            
            <main className="flex-1 pb-20">
                <StoreHeroBanner store={storeInfo} totalProducts={products.length} />

                {/* Products Section */}
                <div id="catalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
                    {/* Category Filter Pills */}
                    {categories.length > 2 && (
                        <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none mb-8">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => {
                                        setActiveCategory(cat);
                                        setVisibleCount(24);
                                    }}
                                    className={`px-4 py-2 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer ${
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
                        <>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                                {displayedProducts.map((prod, idx) => (
                                    <ProductCard 
                                        key={prod.id || idx} 
                                        product={prod} 
                                        showShopName={false}
                                        store={storeInfo}
                                        cardIndex={idx}
                                        onOpenCart={() => setCartDrawerOpen(true)}
                                    />
                                ))}
                            </div>

                            {visibleCount < filteredProducts.length && (
                                <div className="mt-12 text-center">
                                    <button
                                        type="button"
                                        onClick={() => setVisibleCount(prev => Math.min(prev + 24, filteredProducts.length))}
                                        className="px-8 py-3.5 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-extrabold text-xs shadow-xs hover:border-slate-300 transition cursor-pointer"
                                    >
                                        Load More Products ({filteredProducts.length - visibleCount} remaining) ↓
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>

            <StorefrontFooter store={storeInfo} />
            <CartDrawer 
                isOpen={cartDrawerOpen} 
                onClose={() => setCartDrawerOpen(false)} 
                products={products}
                storeSlug={storeInfo?.username || storeInfo?.slug || rawUsername}
                store={storeInfo}
            />
            <ExitIntentModal storeName={storeInfo?.name} />
            <AiShoppingAssistant store={storeInfo} products={products} />
            <LiveSalesToaster storeSlug={storeInfo?.username || storeInfo?.slug || rawUsername} />
        </div>
    );
}
