'use client'
import Link from "next/link"
import { useAuth } from "@/lib/AuthContext"
import { useRouter } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import { Zap, LogOut, ExternalLink, ShieldCheck, Layers, Smartphone, Copy, Store, ChevronDown, Check, Star } from "lucide-react"
import toast from "react-hot-toast"
import { getAllLocalStores, setActiveStoreSlug, getHomepageStoreSlug, setHomepageStoreSlug } from "@/lib/activeStore"
import { isStoreDeleted } from "@/lib/firebaseDb"

const StoreNavbar = ({ storeInfo }) => {
    const { user, logout } = useAuth()
    const router = useRouter()
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const [allStores, setAllStores] = useState([])
    const [homepageStoreSlug, setHomepageStoreSlugState] = useState('')
    const dropdownRef = useRef(null)

    const loadAllStoresData = async () => {
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
                                username: slug,
                                theme: s.theme || 'viral_lander'
                            });
                        }
                    });
                }
            }
        } catch {}

        setAllStores(Array.from(map.values()));
        getHomepageStoreSlug().then(slug => {
            if (slug) setHomepageStoreSlugState(slug);
        });
    };

    useEffect(() => {
        loadAllStoresData();
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsDropdownOpen(false)
            }
        }
        const handleHomepageEvent = (e) => {
            if (e?.detail?.slug) setHomepageStoreSlugState(e.detail.slug);
        };
        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('homepage_store_changed', handleHomepageEvent);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('homepage_store_changed', handleHomepageEvent);
        };
    }, [])

    const handleOwnerLogout = async () => {
        try {
            await fetch('/api/admin/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'logout' })
            });
            if (logout) await logout();
        } catch (e) {}
        toast.success("Admin session closed");
        router.replace('/');
    };

    const handleSetHomepageInNav = async (e, s) => {
        e.stopPropagation();
        const slug = s.username || s.id;
        await setHomepageStoreSlug(slug);
        setHomepageStoreSlugState(slug);
        toast.success(`Store "${s.name}" is now the Root Homepage (/)! 🌟`);
    };

    const storeSlug = storeInfo?.username || storeInfo?.name?.toLowerCase().replace(/[^a-z0-9-]+/g, '') || 'shop';

    return (
        <div className="flex items-center justify-between px-6 lg:px-12 py-3 bg-white border-b border-slate-200 transition-all shadow-xs">
            <div className="flex items-center gap-4">
                <Link href="/dashboard" className="flex items-center gap-2 group">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white shadow-sm shadow-emerald-500/30 group-hover:scale-105 transition">
                        <Zap className="w-5 h-5 fill-white" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-slate-900">
                        GumShop<span className="text-emerald-500">.online</span>
                    </span>
                </Link>

                {/* Active Store Switcher */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 transition text-xs font-bold text-slate-800"
                        title="Click to switch active store"
                    >
                        <Store size={14} className="text-emerald-600 shrink-0" />
                        <span className="max-w-[130px] truncate">{storeInfo?.name || 'Active Store'}</span>
                        {homepageStoreSlug && (storeInfo?.username === homepageStoreSlug || storeInfo?.id === homepageStoreSlug) && (
                            <span className="text-[10px] text-amber-500 font-black shrink-0" title="This store is currently the Root Homepage">⭐</span>
                        )}
                        <ChevronDown size={12} className="text-slate-400 shrink-0" />
                    </button>

                    {isDropdownOpen && (
                        <div className="absolute left-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-2 space-y-1">
                            <div className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1 flex items-center justify-between">
                                <span>Switch Active Store</span>
                                <span>Homepage</span>
                            </div>
                            {allStores.map(s => {
                                const isCurrent = (storeInfo?.username === s.username || storeInfo?.id === s.id);
                                const isHome = Boolean(homepageStoreSlug && (homepageStoreSlug === s.username || homepageStoreSlug === s.id));
                                return (
                                    <div
                                        key={s.id || s.username}
                                        className={`w-full px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition ${
                                            isCurrent
                                                ? 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-200/60'
                                                : 'hover:bg-slate-50 text-slate-700'
                                        }`}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setActiveStoreSlug(s);
                                                setIsDropdownOpen(false);
                                                window.location.reload();
                                            }}
                                            className="min-w-0 pr-2 flex-1 text-left"
                                        >
                                            <div className="truncate font-bold flex items-center gap-1.5">
                                                <span>{s.name}</span>
                                                {isHome && (
                                                    <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[9px] font-black border border-amber-200">
                                                        ⭐ Home
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-[10px] text-slate-400 font-mono">/shop/{s.username}</div>
                                        </button>

                                        <div className="flex items-center gap-1 shrink-0">
                                            {!isHome && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => handleSetHomepageInNav(e, s)}
                                                    className="p-1 text-slate-400 hover:text-amber-500 rounded hover:bg-amber-50 transition text-[11px]"
                                                    title="Designate as Root Homepage (/)"
                                                >
                                                    <Star size={12} />
                                                </button>
                                            )}
                                            {isCurrent && <span className="size-2 rounded-full bg-emerald-500 shrink-0 ml-1" />}
                                        </div>
                                    </div>
                                );
                            })}
                            <div className="border-t border-slate-100 pt-1 mt-1">
                                <Link
                                    href="/create-store"
                                    onClick={() => setIsDropdownOpen(false)}
                                    className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-bold text-emerald-600 hover:bg-emerald-50 flex items-center gap-1.5"
                                >
                                    <span>+ Create New Store</span>
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-3">
                <Link
                    href="/dashboard"
                    className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-emerald-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition"
                >
                    <Layers className="w-3.5 h-3.5" />
                    <span>My Shops</span>
                </Link>

                {storeSlug && (
                    <>
                        <div className="hidden lg:flex items-center gap-1 bg-rose-50 border border-rose-200/80 rounded-lg p-0.5">
                            <Link 
                                href={`/creator/${storeSlug}`} 
                                target="_blank"
                                className="flex items-center gap-1.5 text-xs font-bold text-rose-700 hover:text-rose-800 px-2.5 py-1 rounded-md transition"
                                title="Open Link-in-Bio Storefront for Instagram / TikTok"
                            >
                                <Smartphone className="w-3.5 h-3.5" />
                                <span>Insta Bio Mode</span>
                            </Link>
                            <button
                                type="button"
                                onClick={() => {
                                    const url = typeof window !== 'undefined' ? `${window.location.origin}/creator/${storeSlug}` : `https://gumshop.online/creator/${storeSlug}`;
                                    navigator.clipboard.writeText(url);
                                    toast.success(`Copied Insta Bio Link: /creator/${storeSlug}! 📋`);
                                }}
                                className="p-1 text-rose-600 hover:text-rose-900 hover:bg-rose-100 rounded transition"
                                title="Copy Link for Instagram Bio"
                            >
                                <Copy className="w-3 h-3" />
                            </button>
                        </div>

                        <Link 
                            href={`/shop/${storeSlug}`} 
                            target="_blank"
                            className="hidden md:flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 transition"
                        >
                            <span>Live Storefront</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                    </>
                )}

                {/* Owner Session Active Status */}
                <div className="flex items-center gap-2.5 bg-emerald-50/70 border border-emerald-200/80 px-3 py-1.5 rounded-xl">
                    <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                    <div className="text-left hidden sm:block">
                        <p className="text-xs font-bold text-slate-900 leading-tight">
                            {user?.name || storeInfo?.name || "Store Owner"}
                        </p>
                        <p className="text-[10px] font-semibold text-emerald-700 leading-tight flex items-center gap-1">
                            <ShieldCheck className="w-2.5 h-2.5" /> Master Access
                        </p>
                    </div>
                    <button
                        onClick={handleOwnerLogout}
                        className="text-xs text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg p-1 transition ml-1"
                        title="Sign Out"
                    >
                        <LogOut className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </div>
    )
}

export default StoreNavbar