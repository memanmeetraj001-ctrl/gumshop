'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { 
  Copy, 
  Search, 
  ArrowRight, 
  CheckCircle2, 
  Package, 
  Loader2, 
  ExternalLink,
  Store,
  Layers,
  Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';

function ClonerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const storeParam = searchParams.get('store');

  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [urlInput, setUrlInput] = useState('');
  const [inspecting, setInspecting] = useState(false);
  const [inspectResult, setInspectResult] = useState(null);
  const [selectedItems, setSelectedItems] = useState({});
  const [importing, setImporting] = useState(false);

  // Load stores
  useEffect(() => {
    const fetchStores = async () => {
      try {
        const res = await fetch('/api/stores');
        const data = await res.json();
        if (data.success && Array.isArray(data.stores)) {
          setStores(data.stores);
          if (data.stores.length > 0) {
            const current = storeParam
              ? data.stores.find(s => s.slug === storeParam || s.id === storeParam) || data.stores[0]
              : data.stores[0];
            setSelectedStore(current);
          }
        }
      } catch (e) {
        toast.error('Failed to load stores');
      }
    };
    fetchStores();
  }, [storeParam]);

  // Inspect Store URL
  const handleInspect = async (e) => {
    e.preventDefault();
    if (!urlInput.trim()) {
      toast.error('Please enter a store URL');
      return;
    }

    setInspecting(true);
    setInspectResult(null);
    const toastId = toast.loading('Analyzing store architecture & catalog...');

    try {
      const res = await fetch('/api/cloner/inspect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput.trim() })
      });
      const data = await res.json();

      if (data.success && data.result) {
        setInspectResult(data.result);
        // Select all products by default
        const initSelect = {};
        data.result.products.forEach((p, idx) => {
          initSelect[idx] = true;
        });
        setSelectedItems(initSelect);
        toast.success(`Found ${data.result.products.length} products on ${data.result.platform}!`, { id: toastId });
      } else {
        toast.error('Inspection failed: ' + (data.error || 'Could not scrape store'), { id: toastId });
      }
    } catch (e) {
      toast.error('Inspection error: ' + e.message, { id: toastId });
    } finally {
      setInspecting(false);
    }
  };

  // Toggle item selection
  const toggleSelect = (idx) => {
    setSelectedItems(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  // 1-Click Clone to Store
  const handleCloneToStore = async () => {
    if (!selectedStore) {
      toast.error('Please select an active target store first');
      return;
    }
    if (!inspectResult || !inspectResult.products) return;

    const productsToImport = inspectResult.products.filter((_, idx) => selectedItems[idx]);
    if (productsToImport.length === 0) {
      toast.error('Please select at least 1 product to clone');
      return;
    }

    setImporting(true);
    const toastId = toast.loading(`Cloning ${productsToImport.length} products into ${selectedStore.name}...`);

    try {
      const res = await fetch('/api/cloner/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store_id: selectedStore.id,
          products: productsToImport
        })
      });
      const data = await res.json();

      if (data.success) {
        toast.success(`Successfully imported ${data.count} products!`, { id: toastId });
        router.push(`/store/manage-product?store=${selectedStore.slug}`);
      } else {
        toast.error('Import failed: ' + (data.error || 'Server error'), { id: toastId });
      }
    } catch (e) {
      toast.error('Error importing: ' + e.message, { id: toastId });
    } finally {
      setImporting(false);
    }
  };

  const selectedCount = Object.values(selectedItems).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar 
        stores={stores} 
        activeStore={selectedStore} 
        onStoreChange={(s) => setSelectedStore(s)} 
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <span>Automated Store Cloner</span>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              1-Click Extraction
            </span>
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Inspect any Shopify, WooCommerce, or custom storefront URL. Automatically extract product descriptions, images, prices, and categories into your Supabase database.
          </p>
        </div>

        {/* Input & Target Store Bar */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 mb-8">
          
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Target Destination Store</span>
              <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Store className="w-4 h-4 text-indigo-600" />
                <span>{selectedStore ? selectedStore.name : 'No Store Selected'}</span>
                {selectedStore && <span className="text-xs text-slate-400 font-mono">({selectedStore.slug})</span>}
              </div>
            </div>

            {stores.length === 0 && (
              <span className="text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
                ⚠️ Please create a store first from the top menu before cloning.
              </span>
            )}
          </div>

          <form onSubmit={handleInspect} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example-store.com (e.g. Shopify, BigCommerce, WooCommerce)"
                className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={inspecting}
              className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {inspecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>Inspect & Extract</span>
            </button>
          </form>

          {/* Quick Demo Pre-fill links */}
          <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold">Try sample URL:</span>
            <button
              type="button"
              onClick={() => setUrlInput('https://highgeartoys.com')}
              className="text-indigo-600 hover:underline font-mono"
            >
              https://highgeartoys.com
            </button>
          </div>
        </div>

        {/* Inspected Results */}
        {inspectResult && (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    {inspectResult.platform}
                  </span>
                  <h2 className="text-lg font-bold text-slate-900">{inspectResult.storeName}</h2>
                </div>
                <p className="text-xs text-slate-500">
                  Extracted {inspectResult.products.length} products • {selectedCount} selected for cloning
                </p>
              </div>

              <button
                onClick={handleCloneToStore}
                disabled={importing || selectedCount === 0 || !selectedStore}
                className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow transition flex items-center gap-2 disabled:opacity-50"
              >
                {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
                <span>1-Click Clone {selectedCount} Products</span>
              </button>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {inspectResult.products.map((p, idx) => {
                const isSelected = !!selectedItems[idx];
                return (
                  <div
                    key={idx}
                    onClick={() => toggleSelect(idx)}
                    className={`cursor-pointer rounded-2xl border p-4 transition flex flex-col justify-between ${
                      isSelected 
                        ? 'border-indigo-600 bg-indigo-50/20 shadow-xs' 
                        : 'border-slate-200 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div>
                      <div className="relative aspect-square w-full rounded-xl bg-slate-100 overflow-hidden mb-3 border border-slate-200">
                        {p.images?.[0] ? (
                          <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <Package className="w-8 h-8" />
                          </div>
                        )}
                        <div className="absolute top-2 right-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="w-4 h-4 text-indigo-600 rounded"
                          />
                        </div>
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 line-clamp-2 mb-1">{p.title}</h4>
                      <div className="text-[11px] text-slate-400 line-clamp-2 mb-2">{p.description}</div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-black text-slate-900">${p.price?.toFixed(2)}</span>
                      <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                        COGS: ${p.cost_of_goods?.toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default function ClonerPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading store cloner...</div>}>
      <ClonerContent />
    </Suspense>
  );
}
