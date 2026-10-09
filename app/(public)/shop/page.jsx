'use client'
import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
    Zap, 
    Search, 
    Filter, 
    ChevronDown, 
    ArrowLeft, 
    ShoppingBag, 
    Sparkles, 
    CheckCircle2, 
    Flame, 
    SlidersHorizontal 
} from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import CartDrawer from '@/components/CartDrawer';
import WishlistDrawer from '@/components/WishlistDrawer';
import MobileBottomNav from '@/components/MobileBottomNav';
import { getAllProducts, getProductsByStore } from '@/lib/firebaseDb';
import { getActiveStoreSync } from '@/lib/activeStore';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts } from '@/lib/features/product/productSlice';

function ShopCatalogContent() {
    const searchParams = useSearchParams();
    const queryCat = searchParams.get('category') || '';
    const querySearch = searchParams.get('q') || searchParams.get('search') || '';
    const queryStore = searchParams.get('store') || '';

    const dispatch = useDispatch();
    const reduxProducts = useSelector(state => state.product?.list || []);

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
    const [wishlistDrawerOpen, setWishlistDrawerOpen] = useState(false);

    // Filters
    const [selectedCategory, setSelectedCategory] = useState(queryCat || 'All');
    const [sortBy, setSortBy] = useState('featured');
    const [searchTerm, setSearchTerm] = useState(querySearch || '');
    const [inStockOnly, setInStockOnly] = useState(false);

    useEffect(() => {
        if (queryCat) setSelectedCategory(queryCat);
    }, [queryCat]);

    useEffect(() => {
        if (querySearch) setSearchTerm(querySearch);
    }, [querySearch]);

    useEffect(() => {
        const loadProducts = async () => {
            setLoading(true);
            try {
                const targetStoreId = queryStore || getActiveStoreSync()?.id;
                if (targetStoreId) {
                    const fetched = await getProductsByStore(targetStoreId);
                    if (fetched && fetched.length > 0) {
                        setProducts(fetched);
                    } else {
                        setProducts([]);
                    }
                } else {
                    const fetched = await getAllProducts();
                    setProducts(fetched || []);
                }
            } catch (err) {
                console.warn('Error loading shop catalog:', err);
            } finally {
                setLoading(false);
            }
        };

        loadProducts();
    }, [queryStore]);

    useEffect(() => {
        const hasCleared = typeof window !== 'undefined' && (
            localStorage.getItem('gumshop_stores_cleared') === 'true' ||
            localStorage.getItem('gumshop_empty_dashboard_ack') === 'true'
        );
        if (!hasCleared && reduxProducts && reduxProducts.length > 0 && products.length === 0) {
            setProducts(reduxProducts);
        }
    }, [reduxProducts, products.length]);

    // Unique Categories
    const categories = useMemo(() => {
        const set = new Set(['All']);
        products.forEach(p => {
            if (p.category) set.add(p.category);
        });
        return Array.from(set);
    }, [products]);

    // Filter and Sort
    const filteredProducts = useMemo(() => {
        let list = [...products];

        if (searchTerm.trim()) {
            const q = searchTerm.toLowerCase().trim();
            list = list.filter(p => 
                (p.name && p.name.toLowerCase().includes(q)) ||
                (p.description && p.description.toLowerCase().includes(q)) ||
                (p.category && p.category.toLowerCase().includes(q))
            );
        }

        if (selectedCategory !== 'All') {
            list = list.filter(p => p.category === selectedCategory);
        }

        if (inStockOnly) {
            list = list.filter(p => p.inStock !== false);
        }

        if (sortBy === 'price-low') {
            list.sort((a, b) => parseFloat(a.price || 0) - parseFloat(b.price || 0));
        } else if (sortBy === 'price-high') {
            list.sort((a, b) => parseFloat(b.price || 0) - parseFloat(a.price || 0));
        } else if (sortBy === 'rating') {
            list.sort((a, b) => (b.rating || 5) - (a.rating || 5));
        } else if (sortBy === 'discount') {
            list.sort((a, b) => {
                const discA = (a.compareAtPrice || a.price) - a.price;
                const discB = (b.compareAtPrice || b.price) - b.price;
                return discB - discA;
            });
        }

        return list;
    }, [products, searchTerm, selectedCategory, inStockOnly, sortBy]);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 antialiased pb-24">
            
            {/* Top Navigation & Breadcrumbs Strip */}
            <div className="bg-white border-b border-slate-200/80 py-4 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                        <Link href="/" className="hover:text-emerald-600 transition flex items-center gap-1">
                            <ArrowLeft size={14} />
                            <span>Home</span>
                        </Link>
                        <span>/</span>
                        <span className="text-slate-900 font-bold">Catalog</span>
                        {selectedCategory !== 'All' && (
                            <>
                                <span>/</span>
                                <span className="text-emerald-600 font-bold">{selectedCategory}</span>
                            </>
                        )}
                    </div>

                    <div className="text-xs font-bold text-slate-400">
                        <span>{filteredProducts.length} items available</span>
                    </div>
                </div>
            </div>

            {/* Catalog Header Hero Banner */}
            <div className="bg-slate-950 text-white py-10 px-4 sm:px-6 lg:px-8 border-b border-slate-900">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-3">
                            <Sparkles size={13} />
                            <span>Official Catalog</span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                            All Handpicked Products
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
                            Explore viral gear, top-rated audio, smart ambient tech, and lifestyle aesthetics. 
                            Direct manufacturer pricing with 1-click express checkout.
                        </p>
                    </div>

                    {/* Fast Search Input */}
                    <div className="w-full md:w-80">
                        <div className="relative">
                            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search products, brands, tags..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-xs font-medium text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition"
                            />
                            {searchTerm && (
                                <button 
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs font-bold"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Categories Navigation Pills */}
            <div className="bg-white border-b border-slate-200/80 sticky top-16 z-30 shadow-xs">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                        {categories.map((cat) => {
                            const isSelected = selectedCategory === cat;
                            return (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                                        isSelected 
                                            ? 'bg-slate-900 text-white shadow-sm scale-102' 
                                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                    }`}
                                >
                                    {cat}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Main Product Catalog Section */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
                
                {/* Control Bar: In-Stock Toggle + Sorting */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs mb-8 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <SlidersHorizontal size={16} className="text-slate-500" />
                        <span className="text-xs font-bold text-slate-800">
                            Showing {filteredProducts.length} Results
                        </span>
                        {(selectedCategory !== 'All' || searchTerm || inStockOnly) && (
                            <button
                                onClick={() => { setSelectedCategory('All'); setSearchTerm(''); setInStockOnly(false); }}
                                className="text-[11px] font-bold text-rose-600 hover:text-rose-700 underline ml-2"
                            >
                                Clear filters
                            </button>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {/* Stock Filter */}
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 transition">
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
                                className="appearance-none bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-1.5 pr-8 text-xs font-bold text-slate-700 outline-none focus:border-emerald-500 cursor-pointer transition"
                            >
                                <option value="featured">Sort: Featured</option>
                                <option value="price-low">Price: Low to High</option>
                                <option value="price-high">Price: High to Low</option>
                                <option value="rating">Top Rated (5★)</option>
                                <option value="discount">Biggest Discount</option>
                            </select>
                            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* Product Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {Array(8).fill(0).map((_, i) => (
                            <div key={i} className="bg-white rounded-3xl p-4 border border-slate-200/80 animate-pulse space-y-4">
                                <div className="aspect-square bg-slate-100 rounded-2xl" />
                                <div className="h-4 bg-slate-100 rounded w-2/3" />
                                <div className="h-4 bg-slate-100 rounded w-1/3" />
                            </div>
                        ))}
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-lg mx-auto">
                        <div className="size-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-4">
                            <Filter size={28} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">No products match your criteria</h3>
                        <p className="text-xs text-slate-500 mt-1">
                            Try resetting your search query or choosing another category.
                        </p>
                        <button
                            onClick={() => { setSelectedCategory('All'); setSearchTerm(''); setInStockOnly(false); }}
                            className="mt-5 px-6 py-2.5 rounded-full bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition"
                        >
                            Reset All Filters
                        </button>
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

            </main>

            {/* Slide-out Drawers */}
            <CartDrawer isOpen={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />
            <WishlistDrawer isOpen={wishlistDrawerOpen} onClose={() => setWishlistDrawerOpen(false)} onOpenCart={() => setCartDrawerOpen(true)} />
            
            {/* Mobile Bottom Navigation */}
            <MobileBottomNav 
                onOpenCart={() => setCartDrawerOpen(true)} 
                onOpenWishlist={() => setWishlistDrawerOpen(true)} 
                onFocusSearch={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
            />

        </div>
    );
}

export default function ShopCatalogPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400">Loading catalog...</div>}>
            <ShopCatalogContent />
        </Suspense>
    );
}
