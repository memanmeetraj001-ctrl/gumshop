'use client'
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
    Store, 
    Sparkles, 
    Zap, 
    ArrowRight, 
    CheckCircle2, 
    Palette, 
    Layers, 
    Globe, 
    CheckSquare, 
    ShieldCheck, 
    ShoppingBag,
    ArrowLeft
} from 'lucide-react';
import toast from 'react-hot-toast';
import { setActiveStoreSlug } from '@/lib/activeStore';

export default function CreateStorePage() {
    const router = useRouter();
    const [creationMode, setCreationMode] = useState('blank'); // 'blank' | 'clone'

    // Blank Store Form State
    const [blankName, setBlankName] = useState('');
    const [blankSlug, setBlankSlug] = useState('');
    const [blankTheme, setBlankTheme] = useState('viral_lander');
    const [blankColor, setBlankColor] = useState('#10B981');
    const [isCreatingBlank, setIsCreatingBlank] = useState(false);

    // Clone Store Form State
    const [cloneUrl, setCloneUrl] = useState('');
    const [isRedirectingClone, setIsRedirectingClone] = useState(false);

    const handleBlankNameChange = (name) => {
        setBlankName(name);
        if (!blankSlug || blankSlug === blankName.toLowerCase().replace(/[^a-z0-9-]+/g, '-')) {
            setBlankSlug(name.toLowerCase().replace(/[^a-z0-9-]+/g, '-'));
        }
    };

    const handleCreateBlankStore = async (e) => {
        e.preventDefault();
        const effectiveName = blankName.trim();
        if (!effectiveName) {
            toast.error("Please enter a store name");
            return;
        }

        const effectiveSlug = (blankSlug.trim() || effectiveName.toLowerCase()).replace(/[^a-z0-9-]+/g, '-') || `shop-${Date.now()}`;
        const storeId = `store_${effectiveSlug}`;

        setIsCreatingBlank(true);
        try {
            const newStore = {
                id: storeId,
                userId: storeId,
                name: effectiveName,
                username: effectiveSlug,
                description: `Official digital storefront for ${effectiveName}. Free tracked shipping worldwide.`,
                theme: blankTheme,
                themeColor: blankColor,
                status: 'approved',
                products: [], // Zero products - 100% isolated fresh database
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            // 1. Save locally with strict isolation
            if (typeof window !== 'undefined') {
                localStorage.setItem(`store_${effectiveSlug}`, JSON.stringify(newStore));
                localStorage.setItem(`cloned_store_${effectiveSlug}`, JSON.stringify(newStore));
                localStorage.setItem(`gumshop_db_stores/${storeId}`, JSON.stringify(newStore));
                localStorage.removeItem('gumshop_stores_cleared');
                setActiveStoreSlug(newStore);
            }

            // 2. Persist to Firebase in background
            try {
                const { createStore } = await import('@/lib/firebaseDb');
                await createStore(newStore);
            } catch (fbErr) {}

            toast.success(`Store "${effectiveName}" created with a clean database! 🚀`);
            router.push('/store/manage-product');
        } catch (err) {
            console.error('Create store error:', err);
            toast.error("Failed to create store. Please try again.");
            setIsCreatingBlank(false);
        }
    };

    const handleStartClone = (e) => {
        e.preventDefault();
        const url = cloneUrl.trim();
        if (!url) {
            toast.error("Please enter a competitor store URL to clone");
            return;
        }

        setIsRedirectingClone(true);
        router.push(`/store/import?target=${encodeURIComponent(url)}`);
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
            {/* Top Navigation Bar */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <Link href="/dashboard" className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-bold text-xs transition">
                        <ArrowLeft size={16} />
                        <span>Back to Dashboard</span>
                    </Link>
                    <div className="flex items-center gap-2">
                        <div className="size-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm shadow-md shadow-emerald-600/30">
                            G
                        </div>
                        <span className="font-extrabold text-sm tracking-tight text-slate-900">GumShop Studio</span>
                    </div>
                    <Link href="/dashboard" className="text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-xl transition">
                        All My Shops
                    </Link>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-10">
                {/* Header Title */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100/80 border border-emerald-300 text-emerald-800 text-xs font-bold mb-3 shadow-xs">
                        <Sparkles size={14} className="text-emerald-700" />
                        <span>Multi-Store Architecture • Isolated Databases</span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                        Create a New Store
                    </h1>
                    <p className="text-sm text-slate-500 mt-2 max-w-xl mx-auto">
                        Launch a fresh store with its own isolated catalog, orders, and checkout link. Choose whether to start blank or import products selectively from a competitor.
                    </p>
                </div>

                {/* Mode Selector Switch */}
                <div className="flex p-1.5 bg-slate-200/80 rounded-2xl max-w-md mx-auto mb-8">
                    <button
                        type="button"
                        onClick={() => setCreationMode('blank')}
                        className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                            creationMode === 'blank'
                                ? 'bg-white text-slate-900 shadow-sm'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <Store size={15} className={creationMode === 'blank' ? 'text-emerald-600' : 'text-slate-400'} />
                        <span>Clean Blank Store</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setCreationMode('clone')}
                        className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                            creationMode === 'clone'
                                ? 'bg-white text-slate-900 shadow-sm'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <Sparkles size={15} className={creationMode === 'clone' ? 'text-emerald-600' : 'text-slate-400'} />
                        <span>Clone with Selection</span>
                    </button>
                </div>

                {/* MODE 1: Clean Blank Store */}
                {creationMode === 'blank' && (
                    <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
                        <div className="flex items-center gap-3 pb-6 border-b border-slate-100">
                            <div className="size-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                                <Store size={24} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">Start with a Blank Store</h2>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Zero products to start. Completely isolated database with custom branding.
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleCreateBlankStore} className="space-y-6 mt-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Store Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={blankName}
                                        onChange={(e) => handleBlankNameChange(e.target.value)}
                                        placeholder="e.g. Apex Drift Club"
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Storefront Handle / Slug *
                                    </label>
                                    <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-mono focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500/20">
                                        <span className="text-slate-400 text-xs">/shop/</span>
                                        <input
                                            type="text"
                                            required
                                            value={blankSlug}
                                            onChange={(e) => setBlankSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-'))}
                                            placeholder="apex-drift-club"
                                            className="w-full bg-transparent border-none outline-none text-emerald-700 font-bold font-mono text-xs ml-1"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Theme Preset Selector */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-2">
                                    Conversion Layout Theme
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {[
                                        { id: 'viral_lander', label: '🚀 TikTok Lander', desc: 'Single-product sticky checkout focus' },
                                        { id: 'tech_hardware', label: '⚡ Tech & RC Gadgets', desc: 'Sleek specs grid with fast buy box' },
                                        { id: 'fashion_lookbook', label: '👗 Fashion Lookbook', desc: 'Editorial aesthetic with image grids' },
                                        { id: 'clean_beauty', label: '🌸 Clean Beauty', desc: 'Pastel calm styling with trust badges' },
                                        { id: 'digital_creator', label: '💻 Creator & Digital', desc: 'High conversion for digital assets' },
                                        { id: 'curated_superstore', label: '🏬 Curated Superstore', desc: 'Multi-category department store' }
                                    ].map(theme => (
                                        <button
                                            key={theme.id}
                                            type="button"
                                            onClick={() => setBlankTheme(theme.id)}
                                            className={`p-3 rounded-2xl border text-left transition ${
                                                blankTheme === theme.id
                                                    ? 'border-emerald-500 bg-emerald-50/50 shadow-xs ring-1 ring-emerald-500/30'
                                                    : 'border-slate-200 hover:border-slate-300 bg-white'
                                            }`}
                                        >
                                            <p className="text-xs font-bold text-slate-900">{theme.label}</p>
                                            <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">{theme.desc}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Primary Brand Color */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-2">
                                    Primary Brand Color
                                </label>
                                <div className="flex items-center gap-3">
                                    {[
                                        '#10B981', // Emerald
                                        '#3B82F6', // Blue
                                        '#6366F1', // Indigo
                                        '#8B5CF6', // Purple
                                        '#EC4899', // Pink
                                        '#F97316', // Orange
                                        '#0F172A', // Dark Slate
                                    ].map(color => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => setBlankColor(color)}
                                            className={`size-8 rounded-full border-2 transition transform active:scale-90 ${
                                                blankColor === color ? 'border-slate-900 scale-110 shadow-sm' : 'border-transparent'
                                            }`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                    <input 
                                        type="color" 
                                        value={blankColor} 
                                        onChange={(e) => setBlankColor(e.target.value)}
                                        className="size-8 rounded-full border border-slate-200 cursor-pointer p-0 overflow-hidden" 
                                    />
                                    <span className="text-xs font-mono text-slate-500 font-semibold">{blankColor}</span>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                                <button
                                    type="submit"
                                    disabled={isCreatingBlank}
                                    className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-sm rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition disabled:opacity-50"
                                >
                                    <Zap size={16} className="fill-white" />
                                    <span>{isCreatingBlank ? 'Creating Shop...' : 'Create Blank Shop 🚀'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* MODE 2: Clone Store with Selection */}
                {creationMode === 'clone' && (
                    <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
                        <div className="flex items-center gap-3 pb-6 border-b border-slate-100">
                            <div className="size-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                                <Sparkles size={24} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">Clone Competitor with Product Selection</h2>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Extract images, titles, and reviews from any public Shopify or e-commerce URL, then choose which products to copy.
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleStartClone} className="space-y-6 mt-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    Competitor Store URL *
                                </label>
                                <div className="flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20">
                                    <Globe size={18} className="text-slate-400 mr-2 shrink-0" />
                                    <input
                                        type="url"
                                        required
                                        value={cloneUrl}
                                        onChange={(e) => setCloneUrl(e.target.value)}
                                        placeholder="https://example-shop.com"
                                        className="w-full bg-transparent border-none outline-none text-sm text-slate-800 placeholder-slate-400 font-medium"
                                    />
                                </div>
                                <p className="text-xs text-slate-400 mt-2">
                                    Works with Shopify, WooCommerce, and standard modern storefronts.
                                </p>
                            </div>

                            {/* Features Checklist */}
                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs text-slate-600">
                                <div className="flex items-center gap-2 font-bold text-slate-800">
                                    <CheckCircle2 size={15} className="text-emerald-600" />
                                    <span>Granular Product Selection</span>
                                </div>
                                <p className="text-[11px] text-slate-500 pl-6">
                                    You will be presented with interactive checkboxes to pick only the products you want to copy into your new shop.
                                </p>
                                <div className="flex items-center gap-2 font-bold text-slate-800 pt-1">
                                    <ShieldCheck size={15} className="text-emerald-600" />
                                    <span>Isolated Database & Orders</span>
                                </div>
                                <p className="text-[11px] text-slate-500 pl-6">
                                    The new store will have its own independent catalog and order records, completely separate from your other stores.
                                </p>
                            </div>

                            {/* Submit Button */}
                            <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                                <button
                                    type="submit"
                                    disabled={isRedirectingClone}
                                    className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-sm rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition disabled:opacity-50"
                                >
                                    <span>{isRedirectingClone ? 'Loading Cloner...' : 'Preview & Select Products'}</span>
                                    <ArrowRight size={16} />
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </main>
        </div>
    );
}
