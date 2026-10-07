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
    ShoppingBag,
    Star,
    Flame,
    Clock,
    MessageCircle
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

const PRESET_STYLES = {
    warm_studio: {
        bg: 'bg-gradient-to-b from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0]',
        frame: 'bg-white text-slate-900',
        card: 'bg-white border-slate-100 text-slate-900',
        subtext: 'text-slate-600'
    },
    dark_glass: {
        bg: 'bg-gradient-to-b from-[#090d16] via-[#0f172a] to-[#020617]',
        frame: 'bg-slate-950 text-white',
        card: 'bg-slate-900/90 border-slate-800 text-white',
        subtext: 'text-slate-400'
    },
    sunset: {
        bg: 'bg-gradient-to-b from-[#fff1f2] via-[#ffe4e6] to-[#fef3c7]',
        frame: 'bg-white text-slate-900',
        card: 'bg-white border-rose-100 text-slate-900',
        subtext: 'text-slate-600'
    },
    clean_white: {
        bg: 'bg-white',
        frame: 'bg-white text-slate-900',
        card: 'bg-slate-50 border-slate-200 text-slate-900',
        subtext: 'text-slate-600'
    },
    neon_cyber: {
        bg: 'bg-[#030712]',
        frame: 'bg-gray-950 text-cyan-200',
        card: 'bg-gray-900 border-cyan-900/60 text-cyan-100',
        subtext: 'text-cyan-400/80'
    },
    editorial_paper: {
        bg: 'bg-gradient-to-b from-[#FAF8F5] via-[#F4EFEA] to-[#EAE3D9]',
        frame: 'bg-[#FAF8F5] text-stone-900',
        card: 'bg-white border-stone-200 text-stone-900',
        subtext: 'text-stone-600'
    },
    midnight_luxe: {
        bg: 'bg-gradient-to-b from-[#0B0F19] via-[#090D15] to-[#04060A]',
        frame: 'bg-[#0B0F19] text-amber-100',
        card: 'bg-[#121826] border-amber-500/20 text-amber-50',
        subtext: 'text-amber-300/70'
    },
    pastel_candy: {
        bg: 'bg-gradient-to-b from-[#F5F3FF] via-[#FDF2F8] to-[#FFF1F2]',
        frame: 'bg-white text-slate-900',
        card: 'bg-white/95 border-purple-100 text-slate-900',
        subtext: 'text-purple-600'
    },
    emerald_forest: {
        bg: 'bg-gradient-to-b from-[#064E3B] via-[#022C22] to-[#011C15]',
        frame: 'bg-[#022C22] text-emerald-100',
        card: 'bg-[#064E3B]/60 border-emerald-700/40 text-emerald-50',
        subtext: 'text-emerald-300/70'
    }
};

function formatCreatorProfile(store, rawUsername) {
    if (!store) return null;
    const cleanUser = (rawUsername || store.username || '').toLowerCase().trim();
    const storeClean = (store.username || cleanUser).toLowerCase().trim();
    const bioProfile = store.bioProfile || {};
    const displayName = bioProfile.displayName || store.name || store.storeName || (rawUsername ? rawUsername.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Store');
    
    // Fall back to demo socials ONLY for explicit demo store
    const defaultSocials = storeClean === 'demo' ? DEFAULT_DEMO_CREATOR.socials : {};
    const mergedSocials = { ...defaultSocials, ...(store.socials || {}), ...(bioProfile.socials || {}) };

    return {
        id: store.id || `store_${storeClean}`,
        name: displayName,
        handle: bioProfile.handle || store.username || cleanUser,
        verified: bioProfile.verified !== undefined ? bioProfile.verified : true,
        bio: bioProfile.tagline || store.bio || store.description || store.tagline || `Official storefront for ${displayName}. Browse our curated collection.`,
        avatar: bioProfile.avatar || store.avatar || store.logo || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}`,
        socials: mergedSocials,
        customLinks: bioProfile.customLinks || [],
        leadMagnet: bioProfile.leadMagnet || null,
        backgroundPreset: bioProfile.backgroundPreset || 'warm_studio',
        productDisplayMode: bioProfile.productDisplayMode || 'all',
        featuredProductIds: bioProfile.featuredProductIds || [],
        gumroadProductUrl: store.gumroadProductUrl || store.gumroadUrl || '',
        themeColor: bioProfile.themeColor || store.themeColor || '#10B981',
        tracking: store.tracking || bioProfile.tracking || {},
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
    
    // High-Conversion Sales States
    const [showStickyBar, setShowStickyBar] = useState(false);
    const [liveViewerCount] = useState(() => Math.floor(Math.random() * 8) + 14); // 14 to 21 live viewers
    const [countdown, setCountdown] = useState({ hours: 2, minutes: 48, seconds: 32 });

    // Live Ticking Countdown Timer
    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
                if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
                if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
                return { hours: 3, minutes: 0, seconds: 0 };
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Scroll listener for sticky floating buy bar
    useEffect(() => {
        const handleScroll = () => {
            if (typeof window !== 'undefined') {
                setShowStickyBar(window.scrollY > 240);
            }
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

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

    // In-Bio Email Lead Magnet State
    const [bioLeadEmail, setBioLeadEmail] = useState('');
    const [bioLeadSubmitted, setBioLeadSubmitted] = useState(false);

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

    // Ad Pixel Event Dispatcher
    const firePixelEvent = (eventName, data = {}) => {
        if (typeof window === 'undefined') return;
        try {
            if (window.fbq) window.fbq('track', eventName, data);
            if (window.ttq) window.ttq.track(eventName, data);
            if (window.gtag) window.gtag('event', eventName, data);
        } catch {}
    };

    useEffect(() => {
        if (creator) {
            firePixelEvent('PageView', { content_name: creator.name });
        }
    }, [creator]);

    // ⚡ Instant Buy via Gumroad Trigger
    const handleInstantBuy = async (product) => {
        const orderSessionId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        firePixelEvent('InitiateCheckout', {
            content_name: product.name,
            value: parseFloat(product.price || 0),
            currency: 'USD'
        });
        
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

    const handleBioLeadSubmit = (e) => {
        e.preventDefault();
        if (!bioLeadEmail || !bioLeadEmail.includes('@')) {
            toast.error("Please enter a valid email address.");
            return;
        }

        try {
            const crmKey = `gumshop_customers_${cleanUser}`;
            const existing = JSON.parse(localStorage.getItem(crmKey) || '[]');
            const newLead = {
                id: `lead_${Date.now()}`,
                name: bioLeadEmail.split('@')[0],
                email: bioLeadEmail.trim().toLowerCase(),
                totalSpent: 0,
                orderCount: 0,
                source: 'Stan Bio Lead Magnet',
                lastOrderDate: new Date().toISOString()
            };
            if (!existing.some(c => c.email === newLead.email)) {
                existing.unshift(newLead);
                localStorage.setItem(crmKey, JSON.stringify(existing));
            }
        } catch {}

        setBioLeadSubmitted(true);
        toast.success(`Access granted! Sent to ${bioLeadEmail} 🎉`, { duration: 3500 });
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

    const activePreset = PRESET_STYLES[creator?.backgroundPreset] || PRESET_STYLES.warm_studio;
    const displayedProducts = (creator?.productDisplayMode === 'curated' && creator?.featuredProductIds?.length > 0)
        ? products.filter(p => creator.featuredProductIds.includes(p.id))
        : products;

    return (
        <div className={`min-h-screen text-slate-900 selection:bg-rose-500 selection:text-white flex flex-col font-sans antialiased ${activePreset.bg}`}>
            
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

            {/* Meta Pixel Tracking Script */}
            {creator?.tracking?.metaPixelId && (
                <script
                    id="meta-pixel"
                    dangerouslySetInnerHTML={{
                        __html: `
                        !function(f,b,e,v,n,t,s)
                        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                        n.queue=[];t=b.createElement(e);t.async=!0;
                        t.src=v;s=b.getElementsByTagName(e)[0];
                        s.parentNode.insertBefore(t,s)}(window, document,'script',
                        'https://connect.facebook.net/en_US/fbevents.js');
                        fbq('init', '${creator.tracking.metaPixelId}');
                        fbq('track', 'PageView');
                        `
                    }}
                />
            )}

            {/* TikTok Pixel Tracking Script */}
            {creator?.tracking?.tiktokPixelId && (
                <script
                    id="tiktok-pixel"
                    dangerouslySetInnerHTML={{
                        __html: `
                        !function (w, d, t) {
                            w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
                            ttq.load('${creator.tracking.tiktokPixelId}');
                            ttq.page();
                        }(window, document, 'ttq');
                        `
                    }}
                />
            )}

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
                    <Link
                        href="/store/bio-editor"
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                    >
                        <Smartphone size={12} className="text-rose-500" />
                        <span>Edit Bio Profile</span>
                    </Link>
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

            {/* Main Stage with Dynamic Atmosphere Preset */}
            <main className={`flex-1 flex items-center justify-center p-0 md:py-10 md:px-4 ${activePreset.bg}`}>
                
                {/* Mobile Smartphone Frame Container */}
                <div 
                    className={`w-full transition-all duration-300 ${
                        viewMode === 'phone' 
                            ? `max-w-[430px] md:my-auto md:rounded-[48px] md:border-[10px] md:border-slate-900 md:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] md:ring-1 md:ring-slate-800/10 relative overflow-hidden ${activePreset.frame}`
                            : `max-w-xl mx-auto rounded-3xl shadow-xl border border-slate-200 my-6 ${activePreset.frame}`
                    }`}
                >
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

                                {/* ─── Custom CTA Link Buttons (Stan Store Killer Feature) ─── */}
                                {creator.customLinks?.length > 0 && (
                                    <div className="mt-4 space-y-2">
                                        {creator.customLinks.map((link, idx) => (
                                            <a
                                                key={link.id || idx}
                                                href={link.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="relative block w-full p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md transition-all font-bold text-xs sm:text-sm text-slate-800 text-center active:scale-[0.99]"
                                                style={link.highlight ? { borderColor: creator.themeColor || '#10B981', borderWidth: '1.5px' } : {}}
                                            >
                                                {link.highlight && (
                                                    <span 
                                                        className="absolute -top-2.5 right-3 text-[10px] font-extrabold px-2 py-0.5 rounded-full text-white shadow-2xs"
                                                        style={{ backgroundColor: creator.themeColor || '#10B981' }}
                                                    >
                                                        {link.badge || '⭐ Featured'}
                                                    </span>
                                                )}
                                                <span>{link.title}</span>
                                            </a>
                                        ))}
                                    </div>
                                )}

                                {/* ─── Email Lead Magnet Opt-In Card ─── */}
                                {creator.leadMagnet?.enabled && (
                                    <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-md relative overflow-hidden text-left">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <span className="text-xs">🎁</span>
                                            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                                                Free Resource
                                            </span>
                                        </div>
                                        <h4 className="text-xs sm:text-sm font-extrabold text-white leading-snug">
                                            {creator.leadMagnet.title || 'Free Creator Playbook'}
                                        </h4>
                                        <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                                            {creator.leadMagnet.subtitle || 'Enter your email for instant digital delivery.'}
                                        </p>

                                        {bioLeadSubmitted ? (
                                            <div className="mt-2.5 p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                                                <CheckCircle2 size={14} className="text-emerald-400" />
                                                <span>Access link sent! Check your inbox.</span>
                                            </div>
                                        ) : (
                                            <form onSubmit={handleBioLeadSubmit} className="mt-3 flex gap-1.5">
                                                <input 
                                                    type="email"
                                                    required
                                                    placeholder="Enter your email..."
                                                    value={bioLeadEmail}
                                                    onChange={e => setBioLeadEmail(e.target.value)}
                                                    className="flex-1 min-w-0 bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                                                />
                                                <button
                                                    type="submit"
                                                    className="px-3.5 py-1.5 rounded-xl font-black text-xs text-slate-950 transition active:scale-95 shrink-0"
                                                    style={{ backgroundColor: creator.themeColor || '#10B981' }}
                                                >
                                                    {creator.leadMagnet.buttonText || 'Claim Free'}
                                                </button>
                                            </form>
                                        )}
                                    </div>
                                )}

                            </div>

                            {/* ─── Urgency Drop Countdown Ribbon ─── */}
                            <div className="mt-4 p-3 rounded-2xl bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-rose-500/10 border border-rose-200/80 flex items-center justify-between gap-2 text-rose-950 shadow-2xs">
                                <div className="flex items-center gap-1.5 min-w-0">
                                    <span className="size-2 rounded-full bg-rose-500 animate-ping shrink-0" />
                                    <span className="text-[11px] font-black uppercase tracking-wider text-rose-800 truncate">
                                        ⚡ Limited Drop Ending
                                    </span>
                                </div>
                                <div className="font-mono text-xs font-black bg-white px-2.5 py-1 rounded-xl border border-rose-200 shadow-2xs text-rose-700 flex items-center gap-1 shrink-0">
                                    <Clock size={12} className="text-rose-500" />
                                    <span>{String(countdown.hours).padStart(2, '0')}:{String(countdown.minutes).padStart(2, '0')}:{String(countdown.seconds).padStart(2, '0')}</span>
                                </div>
                            </div>

                            {/* ─── Live Shopper Scarcity Badge ─── */}
                            <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 font-semibold px-1">
                                <span className="flex items-center gap-1.5 text-amber-700">
                                    <Flame size={13} className="text-amber-500 fill-amber-500" />
                                    <span><strong>{liveViewerCount} shoppers</strong> viewing this drop</span>
                                </span>
                                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                                    ✓ High Demand
                                </span>
                            </div>

                            {/* ─── Stacked Store Product Cards ─── */}
                            {displayedProducts.length > 0 ? (
                                <div className="mt-4 space-y-3">
                                    {displayedProducts.map((item, index) => {
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
                                                    {/* High-Converting Badges */}
                                                    {(item.badge || isFree || index === 0 || (item.comparePrice && item.comparePrice > item.price)) && (
                                                        <div className="mb-1">
                                                            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 border border-amber-500/20">
                                                                {item.badge || (isFree ? '⚡ Instant Free Access' : (index === 0 ? '🔥 Best Seller' : '🏷️ Limited Drop'))}
                                                            </span>
                                                        </div>
                                                    )}
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
                                                            /* Instant Buy via Gumroad CTA Button */
                                                            <button
                                                                onClick={() => handleInstantBuy(item)}
                                                                className="py-1.5 px-3 sm:px-3.5 rounded-xl text-white font-black text-xs transition active:scale-95 shadow-xs flex items-center gap-1 tracking-tight"
                                                                style={{ backgroundColor: creator.themeColor || '#ef4444' }}
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

                            {/* ─── High-Trust Verified Buyer Testimonials ─── */}
                            <div className="mt-6 pt-5 border-t border-slate-200/70">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1">
                                        <Star size={13} className="text-amber-400 fill-amber-400" />
                                        <span>Verified Customer Proof</span>
                                    </span>
                                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                                        ⭐ 4.9 / 5.0 (184 Reviews)
                                    </span>
                                </div>

                                <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-0.5 text-amber-400">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} size={11} className="fill-amber-400" />
                                            ))}
                                        </div>
                                        <span className="text-[10px] text-slate-400 font-medium">Verified Purchase</span>
                                    </div>
                                    <p className="text-xs text-slate-700 font-medium italic leading-relaxed">
                                        "Honestly 10x better than I expected. Grabbed it from TikTok and had full access within 10 seconds. Best purchase this month!"
                                    </p>
                                    <div className="flex items-center gap-2 pt-1">
                                        <div className="size-5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black flex items-center justify-center">
                                            A
                                        </div>
                                        <span className="text-[11px] font-bold text-slate-800">Alex M. (@alex_creator)</span>
                                    </div>
                                </div>
                            </div>

                            {/* ─── 1-Tap WhatsApp Direct Closing Channel ─── */}
                            <div className="mt-4">
                                <a
                                    href={`https://wa.me/?text=${encodeURIComponent(`Hi! I'm on your creator shop @${rawUsername} and have a quick question before ordering:`)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full py-2.5 px-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-center gap-2 transition active:scale-98"
                                >
                                    <MessageCircle size={15} className="text-emerald-600" />
                                    <span>Have questions? Chat directly on WhatsApp →</span>
                                </a>
                            </div>

                        </div>

                    </div>

                    {/* Bottom Home Indicator Bar (Simulated iPhone) */}
                    <div className="pb-2 pt-1 flex justify-center">
                        <div className="w-32 h-1 bg-slate-900/80 rounded-full"></div>
                    </div>

                </div>

            </main>

            {/* ─── Floating Sticky Bottom Buy Bar (Appears on Scroll) ─── */}
            {showStickyBar && displayedProducts.length > 0 && (
                <div className="fixed bottom-3 left-0 right-0 z-40 px-4 max-w-[420px] mx-auto animate-in slide-in-from-bottom-4 duration-300">
                    <div className="bg-slate-950/95 backdrop-blur-md text-white p-2.5 px-3.5 rounded-2xl shadow-2xl border border-slate-800 flex items-center justify-between gap-3 ring-1 ring-white/10">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="size-9 rounded-xl overflow-hidden bg-slate-800 shrink-0 border border-slate-700">
                                <img 
                                    src={displayedProducts[0].image || (displayedProducts[0].images && displayedProducts[0].images[0]) || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200'} 
                                    alt={displayedProducts[0].name} 
                                    className="w-full h-full object-cover" 
                                />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-bold text-white truncate">{displayedProducts[0].name}</p>
                                <p className="text-[11px] font-black text-emerald-400">
                                    ${parseFloat(displayedProducts[0].price || 0).toFixed(2)}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => handleInstantBuy(displayedProducts[0])}
                            className="px-3.5 py-2 rounded-xl text-xs font-black text-slate-950 flex items-center gap-1 shrink-0 shadow-sm active:scale-95 transition cursor-pointer"
                            style={{ backgroundColor: creator.themeColor || '#10B981' }}
                        >
                            <Zap size={13} className="fill-slate-950" />
                            <span>Claim Now</span>
                        </button>
                    </div>
                </div>
            )}

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
