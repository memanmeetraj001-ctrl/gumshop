'use client'

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
    Sparkles, 
    ArrowLeft, 
    Check, 
    X, 
    Globe, 
    Layers, 
    ShoppingBag, 
    Image as ImageIcon, 
    CheckCircle2, 
    AlertCircle, 
    Loader2, 
    ExternalLink, 
    Filter, 
    Edit2, 
    Save, 
    Trash2, 
    Store, 
    ArrowRight, 
    ShieldCheck, 
    Zap 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { setActiveStoreSlug } from '@/lib/activeStore';

export default function StoreImportPage() {
    const router = useRouter();

    // Workflow Stages: 'input' | 'analyzing' | 'preview' | 'creating' | 'done'
    const [stage, setStage] = useState('input');
    const [targetUrl, setTargetUrl] = useState('');
    const [analysisLog, setAnalysisLog] = useState([]);
    const [errorMsg, setErrorMsg] = useState('');

    // Extracted Data from Backend
    const [importData, setImportData] = useState(null);

    // Active Tab in Import Center: 'products' | 'banners' | 'categories' | 'branding'
    const [activeTab, setActiveTab] = useState('products');

    // Selection States
    const [selectedProductIds, setSelectedProductIds] = useState(new Set());
    const [selectedBannerUrls, setSelectedBannerUrls] = useState(new Set());
    const [primaryHeroBanner, setPrimaryHeroBanner] = useState('');
    const [selectedCategories, setSelectedCategories] = useState(new Set());

    // Inline Product Editing State
    const [editingProductId, setEditingProductId] = useState(null);
    const [editedProducts, setEditedProducts] = useState({});

    // Destination Store State
    const [destStoreName, setDestStoreName] = useState('');
    const [destStoreSlug, setDestStoreSlug] = useState('');
    const [destTheme, setDestTheme] = useState('viral_lander');
    const [destThemeColor, setDestThemeColor] = useState('#10B981');
    const [destDescription, setDestDescription] = useState('');

    // Rights / Copyright Confirmation State
    const [rightsConfirmed, setRightsConfirmed] = useState(false);

    // Auto-populate target URL if passed via query params (e.g. from cloner or dashboard)
    React.useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const queryUrl = params.get('url') || params.get('target');
            if (queryUrl && !targetUrl) {
                setTargetUrl(queryUrl);
            }
        }
    }, []);

    // Analysis Execution
    const handleAnalyzeStore = async (e) => {
        e?.preventDefault();
        if (!targetUrl.trim()) {
            toast.error('Please enter a store URL to analyze');
            return;
        }

        setStage('analyzing');
        setErrorMsg('');
        setAnalysisLog([
            'Verifying URL protocol and SSRF security policies...',
            'Establishing secure connection to public storefront...'
        ]);

        try {
            const res = await fetch('/api/importer/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: targetUrl.trim() })
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.error || 'Unable to inspect this store.');
            }

            // Populate preview
            // Normalize banners so every banner is guaranteed to have a string image URL
            const cleanBanners = (data.banners || []).map((b, idx) => {
                const imgUrl = typeof b === 'string' ? b : (b?.image || b?.url || '');
                return {
                    id: (typeof b === 'object' && b.id) || `ban_${idx}`,
                    image: imgUrl,
                    title: (typeof b === 'object' && b.title) || `Banner ${idx + 1}`
                };
            }).filter(b => Boolean(b.image));

            // Default: Select all banners and pick first image URL as hero
            const allBannerUrls = new Set(cleanBanners.map(b => b.image));
            setSelectedBannerUrls(allBannerUrls);
            setPrimaryHeroBanner(cleanBanners[0]?.image || '');

            // Default: Select all categories as clean strings
            const cleanCategories = (data.categories || ['Featured']).map(c => 
                typeof c === 'string' ? c : (c?.name || c?.title || 'Featured')
            ).filter(Boolean);
            const allCats = new Set(cleanCategories.length > 0 ? cleanCategories : ['Featured']);
            setSelectedCategories(allCats);

            // Populate preview with normalized data
            setImportData({
                ...data,
                banners: cleanBanners,
                categories: cleanCategories.length > 0 ? cleanCategories : ['Featured']
            });
            
            // Default: Select all detected products
            const allPIds = new Set((data.products || []).map(p => p.id));
            setSelectedProductIds(allPIds);

            // Pre-fill destination store inputs
            const initialName = data.store?.name || 'Imported Store';
            setDestStoreName(initialName);
            setDestStoreSlug(initialName.toLowerCase().replace(/[^a-z0-9-]+/g, '-'));
            setDestTheme(data.store?.theme || 'viral_lander');
            setDestThemeColor(data.store?.themeColor || '#10B981');
            setDestDescription(data.store?.description || `Curated catalog from ${initialName}.`);

            setStage('preview');
            toast.success(`Detected ${data.products?.length || 0} products & ${cleanBanners.length} banners! 🎉`);

        } catch (err) {
            console.error('Import analysis failed:', err);
            setErrorMsg(err.message || 'Unable to analyze store. Check the URL and try again.');
            setStage('input');
            toast.error(err.message || 'Store analysis failed');
        }
    };

    // Product Selection Helpers
    const toggleSelectAllProducts = () => {
        if (!importData?.products) return;
        if (selectedProductIds.size === importData.products.length) {
            setSelectedProductIds(new Set());
        } else {
            setSelectedProductIds(new Set(importData.products.map(p => p.id)));
        }
    };

    const toggleProductSelect = (id) => {
        setSelectedProductIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    // Banner Selection Helpers
    const toggleBannerSelect = (url) => {
        const cleanUrl = typeof url === 'string' ? url : (url?.image || url?.url || '');
        if (!cleanUrl) return;
        setSelectedBannerUrls(prev => {
            const next = new Set(prev);
            if (next.has(cleanUrl)) {
                next.delete(cleanUrl);
                if (primaryHeroBanner === cleanUrl) {
                    setPrimaryHeroBanner(Array.from(next)[0] || '');
                }
            } else {
                next.add(cleanUrl);
                if (!primaryHeroBanner) setPrimaryHeroBanner(cleanUrl);
            }
            return next;
        });
    };

    // Category Selection Helpers
    const toggleCategorySelect = (cat) => {
        const cleanCat = typeof cat === 'string' ? cat : (cat?.name || cat?.title || 'Featured');
        setSelectedCategories(prev => {
            const next = new Set(prev);
            if (next.has(cleanCat)) next.delete(cleanCat);
            else next.add(cleanCat);
            return next;
        });
    };

    // Inline Product Edit Helpers
    const handleSaveInlineEdit = (id, newFields) => {
        setEditedProducts(prev => ({
            ...prev,
            [id]: { ...(prev[id] || {}), ...newFields }
        }));
        setEditingProductId(null);
        toast.success('Product updated!');
    };

    // Execute Import & Store Creation
    const handleExecuteImport = async () => {
        if (!rightsConfirmed) {
            toast.error('Please confirm you have rights or permission to use the selected content.');
            return;
        }

        if (selectedProductIds.size === 0) {
            toast.error('Please select at least 1 product to import');
            return;
        }

        if (!destStoreName.trim()) {
            toast.error('Please enter a destination store name');
            return;
        }

        setStage('creating');

        try {
            // Merge original products with inline user modifications safely
            const finalProducts = (importData.products || [])
                .filter(p => selectedProductIds.has(p.id))
                .map(p => {
                    const overrides = editedProducts[p.id] || {};
                    const rawPrice = overrides.price !== undefined ? overrides.price : p.price;
                    const numPrice = typeof rawPrice === 'object' ? (rawPrice?.amount || rawPrice?.value || 0) : rawPrice;
                    const price = isNaN(parseFloat(numPrice)) ? 0 : parseFloat(numPrice);

                    const rawCompare = overrides.compareAtPrice !== undefined ? overrides.compareAtPrice : p.compareAtPrice;
                    const numCompare = typeof rawCompare === 'object' ? (rawCompare?.amount || rawCompare?.value || 0) : rawCompare;
                    const compareAtPrice = isNaN(parseFloat(numCompare)) ? (price > 0 ? Math.round(price * 1.35 * 100) / 100 : 0) : parseFloat(numCompare);

                    const rawCat = overrides.category !== undefined ? overrides.category : p.category;
                    const category = typeof rawCat === 'string' ? rawCat : (rawCat?.name || rawCat?.title || 'Featured');

                    const rawName = overrides.name !== undefined ? overrides.name : p.name;
                    const name = typeof rawName === 'string' ? rawName : String(rawName || 'Product');

                    return {
                        ...p,
                        ...overrides,
                        name,
                        price,
                        compareAtPrice,
                        category,
                        image: p.image || p.images?.[0] || ''
                    };
                });

            const cleanHeroUrl = typeof primaryHeroBanner === 'string' 
                ? primaryHeroBanner 
                : (primaryHeroBanner?.image || '');

            const bannerList = Array.from(selectedBannerUrls).map(b => 
                typeof b === 'string' ? b : (b?.image || '')
            ).filter(Boolean);

            const categoryList = Array.from(selectedCategories).map(c => 
                typeof c === 'string' ? c : (c?.name || '')
            ).filter(Boolean);

            const payload = {
                destinationStore: {
                    name: destStoreName.trim(),
                    slug: destStoreSlug.trim(),
                    theme: destTheme,
                    themeColor: destThemeColor,
                    description: destDescription.trim(),
                    logo: importData.store?.logo || finalProducts[0]?.image || '',
                    heroBanner: cleanHeroUrl,
                    sourceUrl: targetUrl.trim()
                },
                selectedProducts: finalProducts,
                selectedBanners: bannerList,
                selectedCategories: categoryList
            };

            const res = await fetch('/api/importer/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok || !data.success) {
                throw new Error(data.error || 'Failed to complete store import');
            }

            // Sync with local edge caches so storefront renders instantly, guarded against quota exceptions
            if (typeof window !== 'undefined') {
                const effectiveSlug = data.slug;
                try {
                    localStorage.setItem(`store_${effectiveSlug}`, JSON.stringify(data.store));
                } catch (e) {
                    console.warn('Storage quota notice on store save:', e.message);
                }
                try {
                    localStorage.setItem(`cloned_store_${effectiveSlug}`, JSON.stringify(data.store));
                } catch (e) {}
                try {
                    localStorage.setItem(`gumshop_db_stores/store_${effectiveSlug}`, JSON.stringify(data.store));
                } catch (e) {}
                try {
                    sessionStorage.setItem(`cloned_store_${effectiveSlug}`, JSON.stringify(data.store));
                } catch (e) {}
                try {
                    localStorage.removeItem('gumshop_stores_cleared');
                } catch (e) {}
                try {
                    setActiveStoreSlug(data.store);
                } catch (e) {}
            }

            toast.success(`Store "${destStoreName}" published successfully! 🚀`);
            router.push(`/shop/${data.slug}`);

        } catch (err) {
            console.error('Execute import error:', err);
            toast.error(err.message || 'Failed to import store');
            setStage('preview');
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased">
            {/* Header */}
            <header className="px-6 py-4 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link
                        href="/dashboard"
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition flex items-center gap-1.5 text-xs font-bold"
                    >
                        <ArrowLeft size={14} /> Master Dashboard
                    </Link>
                    <span className="text-slate-700">|</span>
                    <div className="flex items-center gap-2">
                        <div className="size-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                            <Sparkles size={15} />
                        </div>
                        <h1 className="text-sm font-bold text-white tracking-tight">AI Store Import Center</h1>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1">
                        <ShieldCheck size={12} /> SSRF Protected
                    </span>
                </div>
            </header>

            {/* Main Stage */}
            <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">

                {/* ─── STAGE 1: URL INPUT ─── */}
                {stage === 'input' && (
                    <div className="max-w-2xl mx-auto mt-6">
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-semibold text-emerald-400 mb-4 shadow-sm">
                                <Zap size={14} className="fill-emerald-400" />
                                <span>Zero-Friction Catalog & Banner Extraction</span>
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                                Import an External E-Commerce Store
                            </h2>
                            <p className="text-sm text-slate-400 mt-2 max-w-lg mx-auto leading-relaxed">
                                Enter any public store or collection URL. Our engine analyzes the catalog, extracts high-res banners, and gives you complete control to review before publishing.
                            </p>
                        </div>

                        {errorMsg && (
                            <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3 text-rose-300 text-xs font-medium">
                                <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-400" />
                                <div>
                                    <div className="font-bold text-white">Import Failed</div>
                                    <div className="mt-0.5">{errorMsg}</div>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleAnalyzeStore} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                                    Target Storefront URL
                                </label>
                                <div className="relative">
                                    <Globe size={18} className="absolute left-4 top-3.5 text-slate-500" />
                                    <input
                                        type="text"
                                        required
                                        placeholder="https://example-brand.com or brand.myshopify.com"
                                        value={targetUrl}
                                        onChange={(e) => setTargetUrl(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-2xl text-sm text-white placeholder-slate-600 focus:outline-none transition shadow-inner"
                                    />
                                </div>
                                <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1.5">
                                    <ShieldCheck size={13} className="text-slate-400" />
                                    <span>Only publicly accessible data is read. Authenticated and private networks are rejected.</span>
                                </p>
                            </div>

                            {/* Quick Presets / Examples */}
                            <div className="mt-5 pt-4 border-t border-slate-800/80">
                                <span className="text-xs font-semibold text-slate-400 mr-2">Try sample stores:</span>
                                <div className="inline-flex flex-wrap gap-2 mt-1">
                                    {[
                                        { label: 'HighGear Toys', url: 'https://highgeartoys.com' },
                                        { label: 'Gymshark Look', url: 'https://gymshark.com' },
                                        { label: 'Allbirds Shoes', url: 'https://allbirds.com' }
                                    ].map(sample => (
                                        <button
                                            key={sample.label}
                                            type="button"
                                            onClick={() => setTargetUrl(sample.url)}
                                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-medium text-slate-300 transition"
                                        >
                                            {sample.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full mt-6 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-extrabold text-sm shadow-lg shadow-emerald-500/20 transition active:scale-[0.99] flex items-center justify-center gap-2"
                            >
                                <Sparkles size={16} />
                                <span>Analyze Store Catalog & Banners</span>
                            </button>
                        </form>
                    </div>
                )}

                {/* ─── STAGE 2: ANALYZING SPINNER ─── */}
                {stage === 'analyzing' && (
                    <div className="max-w-md mx-auto my-20 text-center">
                        <div className="size-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-6 animate-pulse">
                            <Loader2 size={32} className="animate-spin" />
                        </div>
                        <h3 className="text-xl font-extrabold text-white">Inspecting Storefront...</h3>
                        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                            Extracting product listings, pricing, categories, and hero marketing banners.
                        </p>
                        <div className="mt-6 p-4 rounded-2xl bg-slate-900 border border-slate-800 text-left text-xs font-mono text-slate-400 space-y-2">
                            {analysisLog.map((log, i) => (
                                <div key={i} className="flex items-center gap-2 text-emerald-400">
                                    <Check size={12} />
                                    <span>{log}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ─── STAGE 3: IMPORT PREVIEW & SELECTION CENTER ─── */}
                {stage === 'preview' && importData && (
                    <div className="space-y-6 animate-in fade-in duration-200">
                        
                        {/* Summary Banner */}
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                {importData.store?.logo && (
                                    <div className="size-14 rounded-2xl bg-slate-800 border border-slate-700 p-1 shrink-0 overflow-hidden">
                                        <img src={importData.store.logo} alt="Logo" className="w-full h-full object-cover rounded-xl" />
                                    </div>
                                )}
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-lg font-black text-white">{importData.store?.name}</h2>
                                        <span className="text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                            {importData.platform}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-0.5 max-w-lg line-clamp-1">
                                        {importData.store?.description}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                                <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] text-slate-300 bg-slate-950/60 px-3 py-2 rounded-xl border border-slate-800 hover:border-slate-700 transition">
                                    <input 
                                        type="checkbox"
                                        checked={rightsConfirmed}
                                        onChange={(e) => setRightsConfirmed(e.target.checked)}
                                        className="size-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-emerald-500"
                                    />
                                    <span className="max-w-xs">I confirm I have permission/rights to use this imported content.</span>
                                </label>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setStage('input')}
                                        className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleExecuteImport}
                                        disabled={!rightsConfirmed}
                                        className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-extrabold shadow-md transition flex items-center justify-center gap-1.5 ${
                                            rightsConfirmed
                                                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-emerald-500/20 active:scale-95'
                                                : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                                        }`}
                                    >
                                        <span>Import & Publish ({selectedProductIds.size} items)</span>
                                        <ArrowRight size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Navigation Tabs */}
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setActiveTab('products')}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                                        activeTab === 'products'
                                            ? 'bg-emerald-500 text-slate-950 shadow-sm'
                                            : 'text-slate-400 hover:text-white hover:bg-slate-900'
                                    }`}
                                >
                                    <ShoppingBag size={14} />
                                    <span>Products ({selectedProductIds.size} / {importData.products?.length || 0})</span>
                                </button>

                                <button
                                    onClick={() => setActiveTab('banners')}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                                        activeTab === 'banners'
                                            ? 'bg-emerald-500 text-slate-950 shadow-sm'
                                            : 'text-slate-400 hover:text-white hover:bg-slate-900'
                                    }`}
                                >
                                    <ImageIcon size={14} />
                                    <span>Hero Banners ({selectedBannerUrls.size} / {importData.banners?.length || 0})</span>
                                </button>

                                <button
                                    onClick={() => setActiveTab('categories')}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                                        activeTab === 'categories'
                                            ? 'bg-emerald-500 text-slate-950 shadow-sm'
                                            : 'text-slate-400 hover:text-white hover:bg-slate-900'
                                    }`}
                                >
                                    <Layers size={14} />
                                    <span>Categories ({selectedCategories.size})</span>
                                </button>

                                <button
                                    onClick={() => setActiveTab('branding')}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                                        activeTab === 'branding'
                                            ? 'bg-emerald-500 text-slate-950 shadow-sm'
                                            : 'text-slate-400 hover:text-white hover:bg-slate-900'
                                    }`}
                                >
                                    <Store size={14} />
                                    <span>Destination Setup</span>
                                </button>
                            </div>

                            {activeTab === 'products' && (
                                <button
                                    onClick={toggleSelectAllProducts}
                                    className="text-xs font-bold text-slate-400 hover:text-white underline decoration-slate-600"
                                >
                                    {selectedProductIds.size === importData.products?.length ? 'Deselect All' : 'Select All'}
                                </button>
                            )}
                        </div>

                        {/* ─── TAB: PRODUCTS ─── */}
                        {activeTab === 'products' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {importData.products?.map((prod) => {
                                    const isSelected = selectedProductIds.has(prod.id);
                                    const isEditing = editingProductId === prod.id;
                                    const edited = editedProducts[prod.id] || {};
                                    const rawPrice = edited.price !== undefined ? edited.price : prod.price;
                                    const numPrice = typeof rawPrice === 'object' ? (rawPrice?.amount || rawPrice?.value || 0) : rawPrice;
                                    const displayPrice = isNaN(parseFloat(numPrice)) ? 0 : parseFloat(numPrice);

                                    const rawName = edited.name !== undefined ? edited.name : prod.name;
                                    const displayName = typeof rawName === 'string' ? rawName : String(rawName || 'Product');

                                    const rawCat = edited.category !== undefined ? edited.category : prod.category;
                                    const displayCategory = typeof rawCat === 'string' ? rawCat : (rawCat?.name || rawCat?.title || 'Featured');

                                    const prodImg = prod.image || prod.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500';

                                    return (
                                        <div
                                            key={prod.id}
                                            className={`rounded-2xl p-4 border transition flex flex-col justify-between ${
                                                isSelected 
                                                    ? 'bg-slate-900 border-emerald-500/50 shadow-sm shadow-emerald-500/5' 
                                                    : 'bg-slate-900/40 border-slate-800 opacity-60'
                                            }`}
                                        >
                                            <div>
                                                <div className="flex items-start justify-between gap-3 mb-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => toggleProductSelect(prod.id)}
                                                        className="size-4.5 rounded text-emerald-500 focus:ring-0 focus:outline-none cursor-pointer mt-1"
                                                    />
                                                    <div className="size-16 rounded-xl bg-slate-800 shrink-0 overflow-hidden border border-slate-700">
                                                        <img 
                                                            src={prodImg} 
                                                            alt={displayName} 
                                                            className="w-full h-full object-cover" 
                                                            onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500'; }}
                                                        />
                                                    </div>
                                                </div>

                                                {isEditing ? (
                                                    <div className="space-y-2 mt-2">
                                                        <input
                                                            type="text"
                                                            value={displayName}
                                                            onChange={(e) => setEditedProducts(prev => ({
                                                                ...prev,
                                                                [prod.id]: { ...(prev[prod.id] || {}), name: e.target.value }
                                                            }))}
                                                            className="w-full text-xs font-bold text-white bg-slate-950 border border-slate-700 rounded-lg p-1.5"
                                                        />
                                                        <div className="flex gap-2">
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                value={displayPrice}
                                                                onChange={(e) => setEditedProducts(prev => ({
                                                                    ...prev,
                                                                    [prod.id]: { ...(prev[prod.id] || {}), price: e.target.value }
                                                                }))}
                                                                className="w-1/2 text-xs text-white bg-slate-950 border border-slate-700 rounded-lg p-1.5"
                                                            />
                                                            <input
                                                                type="text"
                                                                value={displayCategory}
                                                                onChange={(e) => setEditedProducts(prev => ({
                                                                    ...prev,
                                                                    [prod.id]: { ...(prev[prod.id] || {}), category: e.target.value }
                                                                }))}
                                                                className="w-1/2 text-xs text-white bg-slate-950 border border-slate-700 rounded-lg p-1.5"
                                                            />
                                                        </div>
                                                        <button
                                                            onClick={() => setEditingProductId(null)}
                                                            className="w-full py-1 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs"
                                                        >
                                                            Done Editing
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <h4 className="text-xs font-bold text-white line-clamp-2 leading-snug">
                                                            {displayName}
                                                        </h4>
                                                        <div className="flex items-center justify-between mt-2">
                                                            <span className="text-sm font-black text-emerald-400">
                                                                ${displayPrice.toFixed(2)}
                                                            </span>
                                                            <span className="text-[10px] font-semibold uppercase text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                                                                {displayCategory}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {!isEditing && (
                                                <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                                                    <button
                                                        onClick={() => setEditingProductId(prod.id)}
                                                        className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 font-semibold"
                                                    >
                                                        <Edit2 size={12} /> Edit
                                                    </button>
                                                    <span className="text-[10px] text-slate-500 font-mono">
                                                        {isSelected ? '✓ Included' : '✕ Excluded'}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* ─── TAB: BANNERS ─── */}
                        {activeTab === 'banners' && (
                            <div className="space-y-4">
                                <div className="text-xs text-slate-400 mb-2">
                                    Click any banner to set as the <strong>Primary Storefront Hero Banner</strong>. Checkboxes determine which banners are preserved in the gallery.
                                </div>
                                {(!importData.banners || importData.banners.length === 0) ? (
                                    <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-2xl p-6">
                                        <ImageIcon size={32} className="mx-auto text-slate-600 mb-2" />
                                        <p className="text-xs text-slate-400">No standalone hero banners detected on the target site.</p>
                                        <p className="text-[11px] text-slate-500 mt-1">The primary product image will be used as the storefront header.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {importData.banners.map((banner, idx) => {
                                            const bannerUrl = typeof banner === 'string' ? banner : (banner?.image || banner?.url || '');
                                            if (!bannerUrl) return null;
                                            const isHero = primaryHeroBanner === bannerUrl;
                                            const isSelected = selectedBannerUrls.has(bannerUrl);

                                            return (
                                                <div
                                                    key={banner.id || idx}
                                                    className={`rounded-2xl overflow-hidden border transition relative group ${
                                                        isHero 
                                                            ? 'border-emerald-500 ring-2 ring-emerald-500/30' 
                                                            : (isSelected ? 'border-slate-700' : 'border-slate-800 opacity-50')
                                                    }`}
                                                >
                                                    <div className="h-44 bg-slate-900 relative">
                                                        <img 
                                                            src={bannerUrl} 
                                                            alt={`Banner ${idx + 1}`} 
                                                            className="w-full h-full object-cover" 
                                                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                                        />
                                                        <div className="absolute top-3 left-3 flex items-center gap-2">
                                                            <input
                                                                type="checkbox"
                                                                checked={isSelected}
                                                                onChange={() => toggleBannerSelect(bannerUrl)}
                                                                className="size-4.5 rounded text-emerald-500 focus:ring-0 focus:outline-none cursor-pointer"
                                                            />
                                                            {isHero && (
                                                                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-sm">
                                                                    Primary Hero
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="p-3 bg-slate-900 flex items-center justify-between text-xs">
                                                        <span className="text-slate-400 truncate max-w-xs font-mono text-[11px]">{bannerUrl}</span>
                                                        <button
                                                            onClick={() => {
                                                                setPrimaryHeroBanner(bannerUrl);
                                                                if (!selectedBannerUrls.has(bannerUrl)) toggleBannerSelect(bannerUrl);
                                                            }}
                                                            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-white font-bold transition"
                                                        >
                                                            {isHero ? 'Active Hero' : 'Set as Hero'}
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ─── TAB: CATEGORIES ─── */}
                        {activeTab === 'categories' && (
                            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                                <h3 className="text-sm font-bold text-white mb-3">Select Categories to Retain</h3>
                                <div className="flex flex-wrap gap-2.5">
                                    {importData.categories?.map((cat, idx) => {
                                        const catName = typeof cat === 'string' ? cat : (cat?.name || cat?.title || `Category ${idx + 1}`);
                                        const isSelected = selectedCategories.has(catName);
                                        return (
                                            <button
                                                key={catName || idx}
                                                onClick={() => toggleCategorySelect(catName)}
                                                className={`px-4 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
                                                    isSelected
                                                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                                        : 'bg-slate-950 text-slate-500 border-slate-800 hover:border-slate-700'
                                                }`}
                                            >
                                                <span>{catName}</span>
                                                {isSelected ? <Check size={13} /> : <X size={13} />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* ─── TAB: BRANDING & DESTINATION SETUP ─── */}
                        {activeTab === 'branding' && (
                            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-xl mx-auto space-y-4">
                                <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3">Destination Store Configuration</h3>
                                
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 mb-1">New Store Name</label>
                                    <input
                                        type="text"
                                        value={destStoreName}
                                        onChange={(e) => {
                                            setDestStoreName(e.target.value);
                                            setDestStoreSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-'));
                                        }}
                                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 mb-1">Store Slug</label>
                                    <div className="flex items-center">
                                        <span className="px-3 py-2.5 bg-slate-800 text-slate-500 rounded-l-xl text-xs font-mono">gumshop.online/shop/</span>
                                        <input
                                            type="text"
                                            value={destStoreSlug}
                                            onChange={(e) => setDestStoreSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-'))}
                                            className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-r-xl text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 mb-1">Store Theme</label>
                                    <select
                                        value={destTheme}
                                        onChange={(e) => setDestTheme(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                                    >
                                        <option value="viral_lander">Viral Lander (High Converting)</option>
                                        <option value="tech_hardware">Tech Hardware & RC</option>
                                        <option value="clean_beauty">Clean Minimalist Beauty</option>
                                        <option value="fashion_lookbook">Fashion Lookbook</option>
                                        <option value="digital_creator">Digital Creator</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 mb-1">Store Tagline / Bio</label>
                                    <textarea
                                        rows={2}
                                        value={destDescription}
                                        onChange={(e) => setDestDescription(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                            </div>
                        )}

                    </div>
                )}

                {/* ─── STAGE 4: CREATING SPINNER ─── */}
                {stage === 'creating' && (
                    <div className="max-w-md mx-auto my-20 text-center">
                        <div className="size-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-6 animate-pulse">
                            <Loader2 size={32} className="animate-spin" />
                        </div>
                        <h3 className="text-xl font-extrabold text-white">Generating Storefront...</h3>
                        <p className="text-xs text-slate-400 mt-2">
                            Configuring database, hero banners, and publishing products to your new isolated shop.
                        </p>
                    </div>
                )}

            </main>
        </div>
    );
}
