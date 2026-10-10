'use client'

import React, { useState, useEffect, useMemo } from 'react';
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
    Zap,
    Upload,
    FileText,
    DollarSign,
    Search,
    LayoutGrid,
    Table as TableIcon,
    Star,
    Percent,
    Scissors
} from 'lucide-react';
import toast from 'react-hot-toast';
import { setActiveStoreSlug, setHomepageStoreSlug, getAllLocalStores } from '@/lib/activeStore';
import { isStoreDeleted } from '@/lib/firebaseDb';
import { normalizeProductPrice, applyPriceSlash } from '@/lib/importer/priceNormalizer.js';
import { parseCatalogFile } from '@/lib/importer/fileImporter.js';

export default function StoreImportPage() {
    const router = useRouter();

    // Workflow Stages: 'input' | 'analyzing' | 'preview' | 'creating' | 'done'
    const [stage, setStage] = useState('input');
    const [inputMethod, setInputMethod] = useState('url'); // 'url' | 'file'
    const [targetUrl, setTargetUrl] = useState('');
    const [analysisLog, setAnalysisLog] = useState([]);
    const [errorMsg, setErrorMsg] = useState('');

    // Extracted Data from Backend / File
    const [importData, setImportData] = useState(null);

    // Active Tab in Import Center: 'products' | 'banners' | 'categories' | 'branding'
    const [activeTab, setActiveTab] = useState('products');

    // Selection States
    const [selectedProductIds, setSelectedProductIds] = useState(new Set());
    const [selectedBannerUrls, setSelectedBannerUrls] = useState(new Set());
    const [primaryHeroBanner, setPrimaryHeroBanner] = useState('');
    const [selectedCategories, setSelectedCategories] = useState(new Set());

    // Inline Product Editing State: map of productId -> { name, price, compareAtPrice, category }
    const [editingProductId, setEditingProductId] = useState(null);
    const [editedProducts, setEditedProducts] = useState({});

    // Bulk Pricing Controls
    const [currencySymbol, setCurrencySymbol] = useState('$');
    const [activeMarkup, setActiveMarkup] = useState(1.0);
    const [activeSlashPercent, setActiveSlashPercent] = useState(0);
    const [customSlashInput, setCustomSlashInput] = useState('');

    // Filter & Search Controls in Preview
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

    // Destination Store Mode: 'new' | 'append'
    const [destMode, setDestMode] = useState('new');
    const [existingStores, setExistingStores] = useState([]);
    const [selectedExistingStoreId, setSelectedExistingStoreId] = useState('');

    // Destination Store Form State
    const [destStoreName, setDestStoreName] = useState('');
    const [destStoreSlug, setDestStoreSlug] = useState('');
    const [destTheme, setDestTheme] = useState('viral_lander');
    const [destThemeColor, setDestThemeColor] = useState('#10B981');
    const [destDescription, setDestDescription] = useState('');
    const [storeArchitecture, setStoreArchitecture] = useState('multi'); // 'multi' | 'single'
    const [autoConvertCurrency, setAutoConvertCurrency] = useState(true);

    // 1-Click Homepage Setting & Rights Confirmation
    const [setAsHomepage, setSetAsHomepage] = useState(false);
    const [rightsConfirmed, setRightsConfirmed] = useState(false);

    // Load Existing Stores for "Append" Option
    useEffect(() => {
        const loadStores = async () => {
            const local = getAllLocalStores().filter(s => s && !isStoreDeleted(s.id) && !isStoreDeleted(s.username));
            const map = new Map();
            local.forEach(s => {
                const slug = (s.username || s.id || '').toLowerCase();
                if (slug) map.set(slug, s);
            });

            try {
                const res = await fetch('/api/store/data').catch(() => null);
                if (res && res.ok) {
                    const data = await res.json().catch(() => ({}));
                    if (Array.isArray(data.stores)) {
                        data.stores.forEach(s => {
                            const slug = (s.username || s.name || s.id || '').toLowerCase().replace(/[^a-z0-9-]+/g, '-');
                            if (slug && !isStoreDeleted(slug) && !isStoreDeleted(s.id) && !map.has(slug)) {
                                map.set(slug, {
                                    id: s.id || `store_${slug}`,
                                    name: s.name || slug,
                                    username: slug
                                });
                            }
                        });
                    }
                }
            } catch {}

            const storesList = Array.from(map.values());
            setExistingStores(storesList);
            if (storesList.length > 0) {
                setSelectedExistingStoreId(storesList[0].username || storesList[0].id);
            }
        };

        loadStores();

        // Auto-populate target URL if passed via query params
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const queryUrl = params.get('url') || params.get('target');
            if (queryUrl && !targetUrl) {
                setTargetUrl(queryUrl);
            }
        }
    }, []);

    // Helper: Initialize Extracted Data into Preview State
    const setupImportPreview = (data) => {
        const cleanBanners = (data.banners || []).map((b, idx) => {
            const imgUrl = typeof b === 'string' ? b : (b?.image || b?.url || '');
            return {
                id: (typeof b === 'object' && b.id) || `ban_${idx}`,
                image: imgUrl,
                title: (typeof b === 'object' && b.title) || `Banner ${idx + 1}`
            };
        }).filter(b => Boolean(b.image));

        const allBannerUrls = new Set(cleanBanners.map(b => b.image));
        setSelectedBannerUrls(allBannerUrls);
        setPrimaryHeroBanner(cleanBanners[0]?.image || '');

        const cleanCategories = (data.categories || ['Featured']).map(c => 
            typeof c === 'string' ? c : (c?.name || c?.title || 'Featured')
        ).filter(Boolean);
        setSelectedCategories(new Set(cleanCategories.length > 0 ? cleanCategories : ['Featured']));

        // Normalize initial product prices
        const productsWithNormalizedPrices = (data.products || []).map(p => ({
            ...p,
            price: normalizeProductPrice(p.price),
            compareAtPrice: p.compareAtPrice ? normalizeProductPrice(p.compareAtPrice) : Math.round(normalizeProductPrice(p.price) * 1.35 * 100) / 100
        }));

        setImportData({
            ...data,
            banners: cleanBanners,
            categories: cleanCategories.length > 0 ? cleanCategories : ['Featured'],
            products: productsWithNormalizedPrices
        });

        setSelectedProductIds(new Set(productsWithNormalizedPrices.map(p => p.id)));

        // Pre-fill destination store inputs
        const initialName = data.store?.name || 'Imported Store';
        setDestStoreName(initialName);
        setDestStoreSlug(initialName.toLowerCase().replace(/[^a-z0-9-]+/g, '-'));
        setDestTheme(data.store?.theme || 'viral_lander');
        setDestThemeColor(data.store?.themeColor || '#10B981');
        setDestDescription(data.store?.description || `Curated catalog from ${initialName}.`);

        setStage('preview');
        toast.success(`Detected ${productsWithNormalizedPrices.length} products & ${cleanBanners.length} banners! 🎉`);
    };

    // Analysis Execution via Web Scraper
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
            'Establishing secure connection to public storefront...',
            'Extracting product catalogs, variants, and high-res imagery...'
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

            setupImportPreview(data);

        } catch (err) {
            console.error('Import analysis failed:', err);
            setErrorMsg(err.message || 'Unable to analyze store. Check the URL and try again.');
            setStage('input');
            toast.error(err.message || 'Store analysis failed');
        }
    };

    // File Upload Handler (CSV or JSON)
    const handleFileUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result;
            if (typeof content !== 'string') return;

            const parsed = parseCatalogFile(content, file.name);
            if (!parsed.success) {
                toast.error(parsed.error || 'Failed to parse file');
                return;
            }

            setupImportPreview(parsed);
        };
        reader.readAsText(file);
    };

    // ─── BULK PRICING TRANSFORMATIONS ───

    // 1-Click Fix Cents (Divide by 100)
    const handleDivideBy100 = () => {
        if (!importData?.products) return;
        const newOverrides = { ...editedProducts };
        importData.products.forEach(p => {
            const currentPrice = newOverrides[p.id]?.price !== undefined ? newOverrides[p.id].price : p.price;
            const currentCompare = newOverrides[p.id]?.compareAtPrice !== undefined ? newOverrides[p.id].compareAtPrice : p.compareAtPrice;
            newOverrides[p.id] = {
                ...(newOverrides[p.id] || {}),
                price: Math.round((currentPrice / 100) * 100) / 100,
                compareAtPrice: currentCompare ? Math.round((currentCompare / 100) * 100) / 100 : 0
            };
        });
        setEditedProducts(newOverrides);
        toast.success('All prices converted from cents to dollars! (÷ 100) 💰');
    };

    // 1-Click Multiply by 100 (Revert)
    const handleMultiplyBy100 = () => {
        if (!importData?.products) return;
        const newOverrides = { ...editedProducts };
        importData.products.forEach(p => {
            const currentPrice = newOverrides[p.id]?.price !== undefined ? newOverrides[p.id].price : p.price;
            const currentCompare = newOverrides[p.id]?.compareAtPrice !== undefined ? newOverrides[p.id].compareAtPrice : p.compareAtPrice;
            newOverrides[p.id] = {
                ...(newOverrides[p.id] || {}),
                price: Math.round((currentPrice * 100) * 100) / 100,
                compareAtPrice: currentCompare ? Math.round((currentCompare * 100) * 100) / 100 : 0
            };
        });
        setEditedProducts(newOverrides);
        toast.success('Prices multiplied by 100. ↺');
    };

    // Apply Margin Markup (e.g. 1.15x, 1.25x, 1.5x)
    const handleApplyMarkup = (multiplier) => {
        if (!importData?.products) return;
        setActiveMarkup(multiplier);
        const newOverrides = { ...editedProducts };
        importData.products.forEach(p => {
            const basePrice = p.price || 0;
            const newPrice = Math.round(basePrice * multiplier * 100) / 100;
            newOverrides[p.id] = {
                ...(newOverrides[p.id] || {}),
                price: newPrice,
                compareAtPrice: Math.round(newPrice * 1.35 * 100) / 100
            };
        });
        setEditedProducts(newOverrides);
        toast.success(`Applied ${Math.round((multiplier - 1) * 100)}% markup! 📈`);
    };

    // Slash Prices by Any Percentage (e.g. 10%, 20%, 50%, or custom %)
    const handleSlashPrices = (percent) => {
        if (!importData?.products) return;
        const pct = parseFloat(percent);
        if (isNaN(pct) || pct < 0 || pct > 99) {
            toast.error('Please enter a valid percentage between 1% and 99%');
            return;
        }
        setActiveSlashPercent(pct);
        const newOverrides = { ...editedProducts };
        importData.products.forEach(p => {
            const basePrice = p.price || 0;
            const { price: slashed, compareAtPrice: compare } = applyPriceSlash(basePrice, pct, p.compareAtPrice);
            newOverrides[p.id] = {
                ...(newOverrides[p.id] || {}),
                price: slashed,
                compareAtPrice: compare
            };
        });
        setEditedProducts(newOverrides);
        if (pct === 0) {
            toast.success('Prices restored to original imported values (0% slash)');
        } else {
            toast.success(`Slashed all prices by ${pct}%! Strike-through discounts activated. ✂️`);
        }
    };

    // Charm Pricing (Round to .99)
    const handleCharmPricing = () => {
        if (!importData?.products) return;
        const newOverrides = { ...editedProducts };
        importData.products.forEach(p => {
            const currentPrice = newOverrides[p.id]?.price !== undefined ? newOverrides[p.id].price : p.price;
            if (currentPrice > 1) {
                const charmed = Math.floor(currentPrice) + 0.99;
                newOverrides[p.id] = {
                    ...(newOverrides[p.id] || {}),
                    price: charmed
                };
            }
        });
        setEditedProducts(newOverrides);
        toast.success('All prices rounded to .99 charm pricing! 🎯');
    };

    // Single Product Fix Cents (e.g. 9999 -> 99.99)
    const handleFixSingleProductPrice = (productId) => {
        const prod = importData?.products?.find(p => p.id === productId);
        if (!prod) return;
        const currentPrice = editedProducts[productId]?.price !== undefined ? editedProducts[productId].price : prod.price;
        const fixed = Math.round((currentPrice / 100) * 100) / 100;
        setEditedProducts(prev => ({
            ...prev,
            [productId]: {
                ...(prev[productId] || {}),
                price: fixed,
                compareAtPrice: Math.round(fixed * 1.35 * 100) / 100
            }
        }));
        toast.success(`Updated to ${currencySymbol}${fixed.toFixed(2)}`);
    };

    // Check if any prices look like raw cents (>= 1000 and integer)
    const centsCount = useMemo(() => {
        if (!importData?.products) return 0;
        return importData.products.filter(p => {
            const pr = editedProducts[p.id]?.price !== undefined ? editedProducts[p.id].price : p.price;
            return pr >= 1000 && Number.isInteger(pr);
        }).length;
    }, [importData, editedProducts]);

    // Filtered Products for Preview
    const filteredProducts = useMemo(() => {
        if (!importData?.products) return [];
        return importData.products.filter(p => {
            const edited = editedProducts[p.id] || {};
            const name = (edited.name !== undefined ? edited.name : p.name).toLowerCase();
            const category = (edited.category !== undefined ? edited.category : p.category) || 'Featured';
            const price = edited.price !== undefined ? edited.price : p.price;

            // Search query filter
            if (searchQuery.trim() && !name.includes(searchQuery.toLowerCase())) {
                return false;
            }

            // Category filter
            if (filterCategory !== 'all' && category !== filterCategory) {
                return false;
            }

            // Price range filter
            if (minPrice !== '' && price < parseFloat(minPrice)) return false;
            if (maxPrice !== '' && price > parseFloat(maxPrice)) return false;

            return true;
        });
    }, [importData, editedProducts, searchQuery, filterCategory, minPrice, maxPrice]);

    // Product Selection Helpers
    const toggleSelectAllFiltered = () => {
        if (filteredProducts.length === 0) return;
        const filteredIds = filteredProducts.map(p => p.id);
        const allSelected = filteredIds.every(id => selectedProductIds.has(id));

        setSelectedProductIds(prev => {
            const next = new Set(prev);
            if (allSelected) {
                filteredIds.forEach(id => next.delete(id));
            } else {
                filteredIds.forEach(id => next.add(id));
            }
            return next;
        });
    };

    const toggleProductSelect = (id) => {
        setSelectedProductIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    // Banner & Category Selection
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

    const toggleCategorySelect = (cat) => {
        const cleanCat = typeof cat === 'string' ? cat : (cat?.name || cat?.title || 'Featured');
        setSelectedCategories(prev => {
            const next = new Set(prev);
            if (next.has(cleanCat)) next.delete(cleanCat);
            else next.add(cleanCat);
            return next;
        });
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

        if (destMode === 'new' && !destStoreName.trim()) {
            toast.error('Please enter a destination store name');
            return;
        }

        setStage('creating');

        try {
            // Merge original products with user edits
            const finalProducts = (importData.products || [])
                .filter(p => selectedProductIds.has(p.id))
                .map(p => {
                    const overrides = editedProducts[p.id] || {};
                    const price = overrides.price !== undefined ? overrides.price : p.price;
                    const compareAtPrice = overrides.compareAtPrice !== undefined ? overrides.compareAtPrice : p.compareAtPrice;
                    const category = overrides.category !== undefined ? overrides.category : p.category;
                    const name = overrides.name !== undefined ? overrides.name : p.name;

                    return {
                        ...p,
                        name,
                        price,
                        compareAtPrice,
                        category: typeof category === 'string' ? category : (category?.name || 'Featured'),
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

            const chosenExisting = existingStores.find(s => (s.username === selectedExistingStoreId || s.id === selectedExistingStoreId));

            const destinationStorePayload = destMode === 'append' ? {
                id: chosenExisting?.id || selectedExistingStoreId,
                name: chosenExisting?.name || selectedExistingStoreId,
                slug: chosenExisting?.username || selectedExistingStoreId,
                sourceUrl: targetUrl.trim(),
                singleProductStore: storeArchitecture === 'single'
            } : {
                name: destStoreName.trim(),
                slug: (destStoreSlug.trim() || destStoreName.toLowerCase().replace(/[^a-z0-9-]+/g, '-') || 'store').replace(/^-|-$/g, ''),
                theme: destTheme,
                themeColor: destThemeColor,
                description: destDescription.trim(),
                logo: importData.store?.logo || finalProducts[0]?.image || '',
                heroBanner: cleanHeroUrl,
                sourceUrl: targetUrl.trim(),
                singleProductStore: storeArchitecture === 'single'
            };

            const payload = {
                destinationStore: destinationStorePayload,
                destinationMode: destMode,
                setAsHomepage,
                slashPercent: activeSlashPercent,
                autoConvertCurrency,
                selectedProducts: finalProducts.map(p => ({
                    ...p,
                    _preCalculated: activeSlashPercent > 0
                })),
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

            // Sync with local active store and homepage store
            if (typeof window !== 'undefined') {
                const effectiveSlug = data.slug;
                try {
                    localStorage.setItem(`store_${effectiveSlug}`, JSON.stringify(data.store));
                    localStorage.setItem(`cloned_store_${effectiveSlug}`, JSON.stringify(data.store));
                    localStorage.setItem(`gumshop_db_stores/store_${effectiveSlug}`, JSON.stringify(data.store));
                    localStorage.removeItem('gumshop_stores_cleared');
                    localStorage.removeItem('gumshop_empty_dashboard_ack');
                    setActiveStoreSlug(data.store);

                    if (setAsHomepage) {
                        await setHomepageStoreSlug(effectiveSlug);
                    }
                } catch (e) {
                    console.warn('Storage quota notice:', e.message);
                }
            }

            toast.success(
                destMode === 'append' 
                    ? `Added ${finalProducts.length} products to store "${destinationStorePayload.name}"! 📦` 
                    : `Store "${destStoreName}" published successfully! 🚀`
            );

            if (setAsHomepage) {
                toast.success('Designated as official Root Homepage (/)! 🌟');
            }

            router.push(`/shop/${data.slug}`);

        } catch (err) {
            console.error('Execute import error:', err);
            toast.error(err.message || 'Failed to import store');
            setStage('preview');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased">
            {/* Header */}
            <header className="px-6 py-4 border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-3">
                    <Link
                        href="/dashboard"
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center gap-1.5 text-xs font-bold"
                    >
                        <ArrowLeft size={14} /> Master Dashboard
                    </Link>
                    <span className="text-slate-300">|</span>
                    <div className="flex items-center gap-2">
                        <div className="size-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                            <Sparkles size={15} />
                        </div>
                        <h1 className="text-sm font-bold text-slate-900 tracking-tight">AI Store Import Center</h1>
                    </div>
                </div>

                <div className="flex items-center gap-2 text-xs">
                    <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold flex items-center gap-1">
                        <ShieldCheck size={12} /> SSRF Protected
                    </span>
                </div>
            </header>

            {/* Main Stage */}
            <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">

                {/* ─── STAGE 1: INPUT ─── */}
                {stage === 'input' && (
                    <div className="max-w-2xl mx-auto py-6">
                        <div className="text-center mb-6">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold mb-3">
                                <Zap size={14} /> Zero-Friction Catalog & Banner Extraction
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                                Import an External E-Commerce Store
                            </h2>
                            <p className="text-sm text-slate-600 mt-2 max-w-lg mx-auto leading-relaxed">
                                Enter any public store URL or upload a CSV/JSON catalog file. Our engine analyzes the catalog, normalizes pricing, extracts high-res banners, and gives you complete control before publishing.
                            </p>
                        </div>

                        {errorMsg && (
                            <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-700 text-xs font-medium">
                                <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-500" />
                                <div>
                                    <div className="font-bold text-rose-900">Import Failed</div>
                                    <div className="mt-0.5">{errorMsg}</div>
                                </div>
                            </div>
                        )}

                        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
                            
                            {/* Input Method Switcher */}
                            <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold">
                                <button
                                    type="button"
                                    onClick={() => setInputMethod('url')}
                                    className={`flex-1 py-2.5 rounded-xl transition flex items-center justify-center gap-2 ${
                                        inputMethod === 'url' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    <Globe size={14} />
                                    <span>Public Store URL</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setInputMethod('file')}
                                    className={`flex-1 py-2.5 rounded-xl transition flex items-center justify-center gap-2 ${
                                        inputMethod === 'file' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    <FileText size={14} />
                                    <span>Upload CSV / JSON</span>
                                </button>
                            </div>

                            {/* Store Architecture & Conversion Mode Selector (Available on Step 1) */}
                            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <label className="block text-xs font-black uppercase tracking-wider text-slate-800">
                                            Store Architecture & Optimization Mode
                                        </label>
                                        <p className="text-[11px] text-slate-500 mt-0.5">
                                            Choose how your imported store and Stan Store link-in-bio will be generated
                                        </p>
                                    </div>
                                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                        Selectable
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                    <button
                                        type="button"
                                        onClick={() => setStoreArchitecture('single')}
                                        className={`p-4 rounded-xl border text-left transition ${
                                            storeArchitecture === 'single'
                                                ? 'border-emerald-500 bg-white ring-2 ring-emerald-500/20 text-slate-900 shadow-sm'
                                                : 'border-slate-200 bg-white/70 text-slate-600 hover:border-slate-300'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                                                <span>🎯 Single-Product Store</span>
                                            </div>
                                            {storeArchitecture === 'single' && (
                                                <span className="size-4 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                                                    <Check size={11} className="stroke-[3]" />
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[11px] text-slate-500 mt-1.5 leading-snug">
                                            Dedicated high-converting Stan Store hero lander with 1, 2, and 3 multi-pack bundles and instant direct checkout.
                                        </p>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setStoreArchitecture('multi')}
                                        className={`p-4 rounded-xl border text-left transition ${
                                            storeArchitecture === 'multi'
                                                ? 'border-emerald-500 bg-white ring-2 ring-emerald-500/20 text-slate-900 shadow-sm'
                                                : 'border-slate-200 bg-white/70 text-slate-600 hover:border-slate-300'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                                                <span>🏬 Multi-Product Catalog</span>
                                            </div>
                                            {storeArchitecture === 'multi' && (
                                                <span className="size-4 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                                                    <Check size={11} className="stroke-[3]" />
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[11px] text-slate-500 mt-1.5 leading-snug">
                                            Standard browsable catalog collection with category filters, product search grid, and shopping cart.
                                        </p>
                                    </button>
                                </div>

                                {/* Currency Auto-Conversion Checkbox */}
                                <div className="pt-2 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <label className="flex items-center gap-2 cursor-pointer text-xs">
                                        <input
                                            type="checkbox"
                                            checked={autoConvertCurrency}
                                            onChange={(e) => setAutoConvertCurrency(e.target.checked)}
                                            className="size-4 accent-emerald-600 rounded text-emerald-600 cursor-pointer"
                                        />
                                        <span className="font-semibold text-slate-700">
                                            Auto-convert foreign currencies (Rs / INR / € / £) to USD baseline
                                        </span>
                                    </label>
                                    <span className="text-[10px] text-slate-500 font-mono">
                                        e.g. Rs. 5,300 → $61.27
                                    </span>
                                </div>
                            </div>

                            {/* Method A: URL Scraper Form */}
                            {inputMethod === 'url' && (
                                <form onSubmit={handleAnalyzeStore} className="space-y-5">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                                            Target Storefront URL
                                        </label>
                                        <div className="relative">
                                            <Globe size={18} className="absolute left-4 top-3.5 text-slate-400" />
                                            <input
                                                type="text"
                                                required
                                                placeholder="https://example-brand.com or brand.myshopify.com"
                                                value={targetUrl}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setTargetUrl(val);
                                                    if (val.includes('/products/') || val.includes('/product/')) {
                                                        setStoreArchitecture('single');
                                                    }
                                                }}
                                                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 focus:border-emerald-500 rounded-2xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition shadow-2xs"
                                            />
                                        </div>
                                        <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1.5">
                                            <ShieldCheck size={13} className="text-slate-400" />
                                            <span>Only publicly accessible data is read. Authenticated and private networks are rejected.</span>
                                        </p>
                                    </div>

                                    {/* Quick Presets / Examples */}
                                    <div className="pt-2 border-t border-slate-200">
                                        <span className="text-xs font-semibold text-slate-500 mr-2">Try sample stores:</span>
                                        <div className="inline-flex flex-wrap gap-2 mt-1">
                                            {[
                                                { label: 'HolidayDrop (Single Pet Costume)', url: 'https://holidaydrop.store/products/phantompaws-horseman-costume' },
                                                { label: 'HighGear Toys', url: 'https://highgeartoys.com' },
                                                { label: 'Gymshark Look', url: 'https://gymshark.com' },
                                                { label: 'Allbirds Shoes', url: 'https://allbirds.com' }
                                            ].map(sample => (
                                                <button
                                                    key={sample.label}
                                                    type="button"
                                                    onClick={() => {
                                                        setTargetUrl(sample.url);
                                                        if (sample.url.includes('/products/')) {
                                                            setStoreArchitecture('single');
                                                        }
                                                    }}
                                                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[11px] font-medium text-slate-700 transition"
                                                >
                                                    {sample.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-sm shadow-md shadow-emerald-600/15 transition active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        <Sparkles size={16} />
                                        <span>Analyze Store Catalog & Banners</span>
                                    </button>
                                </form>
                            )}

                            {/* Method B: File Upload (CSV or JSON) */}
                            {inputMethod === 'file' && (
                                <div className="space-y-4">
                                    <label className="border-2 border-dashed border-slate-200 hover:border-emerald-500/50 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition bg-slate-50/50 group">
                                        <div className="size-14 rounded-2xl bg-slate-100 group-hover:bg-emerald-50 flex items-center justify-center text-slate-400 group-hover:text-emerald-600 transition mb-3">
                                            <Upload size={24} />
                                        </div>
                                        <div className="text-sm font-bold text-slate-800 group-hover:text-emerald-700 transition">
                                            Drop Shopify CSV or GumShop JSON here
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1 max-w-sm">
                                            Supports official Shopify <code>products_export.csv</code> and GumShop backup files.
                                        </p>
                                        <input
                                            type="file"
                                            accept=".csv,.json"
                                            onChange={handleFileUpload}
                                            className="hidden"
                                        />
                                    </label>
                                </div>
                            )}

                        </div>
                    </div>
                )}

                {/* ─── STAGE 2: ANALYZING ─── */}
                {stage === 'analyzing' && (
                    <div className="max-w-lg mx-auto py-16 text-center space-y-6">
                        <div className="size-20 mx-auto rounded-3xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 animate-pulse shadow-md">
                            <Loader2 size={36} className="animate-spin" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 tracking-tight">Analyzing Public Storefront</h3>
                            <p className="text-xs text-slate-500 mt-1 font-mono truncate max-w-sm mx-auto">{targetUrl}</p>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-2xl p-4 text-left font-mono text-xs space-y-2 shadow-xs">
                            {analysisLog.map((log, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-slate-600">
                                    <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
                                    <span>{log}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ─── STAGE 3: PREVIEW & CUSTOMIZATION ─── */}
                {stage === 'preview' && importData && (
                    <div className="space-y-6">
                        
                        {/* Summary Header & Top Publish Bar */}
                        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-lg font-black text-slate-900">{importData.store?.name || 'Imported Store'}</h2>
                                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 uppercase">
                                        {importData.platform || 'Verified'}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                                    {importData.store?.description}
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                                    <input 
                                        type="checkbox"
                                        checked={rightsConfirmed}
                                        onChange={(e) => setRightsConfirmed(e.target.checked)}
                                        className="size-4 rounded border-slate-300 bg-white text-emerald-600 focus:ring-0 focus:outline-none cursor-pointer accent-emerald-600"
                                    />
                                    <span>I have rights to import this content</span>
                                </label>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setStage('input')}
                                        className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={handleExecuteImport}
                                        disabled={!rightsConfirmed}
                                        className={`px-5 py-2.5 rounded-xl text-xs font-extrabold shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer ${
                                            rightsConfirmed
                                                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-emerald-600/15 active:scale-95'
                                                : 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-60'
                                        }`}
                                    >
                                        <span>Import & Publish ({selectedProductIds.size} items)</span>
                                        <ArrowRight size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Cents Warning Banner (if detected) */}
                        {centsCount > 0 && (
                            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                                <div className="flex items-center gap-2.5">
                                    <AlertCircle size={18} className="text-amber-600 shrink-0" />
                                    <div>
                                        <span className="font-bold text-amber-900">Notice:</span>{' '}
                                        <span className="text-amber-800">
                                            Detected {centsCount} products with prices ≥ $1,000 (likely raw cents like <code>9999</code> for $99.99).
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={handleDivideBy100}
                                    className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs shadow-xs transition shrink-0 cursor-pointer"
                                >
                                    ⚡ 1-Click Fix to Standard Dollars (÷ 100)
                                </button>
                            </div>
                        )}

                        {/* ─── BULK PRICING TOOLBAR ─── */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-2xs">
                            <div className="flex items-center gap-2">
                                <DollarSign size={14} className="text-emerald-600" />
                                <span className="font-bold text-slate-800">Bulk Pricing Rules:</span>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                {/* Fix Cents buttons */}
                                <button
                                    onClick={handleDivideBy100}
                                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition font-bold"
                                    title="Divide all prices by 100 (e.g. 9999 -> 99.99)"
                                >
                                    ÷ 100 (Fix Cents)
                                </button>

                                <button
                                    onClick={handleMultiplyBy100}
                                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 transition font-medium"
                                    title="Multiply all prices by 100"
                                >
                                    × 100
                                </button>

                                <span className="text-slate-300">|</span>

                                {/* Markup buttons */}
                                <span className="text-slate-500 font-semibold">Markup:</span>
                                {[
                                    { label: '1.0x', val: 1.0 },
                                    { label: '+15%', val: 1.15 },
                                    { label: '+25%', val: 1.25 },
                                    { label: '+50%', val: 1.5 }
                                ].map(m => (
                                    <button
                                        key={m.label}
                                        onClick={() => handleApplyMarkup(m.val)}
                                        className={`px-2 py-1 rounded-lg text-xs font-bold transition border ${
                                            activeMarkup === m.val
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200'
                                        }`}
                                    >
                                        {m.label}
                                    </button>
                                ))}

                                <span className="text-slate-300">|</span>

                                {/* Slash Prices (% Discount) */}
                                <div className="flex items-center gap-1.5 bg-rose-50/80 px-2 py-1 rounded-xl border border-rose-200">
                                    <Scissors size={12} className="text-rose-600 shrink-0" />
                                    <span className="text-rose-800 font-bold text-[11px]">Slash:</span>
                                    {[
                                        { label: '0%', val: 0 },
                                        { label: '-15%', val: 15 },
                                        { label: '-25%', val: 25 },
                                        { label: '-30%', val: 30 },
                                        { label: '-50%', val: 50 }
                                    ].map(s => (
                                        <button
                                            key={s.label}
                                            type="button"
                                            onClick={() => handleSlashPrices(s.val)}
                                            className={`px-1.5 py-0.5 rounded text-[11px] font-bold transition border ${
                                                activeSlashPercent === s.val
                                                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                                                    : 'bg-white text-slate-700 hover:bg-rose-100/60 border-rose-200'
                                            }`}
                                        >
                                            {s.label}
                                        </button>
                                    ))}
                                    <div className="flex items-center gap-1">
                                        <input
                                            type="number"
                                            min="1"
                                            max="99"
                                            placeholder="%"
                                            value={customSlashInput}
                                            onChange={(e) => setCustomSlashInput(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    if (customSlashInput) handleSlashPrices(parseFloat(customSlashInput));
                                                }
                                            }}
                                            className="w-11 px-1 py-0.5 bg-white border border-rose-300 rounded text-[11px] text-slate-900 font-mono text-center focus:outline-none focus:border-rose-500"
                                            title="Enter any discount % (e.g. 20, 35, 60)"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (customSlashInput) handleSlashPrices(parseFloat(customSlashInput));
                                            }}
                                            className="px-1.5 py-0.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[10px] rounded transition"
                                            title="Apply custom discount percentage"
                                        >
                                            Cut %
                                        </button>
                                    </div>
                                </div>

                                <span className="text-slate-300">|</span>

                                {/* Charm Pricing */}
                                <button
                                    onClick={handleCharmPricing}
                                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition font-bold"
                                    title="Round prices to .99"
                                >
                                    .99 Charm Pricing
                                </button>

                                {/* Currency Selector */}
                                <select
                                    value={currencySymbol}
                                    onChange={(e) => setCurrencySymbol(e.target.value)}
                                    className="px-2 py-1 rounded-lg bg-white text-slate-800 font-bold border border-slate-200 focus:outline-none"
                                >
                                    <option value="$">$ USD</option>
                                    <option value="€">€ EUR</option>
                                    <option value="£">£ GBP</option>
                                    <option value="₹">₹ INR</option>
                                    <option value="C$">C$ CAD</option>
                                    <option value="A$">A$ AUD</option>
                                </select>
                            </div>
                        </div>

                        {/* Navigation Tabs */}
                        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setActiveTab('products')}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                                        activeTab === 'products'
                                            ? 'bg-slate-900 text-white shadow-xs'
                                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                    }`}
                                >
                                    <ShoppingBag size={14} />
                                    <span>Products ({selectedProductIds.size} / {importData.products?.length || 0})</span>
                                </button>

                                <button
                                    onClick={() => setActiveTab('banners')}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                                        activeTab === 'banners'
                                            ? 'bg-slate-900 text-white shadow-xs'
                                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                    }`}
                                >
                                    <ImageIcon size={14} />
                                    <span>Hero Banners ({selectedBannerUrls.size} / {importData.banners?.length || 0})</span>
                                </button>

                                <button
                                    onClick={() => setActiveTab('categories')}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                                        activeTab === 'categories'
                                            ? 'bg-slate-900 text-white shadow-xs'
                                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                    }`}
                                >
                                    <Layers size={14} />
                                    <span>Categories ({selectedCategories.size})</span>
                                </button>

                                <button
                                    onClick={() => setActiveTab('branding')}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                                        activeTab === 'branding'
                                            ? 'bg-slate-900 text-white shadow-xs'
                                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                    }`}
                                >
                                    <Store size={14} />
                                    <span>Destination Setup</span>
                                </button>
                            </div>
                        </div>

                        {/* ─── TAB: PRODUCTS ─── */}
                        {activeTab === 'products' && (
                            <div className="space-y-4">
                                
                                {/* Search, Category Filter & View Mode Bar */}
                                <div className="p-3 bg-white border border-slate-200 shadow-sm rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
                                    <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
                                        {/* Search Input */}
                                        <div className="relative flex-1 min-w-[160px]">
                                            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                                            <input
                                                type="text"
                                                placeholder="Search products..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
                                            />
                                        </div>

                                        {/* Category Filter */}
                                        <select
                                            value={filterCategory}
                                            onChange={(e) => setFilterCategory(e.target.value)}
                                            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white"
                                        >
                                            <option value="all">All Categories</option>
                                            {importData.categories?.map(c => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                        </select>

                                        {/* Price Range Filter */}
                                        <div className="flex items-center gap-1 text-slate-600 font-medium">
                                            <span>Price:</span>
                                            <input
                                                type="number"
                                                placeholder="Min"
                                                value={minPrice}
                                                onChange={(e) => setMinPrice(e.target.value)}
                                                className="w-16 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white"
                                            />
                                            <span>-</span>
                                            <input
                                                type="number"
                                                placeholder="Max"
                                                value={maxPrice}
                                                onChange={(e) => setMaxPrice(e.target.value)}
                                                className="w-16 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white"
                                            />
                                        </div>
                                    </div>

                                    {/* Action buttons & View Toggle */}
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={toggleSelectAllFiltered}
                                            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold transition text-xs border border-slate-200"
                                        >
                                            Toggle All ({filteredProducts.length})
                                        </button>

                                        <div className="flex bg-slate-100 border border-slate-200 p-0.5 rounded-xl">
                                            <button
                                                onClick={() => setViewMode('grid')}
                                                className={`p-1.5 rounded-lg transition ${viewMode === 'grid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                                                title="Grid View"
                                            >
                                                <LayoutGrid size={14} />
                                            </button>
                                            <button
                                                onClick={() => setViewMode('table')}
                                                className={`p-1.5 rounded-lg transition ${viewMode === 'table' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                                                title="Compact Table View"
                                            >
                                                <TableIcon size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* VIEW 1: GRID VIEW */}
                                {viewMode === 'grid' && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {filteredProducts.map((prod) => {
                                            const isSelected = selectedProductIds.has(prod.id);
                                            const isEditing = editingProductId === prod.id;
                                            const edited = editedProducts[prod.id] || {};
                                            const displayPrice = edited.price !== undefined ? edited.price : prod.price;
                                            const displayCompare = edited.compareAtPrice !== undefined ? edited.compareAtPrice : prod.compareAtPrice;
                                            const displayName = edited.name !== undefined ? edited.name : prod.name;
                                            const displayCategory = edited.category !== undefined ? edited.category : prod.category;
                                            const prodImg = prod.image || prod.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500';

                                            const isSuspectedCents = displayPrice >= 1000 && Number.isInteger(displayPrice);

                                            return (
                                                <div
                                                    key={prod.id}
                                                    className={`rounded-2xl p-4 border transition flex flex-col justify-between ${
                                                        isSelected 
                                                            ? 'bg-white border-emerald-500 shadow-md shadow-emerald-500/5 ring-1 ring-emerald-500/20' 
                                                            : 'bg-slate-50/80 border-slate-200 opacity-60'
                                                    }`}
                                                >
                                                    <div>
                                                        <div className="flex items-start justify-between gap-3 mb-3">
                                                            <input
                                                                type="checkbox"
                                                                checked={isSelected}
                                                                onChange={() => toggleProductSelect(prod.id)}
                                                                className="size-4.5 rounded text-emerald-600 focus:ring-0 focus:outline-none cursor-pointer mt-1"
                                                            />
                                                            <div className="size-16 rounded-xl bg-slate-100 shrink-0 overflow-hidden border border-slate-200">
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
                                                                  className="w-full text-xs font-bold text-slate-900 bg-white border border-slate-200 rounded-lg p-1.5 focus:outline-none focus:border-emerald-500"
                                                                />
                                                                <div className="flex gap-2">
                                                                    <input
                                                                        type="number"
                                                                        step="0.01"
                                                                        value={displayPrice}
                                                                        onChange={(e) => setEditedProducts(prev => ({
                                                                            ...prev,
                                                                            [prod.id]: { ...(prev[prod.id] || {}), price: parseFloat(e.target.value) || 0 }
                                                                        }))}
                                                                        className="w-1/2 text-xs font-mono font-bold text-emerald-600 bg-white border border-slate-200 rounded-lg p-1.5 focus:outline-none focus:border-emerald-500"
                                                                    />
                                                                    <button
                                                                        onClick={() => setEditingProductId(null)}
                                                                        className="w-1/2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg p-1.5 transition"
                                                                    >
                                                                        Save
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <h4 className="font-bold text-xs text-slate-900 line-clamp-2">{displayName}</h4>
                                                                <p className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">{displayCategory}</p>
                                                                
                                                                <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="flex items-baseline gap-1.5">
                                                                            <span className="font-mono font-bold text-emerald-600 text-sm">
                                                                                {currencySymbol}{displayPrice.toFixed(2)}
                                                                            </span>
                                                                            {displayCompare > displayPrice && (
                                                                                <span className="font-mono text-xs text-slate-400 line-through">
                                                                                    {currencySymbol}{displayCompare.toFixed(2)}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        {isSuspectedCents && (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleFixSingleProductPrice(prod.id)}
                                                                                className="px-1.5 py-0.5 rounded bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-[10px] border border-amber-200"
                                                                                title="Fix likely cents value"
                                                                            >
                                                                                ÷100
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                    <button
                                                                        onClick={() => setEditingProductId(prod.id)}
                                                                        className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-100 transition"
                                                                        title="Edit Title & Price"
                                                                    >
                                                                        <Edit2 size={12} />
                                                                    </button>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* VIEW 2: COMPACT TABLE VIEW */}
                                {viewMode === 'table' && (
                                    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-xs">
                                                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                                                    <tr>
                                                        <th className="py-3 px-4 w-10">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedProductIds.size === filteredProducts.length && filteredProducts.length > 0}
                                                                onChange={toggleSelectAllFiltered}
                                                                className="size-4 rounded text-emerald-600 focus:ring-0 focus:outline-none cursor-pointer"
                                                            />
                                                        </th>
                                                        <th className="py-3 px-4">Product</th>
                                                        <th className="py-3 px-4">Category</th>
                                                        <th className="py-3 px-4 w-32">Price ({currencySymbol})</th>
                                                        <th className="py-3 px-4 text-right">Quick Fix</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 text-slate-800">
                                                    {filteredProducts.map((prod) => {
                                                        const isSelected = selectedProductIds.has(prod.id);
                                                        const edited = editedProducts[prod.id] || {};
                                                        const displayPrice = edited.price !== undefined ? edited.price : prod.price;
                                                        const displayCompare = edited.compareAtPrice !== undefined ? edited.compareAtPrice : prod.compareAtPrice;
                                                        const displayName = edited.name !== undefined ? edited.name : prod.name;
                                                        const displayCategory = edited.category !== undefined ? edited.category : prod.category;
                                                        const prodImg = prod.image || prod.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100';
                                                        const isSuspectedCents = displayPrice >= 1000 && Number.isInteger(displayPrice);

                                                        return (
                                                            <tr key={prod.id} className={`hover:bg-slate-50/80 transition ${isSelected ? '' : 'opacity-50'}`}>
                                                                <td className="py-3 px-4">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={isSelected}
                                                                        onChange={() => toggleProductSelect(prod.id)}
                                                                        className="size-4 rounded text-emerald-600 focus:ring-0 focus:outline-none cursor-pointer"
                                                                    />
                                                                </td>
                                                                <td className="py-3 px-4">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="size-10 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                                                                            <img src={prodImg} alt={displayName} className="w-full h-full object-cover" />
                                                                        </div>
                                                                        <input
                                                                            type="text"
                                                                            value={displayName}
                                                                            onChange={(e) => setEditedProducts(prev => ({
                                                                                ...prev,
                                                                                [prod.id]: { ...(prev[prod.id] || {}), name: e.target.value }
                                                                            }))}
                                                                            className="bg-transparent text-slate-900 font-bold text-xs focus:outline-none focus:bg-slate-50 border border-transparent focus:border-slate-200 px-2 py-1 rounded max-w-sm truncate"
                                                                        />
                                                                    </div>
                                                                </td>
                                                                <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                                                                    {displayCategory}
                                                                </td>
                                                                <td className="py-3 px-4">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <div className="flex items-center gap-1 font-mono font-bold text-emerald-600">
                                                                            <span>{currencySymbol}</span>
                                                                            <input
                                                                                type="number"
                                                                                step="0.01"
                                                                                value={displayPrice}
                                                                                onChange={(e) => setEditedProducts(prev => ({
                                                                                    ...prev,
                                                                                    [prod.id]: { ...(prev[prod.id] || {}), price: parseFloat(e.target.value) || 0 }
                                                                                }))}
                                                                                className="w-20 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-mono font-bold text-emerald-600 focus:outline-none focus:border-emerald-500 focus:bg-white"
                                                                            />
                                                                        </div>
                                                                        {displayCompare > displayPrice && (
                                                                            <span className="font-mono text-[10px] text-slate-400 line-through">
                                                                                {currencySymbol}{displayCompare.toFixed(2)}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td className="py-3 px-4 text-right">
                                                                    {isSuspectedCents && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleFixSingleProductPrice(prod.id)}
                                                                            className="px-2 py-0.5 rounded bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-[10px] border border-amber-200"
                                                                        >
                                                                            ÷100 Fix
                                                                        </button>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                            </div>
                        )}

                        {/* ─── TAB: BANNERS ─── */}
                        {activeTab === 'banners' && (
                            <div className="space-y-4">
                                <p className="text-xs text-slate-600">
                                    Select hero banners extracted from the external storefront. The primary hero will headline your landing page.
                                </p>

                                {importData.banners?.length === 0 ? (
                                    <div className="text-center py-12 bg-white border border-slate-200 rounded-3xl shadow-sm">
                                        <p className="text-sm text-slate-500">No public banner images were detected.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {importData.banners?.map((banner) => {
                                            const bannerUrl = typeof banner === 'string' ? banner : banner.image;
                                            const isSelected = selectedBannerUrls.has(bannerUrl);
                                            const isHero = primaryHeroBanner === bannerUrl;

                                            return (
                                                <div
                                                    key={banner.id || bannerUrl}
                                                    className={`rounded-2xl overflow-hidden border transition ${
                                                        isSelected ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md' : 'border-slate-200 opacity-70'
                                                    }`}
                                                >
                                                    <div className="aspect-[21/9] bg-slate-100 relative overflow-hidden">
                                                        <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                                                        <div className="absolute top-3 left-3 flex items-center gap-2">
                                                            <input
                                                                type="checkbox"
                                                                checked={isSelected}
                                                                onChange={() => toggleBannerSelect(bannerUrl)}
                                                                className="size-4.5 rounded text-emerald-600 focus:ring-0 focus:outline-none cursor-pointer"
                                                            />
                                                            {isHero && (
                                                                <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider shadow-sm">
                                                                    Primary Hero
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="p-3 bg-white border-t border-slate-100 flex items-center justify-between text-xs">
                                                        <span className="text-slate-500 truncate max-w-xs font-mono text-[11px]">{bannerUrl}</span>
                                                        <button
                                                            onClick={() => {
                                                                setPrimaryHeroBanner(bannerUrl);
                                                                if (!selectedBannerUrls.has(bannerUrl)) toggleBannerSelect(bannerUrl);
                                                            }}
                                                            className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700 font-bold transition border border-slate-200"
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
                            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                                <h3 className="text-sm font-bold text-slate-900 mb-3">Select Categories to Retain</h3>
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
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-sm'
                                                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
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
                            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-xl mx-auto space-y-5 shadow-sm">
                                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">Destination Store Configuration</h3>
                                
                                {/* Destination Mode: New vs Existing */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-2">Import Destination</label>
                                    <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold">
                                        <button
                                            type="button"
                                            onClick={() => setDestMode('new')}
                                            className={`flex-1 py-2 rounded-xl transition ${destMode === 'new' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                                        >
                                            + Create New Store
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setDestMode('append')}
                                            className={`flex-1 py-2 rounded-xl transition ${destMode === 'append' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                                        >
                                            ⇄ Merge into Existing Store
                                        </button>
                                    </div>
                                </div>

                                {destMode === 'append' ? (
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Select Target Store</label>
                                        <select
                                            value={selectedExistingStoreId}
                                            onChange={(e) => setSelectedExistingStoreId(e.target.value)}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                                        >
                                            {existingStores.map(s => (
                                                <option key={s.id || s.username} value={s.username || s.id}>
                                                    {s.name} (/shop/{s.username})
                                                </option>
                                            ))}
                                        </select>
                                        <p className="text-[11px] text-slate-500 mt-1">
                                            Imported products will be added to this store without modifying its existing branding.
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1">New Store Name</label>
                                            <input
                                                type="text"
                                                value={destStoreName}
                                                onChange={(e) => {
                                                    setDestStoreName(e.target.value);
                                                    setDestStoreSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-'));
                                                }}
                                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1">Store Slug</label>
                                            <div className="flex items-center">
                                                <span className="px-3 py-2.5 bg-slate-100 text-slate-500 border border-r-0 border-slate-200 rounded-l-xl text-xs font-mono">gumshop.online/shop/</span>
                                                <input
                                                    type="text"
                                                    value={destStoreSlug}
                                                    onChange={(e) => setDestStoreSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-'))}
                                                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-r-xl text-sm text-slate-900 font-mono focus:outline-none focus:border-emerald-500 focus:bg-white"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1">Store Architecture</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setStoreArchitecture('multi')}
                                                    className={`p-3 rounded-xl border text-left transition ${
                                                        storeArchitecture === 'multi'
                                                            ? 'border-emerald-500 bg-emerald-50/70 text-slate-900 ring-2 ring-emerald-500/20'
                                                            : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                                                    }`}
                                                >
                                                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                                        <span>🏬 Catalog Store</span>
                                                    </div>
                                                    <p className="text-[10px] text-slate-500 mt-0.5">Multi-product grid & catalog</p>
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => setStoreArchitecture('single')}
                                                    className={`p-3 rounded-xl border text-left transition ${
                                                        storeArchitecture === 'single'
                                                            ? 'border-emerald-500 bg-emerald-50/70 text-slate-900 ring-2 ring-emerald-500/20'
                                                            : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                                                    }`}
                                                >
                                                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                                        <span>🎯 Single-Product Lander</span>
                                                    </div>
                                                    <p className="text-[10px] text-slate-500 mt-0.5">Viral 1-product funnel & Stan Store</p>
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1">Currency Auto-Conversion</label>
                                            <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={autoConvertCurrency}
                                                    onChange={(e) => setAutoConvertCurrency(e.target.checked)}
                                                    className="size-4 accent-emerald-600 rounded"
                                                />
                                                <div className="text-xs">
                                                    <span className="font-bold text-slate-900">Auto-convert foreign currency (Rs / ₹ / € / £) to USD</span>
                                                    <p className="text-[10px] text-slate-500">e.g. Rs. 5,300 automatically converted to standard baseline</p>
                                                </div>
                                            </label>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1">Store Theme</label>
                                            <select
                                                value={destTheme}
                                                onChange={(e) => setDestTheme(e.target.value)}
                                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                                            >
                                                <option value="viral_lander">Viral Lander (High Converting)</option>
                                                <option value="tech_hardware">Tech Hardware & RC</option>
                                                <option value="clean_beauty">Clean Beauty / Minimal</option>
                                                <option value="fashion_lookbook">Fashion Lookbook</option>
                                                <option value="digital_creator">Digital Creator</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1">Theme Accent Color</label>
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="color"
                                                    value={destThemeColor}
                                                    onChange={(e) => setDestThemeColor(e.target.value)}
                                                    className="size-10 rounded-xl border border-slate-200 cursor-pointer bg-transparent"
                                                />
                                                <input
                                                    type="text"
                                                    value={destThemeColor}
                                                    onChange={(e) => setDestThemeColor(e.target.value)}
                                                    className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 font-mono focus:outline-none focus:bg-white"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1">Store Description</label>
                                            <textarea
                                                rows={3}
                                                value={destDescription}
                                                onChange={(e) => setDestDescription(e.target.value)}
                                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white resize-none"
                                            />
                                        </div>
                                    </>
                                )}

                                {/* ⭐ Set as Root Homepage Checkbox */}
                                <div className="pt-3 border-t border-slate-100">
                                    <label className="flex items-center gap-3 p-3 rounded-2xl bg-amber-50/80 border border-amber-200 cursor-pointer hover:bg-amber-50 transition">
                                        <input
                                            type="checkbox"
                                            checked={setAsHomepage}
                                            onChange={(e) => setSetAsHomepage(e.target.checked)}
                                            className="size-4.5 rounded text-amber-500 focus:ring-0 focus:outline-none cursor-pointer accent-amber-500"
                                        />
                                        <div className="text-xs">
                                            <div className="font-bold text-amber-900 flex items-center gap-1.5">
                                                <Star size={13} className="text-amber-500 fill-amber-500" />
                                                <span>Designate as Root Website Homepage (/)</span>
                                            </div>
                                            <div className="text-slate-600 text-[11px] mt-0.5">
                                                Directs root visitors (gumshop.online/) to this store upon publishing.
                                            </div>
                                        </div>
                                    </label>
                                </div>

                            </div>
                        )}

                    </div>
                )}

                {/* ─── STAGE 4: CREATING / SAVING ─── */}
                {stage === 'creating' && (
                    <div className="max-w-lg mx-auto py-16 text-center space-y-6">
                        <div className="size-20 mx-auto rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 animate-pulse shadow-xl shadow-emerald-500/10">
                            <Loader2 size={36} className="animate-spin" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                                {destMode === 'append' ? 'Appending to Store Catalog' : 'Publishing Imported Store'}
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">
                                Persisting products, price rules, and high-res media to database...
                            </p>
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
}
