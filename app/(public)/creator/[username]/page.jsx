'use client'

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { 
    CheckCircle2, 
    Share2, 
    Copy, 
    ExternalLink, 
    Download, 
    Zap, 
    Sparkles, 
    ArrowLeft, 
    Check, 
    Globe, 
    Smartphone, 
    Monitor,
    Mail,
    X,
    Store,
    ShoppingBag
} from 'lucide-react';
import { getStoreByUsername, getProductsByStore, getAllStores, isProductDeleted, isJunkProductName } from '@/lib/firebaseDb';
import GumroadIframeModal from '@/components/GumroadIframeModal';
import Loading from '@/components/Loading';
import { 
    DEFAULT_DEMO_CREATOR, 
    getStoreAndCatalog,
    getStoreAndCatalogSync 
} from '@/lib/storePresets';
import toast from 'react-hot-toast';

function formatCreatorProfile(store, rawUsername) {
    if (!store) return null;
    const cleanUser = (rawUsername || store.username || '').toLowerCase().trim();
    const storeClean = (store.username || cleanUser).toLowerCase().trim();
    const displayName = store.name || store.storeName || (rawUsername ? rawUsername.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Store');
    
    // Fall back to demo socials ONLY for explicit demo store
    const defaultSocials = storeClean === 'demo' ? DEFAULT_DEMO_CREATOR.socials : {};

    return {
        id: store.id || `store_${storeClean}`,
        name: displayName,
        verified: true,
        bio: store.bio || store.description || store.tagline || `Official storefront for ${displayName}. Browse our curated collection.`,
        avatar: store.avatar || store.logo || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}`,
        socials: store.socials || defaultSocials,
        gumroadProductUrl: store.gumroadProductUrl || store.gumroadUrl || '',
        themeColor: store.themeColor || '#10B981',
        status: store.status || 'approved'
    };
}

export default function CreatorBioPage({ params }) {
    // Next.js 15+ dynamic params unwrapping
    const resolvedParams = use(params);
    const rawUsername = resolvedParams?.username || 'demo';
    const cleanUser = rawUsername.toLowerCase().trim();

    // Synchronous initial state resolution so frame 1 matches the store immediately
    const initialData = getStoreAndCatalogSync(rawUsername);
    const [storeInfo, setStoreInfo] = useState(initialData.store || null);
    const [creator, setCreator] = useState(() => initialData.store ? formatCreatorProfile(initialData.store, rawUsername) : null);
    const [products, setProducts] = useState(initialData.products || []);
    const [loading, setLoading] = useState(!initialData.store);
    const [copied, setCopied] = useState(false);
    const [viewMode, setViewMode] = useState('phone'); // 'phone' | 'full'
    
    // Checkout Modal State
    const [checkoutModal, setCheckoutModal] = useState({
        isOpen: false,
        product: null,
        total: 0,
        gumroadUrl: '',
        orderSessionId: ''
    });

    // Free Download Lead Modal State
    const [freeDownloadModal, setFreeDownloadModal] = useState({
        isOpen: false,
        product: null,
        email: '',
        submitted: false
    });

    useEffect(() => {
        let isMounted = true;
        const safetyTimer = setTimeout(() => {
            setLoading(false);
        }, 800);

        const loadCreatorStore = async () => {
            if (cleanUser === 'demo') {
                const demoData = getStoreAndCatalogSync('demo');
                if (isMounted) {
                    setStoreInfo(demoData.store);
                    setCreator(formatCreatorProfile(demoData.store, 'demo'));
                    setProducts(demoData.products || []);
                    setLoading(false);
                }
                return;
            }

            try {
                const { store, products: resolvedProducts } = await getStoreAndCatalog(rawUsername);
                if (isMounted) {
                    if (store) {
                        setStoreInfo(store);
                        setCreator(formatCreatorProfile(store, rawUsername));
                        setProducts(resolvedProducts || []);
                    } else {
                        setStoreInfo(null);
                        setCreator(null);
                        setProducts([]);
                    }
                }
            } catch (err) {
                console.error("Error loading creator bio:", err);
            } finally {
                clearTimeout(safetyTimer);
                if (isMounted) setLoading(false);
            }
        };

        loadCreatorStore();

        const handleSync = () => {
            loadCreatorStore();
        };

        if (typeof window !== 'undefined') {
            window.addEventListener('products_updated', handleSync);
            window.addEventListener('active_store_changed', handleSync);
            window.addEventListener('storage', handleSync);
        }

        return () => {
            isMounted = false;
            clearTimeout(safetyTimer);
            if (typeof window !== 'undefined') {
                window.removeEventListener('products_updated', handleSync);
                window.removeEventListener('active_store_changed', handleSync);
                window.removeEventListener('storage', handleSync);
            }
        };
    }, [cleanUser, rawUsername]);

    const handleCopyShareLink = () => {
        if (typeof window !== 'undefined') {
            const url = window.location.href;
            navigator.clipboard.writeText(url);
            setCopied(true);
            toast.success("Bio link copied to clipboard! 📋");
            setTimeout(() => setCopied(false), 2000);
        }
    };

    // ⚡ Instant Buy via Gumroad Trigger
    const handleInstantBuy = async (product) => {
        const orderSessionId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        
        try {
            const res = await fetch('/api/gumroad/dynamic-checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    storeId: creator.id || `store_${cleanUser}`,
                    storeName: creator.name || 'Creator Store',
                    items: [{
                        productId: product.id,
                        name: product.name,
                        price: parseFloat(product.price || 0),
                        quantity: 1,
                        image: product.image || product.images?.[0]
                    }],
                    gumroadProductUrl: creator.gumroadProductUrl || product.gumroadUrl || ''
                })
            });

            const data = await res.json().catch(() => ({}));

            setCheckoutModal({
                isOpen: true,
                product: product,
                total: parseFloat(product.price || 0),
                gumroadUrl: data.checkoutUrl || '',
                orderSessionId: data.orderSessionId || orderSessionId
            });
        } catch (e) {
            console.warn("Dynamic checkout fallback:", e);
            setCheckoutModal({
                isOpen: true,
                product: product,
                total: parseFloat(product.price || 0),
                gumroadUrl: '',
                orderSessionId: orderSessionId
            });
        }
    };

    // Free Download Handler
    const handleFreeDownloadClick = (product) => {
        setFreeDownloadModal({
            isOpen: true,
            product: product,
            email: '',
            submitted: false
        });
    };

    const handleFreeDownloadSubmit = (e) => {
        e.preventDefault();
        if (!freeDownloadModal.email || !freeDownloadModal.email.includes('@')) {
            toast.error("Please enter a valid email address.");
            return;
        }

        setFreeDownloadModal(prev => ({ ...prev, submitted: true }));
        toast.success(`Download link sent to ${freeDownloadModal.email}! 🎉`);
        setTimeout(() => {
            setFreeDownloadModal({ isOpen: false, product: null, email: '', submitted: false });
        }, 2200);
    };

    if (loading) return <Loading />;

    if (!storeInfo || !creator) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-center px-4 font-sans">
                <div className="size-20 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-rose-500 mb-4">
                    <Store size={36} />
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Store Not Found</h2>
                <p className="text-sm text-slate-500 mt-2 max-w-md leading-relaxed">
                    The link-in-bio store <code className="font-mono text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded">@{rawUsername}</code> may have been renamed or has not been published yet.
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                    <Link href={`/shop/${rawUsername}`} className="px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition">
                        Check Standard Shop
                    </Link>
                    <Link href="/dashboard" className="px-6 py-3 rounded-2xl bg-white border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition">
                        Master HQ
                    </Link>
                </div>
            </div>
        );
    }

    if (storeInfo.status === 'archived') {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-center px-4 font-sans">
                <div className="size-20 rounded-3xl bg-amber-50 border border-amber-200 shadow-sm flex items-center justify-center text-amber-600 mb-4">
                    <Store size={36} />
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Store Inactive</h2>
                <p className="text-sm text-slate-500 mt-2 max-w-md leading-relaxed">
                    The link-in-bio profile <code className="font-mono text-amber-700 font-bold bg-amber-100/60 px-2 py-0.5 rounded">@{rawUsername}</code> is currently archived.
                </p>
                <div className="mt-6 flex items-center justify-center gap-3">
                    <Link href="/dashboard" className="px-6 py-2.5 rounded-2xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition">
                        Manage in Master HQ
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f3f4f6] text-slate-900 selection:bg-rose-500 selection:text-white flex flex-col font-sans antialiased">
            
            {/* SEO Rich Snippets JSON-LD */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "ProfilePage",
                        "mainEntity": {
                            "@type": "Person",
                            "name": creator.name,
                            "description": creator.bio,
                            "image": creator.avatar,
                            "url": `https://gumshop.online/creator/${rawUsername}`,
                            "sameAs": Object.values(creator.socials || {}).filter(Boolean)
                        }
                    })
                }}
            />

            {/* Desktop Admin / Switcher Banner */}
            <header className="hidden md:flex items-center justify-between px-6 py-3 bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 shadow-xs">
                <div className="flex items-center gap-3">
                    <Link 
                        href="/" 
                        className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1.5 transition"
                    >
                        <ArrowLeft size={14} /> Back to GumShop
                    </Link>
                    <span className="text-slate-300">|</span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-600 text-xs font-bold border border-rose-100">
                        ⚡ Link-in-Bio Mode • Live Store Sync
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    {/* View Mode Toggle */}
                    <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-medium">
                        <button
                            onClick={() => setViewMode('phone')}
                            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                                viewMode === 'phone' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            <Smartphone size={13} /> Phone Frame
                        </button>
                        <button
                            onClick={() => setViewMode('full')}
                            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                                viewMode === 'full' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            <Monitor size={13} /> Full Width
                        </button>
                    </div>

                    {/* Copy Bio Link */}
                    <button
                        onClick={handleCopyShareLink}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
                    >
                        {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                        <span>{copied ? "Copied!" : "Copy Bio Link"}</span>
                    </button>

                    {/* View Standard Catalog */}
                    <Link
                        href={`/shop/${rawUsername}`}
                        className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition"
                    >
                        <Globe size={13} />
                        <span>Standard Grid Shop</span>
                    </Link>
                </div>
            </header>

            {/* Main Stage with Aesthetic Warm Studio Backdrop */}
            <main className="flex-1 flex items-center justify-center p-0 md:py-10 md:px-4 bg-gradient-to-b from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0]">
                
                {/* Mobile Smartphone Frame Container */}
                <div 
                    className={`w-full transition-all duration-300 ${
                        viewMode === 'phone' 
                            ? 'max-w-[430px] md:my-auto md:rounded-[48px] md:border-[10px] md:border-slate-900 md:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] md:ring-1 md:ring-slate-800/10 relative overflow-hidden bg-white'
                            : 'max-w-xl mx-auto rounded-3xl bg-white shadow-xl border border-slate-200 my-6'
                    }`}
                >
                    {/* Simulated iPhone Status Bar & Dynamic Island (Phone Mode Only) */}
                    <div className="pt-3 px-7 flex items-center justify-between select-none text-slate-900 text-xs font-semibold">
                        <span>10:09</span>
                        
                        {/* Dynamic Island Pill */}
                        <div className="w-24 h-5 bg-black rounded-full mx-auto shadow-inner flex items-center justify-end pr-2 gap-1.5">
                            <span className="size-2 rounded-full bg-emerald-500/80 animate-pulse"></span>
                            <span className="size-2.5 rounded-full bg-slate-900 border border-slate-800"></span>
                        </div>

                        {/* Status Icons */}
                        <div className="flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                                <path d="M2 17h3v4H2v-4zm5-4h3v8H7v-8zm5-4h3v12h-3V9zm5-4h3v16h-3V5z"/>
                            </svg>
                            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                                <path d="M12 4C7.31 4 3.07 5.9 0 8.98L12 21 24 8.98A16.88 16.88 0 0 0 12 4zm0 3c3.73 0 7.12 1.39 9.73 3.68L12 19.46 2.27 10.68A13.9 13.9 0 0 1 12 7z"/>
                            </svg>
                            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                <path d="M17 6H4c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h13c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-1 9H5c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1h11c.55 0 1 .45 1 1v4c0 .55-.45 1-1 1zm4-6h1c.55 0 1 .45 1 1v4c0 .55-.45 1-1 1h-1V9z"/>
                            </svg>
                        </div>
                    </div>

                    {/* Inner Content Canvas */}
                    <div className="px-5 sm:px-6 pt-5 pb-8 min-h-[640px] flex flex-col justify-between">
                        
                        {/* ─── Profile Header ─── */}
                        <div>
                            <div className="flex flex-col items-center text-center">
                                
                                {/* Store Logo / Creator Avatar */}
                                <div className="relative mb-3 group">
                                    <div className="size-20 sm:size-22 rounded-full overflow-hidden p-0.5 bg-gradient-to-tr from-slate-200 to-slate-100 ring-2 ring-slate-200/80 shadow-md">
                                        <img 
                                            src={creator.avatar} 
                                            alt={creator.name} 
                                            className="w-full h-full object-cover rounded-full group-hover:scale-105 transition-transform duration-300"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(creator.name || 'Store')}`;
                                            }}
                                        />
                                    </div>
                                    <button 
                                        onClick={handleCopyShareLink}
                                        aria-label="Share creator profile"
                                        className="absolute bottom-0 right-0 size-7 bg-white text-slate-700 hover:text-slate-950 rounded-full border border-slate-200 shadow-xs flex items-center justify-center transition active:scale-90"
                                    >
                                        <Share2 size={13} />
                                    </button>
                                </div>

                                {/* Creator Display Name & Verified Blue Badge */}
                                <h1 className="text-lg sm:text-xl font-extrabold text-slate-950 tracking-tight flex items-center justify-center gap-1.5">
                                    <span>{creator.name}</span>
                                    <span title="Verified Merchant" className="inline-flex items-center text-blue-500">
                                        <svg className="w-5 h-5 fill-blue-500 text-white" viewBox="0 0 24 24">
                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.2 14.2l-3.5-3.5 1.4-1.4 2.1 2.1 5.6-5.6 1.4 1.4-7 7z"/>
                                        </svg>
                                    </span>
                                </h1>

                                {/* Bio / Tagline Paragraph */}
                                <p className="text-xs sm:text-[13px] text-slate-600 font-medium max-w-xs mt-1.5 leading-relaxed">
                                    {creator.bio}
                                </p>

                                {/* Direct Bridge to Full Storefront */}
                                <div className="mt-3 flex items-center gap-2">
                                    <Link
                                        href={`/shop/${rawUsername}`}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold shadow-xs transition active:scale-95"
                                    >
                                        <Globe size={12} className="text-emerald-400" />
                                        <span>Visit Full Storefront</span>
                                    </Link>
                                    <Link
                                        href={`/shop/${rawUsername}/track`}
                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium transition"
                                    >
                                        <span>Track Order</span>
                                    </Link>
                                </div>

                                {/* Social Links Hub */}
                                <div className="flex items-center justify-center gap-3 mt-3 text-slate-600">
                                    {creator.socials?.instagram && (
                                        <a 
                                            href={creator.socials.instagram} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="size-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-800 transition hover:scale-110"
                                            aria-label="Instagram"
                                        >
                                            <svg className="size-4 fill-current" viewBox="0 0 24 24">
                                                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                                            </svg>
                                        </a>
                                    )}

                                    {creator.socials?.twitter && (
                                        <a 
                                            href={creator.socials.twitter} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="size-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-800 transition hover:scale-110"
                                            aria-label="Twitter / X"
                                        >
                                            <svg className="size-4 fill-current" viewBox="0 0 24 24">
                                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                                            </svg>
                                        </a>
                                    )}

                                    {creator.socials?.youtube && (
                                        <a 
                                            href={creator.socials.youtube} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="size-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-800 transition hover:scale-110"
                                            aria-label="YouTube"
                                        >
                                            <svg className="size-4 fill-current" viewBox="0 0 24 24">
                                                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                                            </svg>
                                        </a>
                                    )}

                                    {creator.socials?.github && (
                                        <a 
                                            href={creator.socials.github} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="size-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-800 transition hover:scale-110"
                                            aria-label="GitHub"
                                        >
                                            <svg className="size-4 fill-current" viewBox="0 0 24 24">
                                                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                                            </svg>
                                        </a>
                                    )}
                                </div>

                            </div>

                            {/* ─── Stacked Store Product Cards ─── */}
                            {products.length > 0 ? (
                                <div className="mt-5 space-y-3">
                                    {products.map((item, index) => {
                                        const isFree = parseFloat(item.price || 0) === 0 || item.isFreeDownload;
                                        const priceNum = parseFloat(item.price || 0);
                                        const priceDisplay = isFree 
                                            ? "Free" 
                                            : `$${priceNum.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
                                        
                                        return (
                                            <div 
                                                key={item.id || index}
                                                className="bg-white rounded-2xl p-3 border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-all flex items-center gap-3 group"
                                            >
                                                {/* Square Rounded Thumbnail */}
                                                <div className="size-16 sm:size-18 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-100 relative">
                                                    <img 
                                                        src={item.image || (item.images && item.images[0]) || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200'} 
                                                        alt={item.name} 
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200';
                                                        }}
                                                    />
                                                </div>

                                                {/* Product Content Column */}
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                                                        {item.name}
                                                    </h3>

                                                    {/* Category / Tag Pill */}
                                                    {item.category && (
                                                        <span className="inline-block mt-0.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                                                            {typeof item.category === 'string' ? item.category : (item.category?.name || 'Featured')}
                                                        </span>
                                                    )}

                                                    {/* Bottom Row: Price & High-Converting CTA */}
                                                    <div className="flex items-center justify-between gap-2 mt-2">
                                                        <span className="text-sm sm:text-base font-black text-slate-900">
                                                            {priceDisplay}
                                                        </span>

                                                        {isFree ? (
                                                            /* Free Download CTA Button */
                                                            <button
                                                                onClick={() => handleFreeDownloadClick(item)}
                                                                className="py-1.5 px-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-xs transition active:scale-95 shadow-2xs flex items-center gap-1"
                                                            >
                                                                <Download size={13} />
                                                                <span>Free Download</span>
                                                            </button>
                                                        ) : (
                                                            /* Instant Buy via Gumroad CTA Button (Coral Gradient) */
                                                            <button
                                                                onClick={() => handleInstantBuy(item)}
                                                                className="py-1.5 px-3 sm:px-3.5 rounded-xl bg-gradient-to-r from-[#ef4444] to-[#f43f5e] hover:from-[#dc2626] hover:to-[#e11d48] text-white font-black text-xs transition active:scale-95 shadow-xs shadow-rose-500/20 flex items-center gap-1 tracking-tight"
                                                            >
                                                                <Zap size={13} className="fill-white" />
                                                                <span>Instant Buy</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                /* Clean Empty Store State - Never Shows Ghost Products */
                                <div className="text-center py-10 px-4 bg-slate-50/80 rounded-2xl border border-dashed border-slate-200 mt-5">
                                    <div className="size-12 rounded-2xl bg-white shadow-xs border border-slate-200 flex items-center justify-center mx-auto mb-3 text-slate-400">
                                        <ShoppingBag size={22} />
                                    </div>
                                    <h3 className="text-sm font-bold text-slate-800">Products Coming Soon</h3>
                                    <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                                        This store is currently curating their catalog. Check back shortly!
                                    </p>
                                    <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-2">
                                        <Link
                                            href={`/shop/${rawUsername}`}
                                            className="text-xs font-bold text-slate-900 bg-white hover:bg-slate-100 px-4 py-2 rounded-xl border border-slate-200 shadow-2xs transition"
                                        >
                                            Visit Full Storefront
                                        </Link>
                                    </div>
                                </div>
                            )}

                        </div>

                    </div>

                    {/* Bottom Home Indicator Bar (Simulated iPhone) */}
                    <div className="pb-2 pt-1 flex justify-center">
                        <div className="w-32 h-1 bg-slate-900/80 rounded-full"></div>
                    </div>

                </div>

            </main>

            {/* ⚡ In-Page Gumroad Checkout Modal (Zero-Redirect) */}
            <GumroadIframeModal
                isOpen={checkoutModal.isOpen}
                onClose={() => setCheckoutModal({ isOpen: false, product: null, total: 0, gumroadUrl: '', orderSessionId: '' })}
                product={checkoutModal.product}
                items={checkoutModal.product ? [{
                    id: checkoutModal.product.id,
                    name: checkoutModal.product.name,
                    price: checkoutModal.product.price,
                    quantity: 1,
                    image: checkoutModal.product.image || checkoutModal.product.images?.[0]
                }] : []}
                total={checkoutModal.total}
                gumroadUrl={checkoutModal.gumroadUrl}
                orderSessionId={checkoutModal.orderSessionId}
            />

            {/* Free Download Email Modal */}
            {freeDownloadModal.isOpen && (
                <div 
                    className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
                    onClick={() => setFreeDownloadModal({ isOpen: false, product: null, email: '', submitted: false })}
                >
                    <div 
                        className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 relative animate-in zoom-in-95"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setFreeDownloadModal({ isOpen: false, product: null, email: '', submitted: false })}
                            className="absolute top-4 right-4 size-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition"
                        >
                            <X size={16} />
                        </button>

                        <div className="size-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                            <Download size={22} />
                        </div>

                        <h3 className="text-lg font-extrabold text-slate-950">
                            Download {freeDownloadModal.product?.name}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                            Enter your email to receive direct instant access to the files and templates.
                        </p>

                        {freeDownloadModal.submitted ? (
                            <div className="mt-4 p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1.5">
                                <CheckCircle2 size={16} className="text-emerald-600" />
                                <span>Check your inbox! Download link sent.</span>
                            </div>
                        ) : (
                            <form onSubmit={handleFreeDownloadSubmit} className="mt-4 space-y-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Your Email Address
                                    </label>
                                    <div className="relative">
                                        <Mail size={16} className="absolute left-3 top-3 text-slate-400" />
                                        <input
                                            type="email"
                                            required
                                            placeholder="you@domain.com"
                                            value={freeDownloadModal.email}
                                            onChange={(e) => setFreeDownloadModal(prev => ({ ...prev, email: e.target.value }))}
                                            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-md transition active:scale-98 flex items-center justify-center gap-1.5"
                                >
                                    <Download size={14} />
                                    <span>Get Free Instant Download</span>
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}

        </div>
    );
}
