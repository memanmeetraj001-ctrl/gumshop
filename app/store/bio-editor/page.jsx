'use client'

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
    Smartphone, 
    Save, 
    Copy, 
    ExternalLink, 
    Sparkles, 
    Palette, 
    Share2, 
    Link2, 
    ShoppingBag, 
    Mail, 
    Plus, 
    Trash2, 
    Check, 
    CheckCircle2, 
    ArrowLeft,
    Eye,
    Globe,
    Zap,
    Download,
    Flame,
    Star,
    RefreshCw
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { getActiveStore, getActiveStoreSync, setActiveStoreSlug } from '@/lib/activeStore';
import { getProductsByStore } from '@/lib/firebaseDb';
import Loading from '@/components/Loading';
import toast from 'react-hot-toast';

const THEME_PALETTES = [
    { name: 'Emerald', hex: '#10B981' },
    { name: 'Rose', hex: '#F43F5E' },
    { name: 'Indigo', hex: '#6366F1' },
    { name: 'Amber', hex: '#F59E0B' },
    { name: 'Cyan Neon', hex: '#06B6D4' },
    { name: 'Midnight', hex: '#0F172A' },
    { name: 'Purple', hex: '#A855F7' }
];

const BACKGROUND_PRESETS = [
    { id: 'warm_studio', label: 'Warm Studio', desc: 'Neutral soft grey studio gradient', bgClass: 'bg-gradient-to-b from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0]', cardClass: 'bg-white text-slate-900 border-slate-100' },
    { id: 'dark_glass', label: 'Dark Glass / OLED', desc: 'Midnight sleek dark aesthetic', bgClass: 'bg-gradient-to-b from-[#090d16] via-[#0f172a] to-[#020617]', cardClass: 'bg-slate-900/90 text-white border-slate-800' },
    { id: 'sunset', label: 'Sunset Glow', desc: 'Energetic creator warm peach & coral', bgClass: 'bg-gradient-to-b from-[#fff1f2] via-[#ffe4e6] to-[#fef3c7]', cardClass: 'bg-white text-slate-900 border-rose-100' },
    { id: 'clean_white', label: 'Minimal White', desc: 'Ultra-clean modern high contrast', bgClass: 'bg-white', cardClass: 'bg-slate-50 text-slate-900 border-slate-200' },
    { id: 'neon_cyber', label: 'Cyberpunk Neon', desc: 'Futuristic midnight glow', bgClass: 'bg-[#030712]', cardClass: 'bg-gray-950 text-cyan-200 border-cyan-900/60' },
    { id: 'editorial_paper', label: 'Minimalist Editorial', desc: 'Warm cream paper & bespoke serif elegance', bgClass: 'bg-gradient-to-b from-[#FAF8F5] via-[#F4EFEA] to-[#EAE3D9]', cardClass: 'bg-white text-stone-900 border-stone-200' },
    { id: 'midnight_luxe', label: 'Luxe Midnight', desc: 'Deep obsidian with champagne gold touches', bgClass: 'bg-gradient-to-b from-[#0B0F19] via-[#090D15] to-[#04060A]', cardClass: 'bg-[#121826] text-amber-50 border-amber-500/20' },
    { id: 'pastel_candy', label: 'Pastel Candy', desc: 'Playful soft lavender and bubblegum tone', bgClass: 'bg-gradient-to-b from-[#F5F3FF] via-[#FDF2F8] to-[#FFF1F2]', cardClass: 'bg-white/95 text-slate-900 border-purple-100' },
    { id: 'emerald_forest', label: 'Nordic Emerald', desc: 'Organic deep pine & fresh mint vibe', bgClass: 'bg-gradient-to-b from-[#064E3B] via-[#022C22] to-[#011C15]', cardClass: 'bg-[#064E3B]/60 text-emerald-50 border-emerald-700/40' }
];

export default function StanStoreBioEditor() {
    const { user, loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [autoSaveStatus, setAutoSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved'
    const isInitialMount = useRef(true);
    const autoSaveTimerRef = useRef(null);
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState('branding'); // 'branding' | 'socials' | 'links' | 'products'
    
    // Store reference
    const [currentStore, setCurrentStore] = useState(null);
    const [catalogProducts, setCatalogProducts] = useState([]);

    // Bio Profile State
    const [profile, setProfile] = useState({
        displayName: '',
        handle: '',
        tagline: '',
        avatar: '',
        verified: true,
        themeColor: '#10B981',
        backgroundPreset: 'warm_studio',
        socials: {
            instagram: '',
            tiktok: '',
            youtube: '',
            twitter: '',
            discord: '',
            whatsapp: '',
            twitch: '',
            spotify: ''
        },
        customLinks: [
            { id: 'lnk_1', title: '📅 Book a 1:1 Coaching Call', url: 'https://calendly.com', highlight: true, badge: '⭐ Most Popular' },
            { id: 'lnk_2', title: '🎙️ Listen to the Creator Podcast', url: 'https://spotify.com', highlight: false, badge: '' }
        ],
        productDisplayMode: 'all', // 'all' | 'curated'
        featuredProductIds: [],
        leadMagnet: {
            enabled: true,
            title: '🎁 Free Creator Starter Playbook',
            subtitle: 'Get our battle-tested Notion templates & presets directly to your inbox.',
            buttonText: 'Claim Free Access'
        }
    });

    // Load initial store
    useEffect(() => {
        const initEditor = async () => {
            try {
                let store = await getActiveStore(user) || getActiveStoreSync();
                if (!store) {
                    setLoading(false);
                    return;
                }

                setCurrentStore(store);
                const storeSlug = (store.username || store.name || 'shop').toLowerCase().replace(/[^a-z0-9-]+/g, '');
                
                // Existing bio profile or fallback from main store
                const existingBio = store.bioProfile || {};
                setProfile({
                    displayName: existingBio.displayName || store.name || 'Creator Store',
                    handle: existingBio.handle || storeSlug,
                    tagline: existingBio.tagline || store.bio || store.description || 'Curated creator products & digital downloads.',
                    avatar: existingBio.avatar || store.logo || store.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(store.name || 'Store')}`,
                    verified: existingBio.verified !== undefined ? existingBio.verified : true,
                    themeColor: existingBio.themeColor || store.themeColor || '#10B981',
                    backgroundPreset: existingBio.backgroundPreset || 'warm_studio',
                    socials: {
                        instagram: existingBio.socials?.instagram || store.socials?.instagram || '',
                        tiktok: existingBio.socials?.tiktok || store.socials?.tiktok || '',
                        youtube: existingBio.socials?.youtube || store.socials?.youtube || '',
                        twitter: existingBio.socials?.twitter || store.socials?.twitter || '',
                        discord: existingBio.socials?.discord || store.socials?.discord || '',
                        whatsapp: existingBio.socials?.whatsapp || store.socials?.whatsapp || '',
                        twitch: existingBio.socials?.twitch || store.socials?.twitch || '',
                        spotify: existingBio.socials?.spotify || store.socials?.spotify || ''
                    },
                    customLinks: existingBio.customLinks || [
                        { id: 'lnk_1', title: '📅 Book a 1:1 Coaching Call', url: 'https://calendly.com', highlight: true, badge: '⭐ Most Popular' },
                        { id: 'lnk_2', title: '🎙️ Listen to the Creator Podcast', url: 'https://spotify.com', highlight: false, badge: '' }
                    ],
                    productDisplayMode: existingBio.productDisplayMode || 'all',
                    featuredProductIds: existingBio.featuredProductIds || [],
                    leadMagnet: existingBio.leadMagnet || {
                        enabled: true,
                        title: '🎁 Free Creator Starter Playbook',
                        subtitle: 'Get our battle-tested Notion templates & presets directly to your inbox.',
                        buttonText: 'Claim Free Access'
                    }
                });

                // Load products
                const prods = await getProductsByStore(store.id || store.username);
                setCatalogProducts(prods || store.products || []);
            } catch (err) {
                console.error("Error loading bio editor:", err);
            } finally {
                setLoading(false);
                setTimeout(() => {
                    isInitialMount.current = false;
                }, 600);
            }
        };

        if (!authLoading) initEditor();
    }, [user, authLoading]);

    // Debounced Auto-Save on profile edits
    useEffect(() => {
        if (loading || isInitialMount.current || !currentStore) return;
        if (!profile.displayName && !profile.handle) return;

        setAutoSaveStatus('saving');
        if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);

        autoSaveTimerRef.current = setTimeout(async () => {
            try {
                const cleanSlug = (profile.handle || currentStore.username || currentStore.name || 'shop').toLowerCase().replace(/[^a-z0-9-]+/g, '') || 'shop';
                const targetStoreId = currentStore.id || `store_${cleanSlug}`;

                const updatedStore = {
                    ...currentStore,
                    id: targetStoreId,
                    username: cleanSlug,
                    bioProfile: profile,
                    updatedAt: new Date().toISOString()
                };

                // Sync local caches
                if (typeof window !== 'undefined') {
                    localStorage.setItem(`store_${cleanSlug}`, JSON.stringify(updatedStore));
                    localStorage.setItem(`cloned_store_${cleanSlug}`, JSON.stringify(updatedStore));
                    localStorage.setItem(targetStoreId, JSON.stringify(updatedStore));
                    localStorage.setItem('gumshop_active_store', JSON.stringify(updatedStore));
                    localStorage.setItem('active_store_slug', cleanSlug);
                    localStorage.setItem(`gumshop_db_stores/${targetStoreId}`, JSON.stringify(updatedStore));
                    localStorage.setItem(`gumshop_db_stores/store_${cleanSlug}`, JSON.stringify(updatedStore));
                    window.dispatchEvent(new Event('active_store_changed'));
                }

                // Background sync to server API
                fetch('/api/store/data', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        store: updatedStore,
                        products: catalogProducts
                    })
                }).catch(() => {});

                setAutoSaveStatus('saved');
                setTimeout(() => {
                    setAutoSaveStatus(prev => prev === 'saved' ? 'idle' : prev);
                }, 3000);
            } catch (e) {
                console.warn("Bio editor auto-save notice:", e);
                setAutoSaveStatus('idle');
            }
        }, 800);

        return () => {
            if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
        };
    }, [profile, currentStore, loading]);

    // Handle Copy Bio Link
    const handleCopyBioLink = () => {
        const slug = profile.handle || currentStore?.username || 'store';
        const url = `${window.location.origin}/creator/${slug}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        toast.success("Mobile bio link copied to clipboard! 📋");
        setTimeout(() => setCopied(false), 2000);
    };

    // Custom Link management
    const handleAddLink = () => {
        const newLink = {
            id: `lnk_${Date.now()}`,
            title: '✨ New Custom Link',
            url: 'https://',
            highlight: false,
            badge: ''
        };
        setProfile(prev => ({
            ...prev,
            customLinks: [...prev.customLinks, newLink]
        }));
    };

    const handleUpdateLink = (id, field, value) => {
        setProfile(prev => ({
            ...prev,
            customLinks: prev.customLinks.map(l => l.id === id ? { ...l, [field]: value } : l)
        }));
    };

    const handleRemoveLink = (id) => {
        setProfile(prev => ({
            ...prev,
            customLinks: prev.customLinks.filter(l => l.id !== id)
        }));
    };

    // Product toggle
    const handleToggleFeaturedProduct = (productId) => {
        setProfile(prev => {
            const exists = prev.featuredProductIds.includes(productId);
            return {
                ...prev,
                featuredProductIds: exists 
                    ? prev.featuredProductIds.filter(id => id !== productId)
                    : [...prev.featuredProductIds, productId]
            };
        });
    };

    // Save Changes
    const handleSaveBioProfile = async () => {
        if (!currentStore) return;
        if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
        setSaving(true);
        setAutoSaveStatus('saving');
        try {
            const cleanSlug = (profile.handle || currentStore.username || currentStore.name || 'shop').toLowerCase().replace(/[^a-z0-9-]+/g, '') || 'shop';
            const targetStoreId = currentStore.id || `store_${cleanSlug}`;

            const updatedStore = {
                ...currentStore,
                id: targetStoreId,
                username: cleanSlug,
                bioProfile: profile,
                updatedAt: new Date().toISOString()
            };

            // 1. LocalStorage caches for instant synchronous reflection across all views
            if (typeof window !== 'undefined') {
                localStorage.setItem(`store_${cleanSlug}`, JSON.stringify(updatedStore));
                localStorage.setItem(`cloned_store_${cleanSlug}`, JSON.stringify(updatedStore));
                localStorage.setItem(targetStoreId, JSON.stringify(updatedStore));
                localStorage.setItem('gumshop_active_store', JSON.stringify(updatedStore));
                localStorage.setItem('active_store_slug', cleanSlug);
                localStorage.setItem(`gumshop_db_stores/${targetStoreId}`, JSON.stringify(updatedStore));
                localStorage.setItem(`gumshop_db_stores/store_${cleanSlug}`, JSON.stringify(updatedStore));
                window.dispatchEvent(new Event('active_store_changed'));
                window.dispatchEvent(new Event('products_updated'));
            }

            // Sync active store cookie
            setActiveStoreSlug(cleanSlug);

            // 2. Dual-layer API sync to server (Supabase / Edge backend) - Await to guarantee persistence
            await fetch('/api/store/data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    store: updatedStore,
                    products: catalogProducts
                })
            }).catch(() => {});

            // 3. Dual-layer Firebase sync
            try {
                const { updateStore } = await import('@/lib/firebaseDb');
                await updateStore(targetStoreId, updatedStore);
            } catch (e) {
                console.warn("Firebase sync note:", e);
            }

            setCurrentStore(updatedStore);
            setAutoSaveStatus('saved');
            toast.success("Mobile Stan Storefront published successfully! 🚀", {
                duration: 3500,
                icon: '📱'
            });
        } catch (err) {
            console.error("Save error:", err);
            setAutoSaveStatus('idle');
            toast.error("Failed to save mobile store settings.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <Loading />;

    const activePreset = BACKGROUND_PRESETS.find(p => p.id === profile.backgroundPreset) || BACKGROUND_PRESETS[0];
    const liveSlug = profile.handle || currentStore?.username || 'store';

    // Filter preview products based on curation mode
    const previewProducts = profile.productDisplayMode === 'curated' && profile.featuredProductIds.length > 0
        ? catalogProducts.filter(p => profile.featuredProductIds.includes(p.id))
        : catalogProducts;

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
            {/* ─── Top Control Navbar ─── */}
            <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 shadow-xs">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <Link 
                            href="/store"
                            className="size-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition"
                            title="Back to Store Dashboard"
                        >
                            <ArrowLeft size={16} />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-1.5">
                                    <Smartphone size={18} className="text-rose-500" />
                                    <span>Stan & Mobile Bio Visual Editor</span>
                                </span>
                                <span className="text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">
                                    Live Builder
                                </span>
                            </div>
                            <p className="text-xs text-slate-500">
                                Editing link-in-bio for <code className="font-mono text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded">@{liveSlug}</code>
                            </p>
                        </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
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
                            onClick={handleCopyBioLink}
                            className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition"
                        >
                            {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                            <span className="hidden sm:inline">{copied ? "Copied!" : "Copy Link"}</span>
                        </button>

                        <Link
                            href={`/creator/${liveSlug}`}
                            target="_blank"
                            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition"
                        >
                            <Eye size={14} />
                            <span>Open Live</span>
                            <ExternalLink size={12} className="text-slate-400" />
                        </Link>

                        <button
                            onClick={handleSaveBioProfile}
                            disabled={saving}
                            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-1.5 shadow-sm shadow-emerald-600/20 transition active:scale-95 disabled:opacity-50"
                        >
                            <Save size={14} />
                            <span>{saving ? "Saving..." : "Save Bio Store"}</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* ─── Main Editor Stage (Split Layout) ─── */}
            <main className="max-w-7xl mx-auto px-4 sm:px-8 pt-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* ════════ LEFT: Editor Controls (7 Cols) ════════ */}
                    <div className="lg:col-span-7 space-y-6">
                        
                        {/* Editor Tabs Navigation */}
                        <div className="bg-white p-1.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-1 overflow-x-auto scrollbar-none">
                            <button
                                onClick={() => setActiveTab('branding')}
                                className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition ${
                                    activeTab === 'branding' 
                                        ? 'bg-slate-900 text-white shadow-xs' 
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                }`}
                            >
                                <Palette size={14} />
                                <span>1. Branding & Bio</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('socials')}
                                className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition ${
                                    activeTab === 'socials' 
                                        ? 'bg-slate-900 text-white shadow-xs' 
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                }`}
                            >
                                <Share2 size={14} />
                                <span>2. Socials</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('links')}
                                className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition ${
                                    activeTab === 'links' 
                                        ? 'bg-slate-900 text-white shadow-xs' 
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                }`}
                            >
                                <Link2 size={14} />
                                <span>3. Custom Links</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('products')}
                                className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition ${
                                    activeTab === 'products' 
                                        ? 'bg-slate-900 text-white shadow-xs' 
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                }`}
                            >
                                <ShoppingBag size={14} />
                                <span>4. Catalog & Leads</span>
                            </button>
                        </div>

                        {/* ──────── TAB 1: BRANDING & PROFILE ──────── */}
                        {activeTab === 'branding' && (
                            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-6">
                                <div className="border-b border-slate-100 pb-4">
                                    <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                                        <Palette size={18} className="text-emerald-600" />
                                        Profile Details & Visual Styling
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-0.5">Customize your creator persona, avatar, and background ambience.</p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Display Name</label>
                                        <input 
                                            type="text" 
                                            value={profile.displayName} 
                                            onChange={e => setProfile(p => ({ ...p, displayName: e.target.value }))}
                                            placeholder="e.g. Alex Rivers"
                                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Profile Handle (@)</label>
                                        <input 
                                            type="text" 
                                            value={profile.handle} 
                                            onChange={e => setProfile(p => ({ ...p, handle: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') }))}
                                            placeholder="e.g. alexrivers"
                                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Avatar Image URL</label>
                                    <div className="flex items-center gap-3">
                                        <img 
                                            src={profile.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile.displayName || 'Store')}`} 
                                            alt="Preview" 
                                            className="size-12 rounded-full border border-slate-200 object-cover shrink-0" 
                                        />
                                        <input 
                                            type="url" 
                                            value={profile.avatar} 
                                            onChange={e => setProfile(p => ({ ...p, avatar: e.target.value }))}
                                            placeholder="https://images.unsplash.com/..."
                                            className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Bio / Tagline</label>
                                    <textarea 
                                        rows={3} 
                                        value={profile.tagline} 
                                        onChange={e => setProfile(p => ({ ...p, tagline: e.target.value }))}
                                        placeholder="Creator, tech reviewer & digital downloads architect. Curating top tools weekly."
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
                                    />
                                    <div className="text-[11px] text-slate-400 text-right mt-1">
                                        {profile.tagline.length} / 160 characters
                                    </div>
                                </div>

                                {/* Verified Badge Toggle */}
                                <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
                                    <div className="flex items-center gap-2.5">
                                        <div className="size-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                                            <CheckCircle2 size={18} />
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-900">Verified Creator Badge</h4>
                                            <p className="text-[11px] text-slate-500">Display blue verified trust mark on your mobile header.</p>
                                        </div>
                                    </div>
                                    <input 
                                        type="checkbox" 
                                        checked={profile.verified} 
                                        onChange={e => setProfile(p => ({ ...p, verified: e.target.checked }))}
                                        className="size-5 accent-emerald-600 rounded cursor-pointer"
                                    />
                                </div>

                                {/* Theme Accent Color Palette */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-2">Theme Accent Color</label>
                                    <div className="flex flex-wrap items-center gap-2.5">
                                        {THEME_PALETTES.map((pal) => (
                                            <button
                                                key={pal.hex}
                                                type="button"
                                                onClick={() => setProfile(p => ({ ...p, themeColor: pal.hex }))}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition ${
                                                    profile.themeColor === pal.hex 
                                                        ? 'border-slate-900 bg-slate-900 text-white shadow-xs' 
                                                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                                }`}
                                            >
                                                <span className="size-3 rounded-full" style={{ backgroundColor: pal.hex }} />
                                                <span>{pal.name}</span>
                                            </button>
                                        ))}
                                        <div className="flex items-center gap-1.5 pl-2">
                                            <input 
                                                type="color" 
                                                value={profile.themeColor} 
                                                onChange={e => setProfile(p => ({ ...p, themeColor: e.target.value }))}
                                                className="size-8 rounded-lg cursor-pointer border border-slate-200"
                                            />
                                            <span className="text-xs font-mono font-bold text-slate-600 uppercase">{profile.themeColor}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Background Ambience Presets */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-2">Background Atmosphere Preset</label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                        {BACKGROUND_PRESETS.map((preset) => {
                                            const isSelected = profile.backgroundPreset === preset.id;
                                            return (
                                                <div
                                                    key={preset.id}
                                                    onClick={() => setProfile(p => ({ ...p, backgroundPreset: preset.id }))}
                                                    className={`p-3 rounded-2xl border cursor-pointer transition ${
                                                        isSelected 
                                                            ? 'border-emerald-600 bg-emerald-50/40 ring-1 ring-emerald-500' 
                                                            : 'border-slate-200 hover:border-slate-300 bg-white'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-bold text-slate-900">{preset.label}</span>
                                                        {isSelected && <Check size={14} className="text-emerald-600" />}
                                                    </div>
                                                    <p className="text-[11px] text-slate-500 mt-0.5">{preset.desc}</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ──────── TAB 2: SOCIAL MEDIA CHANNELS ──────── */}
                        {activeTab === 'socials' && (
                            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-6">
                                <div className="border-b border-slate-100 pb-4">
                                    <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                                        <Share2 size={18} className="text-rose-500" />
                                        Social Media Presence
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-0.5">Connect your active audience channels to route fans and followers.</p>
                                </div>

                                <div className="space-y-3.5">
                                    {[
                                        { key: 'instagram', label: 'Instagram Profile URL', placeholder: 'https://instagram.com/yourhandle', icon: '📸' },
                                        { key: 'tiktok', label: 'TikTok Channel URL', placeholder: 'https://tiktok.com/@yourhandle', icon: '🎵' },
                                        { key: 'youtube', label: 'YouTube Channel URL', placeholder: 'https://youtube.com/@yourchannel', icon: '▶️' },
                                        { key: 'twitter', label: 'X / Twitter Profile URL', placeholder: 'https://x.com/yourhandle', icon: '🐦' },
                                        { key: 'discord', label: 'Discord Server Invite', placeholder: 'https://discord.gg/yourinvite', icon: '💬' },
                                        { key: 'whatsapp', label: 'WhatsApp / Telegram Chat', placeholder: 'https://wa.me/1234567890', icon: '📱' },
                                        { key: 'spotify', label: 'Spotify / Podcast Link', placeholder: 'https://open.spotify.com/show/...', icon: '🎙️' },
                                        { key: 'twitch', label: 'Twitch Stream URL', placeholder: 'https://twitch.tv/yourchannel', icon: '🎮' }
                                    ].map(item => (
                                        <div key={item.key}>
                                            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                                                <span>{item.icon}</span>
                                                <span>{item.label}</span>
                                            </label>
                                            <input 
                                                type="url"
                                                value={profile.socials[item.key] || ''}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    setProfile(p => ({
                                                        ...p,
                                                        socials: { ...p.socials, [item.key]: val }
                                                    }));
                                                }}
                                                placeholder={item.placeholder}
                                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ──────── TAB 3: CUSTOM CTA LINK BUTTONS ──────── */}
                        {activeTab === 'links' && (
                            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-6">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                    <div>
                                        <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                                            <Link2 size={18} className="text-indigo-600" />
                                            Custom CTA Buttons (Stan Store Style)
                                        </h3>
                                        <p className="text-xs text-slate-500 mt-0.5">Add non-store link cards (e.g. Calendly, Newsletter, VIP Communities).</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleAddLink}
                                        className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1 shadow-xs transition"
                                    >
                                        <Plus size={14} />
                                        <span>Add Button</span>
                                    </button>
                                </div>

                                {profile.customLinks.length === 0 ? (
                                    <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                        <Link2 size={24} className="mx-auto text-slate-400 mb-2" />
                                        <p className="text-xs font-bold text-slate-700">No Custom Link Buttons Added</p>
                                        <p className="text-[11px] text-slate-400 mt-0.5">Click "Add Button" above to create links to booking pages, blogs, or podcasts.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3.5">
                                        {profile.customLinks.map((link, idx) => (
                                            <div 
                                                key={link.id || idx}
                                                className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 relative group"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                                                        Button #{idx + 1}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveLink(link.id)}
                                                        className="text-slate-400 hover:text-rose-600 transition p-1"
                                                        title="Delete Button"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Button Title</label>
                                                        <input 
                                                            type="text" 
                                                            value={link.title} 
                                                            onChange={e => handleUpdateLink(link.id, 'title', e.target.value)}
                                                            placeholder="e.g. 📅 Book 1-on-1 Consultation"
                                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Destination URL</label>
                                                        <input 
                                                            type="url" 
                                                            value={link.url} 
                                                            onChange={e => handleUpdateLink(link.id, 'url', e.target.value)}
                                                            placeholder="https://calendly.com/..."
                                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={link.highlight} 
                                                            onChange={e => handleUpdateLink(link.id, 'highlight', e.target.checked)}
                                                            className="size-4 accent-emerald-600 rounded"
                                                        />
                                                        <span className="text-xs font-semibold text-slate-700">Highlight with Theme Badge</span>
                                                    </label>

                                                    {link.highlight && (
                                                        <input 
                                                            type="text" 
                                                            value={link.badge || ''} 
                                                            onChange={e => handleUpdateLink(link.id, 'badge', e.target.value)}
                                                            placeholder="Badge Text (e.g. ⭐ Hot)"
                                                            className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 w-32"
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ──────── TAB 4: PRODUCTS & LEAD MAGNET ──────── */}
                        {activeTab === 'products' && (
                            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-6">
                                <div className="border-b border-slate-100 pb-4">
                                    <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                                        <Mail size={18} className="text-emerald-600" />
                                        Lead Magnet & Catalog Curation
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-0.5">Collect email leads and choose which products appear on your mobile store.</p>
                                </div>

                                {/* Free Lead Magnet Section */}
                                <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="size-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                                                🎁
                                            </span>
                                            <div>
                                                <h4 className="text-xs font-bold text-white">Email Lead Magnet Opt-In</h4>
                                                <p className="text-[11px] text-slate-400">Captures buyer emails directly to your Customers CRM.</p>
                                            </div>
                                        </div>
                                        <input 
                                            type="checkbox" 
                                            checked={profile.leadMagnet.enabled} 
                                            onChange={e => setProfile(p => ({
                                                ...p,
                                                leadMagnet: { ...p.leadMagnet, enabled: e.target.checked }
                                            }))}
                                            className="size-5 accent-emerald-500 rounded cursor-pointer"
                                        />
                                    </div>

                                    {profile.leadMagnet.enabled && (
                                        <div className="space-y-3 pt-2 border-t border-slate-700/60">
                                            <div>
                                                <label className="block text-[11px] font-bold text-slate-300 mb-1">Headline</label>
                                                <input 
                                                    type="text" 
                                                    value={profile.leadMagnet.title} 
                                                    onChange={e => setProfile(p => ({
                                                        ...p,
                                                        leadMagnet: { ...p.leadMagnet, title: e.target.value }
                                                    }))}
                                                    placeholder="e.g. 🎁 Free Creator Starter Playbook"
                                                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-xs font-bold text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-bold text-slate-300 mb-1">Subtitle</label>
                                                <input 
                                                    type="text" 
                                                    value={profile.leadMagnet.subtitle} 
                                                    onChange={e => setProfile(p => ({
                                                        ...p,
                                                        leadMagnet: { ...p.leadMagnet, subtitle: e.target.value }
                                                    }))}
                                                    placeholder="e.g. Enter your email for instant digital delivery."
                                                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-xs font-medium text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-bold text-slate-300 mb-1">Button CTA Text</label>
                                                <input 
                                                    type="text" 
                                                    value={profile.leadMagnet.buttonText} 
                                                    onChange={e => setProfile(p => ({
                                                        ...p,
                                                        leadMagnet: { ...p.leadMagnet, buttonText: e.target.value }
                                                    }))}
                                                    placeholder="Claim Free Access"
                                                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-xs font-bold text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Product Curation Section */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-2">Catalog Display Mode</label>
                                    <div className="flex items-center gap-3">
                                        <label className={`flex-1 p-3 rounded-2xl border cursor-pointer transition ${
                                            profile.productDisplayMode === 'all' 
                                                ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold' 
                                                : 'border-slate-200 bg-white text-slate-700'
                                        }`}>
                                            <input 
                                                type="radio" 
                                                name="prodMode" 
                                                value="all" 
                                                checked={profile.productDisplayMode === 'all'} 
                                                onChange={() => setProfile(p => ({ ...p, productDisplayMode: 'all' }))}
                                                className="sr-only"
                                            />
                                            <div className="text-xs">Show All Products ({catalogProducts.length})</div>
                                            <div className="text-[11px] font-normal text-slate-500">Auto-displays every item in your catalog</div>
                                        </label>

                                        <label className={`flex-1 p-3 rounded-2xl border cursor-pointer transition ${
                                            profile.productDisplayMode === 'curated' 
                                                ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold' 
                                                : 'border-slate-200 bg-white text-slate-700'
                                        }`}>
                                            <input 
                                                type="radio" 
                                                name="prodMode" 
                                                value="curated" 
                                                checked={profile.productDisplayMode === 'curated'} 
                                                onChange={() => setProfile(p => ({ ...p, productDisplayMode: 'curated' }))}
                                                className="sr-only"
                                            />
                                            <div className="text-xs">Curate Featured Only</div>
                                            <div className="text-[11px] font-normal text-slate-500">Hand-pick high-converting mobile items</div>
                                        </label>
                                    </div>

                                    {profile.productDisplayMode === 'curated' && (
                                        <div className="mt-4 space-y-2 max-h-64 overflow-y-auto pr-1">
                                            {catalogProducts.map(prod => {
                                                const isFeatured = profile.featuredProductIds.includes(prod.id);
                                                return (
                                                    <div 
                                                        key={prod.id}
                                                        onClick={() => handleToggleFeaturedProduct(prod.id)}
                                                        className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                                                            isFeatured 
                                                                ? 'border-emerald-500 bg-emerald-50/50' 
                                                                : 'border-slate-200 bg-white hover:bg-slate-50'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-2.5">
                                                            <img 
                                                                src={prod.image || (prod.images && prod.images[0]) || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'} 
                                                                alt="" 
                                                                className="size-8 rounded-lg object-cover" 
                                                            />
                                                            <div>
                                                                <div className="text-xs font-bold text-slate-900">{prod.name}</div>
                                                                <div className="text-[11px] font-semibold text-slate-500">${prod.price}</div>
                                                            </div>
                                                        </div>
                                                        <input 
                                                            type="checkbox" 
                                                            checked={isFeatured} 
                                                            readOnly 
                                                            className="size-4 accent-emerald-600 rounded" 
                                                        />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                    </div>

                    {/* ════════ RIGHT: Interactive Simulated iPhone 16 Pro Frame (5 Cols) ════════ */}
                    <div className="lg:col-span-5 sticky top-24">
                        <div className="text-center mb-2">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-center gap-1.5">
                                <Sparkles size={12} className="text-rose-500" />
                                Real-Time Mobile Device Preview
                            </span>
                        </div>

                        {/* iPhone 16 Pro Outer Hardware Shell */}
                        <div className="mx-auto w-[360px] sm:w-[380px] rounded-[52px] border-[12px] border-slate-950 bg-slate-950 shadow-[0_25px_70px_-15px_rgba(0,0,0,0.35)] ring-1 ring-slate-800/20 overflow-hidden relative select-none">
                            
                            {/* Inner Screen Canvas */}
                            <div className={`min-h-[680px] max-h-[720px] overflow-y-auto scrollbar-none flex flex-col justify-between ${activePreset.bgClass}`}>
                                
                                {/* Bio Profile Content */}
                                <div className="px-5 pt-6 pb-6 flex-1 flex flex-col">
                                    
                                    {/* Avatar & Verification */}
                                    <div className="flex flex-col items-center text-center">
                                        <div className="size-20 rounded-full p-1 ring-2 ring-white/80 shadow-md overflow-hidden bg-white mb-2.5">
                                            <img 
                                                src={profile.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile.displayName || 'Store')}`} 
                                                alt="" 
                                                className="w-full h-full object-cover rounded-full" 
                                            />
                                        </div>

                                        <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-1">
                                            <span>{profile.displayName || 'Creator Store'}</span>
                                            {profile.verified && (
                                                <svg className="w-4 h-4 fill-blue-500 text-white shrink-0" viewBox="0 0 24 24">
                                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.2 14.2l-3.5-3.5 1.4-1.4 2.1 2.1 5.6-5.6 1.4 1.4-7 7z"/>
                                                </svg>
                                            )}
                                        </h2>

                                        <p className="text-[10px] font-mono font-bold text-slate-500 mt-0.5">
                                            @{liveSlug}
                                        </p>

                                        <p className="text-xs text-slate-600 font-medium max-w-[280px] mt-2 leading-relaxed">
                                            {profile.tagline || 'Curated creator products & digital downloads.'}
                                        </p>

                                        {/* Social Icons Hub */}
                                        <div className="flex items-center justify-center gap-2 mt-3 text-slate-600">
                                            {Object.entries(profile.socials).filter(([_, url]) => Boolean(url)).map(([platform, url]) => (
                                                <div 
                                                    key={platform}
                                                    className="size-7 rounded-full bg-white/80 border border-slate-200/60 shadow-2xs flex items-center justify-center text-xs font-bold capitalize"
                                                    title={platform}
                                                >
                                                    {platform === 'instagram' && '📸'}
                                                    {platform === 'tiktok' && '🎵'}
                                                    {platform === 'youtube' && '▶️'}
                                                    {platform === 'twitter' && '🐦'}
                                                    {platform === 'discord' && '💬'}
                                                    {platform === 'whatsapp' && '📱'}
                                                    {platform === 'spotify' && '🎙️'}
                                                    {platform === 'twitch' && '🎮'}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Custom CTA Link Buttons */}
                                    {profile.customLinks.length > 0 && (
                                        <div className="mt-4 space-y-2">
                                            {profile.customLinks.map((link, idx) => (
                                                <div 
                                                    key={link.id || idx}
                                                    className="relative p-3 rounded-2xl bg-white border border-slate-200/90 shadow-2xs text-center font-bold text-xs text-slate-800 transition hover:scale-[1.01]"
                                                    style={link.highlight ? { borderColor: profile.themeColor, borderWidth: '1.5px' } : {}}
                                                >
                                                    {link.highlight && (
                                                        <span 
                                                            className="absolute -top-2 right-3 text-[9px] font-extrabold px-1.5 py-0.2 rounded-full text-white shadow-2xs"
                                                            style={{ backgroundColor: profile.themeColor }}
                                                        >
                                                            {link.badge || '⭐ Featured'}
                                                        </span>
                                                    )}
                                                    <span>{link.title}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Email Lead Magnet Preview */}
                                    {profile.leadMagnet?.enabled && (
                                        <div className="mt-4 p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-md relative overflow-hidden">
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <span className="text-xs">🎁</span>
                                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">
                                                    Free Resource
                                                </span>
                                            </div>
                                            <div className="text-xs font-extrabold text-white leading-snug">
                                                {profile.leadMagnet.title || 'Free Creator Playbook'}
                                            </div>
                                            <p className="text-[10px] text-slate-300 mt-0.5 leading-relaxed">
                                                {profile.leadMagnet.subtitle}
                                            </p>
                                            <div className="mt-2.5 flex gap-1.5">
                                                <div className="flex-1 bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-[10px] text-slate-400 truncate">
                                                    your.email@example.com
                                                </div>
                                                <div 
                                                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-950 shrink-0"
                                                    style={{ backgroundColor: profile.themeColor }}
                                                >
                                                    {profile.leadMagnet.buttonText || 'Claim'}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Product Cards Preview */}
                                    <div className="mt-4 space-y-2.5">
                                        <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                            Featured Products ({previewProducts.length})
                                        </div>
                                        {previewProducts.slice(0, 4).map((item, idx) => (
                                            <div 
                                                key={item.id || idx}
                                                className="bg-white rounded-xl p-2.5 border border-slate-100 shadow-2xs flex items-center gap-2.5"
                                            >
                                                <img 
                                                    src={item.image || (item.images && item.images[0]) || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'} 
                                                    alt="" 
                                                    className="size-12 rounded-lg object-cover shrink-0" 
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-xs font-bold text-slate-900 truncate">{item.name}</div>
                                                    <div className="text-xs font-black text-slate-900 mt-0.5">${item.price}</div>
                                                </div>
                                                <button 
                                                    type="button"
                                                    className="py-1 px-2.5 rounded-lg text-white font-black text-[10px] flex items-center gap-1 shrink-0"
                                                    style={{ backgroundColor: profile.themeColor }}
                                                >
                                                    <Zap size={10} className="fill-white" />
                                                    <span>Buy</span>
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                </div>

                                {/* Simulated iOS Home Indicator */}
                                <div className="pb-2 pt-1 flex justify-center">
                                    <div className="w-28 h-1 bg-slate-400/50 rounded-full" />
                                </div>
                            </div>

                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
