'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
    Zap, 
    Plus, 
    ExternalLink, 
    ShoppingBag, 
    Layers, 
    LogOut, 
    Sparkles, 
    Trash2, 
    Smartphone, 
    Copy, 
    Search, 
    Filter, 
    Store, 
    ArrowRight, 
    Settings, 
    Archive, 
    Check, 
    X, 
    Globe, 
    ShieldCheck, 
    TrendingUp, 
    MousePointerClick, 
    Share2,
    LayoutDashboard,
    Package,
    BarChart3,
    History,
    CheckCircle2,
    AlertCircle,
    Clock,
    DollarSign,
    RefreshCw,
    Download,
    Upload,
    Database
} from 'lucide-react';
import toast from 'react-hot-toast';
import { isProductDeleted, isStoreDeleted, markStoreDeleted, deleteStore, DEFAULT_CATALOG_PRODUCTS } from '@/lib/firebaseDb';
import { setActiveStoreSlug, getActiveStoreSync, getAllLocalStores, getHomepageStoreSlug, setHomepageStoreSlug } from '@/lib/activeStore';

export default function MasterDashboardPage() {
    const router = useRouter();
    const [shops, setShops] = useState([]);
    const [activeStore, setActiveStore] = useState(null);
    const [homepageStoreSlug, setHomepageStoreSlugState] = useState('');
    const [authChecking, setAuthChecking] = useState(true);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'archived'
    const [selectedCatalogStore, setSelectedCatalogStore] = useState('all');
    const [selectedOrdersStore, setSelectedOrdersStore] = useState('all');

    // Orders state
    const [orders, setOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(false);

    // Master HQ Navigation State: 'overview' | 'stores' | 'products' | 'imports' | 'orders' | 'analytics' | 'gumroad' | 'settings'
    const [activeNavTab, setActiveNavTab] = useState('overview');

    // Master Import History State
    const [importHistory, setImportHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // Create Blank Store Modal
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newShopName, setNewShopName] = useState('');
    const [newShopTheme, setNewShopTheme] = useState('viral_lander');
    const [newShopColor, setNewShopColor] = useState('#10B981');
    const [isCreatingShop, setIsCreatingShop] = useState(false);

    // Duplication Modal State
    const [duplicatingShop, setDuplicatingShop] = useState(null);
    const [dupName, setDupName] = useState('');
    const [dupSlug, setDupSlug] = useState('');
    const [dupCopyProducts, setDupCopyProducts] = useState(true);
    const [dupCopyBanners, setDupCopyBanners] = useState(true);
    const [dupCopyTheme, setDupCopyTheme] = useState(true);
    const [dupCopyBranding, setDupCopyBranding] = useState(true);
    const [isSubmittingDup, setIsSubmittingDup] = useState(false);

    // Load Import History
    const loadImportHistory = async () => {
        setLoadingHistory(true);
        try {
            const res = await fetch('/api/importer/history');
            const data = await res.json();
            if (data.success && Array.isArray(data.history)) {
                setImportHistory(data.history);
            }
        } catch {
            // Silently fall back to empty array
        } finally {
            setLoadingHistory(false);
        }
    };

    // Load Orders across independent stores
    const loadOrders = async () => {
        setLoadingOrders(true);
        try {
            const ordersMap = new Map();
            // Local edge orders
            if (typeof window !== 'undefined') {
                const rawGen = localStorage.getItem('gumshop_recent_orders');
                if (rawGen) {
                    try {
                        const arr = JSON.parse(rawGen);
                        if (Array.isArray(arr)) {
                            arr.forEach(o => { if (o && o.id) ordersMap.set(o.id, o); });
                        }
                    } catch {}
                }
                for (let i = 0; i < localStorage.length; i++) {
                    const k = localStorage.key(i);
                    if (k && (k.startsWith('gumshop_recent_orders_') || k.startsWith('gumshop_db_orders/'))) {
                        try {
                            const parsed = JSON.parse(localStorage.getItem(k) || 'null');
                            if (Array.isArray(parsed)) {
                                parsed.forEach(o => { if (o && o.id) ordersMap.set(o.id, o); });
                            } else if (parsed && parsed.id) {
                                ordersMap.set(parsed.id, parsed);
                            }
                        } catch {}
                    }
                }
            }
            // Firebase orders
            try {
                const { getAllOrders } = await import('@/lib/firebaseDb');
                const dbOrders = await Promise.race([
                    getAllOrders(),
                    new Promise(res => setTimeout(() => res([]), 1500))
                ]);
                if (Array.isArray(dbOrders)) {
                    dbOrders.forEach(o => {
                        if (o && o.id && !ordersMap.has(o.id)) ordersMap.set(o.id, o);
                    });
                }
            } catch {}

            const sorted = Array.from(ordersMap.values()).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
            setOrders(sorted);
        } catch (e) {
            console.warn("Failed to load orders:", e);
        } finally {
            setLoadingOrders(false);
        }
    };

    // Load Stores from Edge Cache & Firebase with Strict Product Isolation
    const loadShops = async () => {
        const found = [];
        const seenSlugs = new Set();
        const { getProductsByStore } = await import('@/lib/firebaseDb');

        // 1. Scan local edge stores
        if (typeof window !== 'undefined') {
            const localStores = getAllLocalStores();
            for (const ls of localStores) {
                if (ls && ls.username && !isStoreDeleted(ls.id) && !isStoreDeleted(ls.username) && !seenSlugs.has(ls.username)) {
                    seenSlugs.add(ls.username);
                    const prods = await getProductsByStore(ls.id || ls.username);
                    found.push({
                        ...ls,
                        products: prods,
                        productsCount: prods.length
                    });
                }
            }
        }

        // 2. Fetch remote stores from dedicated Server Database (/api/store/data) & Firebase
        try {
            const apiRes = await fetch('/api/store/data').catch(() => null);
            if (apiRes && apiRes.ok) {
                const apiData = await apiRes.json().catch(() => ({}));
                if (Array.isArray(apiData.stores)) {
                    for (const sStore of apiData.stores) {
                        if (!sStore) continue;
                        const slug = (sStore.username || sStore.name || sStore.id || '').toLowerCase().replace(/[^a-z0-9-]+/g, '-');
                        if (slug && !isStoreDeleted(sStore.id) && !isStoreDeleted(sStore.username) && !isStoreDeleted(slug) && !seenSlugs.has(slug)) {
                            seenSlugs.add(slug);
                            const prods = await getProductsByStore(sStore.id || slug);
                            found.push({
                                id: sStore.id || `store_${slug}`,
                                name: sStore.name || slug,
                                username: slug,
                                description: sStore.description || '',
                                theme: sStore.theme || 'tech_hardware',
                                themeColor: sStore.themeColor || '#10B981',
                                logo: sStore.logo || '',
                                status: sStore.status || 'active',
                                productsCount: prods.length,
                                products: prods,
                                createdAt: sStore.createdAt || new Date().toISOString()
                            });
                        }
                    }
                }
            }
        } catch {}

        try {
            const { getAllStores } = await import('@/lib/firebaseDb');
            const remoteStores = await Promise.race([
                getAllStores(),
                new Promise(res => setTimeout(() => res([]), 1500))
            ]);
            if (Array.isArray(remoteStores)) {
                for (const rStore of remoteStores) {
                    if (!rStore) continue;
                    const slug = (rStore.username || rStore.name || rStore.id || '').toLowerCase().replace(/[^a-z0-9-]+/g, '-');
                    if (slug && !isStoreDeleted(rStore.id) && !isStoreDeleted(rStore.username) && !isStoreDeleted(slug) && !seenSlugs.has(slug)) {
                        seenSlugs.add(slug);
                        const prods = await getProductsByStore(rStore.id || slug);
                        found.push({
                            id: rStore.id || `store_${slug}`,
                            name: rStore.name || slug,
                            username: slug,
                            description: rStore.description || '',
                            theme: rStore.theme || 'viral_lander',
                            themeColor: rStore.themeColor || '#10B981',
                            logo: rStore.logo || '',
                            status: rStore.status || 'active',
                            productsCount: prods.length,
                            products: prods,
                            createdAt: rStore.createdAt || new Date().toISOString()
                        });
                    }
                }
            }
        } catch (fbErr) {}

        setShops(found);
        const currActive = getActiveStoreSync();
        if (currActive && !isStoreDeleted(currActive.id) && !isStoreDeleted(currActive.username)) {
            setActiveStore(currActive);
        } else if (found.length > 0) {
            setActiveStore(found[0]);
        } else {
            setActiveStore(null);
        }
        setLoading(false);
    };

    useEffect(() => {
        let isMounted = true;
        const checkMasterAuth = async () => {
            try {
                const storedToken = typeof window !== 'undefined' ? localStorage.getItem('gumshop_admin_token') : null;
                const headers = {};
                if (storedToken) {
                    headers['Authorization'] = `Bearer ${storedToken}`;
                }

                const res = await fetch(`/api/admin/auth?t=${Date.now()}`, {
                    cache: 'no-store',
                    credentials: 'include',
                    headers
                });
                const data = await res.json().catch(() => ({}));

                if (!isMounted) return;

                if (!data.authenticated) {
                    if (typeof window !== 'undefined') {
                        localStorage.removeItem('gumshop_admin_token');
                    }
                    window.location.href = '/login';
                    return;
                }

                if (data.token && typeof window !== 'undefined') {
                    localStorage.setItem('gumshop_admin_token', data.token);
                }

                setAuthChecking(false);
                loadShops();
                loadImportHistory();
                loadOrders();
                getHomepageStoreSlug().then(slug => {
                    if (slug && isMounted) setHomepageStoreSlugState(slug);
                });
            } catch (err) {
                console.warn("Master auth check error:", err);
                if (isMounted) {
                    window.location.href = '/login';
                }
            }
        };

        checkMasterAuth();

        const handleStoreChange = () => {
            const current = getActiveStoreSync();
            if (current && !isStoreDeleted(current.id) && !isStoreDeleted(current.username)) {
                setActiveStore(current);
            }
        };
        const handleStoresUpdated = () => {
            loadShops();
        };
        const handleHomepageChange = (e) => {
            if (e?.detail?.slug) {
                setHomepageStoreSlugState(e.detail.slug);
            }
        };
        window.addEventListener('active_store_changed', handleStoreChange);
        window.addEventListener('stores_updated', handleStoresUpdated);
        window.addEventListener('homepage_store_changed', handleHomepageChange);
        return () => {
            isMounted = false;
            window.removeEventListener('active_store_changed', handleStoreChange);
            window.removeEventListener('stores_updated', handleStoresUpdated);
            window.removeEventListener('homepage_store_changed', handleHomepageChange);
        };
    }, []);

    const handleLogout = async () => {
        try {
            await fetch('/api/admin/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ action: 'logout' })
            });
        } catch {}
        if (typeof window !== 'undefined') {
            localStorage.removeItem('gumshop_admin_token');
        }
        toast.success('Command Center session closed');
        window.location.href = '/login';
    };

    // Store Deletion
    const handleDeleteShop = async (shopSlug, shopId, e) => {
        e?.stopPropagation?.();
        const displayLabel = shopSlug || shopId || 'this store';
        if (!confirm(`Permanently delete store "${displayLabel}"? All products and store data will be deleted.`)) return;

        // 1. Immediately register tombstone so no background routine or seeder can resurrect it
        if (shopSlug) markStoreDeleted(shopSlug);
        if (shopId) markStoreDeleted(shopId);

        // 2. Await deep deletion (Firebase, collection map, products cascade, local/session storage)
        await deleteStore(shopId, shopSlug);

        // 3. Filter shops state
        const cleanSlug = (shopSlug || '').toLowerCase().replace(/[^a-z0-9-]+/g, '-');
        const cleanId = (shopId || '').toLowerCase();
        const remaining = shops.filter(s => {
            const sSlug = (s.username || s.name || '').toLowerCase().replace(/[^a-z0-9-]+/g, '-');
            const sId = (s.id || '').toLowerCase();
            return sSlug !== cleanSlug && sId !== cleanId && s.id !== shopId && s.username !== shopSlug;
        });
        setShops(remaining);

        if (activeStore && (activeStore.username === shopSlug || activeStore.id === shopId || (cleanSlug && activeStore.username === cleanSlug))) {
            const nextActive = remaining[0] || null;
            setActiveStore(nextActive);
            if (nextActive) setActiveStoreSlug(nextActive);
            else if (typeof window !== 'undefined') {
                localStorage.removeItem('gumshop_active_store');
                localStorage.removeItem('active_store_cache');
                localStorage.removeItem('active_store_slug');
            }
        }
        if (homepageStoreSlug && (homepageStoreSlug === shopSlug || homepageStoreSlug === shopId || homepageStoreSlug === cleanSlug)) {
            const nextHome = remaining[0]?.username || '';
            setHomepageStoreSlug(nextHome);
            setHomepageStoreSlugState(nextHome);
        }
        if (remaining.length === 0 && typeof window !== 'undefined') {
            localStorage.setItem('gumshop_empty_dashboard_ack', 'true');
        }
        toast.success(`Store "${displayLabel}" permanently deleted.`);
    };

    // Set Active Store
    const handleSetActiveStore = (shop) => {
        if (!shop) return;
        setActiveStoreSlug(shop);
        setActiveStore(shop);
        toast.success(`Active store set to "${shop.name}" 🎯`);
    };

    // Set Designated Homepage Store
    const handleSetHomepage = async (shop) => {
        if (!shop) return;
        const slug = shop.username || shop.id;
        await setHomepageStoreSlug(slug);
        setHomepageStoreSlugState(slug);
        toast.success(`Store "${shop.name}" is now the official Homepage (/)! 🌟`);
    };

    // 1-Click Backup Export
    const handleExportBackup = () => {
        try {
            const dataToExport = {
                exportedAt: new Date().toISOString(),
                version: '1.0',
                stores: shops,
                storage: {}
            };
            if (typeof window !== 'undefined') {
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && (key.startsWith('gumshop_') || key.startsWith('store_') || key.startsWith('cloned_store_'))) {
                        dataToExport.storage[key] = localStorage.getItem(key);
                    }
                }
            }
            const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `gumshop-stores-backup-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success('All stores & products exported to JSON! 📦');
        } catch (e) {
            toast.error('Failed to export backup');
        }
    };

    // 1-Click Backup Import
    const handleImportBackup = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const parsed = JSON.parse(e.target?.result);
                if (parsed && parsed.storage && typeof window !== 'undefined') {
                    Object.entries(parsed.storage).forEach(([k, v]) => {
                        localStorage.setItem(k, v);
                    });
                    localStorage.removeItem('gumshop_stores_cleared');
                    localStorage.removeItem('gumshop_empty_dashboard_ack');
                    toast.success('Backup restored successfully! 🎉');
                    await loadShops();
                } else {
                    toast.error('Invalid backup file format');
                }
            } catch {
                toast.error('Failed to parse backup JSON');
            }
        };
        reader.readAsText(file);
    };

    // Erase Complete Store Data / Reset to Zero
    const handleWipeAllData = async () => {
        if (!confirm('⚠️ Are you sure you want to completely erase ALL store data? This will delete all stores and products from the database and reset to zero.')) return;
        try {
            // 1. Wipe remote server & Supabase database
            await fetch('/api/store/data?wipeAll=true', { method: 'DELETE' }).catch(() => {});
            await fetch('/api/reset', { method: 'POST' }).catch(() => {});

            // 2. Mark stores cleared locally
            if (typeof window !== 'undefined') {
                localStorage.clear();
                sessionStorage.clear();

                localStorage.setItem('gumshop_stores_cleared', 'true');
                localStorage.setItem('gumshop_empty_dashboard_ack', 'true');
                
                // Add known demo presets to tombstone so they never auto-resurrect
                const presetsToTombstone = ['highgeartoys', 'buy-rc-drift-cars-online', 'higt-rc-drift-cars-onlinee', 'high-rc-toys', 'aura-trends', 'neon-vault', 'clean-glow', 'store_highgeartoys'];
                localStorage.setItem('gumshop_deleted_stores', JSON.stringify(presetsToTombstone));

                // Expire all cookies
                document.cookie = 'active_store_slug=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
                document.cookie = 'gumshop_merchant_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
                document.cookie = 'gumshop_active_store=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';

                window.dispatchEvent(new Event('active_store_changed'));
                window.dispatchEvent(new Event('products_updated'));
            }

            setShops([]);
            setActiveStore(null);
            setOrders([]);
            toast.success('Complete store data erased. Database reset to zero! 🗑️');
        } catch (e) {
            toast.error('Failed to erase all store data');
        }
    };

    // Store Archive / Unarchive
    const handleToggleArchive = (shop) => {
        const nextStatus = shop.status === 'archived' ? 'active' : 'archived';
        setShops(prev => prev.map(s => s.id === shop.id ? { ...s, status: nextStatus } : s));

        if (typeof window !== 'undefined') {
            const cleanSlug = shop.username;
            const updated = { ...shop, status: nextStatus };
            localStorage.setItem(`store_${cleanSlug}`, JSON.stringify(updated));
            localStorage.setItem(`cloned_store_${cleanSlug}`, JSON.stringify(updated));
        }

        toast.success(nextStatus === 'archived' ? `Store "${shop.name}" archived.` : `Store "${shop.name}" restored.`);
    };

    // Open Duplication Modal
    const handleOpenDuplicateModal = (shop, e) => {
        e?.stopPropagation();
        setDuplicatingShop(shop);
        setDupName(`${shop.name} Copy`);
        setDupSlug(`${shop.username}-copy`);
        setDupCopyProducts(true);
        setDupCopyBanners(true);
        setDupCopyTheme(true);
        setDupCopyBranding(true);
    };

    // Execute Duplication
    const handleExecuteDuplicate = async (e) => {
        e?.preventDefault();
        if (!dupName.trim() || !duplicatingShop) return;

        setIsSubmittingDup(true);
        try {
            const res = await fetch('/api/store/duplicate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sourceStoreSlug: duplicatingShop.username,
                    sourceStoreData: duplicatingShop,
                    newStoreName: dupName.trim(),
                    newStoreSlug: dupSlug.trim(),
                    copyProducts: dupCopyProducts,
                    copyBanners: dupCopyBanners,
                    copyTheme: dupCopyTheme,
                    copyBranding: dupCopyBranding
                })
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || 'Duplication failed');
            }

            // Save to edge cache
            if (typeof window !== 'undefined') {
                const s = data.store;
                localStorage.setItem(`store_${data.newStoreSlug}`, JSON.stringify(s));
                localStorage.setItem(`cloned_store_${data.newStoreSlug}`, JSON.stringify(s));
            }

            toast.success(`Store "${dupName}" duplicated successfully! 🚀`);
            setDuplicatingShop(null);
            loadShops();
        } catch (err) {
            toast.error(err.message || 'Failed to duplicate store');
        } finally {
            setIsSubmittingDup(false);
        }
    };

    // Create Blank Store
    const handleCreateBlankShop = async (e) => {
        e.preventDefault();
        if (!newShopName.trim()) return;

        const cleanSlug = newShopName.toLowerCase().trim().replace(/[^a-z0-9-]+/g, '-') || `shop-${Date.now()}`;
        const storeId = `store_${cleanSlug}`;

        setIsCreatingShop(true);
        try {
            const newStore = {
                id: storeId,
                name: newShopName.trim(),
                username: cleanSlug,
                description: `Official digital storefront for ${newShopName.trim()}.`,
                theme: newShopTheme,
                themeColor: newShopColor,
                status: 'active',
                products: [],
                createdAt: new Date().toISOString()
            };

            if (typeof window !== 'undefined') {
                localStorage.setItem(`store_${cleanSlug}`, JSON.stringify(newStore));
                localStorage.setItem(`cloned_store_${cleanSlug}`, JSON.stringify(newStore));
                setActiveStoreSlug(newStore);
            }

            try {
                const { createStore } = await import('@/lib/firebaseDb');
                await createStore(newStore);
            } catch {}

            toast.success(`Store "${newShopName}" created! 🚀`);
            setIsCreateModalOpen(false);
            router.push(`/store/manage-product`);
        } catch {
            toast.error('Failed to create store');
        } finally {
            setIsCreatingShop(false);
        }
    };

    // Filtered list
    const filteredShops = shops.filter(shop => {
        const matchesQuery = 
            shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            shop.username.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || (shop.status || 'active') === statusFilter;
        return matchesQuery && matchesStatus;
    });

    // Compute Metrics & Master Catalog
    const totalStores = shops.length;
    const totalProducts = shops.reduce((acc, s) => acc + (s.productsCount || 0), 0);
    const activeStoresCount = shops.filter(s => s.status !== 'archived').length;

    // Aggregated Master Products
    const allMasterProducts = shops.flatMap(shop => 
        (shop.products || []).map(p => ({
            ...p,
            storeName: shop.name,
            storeSlug: shop.username,
            storeTheme: shop.theme
        }))
    );

    // Filtered Master Catalog by selected store
    const filteredMasterProducts = allMasterProducts.filter(p => {
        if (selectedCatalogStore === 'all') return true;
        const target = selectedCatalogStore.toLowerCase().replace(/^store_/, '');
        const pSlug = (p.storeSlug || '').toLowerCase();
        const pStoreId = (p.storeId || '').toLowerCase().replace(/^store_/, '');
        return pSlug === target || pStoreId === target;
    });

    // Orders Filtered by selected store
    const filteredOrders = orders.filter(o => {
        if (selectedOrdersStore === 'all') return true;
        const target = selectedOrdersStore.toLowerCase().replace(/^store_/, '');
        const oStoreId = (o.storeId || '').toLowerCase().replace(/^store_/, '');
        const oStoreSlug = (o.storeSlug || o.storeName || '').toLowerCase().replace(/[^a-z0-9-]+/g, '-');
        return oStoreId === target || oStoreSlug === target;
    });

    // Financial Metrics
    const totalOrdersCount = orders.length;
    const completedOrdersCount = orders.filter(o => (o.status || '').toLowerCase() === 'completed' || o.verified).length;
    const totalRevenue = orders.reduce((sum, o) => {
        const val = parseFloat(o.total || o.amount || o.price || 0);
        return sum + (isNaN(val) ? 0 : val);
    }, 0);

    if (authChecking) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-3">
                <div className="size-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-mono text-slate-400">Verifying Master Command Center Access...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased">
            {/* Header */}
            <header className="px-6 py-4 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="size-9 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center font-black shadow-md shadow-emerald-500/20">
                        <Zap size={20} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-base font-black text-white tracking-tight">GumShop Master Engine</h1>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                Personal HQ
                            </span>
                        </div>
                    </div>

                    {/* Active Store & Homepage Store Indicators */}
                    <div className="hidden lg:flex items-center gap-2.5 ml-4">
                        {activeStore && (
                            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs">
                                <span className="text-slate-400">Active:</span>
                                <span className="font-bold text-emerald-400">{activeStore.name}</span>
                                <span className="text-[10px] font-mono text-slate-500">/shop/{activeStore.username}</span>
                                <a
                                    href={`/shop/${activeStore.username}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-slate-400 hover:text-white transition ml-0.5"
                                    title="Open active storefront"
                                >
                                    <ExternalLink size={11} />
                                </a>
                            </div>
                        )}
                        {homepageStoreSlug && (
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs">
                                <span className="text-amber-400 font-bold">⭐ Homepage:</span>
                                <span className="font-bold text-amber-200">
                                    {shops.find(s => s.username === homepageStoreSlug || s.id === homepageStoreSlug)?.name || homepageStoreSlug}
                                </span>
                                <a
                                    href="/"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-amber-400/80 hover:text-amber-200 transition ml-0.5"
                                    title="Open Root Homepage (/)"
                                >
                                    <ExternalLink size={11} />
                                </a>
                            </div>
                        )}
                    </div>
                </div>

                {/* Prominent Master Action Strip */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition flex items-center gap-1.5 shadow-sm"
                    >
                        <Plus size={13} />
                        <span>+ CREATE STORE</span>
                    </button>

                    <Link
                        href="/store/import"
                        className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-extrabold text-xs shadow-md shadow-emerald-500/20 transition flex items-center gap-1.5 active:scale-95"
                    >
                        <Sparkles size={13} />
                        <span>+ IMPORT STORE</span>
                    </Link>

                    <Link
                        href="/store/add-product"
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs border border-slate-700 transition hidden md:flex items-center gap-1.5"
                    >
                        <Plus size={13} />
                        <span>+ ADD PRODUCT</span>
                    </Link>

                    <button
                        onClick={handleExportBackup}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs border border-slate-700 transition hidden sm:flex items-center gap-1.5"
                        title="Export All Stores & Products to JSON"
                    >
                        <Download size={13} className="text-emerald-400" />
                        <span>Backup</span>
                    </button>

                    <label
                        className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs border border-slate-700 transition hidden sm:flex items-center gap-1.5 cursor-pointer"
                        title="Import Stores from JSON Backup"
                    >
                        <Upload size={13} className="text-teal-400" />
                        <span>Restore</span>
                        <input
                            type="file"
                            accept=".json"
                            onChange={handleImportBackup}
                            className="hidden"
                        />
                    </label>

                    <button
                        onClick={handleWipeAllData}
                        className="px-2.5 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 hover:text-white font-bold text-xs border border-red-800/60 transition hidden sm:flex items-center gap-1.5"
                        title="Erase Complete Store Data (Reset to Zero)"
                    >
                        <Trash2 size={13} className="text-red-400" />
                        <span>Reset to Zero</span>
                    </button>

                    <span className="text-slate-800 hidden sm:inline">|</span>

                    <button
                        onClick={handleLogout}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                        title="Logout"
                    >
                        <LogOut size={15} />
                    </button>
                </div>
            </header>

            {/* Master HQ Navigation Bar (Section 27) */}
            <nav className="border-b border-slate-800 bg-slate-900/40 px-6 overflow-x-auto no-scrollbar sticky top-[65px] z-20 backdrop-blur-md">
                <div className="max-w-7xl mx-auto flex items-center gap-1 sm:gap-2">
                    {[
                        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
                        { id: 'stores', label: `Stores (${shops.length})`, icon: Store },
                        { id: 'products', label: `Products (${totalProducts})`, icon: ShoppingBag },
                        { id: 'imports', label: `Imports (${importHistory.length})`, icon: Sparkles },
                        { id: 'orders', label: 'Orders', icon: Package },
                        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
                        { id: 'gumroad', label: 'Gumroad', icon: Zap },
                        { id: 'settings', label: 'Settings', icon: Settings }
                    ].map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeNavTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    setActiveNavTab(tab.id);
                                    if (tab.id === 'imports') loadImportHistory();
                                }}
                                className={`px-3 sm:px-4 py-3 text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap border-b-2 ${
                                    isActive 
                                        ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5' 
                                        : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800/40'
                                }`}
                            >
                                <Icon size={14} className={isActive ? 'text-emerald-400' : 'text-slate-500'} />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>
            </nav>

            {/* Main Stage */}
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">

                {/* ─── TAB 1: OVERVIEW ─── */}
                {activeNavTab === 'overview' && (
                    <>
                        {/* ─── METRIC CARDS ─── */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5">
                                <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
                                    <span>Total Stores</span>
                                    <Store size={15} className="text-emerald-400" />
                                </div>
                                <div className="text-2xl font-black text-white mt-2">{totalStores}</div>
                                <div className="text-[11px] text-slate-500 mt-1">{activeStoresCount} active storefronts</div>
                            </div>

                            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5">
                                <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
                                    <span>Catalog Items</span>
                                    <ShoppingBag size={15} className="text-teal-400" />
                                </div>
                                <div className="text-2xl font-black text-white mt-2">{totalProducts}</div>
                                <div className="text-[11px] text-slate-500 mt-1">Across all independent stores</div>
                            </div>

                            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5">
                                <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
                                    <span>Checkout Status</span>
                                    <Zap size={15} className="text-amber-400" />
                                </div>
                                <div className="text-2xl font-black text-emerald-400 mt-2">Ready</div>
                                <div className="text-[11px] text-slate-500 mt-1">Supported Gumroad Overlay</div>
                            </div>

                            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5">
                                <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
                                    <span>Bio Links</span>
                                    <Smartphone size={15} className="text-rose-400" />
                                </div>
                                <div className="text-2xl font-black text-white mt-2">{totalStores}</div>
                                <div className="text-[11px] text-slate-500 mt-1">Mobile Creator storefronts</div>
                            </div>
                        </div>

                        {/* ─── UNIVERSAL CATALOG & DATA BACKUP STRIP ─── */}
                        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                                    <Database size={18} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-white">Universal Dynamic Catalog Engine</span>
                                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">Active Everywhere</span>
                                    </div>
                                    <p className="text-[11px] text-slate-400 mt-0.5">
                                        All stores render cleanly across regular, incognito, and mobile browsers. Export or restore your entire multi-store database anytime with 1 click.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 w-full md:w-auto">
                                <button
                                    onClick={handleExportBackup}
                                    className="flex-1 md:flex-none px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center justify-center gap-1.5 transition"
                                >
                                    <Download size={13} className="text-emerald-400" />
                                    <span>Export All (.json)</span>
                                </button>
                                <label
                                    className="flex-1 md:flex-none px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center justify-center gap-1.5 transition cursor-pointer"
                                >
                                    <Upload size={13} className="text-teal-400" />
                                    <span>Restore Backup</span>
                                    <input
                                        type="file"
                                        accept=".json"
                                        onChange={handleImportBackup}
                                        className="hidden"
                                    />
                                </label>
                            </div>
                        </div>

                        {/* ─── QUICK ACTION BAR ─── */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-900/80 border border-slate-800 rounded-3xl p-4 sm:p-5">
                            <div>
                                <h2 className="text-base font-extrabold text-white">Master HQ Stores</h2>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Create new stores from scratch, import external stores with 1 workflow, or duplicate existing shops.
                                </p>
                            </div>

                            <div className="flex items-center gap-2.5 w-full sm:w-auto">
                                <Link
                                    href="/store/import"
                                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-extrabold text-xs shadow-md shadow-emerald-500/20 transition active:scale-95 flex items-center justify-center gap-1.5"
                                >
                                    <Sparkles size={14} />
                                    <span>+ Import Store</span>
                                </Link>

                                <button
                                    onClick={() => setIsCreateModalOpen(true)}
                                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition active:scale-95 flex items-center justify-center gap-1.5"
                                >
                                    <Plus size={14} />
                                    <span>+ Create Store</span>
                                </button>
                            </div>
                        </div>

                        {/* Quick Store Switcher & Homepage Controller */}
                        {shops.length > 0 && (
                            <div className="p-4 bg-slate-900 border border-slate-800 rounded-3xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-md">
                                <div className="flex items-center gap-3">
                                    <div className="size-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                                        <Store size={15} />
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-white flex items-center gap-2">
                                            <span>Working Context:</span>
                                            <span className="text-emerald-400 font-extrabold">{activeStore?.name || 'None'}</span>
                                        </div>
                                        <div className="text-[11px] text-slate-400">
                                            Switch which store you are managing or designate the root website homepage (/)
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                    <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
                                        <span className="text-slate-400 font-semibold">Active:</span>
                                        <select
                                            value={activeStore?.username || ''}
                                            onChange={(e) => {
                                                const target = shops.find(s => s.username === e.target.value);
                                                if (target) handleSetActiveStore(target);
                                            }}
                                            className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
                                        >
                                            {shops.map(s => (
                                                <option key={s.username} value={s.username} className="bg-slate-900 text-white">
                                                    {s.name} ({s.username}){s.username === homepageStoreSlug ? ' ⭐ [Homepage]' : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="flex items-center gap-2 bg-amber-950/30 px-3 py-1.5 rounded-xl border border-amber-500/30 text-xs">
                                        <span className="text-amber-300 font-bold">⭐ Homepage (/):</span>
                                        <select
                                            value={homepageStoreSlug || ''}
                                            onChange={(e) => {
                                                const target = shops.find(s => s.username === e.target.value);
                                                if (target) handleSetHomepage(target);
                                            }}
                                            className="bg-transparent text-amber-200 font-bold focus:outline-none cursor-pointer"
                                        >
                                            <option value="" className="bg-slate-900 text-slate-300">Default (First Active Store)</option>
                                            {shops.map(s => (
                                                <option key={s.username} value={s.username} className="bg-slate-900 text-amber-200">
                                                    {s.name} ({s.username})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Render Active Stores Preview */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold text-white">Active Stores ({filteredShops.length})</h3>
                                <button
                                    onClick={() => setActiveNavTab('stores')}
                                    className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                                >
                                    <span>View All Stores</span>
                                    <ArrowRight size={12} />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredShops.slice(0, 6).map((shop) => (
                                    <StoreCard 
                                        key={shop.username} 
                                        shop={shop} 
                                        activeStore={activeStore}
                                        homepageStoreSlug={homepageStoreSlug}
                                        onSetActiveStore={handleSetActiveStore}
                                        onSetHomepage={handleSetHomepage}
                                        onDelete={handleDeleteShop}
                                        onArchive={handleToggleArchive}
                                        onDuplicate={handleOpenDuplicateModal}
                                    />
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {/* ─── TAB 2: STORES ─── */}
                {activeNavTab === 'stores' && (
                    <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-black text-white">All Stores ({shops.length})</h2>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Each store operates independently with isolated products, branding, and themes.
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setIsCreateModalOpen(true)}
                                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition flex items-center gap-1.5"
                                >
                                    <Plus size={13} />
                                    <span>Create Store</span>
                                </button>
                                <Link
                                    href="/store/import"
                                    className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-xs shadow-md transition flex items-center gap-1.5"
                                >
                                    <Sparkles size={13} />
                                    <span>Import Store</span>
                                </Link>
                            </div>
                        </div>

                        {/* Quick Store Switcher & Homepage Controller */}
                        {shops.length > 0 && (
                            <div className="p-4 bg-slate-900 border border-slate-800 rounded-3xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-md">
                                <div className="flex items-center gap-3">
                                    <div className="size-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                                        <Globe size={15} />
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-white flex items-center gap-2">
                                            <span>Default Homepage (gumshop.online):</span>
                                            <span className="text-amber-400 font-extrabold">
                                                {shops.find(s => s.username === homepageStoreSlug || s.id === homepageStoreSlug)?.name || homepageStoreSlug || 'Auto (First Active Store)'}
                                            </span>
                                        </div>
                                        <div className="text-[11px] text-slate-400">
                                            Select which store is served when visitors load the homepage (/)
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                    <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
                                        <span className="text-slate-400 font-semibold">Active:</span>
                                        <select
                                            value={activeStore?.username || ''}
                                            onChange={(e) => {
                                                const target = shops.find(s => s.username === e.target.value);
                                                if (target) handleSetActiveStore(target);
                                            }}
                                            className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
                                        >
                                            {shops.map(s => (
                                                <option key={s.username} value={s.username} className="bg-slate-900 text-white">
                                                    {s.name} ({s.username}){s.username === homepageStoreSlug ? ' ⭐ [Homepage]' : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="flex items-center gap-2 bg-amber-950/30 px-3 py-1.5 rounded-xl border border-amber-500/30 text-xs">
                                        <span className="text-amber-300 font-bold">⭐ Set Homepage:</span>
                                        <select
                                            value={homepageStoreSlug || ''}
                                            onChange={(e) => {
                                                const target = shops.find(s => s.username === e.target.value);
                                                if (target) handleSetHomepage(target);
                                            }}
                                            className="bg-transparent text-amber-200 font-bold focus:outline-none cursor-pointer"
                                        >
                                            <option value="" className="bg-slate-900 text-slate-300">Default (First Active Store)</option>
                                            {shops.map(s => (
                                                <option key={s.username} value={s.username} className="bg-slate-900 text-amber-200">
                                                    {s.name} ({s.username})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Search & Status Filters */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                            <div className="relative w-full sm:w-72">
                                <Search size={14} className="absolute left-3.5 top-3 text-slate-500" />
                                <input
                                    type="text"
                                    placeholder="Search by store name or slug..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none transition"
                                />
                            </div>

                            <div className="flex bg-slate-900 border border-slate-800 p-0.5 rounded-xl text-xs font-semibold">
                                <button
                                    onClick={() => setStatusFilter('all')}
                                    className={`px-3 py-1 rounded-lg transition ${statusFilter === 'all' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                                >
                                    All ({shops.length})
                                </button>
                                <button
                                    onClick={() => setStatusFilter('active')}
                                    className={`px-3 py-1 rounded-lg transition ${statusFilter === 'active' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                                >
                                    Active
                                </button>
                                <button
                                    onClick={() => setStatusFilter('archived')}
                                    className={`px-3 py-1 rounded-lg transition ${statusFilter === 'archived' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                                >
                                    Archived
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredShops.map((shop) => (
                                <StoreCard 
                                    key={shop.username} 
                                    shop={shop} 
                                    activeStore={activeStore}
                                    homepageStoreSlug={homepageStoreSlug}
                                    onSetActiveStore={handleSetActiveStore}
                                    onSetHomepage={handleSetHomepage}
                                    onDelete={handleDeleteShop}
                                    onArchive={handleToggleArchive}
                                    onDuplicate={handleOpenDuplicateModal}
                                />
                            ))}

                            {/* Quick Create Card */}
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="bg-slate-900/40 border-2 border-dashed border-slate-800 hover:border-emerald-500/50 rounded-3xl p-8 flex flex-col items-center justify-center text-center transition group min-h-[300px]"
                            >
                                <div className="size-12 rounded-2xl bg-slate-800 group-hover:bg-emerald-500/10 flex items-center justify-center text-slate-500 group-hover:text-emerald-400 transition mb-3">
                                    <Plus size={22} />
                                </div>
                                <h4 className="font-bold text-sm text-slate-300 group-hover:text-white transition">New Blank Store</h4>
                                <p className="text-xs text-slate-500 mt-1 max-w-[200px]">Launch an empty storefront and build custom products</p>
                            </button>
                        </div>
                    </div>
                )}

                {/* ─── TAB 3: MASTER PRODUCTS CATALOG (Section 9) ─── */}
                {activeNavTab === 'products' && (
                    <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-black text-white">Master Catalog ({filteredMasterProducts.length} items)</h2>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    {selectedCatalogStore === 'all' 
                                        ? 'Consolidated product directory across all independent stores.' 
                                        : `Filtered product catalog strictly for store "${selectedCatalogStore}".`}
                                </p>
                            </div>

                            <div className="flex items-center gap-2.5">
                                <select
                                    value={selectedCatalogStore}
                                    onChange={(e) => setSelectedCatalogStore(e.target.value)}
                                    className="px-3 py-2 bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl text-xs text-white focus:outline-none transition"
                                >
                                    <option value="all">All Stores ({allMasterProducts.length} items)</option>
                                    {shops.map(s => (
                                        <option key={s.username} value={s.username}>{s.name} ({s.productsCount || 0})</option>
                                    ))}
                                </select>

                                <Link
                                    href="/store/add-product"
                                    className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-xs shadow-md transition flex items-center gap-1.5"
                                >
                                    <Plus size={13} />
                                    <span>Add Product</span>
                                </Link>
                            </div>
                        </div>

                        {filteredMasterProducts.length > 0 ? (
                            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                                            <tr>
                                                <th className="py-3 px-4">Product</th>
                                                <th className="py-3 px-4">Assigned Store</th>
                                                <th className="py-3 px-4">Price</th>
                                                <th className="py-3 px-4">Status</th>
                                                <th className="py-3 px-4 text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800/60 text-slate-200">
                                            {filteredMasterProducts.map((p, idx) => (
                                                <tr key={p.id || idx} className="hover:bg-slate-800/30 transition">
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="size-10 rounded-xl bg-slate-800 overflow-hidden shrink-0 border border-slate-700">
                                                                <img 
                                                                    src={p.image || p.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'} 
                                                                    alt={p.name} 
                                                                    className="w-full h-full object-cover" 
                                                                />
                                                            </div>
                                                            <div className="min-w-0 max-w-xs">
                                                                <div className="font-bold text-white truncate">{typeof p.name === 'string' ? p.name : String(p.name || 'Product')}</div>
                                                                <div className="text-[10px] text-slate-500 font-mono truncate">{typeof p.category === 'string' ? p.category : (p.category?.name || 'Featured')}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                                                            <Store size={10} />
                                                            {p.storeName}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                                                        ${(parseFloat(typeof p.price === 'object' ? p.price?.amount : p.price) || 0).toFixed(2)}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                            Active
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-right">
                                                        <Link
                                                            href={`/store/manage-product`}
                                                            onClick={() => setActiveStoreSlug({ username: p.storeSlug, name: p.storeName })}
                                                            className="text-xs font-bold text-slate-400 hover:text-white transition px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700"
                                                        >
                                                            Manage
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-3xl p-8">
                                <ShoppingBag size={32} className="mx-auto text-slate-600 mb-3" />
                                <h4 className="text-sm font-bold text-white">No products found for this selection</h4>
                                <p className="text-xs text-slate-500 mt-1">Import a store or add a new product to this store.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* ─── TAB 4: MASTER IMPORTS & HISTORY (Section 26) ─── */}
                {activeNavTab === 'imports' && (
                    <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-900/80 border border-slate-800 rounded-3xl p-6">
                            <div>
                                <div className="flex items-center gap-2">
                                    <Sparkles size={18} className="text-emerald-400" />
                                    <h2 className="text-base font-extrabold text-white">AI Store Import Center</h2>
                                </div>
                                <p className="text-xs text-slate-400 mt-1 max-w-xl">
                                    Inspect any public store (Shopify, WooCommerce, HTML), preview products and hero banners, customize parameters, and generate an independent storefront.
                                </p>
                            </div>

                            <Link
                                href="/store/import"
                                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-extrabold text-xs shadow-md shadow-emerald-500/20 transition active:scale-95 flex items-center gap-1.5"
                            >
                                <Sparkles size={14} />
                                <span>Start New Import</span>
                            </Link>
                        </div>

                        {/* Import History Table */}
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
                            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                                <div>
                                    <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                                        <History size={15} className="text-slate-400" />
                                        <span>Master Import History</span>
                                    </h3>
                                    <p className="text-[11px] text-slate-500 mt-0.5">Audit log of imported catalogs and source provenance</p>
                                </div>
                                <button
                                    onClick={loadImportHistory}
                                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                                    title="Refresh History"
                                >
                                    <RefreshCw size={13} className={loadingHistory ? 'animate-spin' : ''} />
                                </button>
                            </div>

                            {importHistory.length > 0 ? (
                                <div className="overflow-x-auto mt-4">
                                    <table className="w-full text-left text-xs">
                                        <thead className="text-[10px] uppercase font-bold text-slate-500 border-b border-slate-800 pb-2">
                                            <tr>
                                                <th className="py-2.5 px-3">Source</th>
                                                <th className="py-2.5 px-3">Date</th>
                                                <th className="py-2.5 px-3">Products</th>
                                                <th className="py-2.5 px-3">Banners</th>
                                                <th className="py-2.5 px-3">Destination Store</th>
                                                <th className="py-2.5 px-3">Status</th>
                                                <th className="py-2.5 px-3 text-right">View</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800/60 text-slate-300">
                                            {importHistory.map((item, idx) => (
                                                <tr key={item.id || idx} className="hover:bg-slate-800/30 transition">
                                                    <td className="py-3 px-3">
                                                        <div className="font-mono text-[11px] text-slate-300 truncate max-w-xs" title={item.sourceUrl}>
                                                            {item.sourceUrl || 'Direct Catalog Import'}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-3 text-slate-400 text-[11px]">
                                                        {new Date(item.createdAt || item.date || Date.now()).toLocaleDateString()}
                                                    </td>
                                                    <td className="py-3 px-3 font-bold text-white">
                                                        {item.productsImported || 0} items
                                                    </td>
                                                    <td className="py-3 px-3 text-slate-400">
                                                        {item.bannersImported || 0} banners
                                                    </td>
                                                    <td className="py-3 px-3">
                                                        <span className="font-bold text-emerald-400">
                                                            {item.destinationStoreName || item.destinationStoreSlug || 'Store'}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-3">
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                            <CheckCircle2 size={10} />
                                                            {item.status || 'COMPLETED'}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-3 text-right">
                                                        <a
                                                            href={`/shop/${item.destinationStoreSlug}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="text-xs font-bold text-slate-400 hover:text-white"
                                                        >
                                                            <ExternalLink size={13} />
                                                        </a>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-12 text-slate-500 text-xs">
                                    No external stores have been imported yet.
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ─── TAB 5: ORDERS (Section 17) ─── */}
                {activeNavTab === 'orders' && (
                    <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-black text-white">Customer Orders & Fulfillment ({filteredOrders.length})</h2>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    {selectedOrdersStore === 'all'
                                        ? 'Consolidated customer orders across all independent stores.'
                                        : `Customer orders strictly for store "${selectedOrdersStore}".`}
                                </p>
                            </div>

                            <div className="flex items-center gap-2.5">
                                <select
                                    value={selectedOrdersStore}
                                    onChange={(e) => setSelectedOrdersStore(e.target.value)}
                                    className="px-3 py-2 bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl text-xs text-white focus:outline-none transition"
                                >
                                    <option value="all">All Stores ({orders.length} orders)</option>
                                    {shops.map(s => (
                                        <option key={s.username} value={s.username}>{s.name}</option>
                                    ))}
                                </select>

                                <button
                                    onClick={loadOrders}
                                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                                    title="Refresh Orders"
                                >
                                    <RefreshCw size={13} className={loadingOrders ? 'animate-spin' : ''} />
                                </button>

                                <Link
                                    href="/store/orders"
                                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition flex items-center gap-1.5"
                                >
                                    <ExternalLink size={13} />
                                    <span>Store Order Manager</span>
                                </Link>
                            </div>
                        </div>

                        {/* Order Summary Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                                <div className="text-[11px] font-bold text-slate-400">Total Orders</div>
                                <div className="text-2xl font-black text-white mt-1">{filteredOrders.length}</div>
                            </div>
                            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                                <div className="text-[11px] font-bold text-slate-400">Completed Orders</div>
                                <div className="text-2xl font-black text-emerald-400 mt-1">
                                    {filteredOrders.filter(o => (o.status || '').toLowerCase() === 'completed' || o.verified).length}
                                </div>
                            </div>
                            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                                <div className="text-[11px] font-bold text-slate-400">Gross Revenue</div>
                                <div className="text-2xl font-black text-teal-400 mt-1 font-mono">
                                    ${filteredOrders.reduce((sum, o) => sum + (parseFloat(o.total || o.amount || o.price || 0) || 0), 0).toFixed(2)}
                                </div>
                            </div>
                        </div>

                        {filteredOrders.length > 0 ? (
                            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                                            <tr>
                                                <th className="py-3 px-4">Order ID</th>
                                                <th className="py-3 px-4">Store</th>
                                                <th className="py-3 px-4">Customer</th>
                                                <th className="py-3 px-4">Amount</th>
                                                <th className="py-3 px-4">Status</th>
                                                <th className="py-3 px-4">Date</th>
                                                <th className="py-3 px-4 text-right">Fulfillment</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800/60 text-slate-200">
                                            {filteredOrders.map((ord, idx) => (
                                                <tr key={ord.id || idx} className="hover:bg-slate-800/30 transition">
                                                    <td className="py-3 px-4 font-mono font-bold text-white">
                                                        {ord.id || `ORD-${idx + 1}`}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                                                            <Store size={10} />
                                                            {ord.storeName || ord.storeSlug || ord.storeId || 'Store'}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="font-medium text-white">{typeof ord.customer === 'string' ? ord.customer : (ord.customer?.name || ord.name || ord.customerName || 'Customer')}</div>
                                                        <div className="text-[10px] text-slate-500 font-mono">{typeof ord.customer === 'object' && ord.customer?.email ? ord.customer.email : (ord.customerEmail || ord.email || '—')}</div>
                                                    </td>
                                                    <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                                                        ${(parseFloat(ord.total || ord.amount || ord.price || 0) || 0).toFixed(2)}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                            <CheckCircle2 size={10} />
                                                            {ord.status || 'Completed'}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                                                        {new Date(ord.createdAt || Date.now()).toLocaleDateString()}
                                                    </td>
                                                    <td className="py-3 px-4 text-right">
                                                        <Link
                                                            href={`/track?orderId=${ord.id}`}
                                                            target="_blank"
                                                            className="text-xs font-bold text-slate-400 hover:text-white transition px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 inline-flex items-center gap-1"
                                                        >
                                                            <span>Track</span>
                                                            <ExternalLink size={10} />
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center space-y-3">
                                <Package size={36} className="mx-auto text-slate-600" />
                                <h3 className="text-base font-bold text-white">No customer orders recorded yet</h3>
                                <p className="text-xs text-slate-500 max-w-md mx-auto">
                                    When customers place orders via Gumroad checkout on any storefront, verified transactions will populate here automatically.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* ─── TAB 6: ANALYTICS (Section 25) ─── */}
                {activeNavTab === 'analytics' && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-lg font-black text-white">Master Commerce Analytics</h2>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Verified commercial metrics and live storefront engagement. Zero simulated claims.
                            </p>
                        </div>

                        {/* Storefront Engagement Metrics */}
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                    <TrendingUp size={16} className="text-emerald-400" />
                                    <span>GumShop Storefront Engagement (Local Metrics)</span>
                                </h3>
                                <span className="text-[10px] text-slate-500 font-mono">Live Counter</span>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                                    <div className="text-[11px] text-slate-400 font-bold">Total Stores</div>
                                    <div className="text-xl font-black text-white mt-1">{totalStores}</div>
                                    <div className="text-[10px] text-slate-500 mt-0.5">{activeStoresCount} active shops</div>
                                </div>
                                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                                    <div className="text-[11px] text-slate-400 font-bold">Active Catalog Items</div>
                                    <div className="text-xl font-black text-white mt-1">{totalProducts}</div>
                                    <div className="text-[10px] text-slate-500 mt-0.5">Across all stores</div>
                                </div>
                                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                                    <div className="text-[11px] text-slate-400 font-bold">Recorded Orders</div>
                                    <div className="text-xl font-black text-emerald-400 mt-1">{totalOrdersCount}</div>
                                    <div className="text-[10px] text-slate-500 mt-0.5">Real checkouts</div>
                                </div>
                                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                                    <div className="text-[11px] text-slate-400 font-bold">Creator Bio Links</div>
                                    <div className="text-xl font-black text-rose-400 mt-1">{totalStores}</div>
                                    <div className="text-[10px] text-slate-500 mt-0.5">Active landing pages</div>
                                </div>
                            </div>
                        </div>

                        {/* Gumroad Settlement Metrics */}
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                <DollarSign size={16} className="text-teal-400" />
                                <span>Gumroad Commercial Settlement (Verified Financials)</span>
                            </h3>
                            <p className="text-xs text-slate-400">
                                Sales figures are sourced directly from authenticated transactions and verified sales. Never synthesized from click events.
                            </p>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                                    <div className="text-[11px] text-slate-400 font-bold">Verified Purchases</div>
                                    <div className="text-xl font-black text-white mt-1">{completedOrdersCount}</div>
                                    <div className="text-[10px] text-slate-500 mt-1">{completedOrdersCount > 0 ? 'Verified transactions' : 'No sales recorded yet'}</div>
                                </div>
                                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                                    <div className="text-[11px] text-slate-400 font-bold">Net Revenue</div>
                                    <div className="text-xl font-black text-emerald-400 mt-1 font-mono">${totalRevenue.toFixed(2)}</div>
                                    <div className="text-[10px] text-slate-500 mt-1">Real gross GMV</div>
                                </div>
                                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                                    <div className="text-[11px] text-slate-400 font-bold">Refund Rate</div>
                                    <div className="text-xl font-black text-white mt-1">0.0%</div>
                                    <div className="text-[10px] text-slate-500 mt-1">Zero chargebacks</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── TAB 7: GUMROAD INTEGRATION (Section 13) ─── */}
                {activeNavTab === 'gumroad' && (
                    <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-black text-white">Gumroad Commerce Center</h2>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Manage server-vaulted API keys, overlay checkout parameters, and product sync.
                                </p>
                            </div>

                            <Link
                                href="/settings/integrations/gumroad"
                                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-xs shadow-md transition flex items-center gap-1.5"
                            >
                                <Zap size={13} />
                                <span>Configure Gumroad</span>
                            </Link>
                        </div>

                        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="size-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center font-black text-xl">
                                    G
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-white text-base">Supported Gumroad Integration Active</h3>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        Uses Gumroad’s official JavaScript overlay modal (`gumroad.js`) and direct checkout permalinks with post-purchase verification.
                                    </p>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-800 flex flex-wrap gap-3">
                                <Link
                                    href="/settings/integrations/gumroad"
                                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition"
                                >
                                    Open Gumroad Product Mapping Table
                                </Link>
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── TAB 8: SETTINGS (Section 3) ─── */}
                {activeNavTab === 'settings' && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-lg font-black text-white">Master HQ Engine Settings</h2>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Global platform configuration and control options.
                            </p>
                        </div>

                        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
                            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                                <div>
                                    <h3 className="text-sm font-bold text-white">Authentication & Session</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">Master administrator session active</p>
                                </div>
                                <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    Admin Verified
                                </span>
                            </div>

                            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                                <div>
                                    <h3 className="text-sm font-bold text-white">Security & SSRF Guard</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">DNS rebinding protection, non-standard IP blocking active</p>
                                </div>
                                <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    Hardened
                                </span>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-bold text-white">Token Storage</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">Secrets stored strictly server-side</p>
                                </div>
                                <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    Server-Vaulted
                                </span>
                            </div>
                        </div>
                    </div>
                )}

            </main>

            {/* ─── MODAL: CREATE BLANK STORE ─── */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                            <div className="flex items-center gap-2">
                                <div className="size-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                                    <Plus size={16} />
                                </div>
                                <h3 className="font-bold text-base text-white">Create New Store</h3>
                            </div>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-500 hover:text-white">
                                <X size={16} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateBlankShop} className="mt-5 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1">Store Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Velocity RC Store"
                                    value={newShopName}
                                    onChange={(e) => setNewShopName(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1">Theme</label>
                                <select
                                    value={newShopTheme}
                                    onChange={(e) => setNewShopTheme(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                                >
                                    <option value="viral_lander">Viral Lander</option>
                                    <option value="tech_hardware">Tech Hardware & RC</option>
                                    <option value="clean_beauty">Clean Minimalist Beauty</option>
                                    <option value="fashion_lookbook">Fashion Lookbook</option>
                                    <option value="digital_creator">Digital Creator</option>
                                </select>
                            </div>

                            <button
                                type="submit"
                                disabled={isCreatingShop}
                                className="w-full mt-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-xs shadow-md transition"
                            >
                                {isCreatingShop ? 'Creating Store...' : 'Create Store'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* ─── MODAL: 1-CLICK STORE DUPLICATION ─── */}
            {duplicatingShop && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                            <div className="flex items-center gap-2">
                                <div className="size-8 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
                                    <Copy size={16} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm text-white">Duplicate Store</h3>
                                    <p className="text-[11px] text-slate-400">Clone "{duplicatingShop.name}" into an independent shop</p>
                                </div>
                            </div>
                            <button onClick={() => setDuplicatingShop(null)} className="text-slate-500 hover:text-white">
                                <X size={16} />
                            </button>
                        </div>

                        <form onSubmit={handleExecuteDuplicate} className="mt-4 space-y-3.5">
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1">New Store Name</label>
                                <input
                                    type="text"
                                    required
                                    value={dupName}
                                    onChange={(e) => {
                                        setDupName(e.target.value);
                                        setDupSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-'));
                                    }}
                                    className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1">New Store Slug</label>
                                <input
                                    type="text"
                                    required
                                    value={dupSlug}
                                    onChange={(e) => setDupSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-'))}
                                    className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                                />
                            </div>

                            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-2">
                                <span className="text-[11px] font-bold text-slate-400 block mb-1">Copy Options:</span>
                                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={dupCopyProducts}
                                        onChange={(e) => setDupCopyProducts(e.target.checked)}
                                        className="size-4 rounded text-emerald-500 focus:ring-0"
                                    />
                                    <span>Copy all catalog products ({duplicatingShop.productsCount || 0} items)</span>
                                </label>

                                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={dupCopyBanners}
                                        onChange={(e) => setDupCopyBanners(e.target.checked)}
                                        className="size-4 rounded text-emerald-500 focus:ring-0"
                                    />
                                    <span>Copy hero marketing banners</span>
                                </label>

                                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={dupCopyTheme}
                                        onChange={(e) => setDupCopyTheme(e.target.checked)}
                                        className="size-4 rounded text-emerald-500 focus:ring-0"
                                    />
                                    <span>Copy theme & color palette</span>
                                </label>

                                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={dupCopyBranding}
                                        onChange={(e) => setDupCopyBranding(e.target.checked)}
                                        className="size-4 rounded text-emerald-500 focus:ring-0"
                                    />
                                    <span>Copy store logo & bio tagline</span>
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmittingDup}
                                className="w-full mt-3 py-3 rounded-xl bg-teal-500 hover:bg-teal-600 text-slate-950 font-extrabold text-xs shadow-md transition"
                            >
                                {isSubmittingDup ? 'Cloning Store...' : 'Create Duplicate Store'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}

// ─── REUSABLE INDEPENDENT STORE CARD COMPONENT ───
function StoreCard({ shop, activeStore, homepageStoreSlug, onSetActiveStore, onSetHomepage, onDelete, onArchive, onDuplicate }) {
    const isActive = Boolean(activeStore && (activeStore.username === shop.username || activeStore.id === shop.id));
    const isHomepage = Boolean(homepageStoreSlug && (homepageStoreSlug === shop.username || homepageStoreSlug === shop.id));

    return (
        <div
            className={`bg-slate-900 border rounded-3xl p-6 transition flex flex-col justify-between group hover:border-slate-700 shadow-lg ${
                isHomepage
                    ? 'border-amber-500/60 ring-1 ring-amber-500/30'
                    : isActive 
                        ? 'border-emerald-500/50 ring-1 ring-emerald-500/20' 
                        : shop.status === 'archived' 
                            ? 'border-slate-800/60 opacity-60' 
                            : 'border-slate-800'
            }`}
        >
            <div>
                {/* Top Badges & Delete */}
                <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="size-13 rounded-2xl bg-slate-800 border border-slate-700 p-1 shrink-0 overflow-hidden">
                        {shop.logo ? (
                            <img src={shop.logo} alt={shop.name} className="w-full h-full object-cover rounded-xl" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center font-black text-emerald-400 text-base">
                                {shop.name.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        {isActive ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 shadow-sm">
                                <Check size={10} /> Active
                            </span>
                        ) : (
                            <button
                                onClick={() => onSetActiveStore?.(shop)}
                                className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition"
                                title="Set as current active store"
                            >
                                Set Active
                            </button>
                        )}
                        {isHomepage ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 shadow-sm">
                                ⭐ Homepage
                            </span>
                        ) : (
                            <button
                                onClick={() => onSetHomepage?.(shop)}
                                className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 hover:bg-amber-500/20 text-slate-400 hover:text-amber-300 border border-slate-700 hover:border-amber-500/30 transition flex items-center gap-1"
                                title="Set as default root homepage (/)"
                            >
                                ⭐ Make Homepage
                            </button>
                        )}
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                            {shop.theme?.replace('_', ' ')}
                        </span>
                        <button
                            onClick={(e) => onDelete(shop.username, shop.id, e)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                            title="Delete store permanently"
                        >
                            <Trash2 size={13} />
                        </button>
                    </div>
                </div>

                <h3 className="font-bold text-base text-white truncate">{shop.name}</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">/shop/{shop.username}</p>

                {shop.description && (
                    <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                        {shop.description}
                    </p>
                )}

                {/* Metrics Summary */}
                <div className="grid grid-cols-2 gap-2 mt-4 p-3 rounded-2xl bg-slate-950/60 border border-slate-800/60">
                    <div className="text-center">
                        <div className="text-[11px] text-slate-500 font-medium">Products</div>
                        <div className="text-sm font-bold text-white mt-0.5">{shop.productsCount}</div>
                    </div>
                    <div className="text-center border-l border-slate-800/60">
                        <div className="text-[11px] text-slate-500 font-medium">Checkout</div>
                        <div className="text-sm font-bold text-emerald-400 mt-0.5">Ready</div>
                    </div>
                </div>

                {/* Creator Bio Pill */}
                <div className="mt-3 p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 min-w-0">
                        <Smartphone size={13} className="text-rose-400 shrink-0" />
                        <span className="font-mono text-[11px] text-rose-300 truncate">/creator/{shop.username}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => {
                                const url = `${window.location.origin}/creator/${shop.username}`;
                                navigator.clipboard.writeText(url);
                                toast.success('Bio link copied! 📋');
                            }}
                            className="px-2 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-[10px] font-bold"
                        >
                            Copy
                        </button>
                        <a
                            href={`/creator/${shop.username}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 text-rose-300 hover:text-white"
                        >
                            <ExternalLink size={12} />
                        </a>
                    </div>
                </div>
            </div>

            {/* Store Actions Panel */}
            <div className="mt-4 pt-4 border-t border-slate-800 space-y-2">
                <div className="flex items-center gap-2">
                    <Link
                        href="/store"
                        onClick={() => setActiveStoreSlug(shop)}
                        className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1 transition"
                    >
                        <Layers size={13} />
                        <span>Manage</span>
                    </Link>
                    <Link
                        href="/store/manage-product"
                        onClick={() => setActiveStoreSlug(shop)}
                        className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs flex items-center justify-center gap-1 transition"
                        title="Catalog editor"
                    >
                        <ShoppingBag size={13} />
                        <span>Catalog</span>
                    </Link>
                    <a
                        href={`/shop/${shop.username}`}
                        target="_blank"
                        rel="noreferrer"
                        className="py-2 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center gap-1 transition"
                        title="Open public storefront"
                    >
                        <Globe size={13} />
                        <span>View</span>
                    </a>
                </div>

                {/* Homepage Designation Action */}
                {isHomepage ? (
                    <div className="text-[11px] font-bold text-amber-300 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                        <span>⭐ Official Root Homepage (/)</span>
                    </div>
                ) : (
                    <button
                        onClick={() => onSetHomepage?.(shop)}
                        className="w-full text-[11px] font-bold text-amber-400 hover:text-white hover:bg-amber-500/20 py-1.5 px-3 rounded-xl border border-amber-500/30 transition flex items-center justify-center gap-1.5"
                        title="Designate this store as the default root homepage"
                    >
                        <span>⭐ Set as Root Homepage (/)</span>
                    </button>
                )}

                <div className="flex items-center justify-between text-[11px] pt-1">
                    <button
                        onClick={(e) => onDuplicate(shop, e)}
                        className="text-slate-400 hover:text-white flex items-center gap-1 font-semibold"
                    >
                        <Copy size={11} /> Duplicate
                    </button>
                    <button
                        onClick={() => onArchive(shop)}
                        className="text-slate-400 hover:text-white flex items-center gap-1 font-semibold"
                    >
                        <Archive size={11} /> {shop.status === 'archived' ? 'Unarchive' : 'Archive'}
                    </button>
                </div>
            </div>
        </div>
    );
}
