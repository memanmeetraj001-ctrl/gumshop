'use client';
import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { 
  ShoppingBag, 
  Search, 
  Star, 
  ArrowRight, 
  Check, 
  X, 
  ShieldCheck, 
  Truck, 
  RotateCcw,
  Package,
  Lock,
  ExternalLink
} from 'lucide-react';
import GumroadIframeModal from '@/components/GumroadIframeModal';
import { getGumroadCheckoutUrl } from '@/lib/gumroad';
import toast from 'react-hot-toast';

export default function StorefrontPage({ params: rawParams }) {
  const params = use(rawParams);
  const slug = params.slug;

  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Inframe Checkout Modal state
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [activeCheckoutUrl, setActiveCheckoutUrl] = useState('');
  const [activeCheckoutTitle, setActiveCheckoutTitle] = useState('');
  const [activeCheckoutAmount, setActiveCheckoutAmount] = useState('');

  useEffect(() => {
    const loadStoreAndCatalog = async () => {
      try {
        // 1. Fetch store info
        const storeRes = await fetch(`/api/stores`);
        const storeData = await storeRes.json();
        if (storeData.success && Array.isArray(storeData.stores)) {
          const found = storeData.stores.find(s => 
            s.slug.toLowerCase() === slug.toLowerCase() || 
            s.id.toLowerCase() === slug.toLowerCase() ||
            s.id.toLowerCase() === `store_${slug.toLowerCase()}`
          );
          if (found) {
            setStore(found);
            // 2. Fetch products for this store
            const prodRes = await fetch(`/api/products?store_id=${found.id}`);
            const prodData = await prodRes.json();
            if (prodData.success && Array.isArray(prodData.products)) {
              setProducts(prodData.products.filter(p => p.is_active));
            }
          }
        }
      } catch (e) {
        toast.error('Failed to load store catalog');
      } finally {
        setLoading(false);
      }
    };

    loadStoreAndCatalog();
  }, [slug]);

  // Cart operations
  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    toast.success(`Added "${product.title}" to bag`);
    setCartOpen(true);
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Trigger Gumroad Inframe Checkout
  const handleCheckout = (product = null) => {
    const targetProduct = product || (cart.length > 0 ? cart[0] : null);
    if (!targetProduct) {
      toast.error('Your cart is empty');
      return;
    }

    const totalAmount = product ? product.price : cartTotal;
    const checkoutUrl = getGumroadCheckoutUrl(targetProduct, '', slug);

    setActiveCheckoutUrl(checkoutUrl);
    setActiveCheckoutTitle(product ? product.title : `${cartCount} items in cart`);
    setActiveCheckoutAmount(totalAmount.toFixed(2));
    setCheckoutModalOpen(true);
  };

  const filteredProducts = products.filter(p => 
    p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Loading Storefront...</p>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-200 text-slate-500 flex items-center justify-center mx-auto mb-4 font-bold text-2xl">
          404
        </div>
        <h1 className="text-2xl font-black text-slate-900">Store Not Found</h1>
        <p className="text-sm text-slate-500 mt-1 max-w-sm">
          The store handle <span className="font-mono text-slate-800 font-bold">/{slug}</span> does not exist or has been removed.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 px-6 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold shadow transition hover:bg-slate-800"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col selection:bg-indigo-600 selection:text-white">
      
      {/* Top Announcement Bar */}
      <div className="bg-slate-900 text-white text-[11px] font-semibold py-2 px-4 text-center tracking-wide flex items-center justify-center gap-3">
        <span className="flex items-center gap-1.5"><Truck className="w-3.5 h-3.5 text-indigo-400" /> Free Global Express Delivery</span>
        <span className="text-slate-600">•</span>
        <span className="flex items-center gap-1.5"><RotateCcw className="w-3.5 h-3.5 text-emerald-400" /> 30-Day Money Back Guarantee</span>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-950 text-white flex items-center justify-center font-black text-lg shadow-sm">
              {store.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <span className="text-lg font-black tracking-tight block leading-tight">{store.name}</span>
              <span className="text-[10px] text-slate-400 font-mono">Official Storefront</span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex relative flex-1 max-w-md mx-6">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products, gear, or collections..."
              className="w-full pl-10 pr-4 py-2.5 rounded-full bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 transition"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Link
              href={`/creator/${slug}`}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold transition"
            >
              <span>Creator Bio</span>
              <ExternalLink className="w-3 h-3" />
            </Link>

            <button
              onClick={() => setCartOpen(true)}
              className="relative p-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-900 transition flex items-center gap-2"
              title="View Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center shadow-xs">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="bg-gradient-to-b from-slate-50 to-white py-14 sm:py-20 border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <span className="text-xs font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 mb-4 inline-block">
            Curated Collection
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight leading-tight mt-2">
            Elevate Your Everyday.
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto mt-4 leading-relaxed">
            {store.description || 'Discover our hand-picked collection of premium essentials, crafted with unparalleled precision and durability.'}
          </p>
        </div>
      </section>

      {/* Product Catalog Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Featured Catalog</h2>
            <p className="text-xs text-slate-500 mt-0.5">{filteredProducts.length} items ready for immediate dispatch</p>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl p-8">
            <Package className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <h3 className="text-lg font-bold text-slate-800">Products Coming Soon</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              The merchant is updating their catalog. Check back shortly!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((p) => (
              <div 
                key={p.id}
                className="group bg-white rounded-3xl border border-slate-200/90 hover:border-slate-300 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Thumbnail */}
                  <div className="relative aspect-square w-full bg-slate-100 overflow-hidden">
                    {p.images?.[0] ? (
                      <img 
                        src={p.images[0]} 
                        alt={p.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <Package className="w-10 h-10" />
                      </div>
                    )}
                    <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs text-slate-900 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full shadow-xs">
                      {p.category || 'Featured'}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="p-5">
                    <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2 group-hover:text-indigo-600 transition">
                      {p.title}
                    </h3>
                    
                    <div className="flex items-center gap-1 mt-2 text-amber-500 text-xs">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span className="font-bold text-slate-700">4.9</span>
                      <span className="text-slate-400 text-[11px]">(98)</span>
                    </div>

                    <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                      {p.description}
                    </p>
                  </div>
                </div>

                {/* Price and Cart Buttons */}
                <div className="p-5 pt-0">
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-xl font-black text-slate-900">${p.price?.toFixed(2)}</span>
                    <span className="text-xs text-slate-400">USD</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => addToCart(p)}
                      className="w-full py-2.5 rounded-xl border border-slate-900 hover:bg-slate-50 text-slate-900 text-xs font-bold transition text-center"
                    >
                      Add to Bag
                    </button>
                    <button
                      onClick={() => handleCheckout(p)}
                      className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow transition text-center flex items-center justify-center gap-1"
                    >
                      <Lock className="w-3 h-3" />
                      <span>Buy Now</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Cart Drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between">
            
            {/* Cart Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-slate-900" />
                <h3 className="font-bold text-slate-900 text-base">Shopping Bag ({cartCount})</h3>
              </div>
              <button 
                onClick={() => setCartOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-5 divide-y divide-slate-100">
              {cart.length === 0 ? (
                <div className="py-20 text-center">
                  <ShoppingBag className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="text-xs font-semibold text-slate-500">Your bag is currently empty</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="py-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200">
                        {item.images?.[0] ? (
                          <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-6 h-6 m-auto text-slate-400" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 truncate max-w-[180px]">{item.title}</h4>
                        <div className="text-xs text-slate-500 mt-0.5">
                          ${item.price.toFixed(2)} × {item.quantity}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-900">
                        ${(item.price * item.quantity).toFixed(2)}
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-[11px] text-red-500 hover:underline mt-1"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Cart Footer */}
            <div className="p-5 border-t border-slate-100 bg-slate-50">
              <div className="flex items-center justify-between text-sm mb-4">
                <span className="text-slate-500 font-semibold">Subtotal</span>
                <span className="text-xl font-black text-slate-900">${cartTotal.toFixed(2)} USD</span>
              </div>

              <button
                onClick={() => {
                  setCartOpen(false);
                  handleCheckout();
                }}
                disabled={cart.length === 0}
                className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Lock className="w-4 h-4" />
                <span>Proceed to Inframe Checkout</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Gumroad Inframe Checkout Modal */}
      <GumroadIframeModal
        isOpen={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        checkoutUrl={activeCheckoutUrl}
        productTitle={activeCheckoutTitle}
        amount={activeCheckoutAmount}
      />

    </div>
  );
}
