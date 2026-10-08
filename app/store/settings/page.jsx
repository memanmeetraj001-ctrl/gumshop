'use client'
import { useState, useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import { useAuth } from "@/lib/AuthContext";
import { getStoreByUserId, updateStore, updateUser } from "@/lib/firebaseDb";
import { getActiveStore, setActiveStoreSlug } from "@/lib/activeStore";
import { database } from "@/lib/firebase";
const ref = () => null;
const update = () => Promise.resolve();
const set = () => Promise.resolve();
import { 
    Store, 
    CreditCard, 
    Share2, 
    Truck, 
    Palette, 
    Sparkles, 
    Save, 
    ExternalLink, 
    Copy,
    Instagram,
    Youtube,
    Twitter,
    Globe,
    CheckCircle2,
    RefreshCw,
    AlertCircle,
    ArrowRight,
    Smartphone,
    Zap,
    Target,
    BarChart3
} from "lucide-react";
import Loading from "@/components/Loading";

export default function StoreSettings() {
    const { user, loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('general');
    const [isSaving, setIsSaving] = useState(false);
    const [autoSaveStatus, setAutoSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved'
    const isInitialMount = useRef(true);
    const autoSaveTimerRef = useRef(null);
    const [isVerifyingGumroad, setIsVerifyingGumroad] = useState(false);
    const [gumroadAccount, setGumroadAccount] = useState(null);
    const [gumroadProducts, setGumroadProducts] = useState([]);
    const [isFetchingProducts, setIsFetchingProducts] = useState(false);
    const [isCreatingProduct, setIsCreatingProduct] = useState(false);

    // Store state
    const [storeInfo, setStoreInfo] = useState({
        id: "",
        name: "",
        username: "",
        description: "",
        logo: "",
        avatar: "",
        bioProfile: null,
        gumroadToken: "",
        gumroadProductUrl: "",
        themeColor: "#10B981",
        socials: {
            instagram: "",
            tiktok: "",
            youtube: "",
            twitter: "",
            pinterest: ""
        },
        shipping: {
            standardFee: 4.99,
            expressFee: 9.99,
            freeShippingThreshold: 50.00,
            enableFreeShipping: true
        },
        flashSale: {
            enabled: true,
            text: "⚡ FLASH SALE: 25% OFF STOREWIDE — Today Only!",
            countdownHours: 3
        },
        customDomain: "",
        tracking: {
            metaPixelId: "",
            tiktokPixelId: "",
            googleAnalyticsId: ""
        }
    });

    useEffect(() => {
        const fetchStore = async () => {
            try {
                let store = await getActiveStore(user);
                if (!store) {
                    const { getActiveStoreSync } = await import('@/lib/activeStore');
                    store = getActiveStoreSync();
                }

                if (!store) {
                    setLoading(false);
                    return;
                }

                const { getGumroadToken } = await import('@/lib/activeStore');
                const persistentToken = getGumroadToken() || store?.gumroadToken || '';

                const persistentProductUrl = store?.gumroadProductUrl || 
                    (typeof window !== 'undefined' ? (localStorage.getItem(`gumroad_url_${store.username}`) || '') : '');

                const baseStore = store;
                const cleanId = baseStore.id || `store_${baseStore.username || 'shop'}`;
                const resolvedAvatar = baseStore.logo || baseStore.avatar || baseStore.bioProfile?.avatar || "";

                setStoreInfo(prev => ({
                    ...prev,
                    ...baseStore,
                    id: cleanId,
                    logo: resolvedAvatar || prev.logo || "",
                    avatar: resolvedAvatar || prev.avatar || "",
                    bioProfile: baseStore.bioProfile || prev.bioProfile || {
                        displayName: baseStore.name || "My Store",
                        avatar: resolvedAvatar,
                        tagline: baseStore.description || ""
                    },
                    gumroadToken: persistentToken,
                    gumroadProductUrl: persistentProductUrl || baseStore.gumroadProductUrl || "",
                    customDomain: baseStore.customDomain || "",
                    socials: { ...prev.socials, ...(baseStore.socials || {}) },
                    shipping: { ...prev.shipping, ...(baseStore.shipping || {}) },
                    flashSale: { ...prev.flashSale, ...(baseStore.flashSale || {}) },
                    tracking: { ...prev.tracking, ...(baseStore.tracking || {}) }
                }));
            } catch (err) {
                console.error("Error fetching store:", err);
            }
            setLoading(false);
            setTimeout(() => {
                isInitialMount.current = false;
            }, 600);
        };
        if (!authLoading) fetchStore();
    }, [user, authLoading]);

    // Debounced Auto-Save
    useEffect(() => {
        if (loading || isInitialMount.current) return;
        if (!storeInfo.name && !storeInfo.username) return;

        setAutoSaveStatus('saving');
        if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);

        autoSaveTimerRef.current = setTimeout(async () => {
            try {
                const cleanSlug = (storeInfo.username ? storeInfo.username.trim() : (storeInfo.name || 'shop').replace(/\s+/g, '-')).toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || `shop-${Date.now()}`;
                let targetStoreId = storeInfo.id || `store_${cleanSlug}`;
                targetStoreId = targetStoreId.replace(/^store_store_/, 'store_');

                const activeAvatar = storeInfo.logo || storeInfo.avatar || storeInfo.bioProfile?.avatar || "";
                const payload = {
                    ...storeInfo,
                    id: targetStoreId,
                    username: cleanSlug,
                    logo: activeAvatar,
                    avatar: activeAvatar,
                    bioProfile: {
                        ...(storeInfo.bioProfile || {}),
                        displayName: storeInfo.name || storeInfo.bioProfile?.displayName || 'My Store',
                        avatar: activeAvatar || storeInfo.bioProfile?.avatar || '',
                        tagline: storeInfo.description || storeInfo.bioProfile?.tagline || '',
                        themeColor: storeInfo.themeColor || storeInfo.bioProfile?.themeColor || '#10B981'
                    },
                    updatedAt: new Date().toISOString()
                };

                // Sync local caches
                if (typeof window !== 'undefined') {
                    localStorage.setItem(`store_${cleanSlug}`, JSON.stringify(payload));
                    localStorage.setItem(`cloned_store_${cleanSlug}`, JSON.stringify(payload));
                    localStorage.setItem(targetStoreId, JSON.stringify(payload));
                    localStorage.setItem('gumshop_active_store', JSON.stringify(payload));
                    localStorage.setItem('active_store_slug', cleanSlug);
                    localStorage.setItem(`gumshop_db_stores/${targetStoreId}`, JSON.stringify(payload));
                    localStorage.setItem(`gumshop_db_stores/store_${cleanSlug}`, JSON.stringify(payload));
                    if (storeInfo.gumroadProductUrl) localStorage.setItem(`gumroad_url_${cleanSlug}`, storeInfo.gumroadProductUrl);
                    if (storeInfo.gumroadToken) localStorage.setItem(`gumroad_token_${cleanSlug}`, storeInfo.gumroadToken);
                    if (storeInfo.socials) localStorage.setItem(`gumshop_socials_${cleanSlug}`, JSON.stringify(storeInfo.socials));
                    window.dispatchEvent(new Event('active_store_changed'));
                }

                // Background sync to server API
                fetch('/api/store/data', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ store: payload })
                }).catch(() => {});

                if (storeInfo.gumroadToken || storeInfo.gumroadProductUrl) {
                    fetch('/api/store/config', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            gumroadToken: storeInfo.gumroadToken || '',
                            gumroadProductUrl: storeInfo.gumroadProductUrl || '',
                            storeId: targetStoreId,
                            storeName: payload.name,
                            customDomain: payload.customDomain || ''
                        })
                    }).catch(() => {});
                }

                setAutoSaveStatus('saved');
                setTimeout(() => {
                    setAutoSaveStatus(prev => prev === 'saved' ? 'idle' : prev);
                }, 3000);
            } catch (e) {
                console.warn("Auto-save sync notice:", e);
                setAutoSaveStatus('idle');
            }
        }, 800);

        return () => {
            if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
        };
    }, [storeInfo, loading]);

    const handleVerifyGumroad = async () => {
        if (!storeInfo.gumroadToken) {
            toast.error("Please enter your Gumroad Access Token first");
            return;
        }
        setIsVerifyingGumroad(true);
        try {
            const res = await fetch('/api/gumroad/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'verify',
                    accessToken: storeInfo.gumroadToken.trim()
                })
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || "Token verification failed");
            }
            setGumroadAccount(data.user);

            // Auto-persist verified token immediately!
            if (typeof window !== 'undefined') {
                localStorage.setItem('gumshop_gumroad_token', storeInfo.gumroadToken.trim());
                localStorage.setItem('gumroad_access_token', storeInfo.gumroadToken.trim());
                const raw = localStorage.getItem('gumshop_active_store');
                if (raw) {
                    try {
                        const s = JSON.parse(raw);
                        s.gumroadToken = storeInfo.gumroadToken.trim();
                        localStorage.setItem('gumshop_active_store', JSON.stringify(s));
                    } catch {}
                }
            }
            toast.success(`Connected & saved to Gumroad account: ${data.user.name || data.user.email || 'Verified'}!`);
        } catch (err) {
            console.error("Token verification error:", err);
            toast.error(err.message || "Failed to verify Gumroad token");
            setGumroadAccount(null);
        } finally {
            setIsVerifyingGumroad(false);
        }
    };

    const handleTestSync = async () => {
        if (!storeInfo.id) {
            toast.error("Store not loaded yet");
            return;
        }
        setIsVerifyingGumroad(true);
        try {
            const res = await fetch('/api/gumroad/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'sync',
                    storeId: storeInfo.id,
                    accessToken: storeInfo.gumroadToken.trim()
                })
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || "Sync failed");
            }
            toast.success(data.message || `Successfully synced ${data.count || 0} orders from Gumroad!`);
        } catch (err) {
            toast.error(err.message || "Sync test failed");
        } finally {
            setIsVerifyingGumroad(false);
        }
    };

    const handleAutoDetectProducts = async () => {
        if (!storeInfo.gumroadToken) {
            toast.error("Please enter your Gumroad Access Token first");
            return;
        }
        setIsFetchingProducts(true);
        try {
            const res = await fetch('/api/gumroad/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'get_products',
                    accessToken: storeInfo.gumroadToken.trim()
                })
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || "Failed to fetch Gumroad products");
            }
            const prods = data.products || [];
            setGumroadProducts(prods);
            if (prods.length > 0) {
                toast.success(`Found ${prods.length} product(s) on your Gumroad account!`);
                if (!storeInfo.gumroadProductUrl || storeInfo.gumroadProductUrl.includes('gumshop-order')) {
                    const firstUrl = prods[0].short_url || prods[0].url;
                    setStoreInfo(prev => ({ ...prev, gumroadProductUrl: firstUrl }));
                    if (typeof window !== 'undefined') {
                        localStorage.setItem('gumshop_gumroad_url', firstUrl);
                        localStorage.setItem('gumroad_product_url', firstUrl);
                    }
                    toast.success(`Auto-linked "${prods[0].name}" as your checkout product!`);
                }
            } else {
                toast("No products found on your Gumroad account yet. Click 'Create 1-Click Product' to auto-generate one!", { icon: 'ℹ️' });
            }
        } catch (err) {
            console.error("Auto-detect error:", err);
            toast.error(err.message || "Failed to auto-detect products");
        } finally {
            setIsFetchingProducts(false);
        }
    };

    const handleAutoCreateProduct = async () => {
        if (!storeInfo.gumroadToken) {
            toast.error("Please enter your Gumroad Access Token first");
            return;
        }
        setIsCreatingProduct(true);
        try {
            const res = await fetch('/api/gumroad/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'create_checkout_product',
                    accessToken: storeInfo.gumroadToken.trim()
                })
            });
            const data = await res.json();
            if (!res.ok || !data.success || !data.product) {
                throw new Error(data.error || "Could not auto-create Gumroad product");
            }
            const createdUrl = data.product.short_url || data.product.url;
            setStoreInfo(prev => ({ ...prev, gumroadProductUrl: createdUrl }));
            if (typeof window !== 'undefined') {
                localStorage.setItem('gumshop_gumroad_url', createdUrl);
                localStorage.setItem('gumroad_product_url', createdUrl);
            }
            setGumroadProducts(prev => [data.product, ...prev]);
            toast.success("Created Gumroad checkout product! Save Settings to finalize.");
        } catch (err) {
            console.error("Auto-create error:", err);
            toast.error(err.message || "Failed to create product on Gumroad");
        } finally {
            setIsCreatingProduct(false);
        }
    };

    const handleSaveSettings = async (e) => {
        if (e?.preventDefault) e.preventDefault();
        if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
        setIsSaving(true);
        setAutoSaveStatus('saving');
        try {
            const cleanSlug = (storeInfo.username ? storeInfo.username.trim() : (storeInfo.name || 'shop').replace(/\s+/g, '-')).toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || `shop-${Date.now()}`;
            let targetStoreId = storeInfo.id || `store_${cleanSlug}`;
            targetStoreId = targetStoreId.replace(/^store_store_/, 'store_');

            const { setGumroadToken, getGumroadToken } = await import('@/lib/activeStore');
            const persistentToken = (storeInfo.gumroadToken || '').trim() || getGumroadToken() || '';

            // Preserve existing products from active cache so saving settings never wipes them!
            let currentProducts = storeInfo.products || [];
            if (currentProducts.length === 0 && typeof window !== 'undefined') {
                try {
                    const cached = JSON.parse(localStorage.getItem(`cloned_store_${cleanSlug}`) || localStorage.getItem(`store_${cleanSlug}`) || '{}');
                    if (Array.isArray(cached.products) && cached.products.length > 0) {
                        currentProducts = cached.products;
                    }
                } catch {}
            }

            const activeAvatar = storeInfo.logo || storeInfo.avatar || storeInfo.bioProfile?.avatar || "";
            const payloadToSave = {
                id: targetStoreId,
                userId: user?.uid || targetStoreId,
                name: storeInfo.name || "My Store",
                username: cleanSlug,
                description: storeInfo.description || "",
                logo: activeAvatar,
                avatar: activeAvatar,
                bioProfile: {
                    ...(storeInfo.bioProfile || {}),
                    displayName: storeInfo.name || storeInfo.bioProfile?.displayName || "My Store",
                    avatar: activeAvatar,
                    tagline: storeInfo.description || storeInfo.bioProfile?.tagline || "",
                    themeColor: storeInfo.themeColor || storeInfo.bioProfile?.themeColor || "#10B981"
                },
                gumroadToken: persistentToken,
                gumroadProductUrl: storeInfo.gumroadProductUrl || "",
                themeColor: storeInfo.themeColor || "#10B981",
                customDomain: storeInfo.customDomain ? storeInfo.customDomain.toLowerCase().trim().replace(/^https?:\/\//, '') : "",
                socials: storeInfo.socials || {},
                shipping: storeInfo.shipping || { standardFee: 4.99, expressFee: 9.99, freeShippingThreshold: 50.00 },
                flashSale: storeInfo.flashSale || { enabled: true, text: "⚡ FLASH SALE: 25% OFF STOREWIDE — Today Only!", countdownHours: 3 },
                tracking: storeInfo.tracking || { metaPixelId: '', tiktokPixelId: '', googleAnalyticsId: '' },
                status: storeInfo.status || "approved",
                products: currentProducts,
                updatedAt: new Date().toISOString()
            };

            // 1. Dual-layer Firebase Realtime DB save / update
            try {
                if (database) {
                    const storeRef = ref(database, `stores/${targetStoreId}`);
                    await set(storeRef, payloadToSave);
                } else {
                    await updateStore(targetStoreId, payloadToSave);
                }
            } catch (fbErr) {
                console.warn("Firebase RTDB permission notice (saved to edge engine):", fbErr.message);
                try {
                    await updateStore(targetStoreId, payloadToSave);
                } catch (e) {}
            }

            // 2. Link storeId to user document if logged in via Firebase
            if (user?.uid) {
                try {
                    await updateUser(user.uid, { storeId: targetStoreId, role: "storeOwner" });
                } catch (userErr) {
                    console.warn("User storeId link notice:", userErr);
                }
            }

            // 3. Multi-tier token and store synchronization
            if (persistentToken) {
                setGumroadToken(persistentToken);
            }
            setActiveStoreSlug(cleanSlug);

            // Await both server calls so data is persisted before completing
            await Promise.allSettled([
                fetch('/api/store/config', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        gumroadToken: persistentToken,
                        gumroadProductUrl: payloadToSave.gumroadProductUrl,
                        storeId: targetStoreId,
                        storeName: payloadToSave.name,
                        customDomain: payloadToSave.customDomain,
                        tracking: payloadToSave.tracking
                    })
                }),
                fetch('/api/store/data', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        store: payloadToSave,
                        products: currentProducts
                    })
                })
            ]);

            // 4. Cache in localStorage so public storefront & seller layout resolve immediately
            if (typeof window !== 'undefined') {
                if (payloadToSave.gumroadProductUrl) {
                    localStorage.setItem(`gumroad_url_${cleanSlug}`, payloadToSave.gumroadProductUrl);
                }
                if (persistentToken) {
                    localStorage.setItem(`gumroad_token_${cleanSlug}`, persistentToken);
                }
                if (payloadToSave.socials) {
                    localStorage.setItem(`gumshop_socials_${cleanSlug}`, JSON.stringify(payloadToSave.socials));
                }
                localStorage.setItem(targetStoreId, JSON.stringify(payloadToSave));
                localStorage.setItem(`store_${cleanSlug}`, JSON.stringify(payloadToSave));
                localStorage.setItem(`cloned_store_${cleanSlug}`, JSON.stringify(payloadToSave));
                localStorage.setItem(`gumshop_db_stores/${targetStoreId}`, JSON.stringify(payloadToSave));
                localStorage.setItem(`gumshop_db_stores/store_${cleanSlug}`, JSON.stringify(payloadToSave));
                localStorage.setItem('gumshop_active_store', JSON.stringify(payloadToSave));
                localStorage.setItem('active_store_slug', cleanSlug);
                window.dispatchEvent(new Event('active_store_changed'));
                window.dispatchEvent(new Event('products_updated'));
            }

            setStoreInfo(prev => ({ ...prev, id: targetStoreId, ...payloadToSave }));
            setAutoSaveStatus('saved');
            toast.success("Store settings updated successfully! 🎉");
        } catch (error) {
            console.error("Update error:", error);
            setAutoSaveStatus('idle');
            toast.error(error.message || "Failed to update settings");
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) return <Loading />;

    const palettes = [
        { id: '#10B981', name: 'Emerald Noir', bg: 'bg-emerald-500' },
        { id: '#0F172A', name: 'Midnight Stealth', bg: 'bg-slate-900' },
        { id: '#F43F5E', name: 'Soft Rose & Gold', bg: 'bg-rose-500' },
        { id: '#06B6D4', name: 'Cyber Neon Cyan', bg: 'bg-cyan-500' },
        { id: '#3B82F6', name: 'Deep Ocean Slate', bg: 'bg-blue-500' },
        { id: '#78716C', name: 'Minimalist Stone', bg: 'bg-stone-500' },
    ];

    const storeSlug = storeInfo.username || (storeInfo.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'demo';
    const storeUrl = `https://gumshop.online/shop/${storeSlug}`;

    return (
        <div className="p-4 sm:p-8 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                        Store Settings & Automation
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Configure your brand social accounts, white-labeled Gumroad checkout, shipping rates, and theme styles.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Auto-save Status Badge */}
                    {autoSaveStatus === 'saving' && (
                        <span className="inline-flex items-center gap-1.5 text-amber-600 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 text-xs font-medium">
                            <RefreshCw size={12} className="animate-spin" />
                            <span>Auto-saving...</span>
                        </span>
                    )}
                    {autoSaveStatus === 'saved' && (
                        <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 text-xs font-medium">
                            <CheckCircle2 size={13} className="text-emerald-600" />
                            <span>Saved</span>
                        </span>
                    )}

                    <button
                        type="button"
                        onClick={handleSaveSettings}
                        disabled={isSaving}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-xs font-bold text-white shadow-sm shadow-emerald-600/20 transition disabled:opacity-50"
                    >
                        <Save size={14} />
                        <span>{isSaving ? "Saving..." : "Save"}</span>
                    </button>

                    <button
                        onClick={() => {
                            navigator.clipboard.writeText(storeUrl);
                            toast.success("Store link copied to clipboard!");
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition"
                    >
                        <Copy size={14} />
                        <span>Copy Link</span>
                    </button>
                    <a
                        href={storeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-xs font-semibold text-emerald-700 transition"
                    >
                        <span>View Live</span>
                        <ExternalLink size={14} />
                    </a>
                    <a
                        href={`https://gumshop.online/creator/${storeSlug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-xs font-semibold text-rose-700 border border-rose-200 transition"
                        title="Open your single-column mobile Link-in-Bio store"
                    >
                        <span>⚡ Bio Mode</span>
                        <ExternalLink size={14} />
                    </a>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto py-4 border-b border-slate-200/80 no-scrollbar">
                {[
                    { id: 'general', label: 'Store Profile', icon: Store },
                    { id: 'gumroad', label: 'Gumroad Sync & Payments', icon: CreditCard },
                    { id: 'domain', label: 'Custom Domain', icon: Globe },
                    { id: 'socials', label: 'Brand Socials', icon: Share2 },
                    { id: 'shipping', label: 'Shipping Rules', icon: Truck },
                    { id: 'palettes', label: 'Brand Palettes', icon: Palette },
                    { id: 'tracking', label: 'Ad Pixels & Analytics', icon: Target },
                ].map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition shrink-0 ${
                                activeTab === tab.id
                                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                                    : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            <Icon size={16} />
                            <span>{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Settings Form */}
            <form onSubmit={handleSaveSettings} className="mt-8 space-y-8">
                
                {/* 1. General Profile Tab */}
                {activeTab === 'general' && (
                    <div className="space-y-6 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm animate-in fade-in">
                        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <Store size={18} className="text-emerald-600" />
                            <span>Store Profile & Brand Identity</span>
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                                    Store Name
                                </label>
                                <input
                                    type="text"
                                    value={storeInfo.name}
                                    onChange={(e) => setStoreInfo({ ...storeInfo, name: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500 focus:bg-white transition"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                                    Custom Username / Slug
                                </label>
                                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 focus-within:border-emerald-500 focus-within:bg-white transition">
                                    <span className="text-xs text-slate-400">gumshop.online/shop/</span>
                                    <input
                                        type="text"
                                        value={storeInfo.username}
                                        onChange={(e) => setStoreInfo({ ...storeInfo, username: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/-+/g, '-') })}
                                        placeholder={storeSlug}
                                        className="w-full px-2 py-3 bg-transparent text-sm outline-none text-slate-800"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Store Avatar & Logo Input */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                                Store Logo / Profile Picture URL
                            </label>
                            <div className="flex items-center gap-3">
                                <img
                                    src={storeInfo.logo || storeInfo.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(storeInfo.name || 'Store')}`}
                                    alt="Preview"
                                    className="size-12 rounded-2xl border border-slate-200 object-cover shrink-0 shadow-xs"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(storeInfo.name || 'Store')}`;
                                    }}
                                />
                                <input
                                    type="url"
                                    value={storeInfo.logo || storeInfo.avatar || ""}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setStoreInfo(prev => ({
                                            ...prev,
                                            logo: val,
                                            avatar: val,
                                            bioProfile: { ...(prev.bioProfile || {}), avatar: val }
                                        }));
                                    }}
                                    placeholder="https://images.unsplash.com/... or image URL"
                                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500 focus:bg-white transition"
                                />
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1.5">
                                Synchronized across your desktop storefront, mobile Link-in-Bio, and checkout headers.
                            </p>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                                Store Tagline / Bio (Shown in Mobile Link-in-Bio Header)
                            </label>
                            <textarea
                                rows={2}
                                value={storeInfo.description}
                                onChange={(e) => setStoreInfo({ ...storeInfo, description: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500 focus:bg-white transition"
                                placeholder="Viral beauty and wellness essentials curated for daily glow."
                            />
                        </div>

                        {/* Dedicated Instagram / TikTok Link-in-Bio URL (Stan Store Killer) */}
                        <div className="p-5 rounded-2xl bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="p-1 rounded-md bg-rose-500 text-white">
                                        <Smartphone size={13} />
                                    </span>
                                    <p className="text-xs font-bold text-slate-900">Instagram & TikTok Bio Link (Linktree Killer)</p>
                                    <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-rose-200 text-rose-800">Mobile Shop</span>
                                </div>
                                <p className="text-xs text-slate-500 font-mono">
                                    gumshop.online/creator/{storeInfo.username || storeInfo.name?.toLowerCase().replace(/[^a-z0-9-]+/g, '') || 'shop'}
                                </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const clean = storeInfo.username || storeInfo.name?.toLowerCase().replace(/[^a-z0-9-]+/g, '') || 'shop';
                                        const url = typeof window !== 'undefined' ? `${window.location.origin}/creator/${clean}` : `https://gumshop.online/creator/${clean}`;
                                        navigator.clipboard.writeText(url);
                                        toast.success("Copied Instagram Bio Link to clipboard! 📋");
                                    }}
                                    className="px-3 py-2 bg-white hover:bg-slate-50 border border-rose-300 text-rose-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
                                >
                                    <Copy size={13} />
                                    <span>Copy Bio Link</span>
                                </button>
                                <a
                                    href={`/creator/${storeInfo.username || storeInfo.name?.toLowerCase().replace(/[^a-z0-9-]+/g, '') || 'shop'}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-xs"
                                    title="Open Mobile Bio Mode"
                                >
                                    <ExternalLink size={13} />
                                </a>
                            </div>
                        </div>

                        {/* Quick Gumroad Connect Callout */}
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-slate-800">Connected Payment Processor</p>
                                <p className="text-xs text-slate-500">
                                    {storeInfo.gumroadToken ? "Gumroad checkout is configured." : "Gumroad checkout token not added yet."}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setActiveTab('gumroad')}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-50 hover:bg-pink-100 text-pink-700 font-bold text-xs border border-pink-200 transition"
                            >
                                <span>Configure Gumroad</span>
                                <ArrowRight size={13} />
                            </button>
                        </div>
                    </div>
                )}

                {/* 2. Gumroad Sync & Payments Tab */}
                {activeTab === 'gumroad' && (
                    <div className="space-y-6 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm animate-in fade-in">
                        <div>
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <CreditCard size={18} className="text-pink-600" />
                                    <span>Gumroad White-Labeled Payments & Sales Sync</span>
                                </h3>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-pink-50 text-pink-700 border border-pink-200">
                                    <Sparkles size={12} />
                                    0% Platform Fee
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                                Customer payments flow directly into your Gumroad balance via Credit Card, Apple Pay, Google Pay, and PayPal with zero commission taken by GumShop.
                            </p>
                        </div>

                        {/* Account Verification Status */}
                        {gumroadAccount ? (
                            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
                                    <div>
                                        <p className="text-xs font-bold text-emerald-900">
                                            Connected Gumroad Account: {gumroadAccount.name || gumroadAccount.email}
                                        </p>
                                        <p className="text-[11px] text-emerald-700">
                                            Account ID: {gumroadAccount.id || 'Active'} • Currency: {gumroadAccount.currency || 'USD'}
                                        </p>
                                    </div>
                                </div>
                                <span className="text-xs font-extrabold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                                    ✓ Active
                                </span>
                            </div>
                        ) : storeInfo.gumroadToken ? (
                            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <AlertCircle size={18} className="text-amber-600 shrink-0" />
                                    <p className="text-xs text-amber-800 font-medium">
                                        Token saved. Click <strong>Test Connection</strong> below to verify your account.
                                    </p>
                                </div>
                            </div>
                        ) : null}

                        {/* Input Credentials */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                                        Gumroad Personal Access Token
                                    </label>
                                    <a
                                        href="https://gumroad.com/settings/developer"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-[11px] text-pink-600 hover:text-pink-700 font-bold inline-flex items-center gap-1"
                                    >
                                        <span>Get Token</span>
                                        <ExternalLink size={11} />
                                    </a>
                                </div>
                                <input
                                    type="password"
                                    placeholder="Paste token starting with gum_ or access token..."
                                    value={storeInfo.gumroadToken || ''}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setStoreInfo(prev => ({ ...prev, gumroadToken: val }));
                                        if (typeof window !== 'undefined') {
                                            localStorage.setItem('gumshop_gumroad_token', val.trim());
                                            localStorage.setItem('gumroad_access_token', val.trim());
                                        }
                                    }}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-pink-500 focus:bg-white transition font-mono"
                                />
                                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (!storeInfo.gumroadToken) {
                                                toast.error("Please enter your Gumroad Access Token");
                                                return;
                                            }
                                            handleSaveSettings();
                                        }}
                                        disabled={isSaving || !storeInfo.gumroadToken}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white transition shadow-sm disabled:opacity-50"
                                    >
                                        <Save size={13} />
                                        <span>{isSaving ? "Saving..." : "💾 Save Token"}</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleVerifyGumroad}
                                        disabled={isVerifyingGumroad || !storeInfo.gumroadToken}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition disabled:opacity-50"
                                    >
                                        <RefreshCw size={13} className={isVerifyingGumroad ? "animate-spin" : ""} />
                                        <span>{isVerifyingGumroad ? "Testing..." : "🧪 Test Connection"}</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleTestSync}
                                        disabled={isVerifyingGumroad || !storeInfo.gumroadToken}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-50 hover:bg-pink-100 text-xs font-bold text-pink-700 transition disabled:opacity-50"
                                    >
                                        <span>Sync Recent Sales</span>
                                    </button>
                                    {storeInfo.gumroadToken && (
                                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1 ml-auto">
                                            <CheckCircle2 size={12} className="text-emerald-600" /> Token Active & Saved
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div>
                                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                                        Checkout Product Permalink (Pay What You Want)
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={handleAutoDetectProducts}
                                            disabled={isFetchingProducts || !storeInfo.gumroadToken}
                                            className="text-[11px] text-pink-600 hover:text-pink-700 font-bold inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-pink-50 hover:bg-pink-100 transition disabled:opacity-50"
                                        >
                                            <Sparkles size={11} className={isFetchingProducts ? "animate-spin" : ""} />
                                            <span>{isFetchingProducts ? "Detecting..." : "⚡ Auto-Detect Products"}</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleAutoCreateProduct}
                                            disabled={isCreatingProduct || !storeInfo.gumroadToken}
                                            className="text-[11px] text-emerald-700 hover:text-emerald-800 font-bold inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 transition disabled:opacity-50"
                                        >
                                            <Sparkles size={11} className={isCreatingProduct ? "animate-spin" : ""} />
                                            <span>{isCreatingProduct ? "Creating..." : "⚡ 1-Click Auto-Create"}</span>
                                        </button>
                                        <a
                                            href="https://gumroad.com/products/new"
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-[11px] text-slate-500 hover:text-slate-700 font-medium inline-flex items-center gap-1"
                                        >
                                            <span>Manual</span>
                                            <ExternalLink size={11} />
                                        </a>
                                    </div>
                                </div>
                                <input
                                    type="url"
                                    placeholder="https://gumroad.com/l/your-product or https://yourstore.gumroad.com/l/item"
                                    value={storeInfo.gumroadProductUrl || ''}
                                    onChange={(e) => setStoreInfo({ ...storeInfo, gumroadProductUrl: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-pink-500 focus:bg-white transition font-mono"
                                />

                                {gumroadProducts.length > 0 && (
                                    <div className="mt-2.5 p-3 bg-pink-50/70 border border-pink-200/80 rounded-xl space-y-2 animate-in fade-in">
                                        <p className="text-[11px] font-bold text-pink-900 flex items-center justify-between">
                                            <span>Available Products on Your Gumroad ({gumroadProducts.length}):</span>
                                            <span className="text-[10px] text-pink-600 font-normal">Click any product to select</span>
                                        </p>
                                        <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                                            {gumroadProducts.map((p) => {
                                                const url = p.short_url || p.url;
                                                const isSelected = storeInfo.gumroadProductUrl === url;
                                                return (
                                                    <button
                                                        key={p.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setStoreInfo(prev => ({ ...prev, gumroadProductUrl: url }));
                                                            if (typeof window !== 'undefined') {
                                                                localStorage.setItem('gumshop_gumroad_url', url);
                                                                localStorage.setItem('gumroad_product_url', url);
                                                            }
                                                            toast.success(`Selected "${p.name}"! Click "Save Settings" below to apply.`);
                                                        }}
                                                        className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition flex items-center gap-1.5 ${
                                                            isSelected 
                                                                ? 'bg-pink-600 text-white border-pink-600 shadow-sm' 
                                                                : 'bg-white text-slate-700 border-slate-200 hover:border-pink-300 hover:bg-pink-50'
                                                        }`}
                                                    >
                                                        <span>{p.name}</span>
                                                        {p.formatted_price && <span className="opacity-75 text-[10px]">({p.formatted_price})</span>}
                                                        {isSelected && <CheckCircle2 size={11} />}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1.5">
                                    <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
                                    <span>
                                        Zero 404 Guarantee: If no Gumroad link is set, checkout automatically falls back to <strong>Direct Express Checkout</strong> so you never lose a sale.
                                    </span>
                                </p>
                            </div>
                        </div>

                        {/* Webhook Configuration Box */}
                        <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                                    <span>Real-Time Webhook Ping URL</span>
                                </span>
                                <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                                    Automatic Order Ingestion
                                </span>
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Paste this Webhook URL into your Gumroad account so every completed payment automatically generates an order with customer details in your GumShop dashboard.
                            </p>
                            <div className="flex items-center gap-2 bg-slate-800 p-2 rounded-xl border border-slate-700">
                                <code className="text-xs font-mono text-emerald-400 flex-1 px-2 select-all overflow-x-auto">
                                    {typeof window !== 'undefined' ? `${window.location.origin}/api/gumroad/webhook` : 'https://gumshop.online/api/gumroad/webhook'}
                                </code>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const url = typeof window !== 'undefined' ? `${window.location.origin}/api/gumroad/webhook` : 'https://gumshop.online/api/gumroad/webhook';
                                        navigator.clipboard.writeText(url);
                                        toast.success("Webhook URL copied!");
                                    }}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shrink-0"
                                >
                                    <Copy size={13} />
                                    <span>Copy URL</span>
                                </button>
                            </div>
                        </div>

                        {/* Step-by-Step Setup Guide */}
                        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                                📖 3-Minute Gumroad Sync Guide
                            </h4>
                            <div className="space-y-3 text-xs text-slate-600">
                                <div className="flex items-start gap-3">
                                    <div className="size-6 rounded-full bg-pink-100 text-pink-700 font-extrabold flex items-center justify-center shrink-0 text-xs">
                                        1
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800">Generate your Personal Access Token</p>
                                        <p className="text-slate-500 mt-0.5">
                                            Visit <a href="https://gumroad.com/settings/developer" target="_blank" rel="noreferrer" className="text-pink-600 underline font-semibold">Gumroad Settings → Advanced → Developer</a>. Generate a Personal Access Token and paste it into the field above.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="size-6 rounded-full bg-pink-100 text-pink-700 font-extrabold flex items-center justify-center shrink-0 text-xs">
                                        2
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800">Create a Pay-What-You-Want Product</p>
                                        <p className="text-slate-500 mt-0.5">
                                            Create a new Digital Product at <a href="https://gumroad.com/products/new" target="_blank" rel="noreferrer" className="text-pink-600 underline font-semibold">gumroad.com/products/new</a>. Name it <em>"Store Checkout"</em>, set price to <strong>$1+</strong>, and enable <em>"Allow customers to pay what they want"</em>. Copy the product URL and paste it above.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="size-6 rounded-full bg-pink-100 text-pink-700 font-extrabold flex items-center justify-center shrink-0 text-xs">
                                        3
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800">Paste the Ping Webhook URL</p>
                                        <p className="text-slate-500 mt-0.5">
                                            Under <a href="https://gumroad.com/settings/developer" target="_blank" rel="noreferrer" className="text-pink-600 underline font-semibold">Gumroad Developer Settings</a>, scroll down to <strong>"Ping"</strong>, paste the Webhook URL above, and click <strong>Save</strong>. Every completed sale will now automatically sync to your GumShop orders list!
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Custom Domain Tab */}
                {activeTab === 'domain' && (
                    <div className="space-y-6 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm animate-in fade-in">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Globe size={18} className="text-emerald-600" />
                                <span>Connect Your Branded Custom Domain</span>
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">
                                Point your custom domain (e.g. <code className="font-mono text-emerald-600">shop.mybrand.com</code> or <code className="font-mono text-emerald-600">mybrand.com</code>) to your GumShop storefront for a 100% white-labeled shopping experience with free SSL.
                            </p>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                                Custom Domain Name
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    placeholder="shop.yourbrand.com or yourbrand.com"
                                    value={storeInfo.customDomain || ''}
                                    onChange={(e) => setStoreInfo({ ...storeInfo, customDomain: e.target.value })}
                                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500 focus:bg-white transition font-mono"
                                />
                                {storeInfo.customDomain && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-xs font-bold shrink-0">
                                        <CheckCircle2 size={14} className="text-emerald-600" />
                                        <span>Active</span>
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* DNS Instructions Card */}
                        <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                                    <Sparkles size={14} /> DNS Configuration Guide
                                </span>
                                <span className="text-[10px] font-mono text-slate-400">Automatic Free SSL</span>
                            </div>

                            <p className="text-xs text-slate-300 leading-relaxed">
                                Add the following record in your domain registrar (GoDaddy, Namecheap, Cloudflare, Google Domains):
                            </p>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs font-mono border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-800 text-slate-400">
                                            <th className="py-2 pr-4 font-normal">Type</th>
                                            <th className="py-2 pr-4 font-normal">Name / Host</th>
                                            <th className="py-2 pr-4 font-normal">Target / Value</th>
                                            <th className="py-2 font-normal">TTL</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/60 text-slate-200">
                                        <tr>
                                            <td className="py-2.5 pr-4 text-emerald-400 font-bold">CNAME</td>
                                            <td className="py-2.5 pr-4">shop (or @)</td>
                                            <td className="py-2.5 pr-4 text-emerald-300">cname.vercel-dns.com</td>
                                            <td className="py-2.5">Auto / 3600</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <p className="text-[11px] text-slate-400 pt-1">
                                DNS propagation usually takes 5 to 30 minutes. Once propagated, your custom domain will load your store with free automatic HTTPS.
                            </p>
                        </div>
                    </div>
                )}

                {/* 2. Brand Socials Tab */}
                {activeTab === 'socials' && (
                    <div className="space-y-6 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm animate-in fade-in">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Share2 size={18} className="text-emerald-600" />
                                <span>Brand Social Media Accounts</span>
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">
                                These accounts will be displayed as clickable verified badges on your storefront header, footer, and link-in-bio drawer to grow your followers alongside sales.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-2">Instagram Profile or Handle</label>
                                <input
                                    type="text"
                                    placeholder="@mybrand or https://instagram.com/mybrand"
                                    value={storeInfo.socials?.instagram || ''}
                                    onChange={(e) => setStoreInfo({
                                        ...storeInfo,
                                        socials: { ...storeInfo.socials, instagram: e.target.value }
                                    })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500 focus:bg-white transition"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-2">TikTok Profile or Handle</label>
                                <input
                                    type="text"
                                    placeholder="@mybrand or https://tiktok.com/@mybrand"
                                    value={storeInfo.socials?.tiktok || ''}
                                    onChange={(e) => setStoreInfo({
                                        ...storeInfo,
                                        socials: { ...storeInfo.socials, tiktok: e.target.value }
                                    })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500 focus:bg-white transition"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-2">YouTube Channel URL</label>
                                <input
                                    type="text"
                                    placeholder="https://youtube.com/@mybrand"
                                    value={storeInfo.socials?.youtube || ''}
                                    onChange={(e) => setStoreInfo({
                                        ...storeInfo,
                                        socials: { ...storeInfo.socials, youtube: e.target.value }
                                    })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500 focus:bg-white transition"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-2">X / Twitter Handle</label>
                                <input
                                    type="text"
                                    placeholder="@mybrand"
                                    value={storeInfo.socials?.twitter || ''}
                                    onChange={(e) => setStoreInfo({
                                        ...storeInfo,
                                        socials: { ...storeInfo.socials, twitter: e.target.value }
                                    })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500 focus:bg-white transition"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-2">Pinterest URL</label>
                                <input
                                    type="text"
                                    placeholder="https://pinterest.com/mybrand"
                                    value={storeInfo.socials?.pinterest || ''}
                                    onChange={(e) => setStoreInfo({
                                        ...storeInfo,
                                        socials: { ...storeInfo.socials, pinterest: e.target.value }
                                    })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500 focus:bg-white transition"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. Shipping Rules Tab */}
                {activeTab === 'shipping' && (
                    <div className="space-y-6 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm animate-in fade-in">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Truck size={18} className="text-emerald-600" />
                                <span>Shipping Rates & Delivery Options</span>
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">
                                Configure flat delivery charges automatically added to the dynamic Gumroad cart total.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-2">Standard Delivery ($)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={storeInfo.shipping?.standardFee ?? 4.99}
                                    onChange={(e) => setStoreInfo({
                                        ...storeInfo,
                                        shipping: { ...storeInfo.shipping, standardFee: parseFloat(e.target.value) || 0 }
                                    })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500 focus:bg-white transition"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-2">Express Delivery ($)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={storeInfo.shipping?.expressFee ?? 9.99}
                                    onChange={(e) => setStoreInfo({
                                        ...storeInfo,
                                        shipping: { ...storeInfo.shipping, expressFee: parseFloat(e.target.value) || 0 }
                                    })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500 focus:bg-white transition"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-2">Free Shipping Over ($)</label>
                                <input
                                    type="number"
                                    step="1.00"
                                    value={storeInfo.shipping?.freeShippingThreshold ?? 50.00}
                                    onChange={(e) => setStoreInfo({
                                        ...storeInfo,
                                        shipping: { ...storeInfo.shipping, freeShippingThreshold: parseFloat(e.target.value) || 0 }
                                    })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500 focus:bg-white transition"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* 4. Designer Palettes Tab */}
                {activeTab === 'palettes' && (
                    <div className="space-y-6 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm animate-in fade-in">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Palette size={18} className="text-emerald-600" />
                                <span>1-Click Brand Aesthetic Palettes</span>
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">
                                Instantly transform your buttons, badges, and storefront accents with 1 tap.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {palettes.map((palette) => (
                                <button
                                    type="button"
                                    key={palette.id}
                                    onClick={() => setStoreInfo({ ...storeInfo, themeColor: palette.id })}
                                    className={`p-4 rounded-2xl border text-left flex items-center gap-3 transition ${
                                        storeInfo.themeColor === palette.id
                                            ? 'border-emerald-600 bg-emerald-50/50 shadow-sm ring-2 ring-emerald-500/20'
                                            : 'border-slate-200 hover:border-slate-300'
                                    }`}
                                >
                                    <div className={`size-8 rounded-xl ${palette.bg} shadow-sm shrink-0`} />
                                    <div>
                                        <p className="font-bold text-xs text-slate-800">{palette.name}</p>
                                        <p className="text-[10px] text-slate-400 font-mono">{palette.id}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* 5. Ad Pixels & Analytics Tab */}
                {activeTab === 'tracking' && (
                    <div className="space-y-6 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm animate-in fade-in">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Target size={18} className="text-rose-500" />
                                <span>Ad Tracking Pixels & Analytics</span>
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">
                                Inject conversion tracking tags into your main storefront and mobile bio store to track ROAS, PageViews, AddToCart, and Purchases.
                            </p>
                        </div>

                        <div className="space-y-4 max-w-2xl">
                            {/* Meta Pixel */}
                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="size-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-black">f</div>
                                    <label className="text-xs font-bold text-slate-800">Meta (Facebook & Instagram) Pixel ID</label>
                                </div>
                                <input
                                    type="text"
                                    placeholder="e.g. 123456789012345"
                                    value={storeInfo.tracking?.metaPixelId || ''}
                                    onChange={(e) => setStoreInfo({
                                        ...storeInfo,
                                        tracking: { ...storeInfo.tracking, metaPixelId: e.target.value.trim() }
                                    })}
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono outline-none focus:border-blue-500 transition"
                                />
                                <p className="text-[11px] text-slate-500 mt-1">
                                    Automatically fires standard <code>PageView</code> and <code>InitiateCheckout</code> events.
                                </p>
                            </div>

                            {/* TikTok Pixel */}
                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="size-6 rounded-lg bg-black text-white flex items-center justify-center text-xs font-black">TT</div>
                                    <label className="text-xs font-bold text-slate-800">TikTok Pixel ID</label>
                                </div>
                                <input
                                    type="text"
                                    placeholder="e.g. C9ABCDEF123456"
                                    value={storeInfo.tracking?.tiktokPixelId || ''}
                                    onChange={(e) => setStoreInfo({
                                        ...storeInfo,
                                        tracking: { ...storeInfo.tracking, tiktokPixelId: e.target.value.trim() }
                                    })}
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono outline-none focus:border-black transition"
                                />
                                <p className="text-[11px] text-slate-500 mt-1">
                                    Optimizes TikTok Ad conversion campaigns for Link-in-Bio mobile traffic.
                                </p>
                            </div>

                            {/* Google Analytics 4 */}
                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="size-6 rounded-lg bg-amber-500 text-white flex items-center justify-center text-xs font-black">G</div>
                                    <label className="text-xs font-bold text-slate-800">Google Analytics 4 (GA4) Measurement ID</label>
                                </div>
                                <input
                                    type="text"
                                    placeholder="e.g. G-ABC123XYZ"
                                    value={storeInfo.tracking?.googleAnalyticsId || ''}
                                    onChange={(e) => setStoreInfo({
                                        ...storeInfo,
                                        tracking: { ...storeInfo.tracking, googleAnalyticsId: e.target.value.trim() }
                                    })}
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono outline-none focus:border-amber-500 transition"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Save Submit Button */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
                    <div className="text-xs text-slate-500 flex items-center gap-2">
                        {autoSaveStatus === 'saving' && (
                            <span className="flex items-center gap-1.5 text-amber-600 font-medium">
                                <RefreshCw size={12} className="animate-spin" />
                                <span>Auto-saving background updates...</span>
                            </span>
                        )}
                        {autoSaveStatus === 'saved' && (
                            <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
                                <CheckCircle2 size={13} />
                                <span>All changes automatically saved to cloud & device.</span>
                            </span>
                        )}
                        {autoSaveStatus === 'idle' && (
                            <span>Edits are automatically saved as you type.</span>
                        )}
                    </div>
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="inline-flex items-center gap-2 px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-sm rounded-2xl shadow-lg shadow-emerald-600/30 transition disabled:opacity-50"
                    >
                        <Save size={18} />
                        <span>{isSaving ? "Saving Settings..." : "Save Store Settings"}</span>
                    </button>
                </div>

            </form>
        </div>
    );
}
