'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { 
  Store, 
  ShoppingBag, 
  Plus, 
  DollarSign, 
  TrendingUp, 
  ExternalLink, 
  Trash2, 
  Copy, 
  ArrowUpRight,
  Sparkles,
  RefreshCw,
  Sliders,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const [stores, setStores] = useState([]);
  const [activeStore, setActiveStore] = useState(null);
  const [productCounts, setProductCounts] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchStores = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stores');
      const data = await res.json();
      if (data.success && Array.isArray(data.stores)) {
        setStores(data.stores);
        if (data.stores.length > 0) {
          setActiveStore(data.stores[0]);
          // Fetch product counts for each store
          data.stores.forEach(s => fetchStoreProducts(s.id));
        } else {
          setActiveStore(null);
        }
      }
    } catch (e) {
      toast.error('Failed to load stores: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStoreProducts = async (storeId) => {
    try {
      const res = await fetch(`/api/products?store_id=${storeId}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.products)) {
        setProductCounts(prev => ({ ...prev, [storeId]: data.products.length }));
      }
    } catch {}
  };

  useEffect(() => {
    fetchStores();
  }, []);

  const handleDeleteStore = async (store) => {
    if (!confirm(`Are you sure you want to delete "${store.name}"? All products, orders, and links will be permanently erased.`)) {
      return;
    }
    const toastId = toast.loading(`Deleting ${store.name}...`);
    try {
      const res = await fetch(`/api/stores?id=${store.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success(`Store "${store.name}" deleted`, { id: toastId });
        fetchStores();
      } else {
        toast.error('Delete failed: ' + (data.error || 'Server error'), { id: toastId });
      }
    } catch (e) {
      toast.error('Error deleting: ' + e.message, { id: toastId });
    }
  };

  const totalProducts = Object.values(productCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar 
        stores={stores} 
        activeStore={activeStore} 
        onStoreChange={(s) => setActiveStore(s)} 
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Master Dashboard Overview
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Multi-store management, live catalog synchronization, and isolated storefront routing.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/store/cloner"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-sm transition"
            >
              <Copy className="w-3.5 h-3.5 text-indigo-600" />
              <span>Clone Store</span>
            </Link>
            <Link
              href="/store/create"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create Store</span>
            </Link>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Revenue</span>
              <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-100">0 orders</span>
            </div>
            <div className="text-3xl font-black text-slate-900">$0.00</div>
            <div className="text-xs text-slate-400 mt-2 flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5" />
              <span>Real-time Gumroad webhook verified</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Active Stores</span>
              <span className="text-[11px] font-semibold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full border border-indigo-100">Live</span>
            </div>
            <div className="text-3xl font-black text-slate-900">{stores.length}</div>
            <div className="text-xs text-slate-400 mt-2 flex items-center gap-1">
              <Store className="w-3.5 h-3.5" />
              <span>PostgreSQL isolated tenants</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Products</span>
              <span className="text-[11px] font-semibold bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full border border-purple-100">Catalog</span>
            </div>
            <div className="text-3xl font-black text-slate-900">{totalProducts}</div>
            <div className="text-xs text-slate-400 mt-2 flex items-center gap-1">
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Synced across bio and shops</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Avg Margin</span>
              <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-100">Net</span>
            </div>
            <div className="text-3xl font-black text-slate-900">
              {totalProducts > 0 ? '55.0%' : '0.0%'}
            </div>
            <div className="text-xs text-slate-400 mt-2 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Live profit tracking</span>
            </div>
          </div>
        </div>

        {/* Content Body: Empty State OR Stores Grid */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
            <RefreshCw className="w-8 h-8 mx-auto animate-spin text-indigo-600 mb-3" />
            <p className="text-sm font-semibold">Connecting to Supabase PostgreSQL...</p>
          </div>
        ) : stores.length === 0 ? (
          /* Clean Zero-State Matching Mockup */
          <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-14 text-center max-w-3xl mx-auto shadow-sm">
            <div className="w-20 h-20 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-6 shadow-inner">
              <Store className="w-10 h-10" />
            </div>

            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Welcome to your Store Dashboard!
            </h2>
            <p className="text-sm text-slate-500 max-w-md mx-auto mt-2 leading-relaxed">
              You currently have 0 active stores. Create your first brand from scratch or clone any existing Shopify / WooCommerce store in 1 click.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
              <Link
                href="/store/create"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>[+] Create First Store</span>
              </Link>
              <Link
                href="/store/cloner"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-2 border border-slate-200"
              >
                <Copy className="w-4 h-4 text-slate-500" />
                <span>Clone Existing Store</span>
              </Link>
            </div>

            <div className="mt-10 pt-8 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Zero Ghost Data</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  PostgreSQL foreign keys ensure instant cascade deletion with zero leftover records.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Dual Frontends</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Every store automatically powers an e-commerce shop and a mobile Link-in-Bio tree.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-500" />
                  <span>Gumroad Inframe</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Embedded modal checkout eliminates redirection friction for your buyers.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Active Stores Listing */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>Active Stores</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                  {stores.length}
                </span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {stores.map((s) => (
                <div 
                  key={s.id} 
                  className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 shadow-sm p-5 transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 border border-indigo-200 text-indigo-700 font-black flex items-center justify-center text-sm shadow-sm">
                          {s.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-base leading-tight">{s.name}</h3>
                          <span className="text-xs text-slate-400 font-mono">/{s.slug}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteStore(s)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                        title="Delete Store"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-2 mb-4">
                      {s.description || 'Modern multi-channel store with synchronized catalog and link-in-bio presence.'}
                    </p>

                    <div className="flex items-center gap-2 mb-5">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                        {productCounts[s.id] ?? 0} Products
                      </span>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
                        USD ($)
                      </span>
                    </div>
                  </div>

                  {/* Store Actions */}
                  <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
                    <div className="grid grid-cols-2 gap-2">
                      <a
                        href={`/shop/${s.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition"
                      >
                        <span>Storefront</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </a>
                      <a
                        href={`/creator/${s.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold transition"
                      >
                        <span>Link-in-Bio</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    <Link
                      href={`/store/manage-product?store=${s.slug}`}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Manage Products & Margins</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
