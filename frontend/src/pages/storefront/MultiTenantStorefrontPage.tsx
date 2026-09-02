import React, { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { api } from '../../api/client';
import { Product, Tenant, SiteSettings } from '../../types';
import { formatPrice } from '../../utils/formatters';
import { CheckoutModal } from '../../components/storefront/CheckoutModal';
import {
  ShoppingBag,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Truck,
  RotateCcw,
  Star,
  Search,
  CheckCircle2,
  ArrowRight,
  Filter,
  Tag,
  Package,
  Layers,
  Info,
  Clock,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';

export const MultiTenantStorefrontPage: React.FC = () => {
  const { slug, storeSlug, slug: paramSlug } = useParams<{ slug?: string; storeSlug?: string }>();
  const activeSlug = storeSlug || slug || 'demo';

  const [store, setStore] = useState<Tenant | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);

  // Selected Product for Quick Buy / Modal
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  // Mobile menu
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);

    Promise.all([
      api.getStoreBySlug(activeSlug),
      api.getStoreProducts(activeSlug),
    ])
      .then(([storeData, productData]) => {
        setStore(storeData.store);
        setProducts(productData);

        // Extract categories
        const cats = Array.from(new Set(productData.map((p) => p.categoryId).filter(Boolean)));
        setCategories(cats as string[]);

        // Dynamic Document Title
        if (storeData.store?.storeName) {
          document.title = `${storeData.store.storeName} | Official Storefront`;
        }
      })
      .catch((err) => {
        console.error('Failed to load store data:', err);
        setError(err.message || 'Storefront not found');
      })
      .finally(() => setLoading(false));
  }, [activeSlug]);

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      !searchQuery ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.shortDescription?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleBuyNow = (p: Product) => {
    setSelectedProduct(p);
    setCheckoutModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07080B] flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-mono text-gray-400">Loading {activeSlug} storefront…</p>
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="min-h-screen bg-[#07080B] flex flex-col items-center justify-center p-6 text-center text-white space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-red-500/10 text-red-400 flex items-center justify-center border border-red-500/20">
          <Info className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black font-heading">Storefront Not Found</h2>
        <p className="text-xs text-gray-400 max-w-md">
          No active store was found matching &quot;{activeSlug}&quot;. Please verify the URL or create a new store in GumShop.
        </p>
        <div className="flex items-center gap-3 pt-2">
          <Link
            to="/signup"
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase rounded-xl transition-all shadow-lg"
          >
            Create Your Store (Free)
          </Link>
          <Link
            to="/"
            className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold rounded-xl border border-white/10"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  const primaryColor = store.primaryColor || '#6366F1';

  return (
    <div className="min-h-screen bg-[#07080B] text-gray-200 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      <div>
        {/* ── Top Announcement Banner ── */}
        <div
          style={{ backgroundColor: primaryColor }}
          className="text-white text-[11px] font-bold py-2 px-4 text-center tracking-wide flex items-center justify-center gap-2"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Welcome to {store.storeName}! Free Worldwide Shipping on All Orders.</span>
        </div>

        {/* ── Storefront Navigation Bar ── */}
        <header className="sticky top-0 z-40 bg-[#0E1017]/90 backdrop-blur-xl border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
            
            {/* Store Brand / Logo */}
            <Link to={`/store/${store.slug}`} className="flex items-center gap-2.5 group">
              <div
                style={{ backgroundColor: `${primaryColor}25`, borderColor: `${primaryColor}50` }}
                className="w-10 h-10 rounded-2xl border flex items-center justify-center text-white font-black text-base uppercase font-heading shadow-md group-hover:scale-105 transition-transform"
              >
                {store.storeName[0]}
              </div>
              <div>
                <span className="text-sm sm:text-base font-black text-white tracking-wide font-heading block group-hover:text-indigo-400 transition-colors">
                  {store.storeName}
                </span>
                <span className="text-[10px] text-gray-500 font-mono block -mt-0.5">
                  {store.tagline || 'Verified Merchant Store'}
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-gray-300">
              <a href="#catalog" className="hover:text-white transition-colors">
                Catalog ({products.length})
              </a>
              <a href="#about" className="hover:text-white transition-colors">
                About Brand
              </a>
              <a href="#guarantee" className="hover:text-white transition-colors">
                Shipping &amp; Guarantees
              </a>
              <Link to="/track" className="hover:text-white transition-colors">
                Track Order
              </Link>
            </nav>

            {/* Header Right Actions */}
            <div className="flex items-center gap-3">
              <Link
                to="/admin/login"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-bold rounded-xl border border-white/10 transition-colors"
              >
                <span>Store Admin</span>
              </Link>

              <a
                href="#catalog"
                style={{ backgroundColor: primaryColor }}
                className="px-4 py-2 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-1.5 hover:opacity-90"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Shop Catalog</span>
              </a>

              {/* Mobile Menu Toggle */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-xl bg-white/5 text-gray-300"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <div className="md:hidden p-4 bg-[#141722] border-b border-white/10 space-y-3 text-xs font-bold">
              <a
                href="#catalog"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-gray-300 hover:text-white"
              >
                Catalog ({products.length} Items)
              </a>
              <a
                href="#about"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-gray-300 hover:text-white"
              >
                About Brand
              </a>
              <a
                href="#guarantee"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-gray-300 hover:text-white"
              >
                Shipping &amp; Guarantee
              </a>
              <Link
                to="/admin/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-indigo-400 hover:text-indigo-300"
              >
                Store Admin Portal ↗
              </Link>
            </div>
          )}
        </header>

        {/* ── Hero Showcase Section ── */}
        <section className="relative overflow-hidden py-16 sm:py-24 border-b border-white/10 bg-gradient-to-b from-[#10131E] via-[#0A0C12] to-[#07080B]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-gray-300 shadow-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Official {store.storeName} Online Storefront</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white uppercase font-heading tracking-tight max-w-3xl mx-auto leading-none">
              {store.tagline || `Exclusive Products by ${store.storeName}`}
            </h1>

            <p className="text-xs sm:text-sm text-gray-400 max-w-xl mx-auto leading-relaxed">
              Curated physical goods, instant checkout, and guaranteed express insured delivery straight to your doorstep.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <a
                href="#catalog"
                style={{ backgroundColor: primaryColor }}
                className="px-6 py-3 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-xl shadow-indigo-900/30 flex items-center gap-2 hover:scale-105"
              >
                <span>Browse Products ({products.length})</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              {store.gumroadStoreUrl && (
                <a
                  href={store.gumroadStoreUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-5 py-3 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white font-bold text-xs uppercase tracking-wider rounded-xl border border-white/10 flex items-center gap-1.5 transition-colors"
                >
                  <span>Gumroad Store ↗</span>
                </a>
              )}
            </div>
          </div>
        </section>

        {/* ── Value Props Strip ── */}
        <section id="guarantee" className="py-6 border-b border-white/5 bg-[#0A0C12]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="flex items-center justify-center gap-2.5 text-xs text-gray-300">
              <Truck className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="font-semibold">Free Express Shipping</span>
            </div>
            <div className="flex items-center justify-center gap-2.5 text-xs text-gray-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-semibold">Encrypted Checkout</span>
            </div>
            <div className="flex items-center justify-center gap-2.5 text-xs text-gray-300">
              <RotateCcw className="w-4 h-4 text-purple-400 shrink-0" />
              <span className="font-semibold">30-Day Money Back</span>
            </div>
            <div className="flex items-center justify-center gap-2.5 text-xs text-gray-300">
              <Star className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="font-semibold">Top Rated Quality</span>
            </div>
          </div>
        </section>

        {/* ── Main Catalog Grid ── */}
        <main id="catalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-white/10">
            <div>
              <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">Product Inventory</span>
              <h2 className="text-2xl sm:text-3xl font-black text-white uppercase font-heading mt-0.5">
                Available Products ({filteredProducts.length})
              </h2>
            </div>

            {/* Search Input */}
            <div className="flex items-center gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#12141C] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Product Cards Grid */}
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredProducts.map((p) => {
                const hasDiscount = p.compareAtPrice && p.compareAtPrice > p.price;
                const discountPct = hasDiscount ? Math.round(((p.compareAtPrice! - p.price) / p.compareAtPrice!) * 100) : 0;

                return (
                  <div
                    key={p.id}
                    className="bg-[#12141C] border border-white/10 hover:border-white/20 rounded-2xl overflow-hidden flex flex-col justify-between transition-all group shadow-lg hover:shadow-2xl hover:shadow-black"
                  >
                    <div className="p-4 space-y-3">
                      {/* Product Thumbnail */}
                      <div className="aspect-square bg-black/40 rounded-xl overflow-hidden relative">
                        <img
                          src={p.thumbnail || p.images?.[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80'}
                          alt={p.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80';
                          }}
                        />

                        {/* Badges */}
                        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
                          {p.sale && (
                            <span className="px-2 py-0.5 rounded-md bg-red-600 text-white font-bold text-[10px] uppercase tracking-wider shadow">
                              {discountPct > 0 ? `${discountPct}% OFF` : 'SALE'}
                            </span>
                          )}
                          {p.newProduct && (
                            <span className="px-2 py-0.5 rounded-md bg-indigo-600 text-white font-bold text-[10px] uppercase tracking-wider shadow">
                              NEW
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Title & Short description */}
                      <div>
                        <h3 className="text-sm font-bold text-white line-clamp-1 group-hover:text-indigo-400 transition-colors">
                          {p.title}
                        </h3>
                        {p.shortDescription && (
                          <p className="text-xs text-gray-400 line-clamp-2 mt-1 leading-snug">
                            {p.shortDescription}
                          </p>
                        )}
                      </div>

                      {/* Pricing */}
                      <div className="flex items-baseline gap-2 pt-1">
                        <span className="text-base font-black text-white">
                          {formatPrice(p.price)}
                        </span>
                        {hasDiscount && (
                          <span className="text-xs text-gray-500 line-through">
                            {formatPrice(p.compareAtPrice!)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="p-4 pt-0">
                      <button
                        type="button"
                        onClick={() => handleBuyNow(p)}
                        style={{ backgroundColor: primaryColor }}
                        className="w-full py-2.5 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 hover:opacity-90"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>{p.buttonText || 'Buy Now — Free Shipping'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 bg-[#12141C] border border-white/10 rounded-3xl p-8 space-y-4 max-w-lg mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto">
                <Package className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-white">No Products Found</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                {searchQuery
                  ? `No items matched your search "${searchQuery}".`
                  : 'This store has not published any products yet. Log in to your Admin CMS to add or import products!'}
              </p>
              <Link
                to="/admin/products/new"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase rounded-xl shadow-md"
              >
                <span>+ Add Products in Admin</span>
              </Link>
            </div>
          )}
        </main>
      </div>

      {/* ── Footer ── */}
      <footer id="about" className="bg-[#050608] border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 text-xs text-gray-400">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div
                style={{ backgroundColor: primaryColor }}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-black text-xs uppercase font-heading"
              >
                {store.storeName[0]}
              </div>
              <span className="font-bold text-white text-sm">{store.storeName}</span>
            </div>

            <div className="flex items-center gap-4 text-gray-400">
              <Link to="/track" className="hover:text-white transition-colors">
                Order Tracking
              </Link>
              <Link to="/privacy" className="hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="hover:text-white transition-colors">
                Terms of Service
              </Link>
              <Link to="/admin/login" className="text-indigo-400 hover:underline font-bold">
                Admin Login
              </Link>
            </div>
          </div>

          <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-gray-500">
            <p>© {new Date().getFullYear()} {store.storeName}. All rights reserved.</p>
            <p className="flex items-center gap-1">
              <span>Powered by</span>
              <a href="https://gumshop.online" target="_blank" rel="noreferrer" className="text-indigo-400 font-bold hover:underline">
                GumShop E-Commerce SaaS
              </a>
            </p>
          </div>
        </div>
      </footer>

      {/* Pre-Checkout Address Capture Modal */}
      {selectedProduct && (
        <CheckoutModal
          isOpen={checkoutModalOpen}
          onClose={() => {
            setCheckoutModalOpen(false);
            setSelectedProduct(null);
          }}
          product={selectedProduct}
        />
      )}
    </div>
  );
};
