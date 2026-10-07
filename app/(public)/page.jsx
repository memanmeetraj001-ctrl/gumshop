'use client'
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
    Zap, 
    Sparkles, 
    ArrowRight, 
    ShieldCheck, 
    ChevronDown, 
    ShoppingBag, 
    CheckCircle2, 
    Layers, 
    Filter,
    Store,
    ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import CartDrawer from '@/components/CartDrawer';
import WishlistDrawer from '@/components/WishlistDrawer';
import MobileBottomNav from '@/components/MobileBottomNav';
import { getAllProducts, getProductsByStore } from '@/lib/firebaseDb';
import { getActiveStoreSync, getHomepageStoreSync, getHomepageStoreSlug } from '@/lib/activeStore';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts } from '@/lib/features/product/productSlice';

export default function SuperStorefront() {
    const dispatch = useDispatch();
    const reduxProducts = useSelector(state => state.product.list);

    const [products, setProducts] = useState([]);
    const [activeStore, setActiveStore] = useState(null);
    const [loading, setLoading] = useState(true);
    const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
    const [wishlistDrawerOpen, setWishlistDrawerOpen] = useState(false);

    // Filters state
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [sortBy, setSortBy] = useState('featured');
    const [searchTerm, setSearchTerm] = useState('');
    const [inStockOnly, setInStockOnly] = useState(false);

    const catalogRef = useRef(null);

    // Fetch homepage store & isolated products
    useEffect(() => {
        const loadStoreAndCatalog = async () => {
            setLoading(true);
            try {
                // 1. Resolve designated homepage store (Highest priority)
                let store = getHomepageStoreSync();
                if (!store) {
                    try {
                        const hpRes = await fetch('/api/store/homepage', { cache: 'no-store' });
                        if (hpRes.ok) {
                            const hpData = await hpRes.json();
                            if (hpData.homepageStore) store = hpData.homepageStore;
                        }
                    } catch {}
                }

                // 2. Fallback to active store if no homepage is explicitly chosen
                if (!store) {
                    store = getActiveStoreSync();
                }

                if (store) {
                    setActiveStore(store);
                    const storeProducts = await getProductsByStore(store.id);
                    if (storeProducts && storeProducts.length > 0) {
                        setProducts(storeProducts);
                    } else if (store?.products && Array.isArray(store.products) && store.products.length > 0) {
                        setProducts(store.products);
                    } else {
                        setProducts([]);
                    }
                } else {
                    const fetched = await getAllProducts();
                    setProducts(fetched || []);
                }
            } catch (err) {
                console.warn('Error loading storefront catalog:', err);
            } finally {
                setLoading(false);
            }
        };

        loadStoreAndCatalog();

        if (typeof window !== 'undefined') {
            window.addEventListener('homepage_store_changed', loadStoreAndCatalog);
            window.addEventListener('active_store_changed', loadStoreAndCatalog);
        }

        return () => {
            if (typeof window !== 'undefined') {
                window.removeEventListener('homepage_store_changed', loadStoreAndCatalog);
                window.removeEventListener('active_store_changed', loadStoreAndCatalog);
            }
        };
    }, [dispatch]);

    useEffect(() => {
        if (!activeStore && reduxProducts && reduxProducts.length > 0 && products.length === 0) {
            setProducts(reduxProducts);
        }
    }, [reduxProducts, products.length, activeStore]);

    // Extract dynamic unique categories
    const categories = useMemo(() => {
        const set = new Set(['All']);
        products.forEach(p => {
            if (p.category) set.add(p.category);
        });
        return Array.from(set);
    }, [products]);

    // Filter and sort products
    const filteredProducts = useMemo(() => {
        let list = [...products];

        // Search Filter
        if (searchTerm.trim()) {
            const query = searchTerm.toLowerCase().trim();
            list = list.filter(p => 
                (p.name && p.name.toLowerCase().includes(query)) ||
                (p.description && p.description.toLowerCase().includes(query)) ||
                (p.category && p.category.toLowerCase().includes(query))
            );
        }

        // Category Filter
        if (selectedCategory !== 'All') {
            list = list.filter(p => p.category === selectedCategory);
        }

        // Stock Filter
        if (inStockOnly) {
            list = list.filter(p => p.inStock !== false);
        }

        // Sorting
        if (sortBy === 'price-low') {
            list.sort((a, b) => parseFloat(a.price || 0) - parseFloat(b.price || 0));
        } else if (sortBy === 'price-high') {
            list.sort((a, b) => parseFloat(b.price || 0) - parseFloat(a.price || 0));
        } else if (sortBy === 'discount') {
            list.sort((a, b) => {
                const discA = (a.compareAtPrice || a.price) - a.price;
                const discB = (b.compareAtPrice || b.price) - b.price;
                return discB - discA;
            });
        }

        return list;
    }, [products, searchTerm, selectedCategory, inStockOnly, sortBy]);

    // Discounted deals subset
    const discountedDeals = useMemo(() => {
        return products.filter(p => (p.compareAtPrice && p.compareAtPrice > p.price)).slice(0, 4);
    }, [products]);

    const scrollToCatalog = () => {
        if (catalogRef.current) {
            catalogRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const storeTitle = activeStore?.name || 'GumShop Online';
    const storeDescription = activeStore?.description || 'Independent curated digital commerce storefront. Direct merchant pricing and secure checkout powered by Gumroad.';

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 antialiased pb-16 sm:pb-0">

            {/* 1. Hero Section */}
            <section className="relative overflow-hidden bg-slate-950 text-white pt-10 pb-20 sm:pt-16 sm:pb-28">
                {/* Background glow effects */}
                <div className="absolute top-0 left-1/4 size-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 right-1/4 size-96 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center max-w-3xl mx-auto">
                        
                        {/* Pill Badge */}
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-6">
                            <Sparkles size={14} className="text-emerald-400" />
                            <span>Curated Catalog · Independent Merchant</span>
                        </div>

                        {/* Bold Main Headline */}
                        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight sm:leading-none">
                            {activeStore?.name ? (
                                <>
                                    {activeStore.name} <br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                                        Official Storefront.
                                    </span>
                                </>
                            ) : (
                                <>
                                    Curated Products & <br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                                        Everyday Essentials.
                                    </span>
                                </>
                            )}
                        </h1>

                        {/* Subheadline */}
                        <p className="mt-5 text-base sm:text-lg text-slate-300 leading-relaxed font-normal max-w-2xl mx-auto">
                            {storeDescription}
                        </p>

                        {/* Hero CTAs */}
                        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
                            <button
                                onClick={scrollToCatalog}
                                className="px-8 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-98 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/25 flex items-center gap-2 transition"
                            >
                                <span>Browse Catalog</span>
                                <ArrowRight size={16} />
                            </button>
                            <Link
                                href="/dashboard"
                                className="px-7 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-sm flex items-center gap-2 transition"
                            >
                                <Store size={16} className="text-emerald-400" />
                                <span>Master HQ</span>
                            </Link>
                        </div>

                        {/* Hero Trust Badges Strip (Honest & Factual) */}
                        <div className="mt-14 pt-8 border-t border-slate-900 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold text-slate-400">
                            <div className="flex items-center justify-center gap-2">
                                <ShieldCheck size={16} className="text-emerald-400" />
                                <span>Encrypted Gumroad Checkout</span>
                            </div>
                            <div className="flex items-center justify-center gap-2">
                                <Zap size={16} className="text-emerald-400" />
                                <span>Direct Merchant Pricing</span>
                            </div>
                            <div className="flex items-center justify-center gap-2">
                                <ShoppingBag size={16} className="text-emerald-400" />
                                <span>Curated Quality Items</span>
                            </div>
                            <div className="flex items-center justify-center gap-2">
                                <CheckCircle2 size={16} className="text-emerald-400" />
                                <span>Verified Storefront</span>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* 2. Visual Category Tiles Bar */}
            {categories.length > 1 && (
                <section className="bg-white border-b border-slate-200/80 py-6">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                            {categories.map((cat) => {
                                const isSelected = selectedCategory === cat;
                                return (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={`px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                                            isSelected 
                                                ? 'bg-slate-900 text-white shadow-md shadow-slate-900/20 scale-102' 
                                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                        }`}
                                    >
                                        {cat}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </section>
            )}

            {/* 3. Featured Deals Strip (No Fake Urgency Countdown) */}
            {discountedDeals.length > 0 && (
                <section id="special-deals" className="py-12 bg-emerald-50/50 border-b border-emerald-100/60">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                            <div>
                                <div className="inline-flex items-center gap-1.5 text-emerald-700 font-extrabold text-xs uppercase tracking-wider">
                                    <Sparkles size={14} className="text-emerald-600" />
                                    <span>Special Pricing</span>
                                </div>
                                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                                    Featured Discounted Items
                                </h2>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {discountedDeals.map(product => (
                                <ProductCard 
                                    key={product.id} 
                                    product={product} 
                                    onOpenCart={() => setCartDrawerOpen(true)}
                                />
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* 4. Main Product Catalog & Faceted Filters */}
            <section ref={catalogRef} id="catalog" className="py-12 sm:py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                    {/* Filter & Sorting Header Bar */}
                    <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                                Featured Catalog
                            </h2>
                            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-extrabold text-xs">
                                {filteredProducts.length} items
                            </span>
                        </div>

                        {/* Controls */}
                        <div className="flex flex-wrap items-center gap-3">
                            {/* Stock Toggle */}
                            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 px-3 py-2 rounded-xl border border-slate-200 transition">
                                <input 
                                    type="checkbox"
                                    checked={inStockOnly}
                                    onChange={(e) => setInStockOnly(e.target.checked)}
                                    className="rounded text-emerald-600 focus:ring-emerald-500"
                                />
                                <span>In Stock Only</span>
                            </label>

                            {/* Sort Selector */}
                            <div className="relative">
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="appearance-none bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-4 py-2 pr-8 text-xs font-bold text-slate-700 outline-none focus:border-emerald-500 cursor-pointer transition"
                                >
                                    <option value="featured">Sort: Featured</option>
                                    <option value="price-low">Price: Low to High</option>
                                    <option value="price-high">Price: High to Low</option>
                                    <option value="discount">Biggest Discount</option>
                                </select>
                                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {/* Product Cards Grid or Professional Empty State */}
                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {Array(4).fill(0).map((_, i) => (
                                <div key={i} className="bg-white rounded-3xl p-4 border border-slate-200/80 animate-pulse space-y-4">
                                    <div className="aspect-square bg-slate-100 rounded-2xl" />
                                    <div className="h-4 bg-slate-100 rounded w-2/3" />
                                    <div className="h-4 bg-slate-100 rounded w-1/3" />
                                </div>
                            ))}
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-lg mx-auto">
                            <div className="size-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                                <ShoppingBag size={28} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">Storefront Inventory Updating</h3>
                            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                                {products.length === 0 
                                    ? "There are currently no published products in this catalog. Store managers can add products or import inventory from Master HQ." 
                                    : "No products matched your active filters. Try resetting your search or category."}
                            </p>
                            <div className="mt-6 flex items-center justify-center gap-3">
                                {products.length === 0 ? (
                                    <Link
                                        href="/dashboard"
                                        className="px-6 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs shadow-md transition flex items-center gap-1.5"
                                    >
                                        <Store size={14} />
                                        <span>Manage in Master HQ</span>
                                    </Link>
                                ) : (
                                    <button
                                        onClick={() => { setSelectedCategory('All'); setSearchTerm(''); setInStockOnly(false); }}
                                        className="px-6 py-2.5 rounded-full bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition"
                                    >
                                        Reset All Filters
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {filteredProducts.map(product => (
                                <ProductCard 
                                    key={product.id} 
                                    product={product} 
                                    onOpenCart={() => setCartDrawerOpen(true)}
                                />
                            ))}
                        </div>
                    )}

                </div>
            </section>

            {/* 5. Factual & Honest FAQ Section */}
            <section className="py-14 bg-white border-t border-slate-200/80">
                <div className="max-w-4xl mx-auto px-4 sm:px-6">
                    <div className="text-center mb-10">
                        <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Help & Details</span>
                        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">Frequently Asked Questions</h2>
                    </div>

                    <div className="space-y-4">
                        {[
                            {
                                q: "How does checkout work?",
                                a: "Checkout is processed directly through Gumroad. You will enter your customer and delivery details, then complete payment securely via Gumroad's encrypted checkout window."
                            },
                            {
                                q: "What payment options are supported?",
                                a: "We support all payment methods enabled by Gumroad, including major credit/debit cards, Apple Pay, Google Pay, and PayPal where available."
                            },
                            {
                                q: "How do I receive order confirmation?",
                                a: "Upon completing payment on Gumroad, you will receive an immediate automated email receipt and fulfillment updates directly from the merchant."
                            },
                            {
                                q: "What is the return and refund policy?",
                                a: "Refund and cancellation requests are handled directly by the store merchant in accordance with standard Gumroad customer protection policies."
                            }
                        ].map((faq, i) => (
                            <details key={i} className="group bg-slate-50 p-5 rounded-2xl border border-slate-200/80 open:border-emerald-500/50 shadow-xs transition">
                                <summary className="font-bold text-sm text-slate-900 cursor-pointer list-none flex items-center justify-between">
                                    <span>{faq.q}</span>
                                    <ChevronDown size={16} className="text-slate-400 group-open:rotate-180 transition-transform" />
                                </summary>
                                <p className="mt-3 text-xs text-slate-600 leading-relaxed font-normal">
                                    {faq.a}
                                </p>
                            </details>
                        ))}
                    </div>
                </div>
            </section>

            {/* 6. Slide Drawers & Sticky Mobile Navigation */}
            <CartDrawer
                isOpen={cartDrawerOpen}
                onClose={() => setCartDrawerOpen(false)}
            />

            <WishlistDrawer
                isOpen={wishlistDrawerOpen}
                onClose={() => setWishlistDrawerOpen(false)}
                onOpenCart={() => setCartDrawerOpen(true)}
            />

            <MobileBottomNav
                onOpenCart={() => setCartDrawerOpen(true)}
                onOpenWishlist={() => setWishlistDrawerOpen(true)}
                onFocusSearch={scrollToCatalog}
            />

        </div>
    );
}
