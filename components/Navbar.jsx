'use client'
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
    Search, 
    ShoppingBag, 
    Heart, 
    Zap, 
    Menu, 
    X, 
    ShieldCheck, 
    Truck, 
    SlidersHorizontal,
    UserCheck,
    Store,
    ChevronDown
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { useWishlist } from '@/lib/wishlist';
import { getAllLocalStores } from '@/lib/activeStore';
import { isStoreDeleted } from '@/lib/firebaseDb';

export default function Navbar({ onOpenCart, onOpenWishlist, onSearchChange, searchTerm = '' }) {
    const router = useRouter();
    const cartCount = useSelector(state => state.cart.total);
    const { count: wishlistCount } = useWishlist();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isOwner, setIsOwner] = useState(false);
    const [searchInput, setSearchInput] = useState(searchTerm);
    const [availableStores, setAvailableStores] = useState([]);
    const [storesMenuOpen, setStoresMenuOpen] = useState(false);
    const storesMenuRef = useRef(null);

    useEffect(() => {
        // Check if master admin is authenticated
        const storedToken = typeof window !== 'undefined' 
            ? (localStorage.getItem('gumshop_admin_token') || sessionStorage.getItem('gumshop_admin_token')) 
            : null;
        if (storedToken && (storedToken.startsWith('gumshop_') || storedToken === 'authenticated' || storedToken.includes('superadmin') || storedToken.includes('meetminal'))) {
            setIsOwner(true);
        }
        const headers = storedToken ? { 'Authorization': `Bearer ${storedToken}` } : {};
        fetch('/api/admin/auth', { headers, credentials: 'include' })
            .then(r => r.json())
            .then(d => { if (d.authenticated) setIsOwner(true); })
            .catch(() => {});

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

            setAvailableStores(Array.from(map.values()));
        };

        loadStores();

        const handleClickOutside = (e) => {
            if (storesMenuRef.current && !storesMenuRef.current.contains(e.target)) {
                setStoresMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearch = (e) => {
        const val = e.target.value;
        setSearchInput(val);
        if (onSearchChange) onSearchChange(val);
    };

    const handleSearchSubmit = (e) => {
        if (e) e.preventDefault();
        const trimmed = searchInput.trim();
        if (trimmed) {
            if (onSearchChange) {
                onSearchChange(trimmed);
                const cat = document.getElementById('catalog');
                if (cat) cat.scrollIntoView({ behavior: 'smooth' });
            } else {
                router.push(`/shop?q=${encodeURIComponent(trimmed)}`);
            }
        }
    };

    return (
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
            {/* Top Announcement Bar */}
            <div className="bg-slate-900 text-white text-[11px] font-semibold py-1.5 px-4 text-center">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="hidden sm:flex items-center gap-2 text-slate-400">
                        <Truck size={13} className="text-emerald-400" />
                        <span>Tracked Worldwide Express Delivery</span>
                    </div>

                    <div className="mx-auto sm:mx-0 flex items-center gap-2">
                        <span className="text-emerald-400 font-extrabold uppercase tracking-wider">⚡ FLASH DEALS:</span>
                        <span>Extra 20% OFF Everything With Code</span>
                        <span className="bg-emerald-500/20 text-emerald-300 font-mono font-bold px-1.5 py-0.2 rounded border border-emerald-500/30">
                            SAVE20
                        </span>
                    </div>

                    <div className="hidden md:flex items-center gap-3 text-slate-400 text-[11px]">
                        <span className="flex items-center gap-1">
                            <ShieldCheck size={13} className="text-emerald-400" /> Buyer Protection
                        </span>
                        <span>•</span>
                        {isOwner ? (
                            <Link href="/dashboard" className="text-emerald-400 hover:underline font-bold flex items-center gap-1">
                                <Store size={12} /> HQ Dashboard
                            </Link>
                        ) : (
                            <Link href="/track" className="hover:text-slate-200 transition">
                                📦 Track Order
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Navbar */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16 sm:h-20 gap-4 sm:gap-6">
                    
                    {/* Brand Logo & Stores Switcher */}
                    <div className="flex items-center gap-3">
                        <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
                            <div className="size-10 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-md shadow-slate-900/10 group-hover:bg-emerald-600 transition-colors">
                                <Zap size={20} className="fill-white" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-lg sm:text-xl font-black tracking-tight text-slate-900 leading-none">
                                    GUM<span className="text-emerald-600">SHOP</span>
                                </span>
                                <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mt-0.5">
                                    Super Store
                                </span>
                            </div>
                        </Link>

                        {availableStores.length > 1 && (
                            <div className="relative hidden lg:block" ref={storesMenuRef}>
                                <button
                                    type="button"
                                    onClick={() => setStoresMenuOpen(!storesMenuOpen)}
                                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200/80 text-slate-700 text-xs font-bold transition"
                                    title="Explore multiple stores"
                                >
                                    <Store size={12} className="text-emerald-600" />
                                    <span>Stores ({availableStores.length})</span>
                                    <ChevronDown size={11} className="text-slate-400" />
                                </button>
                                {storesMenuOpen && (
                                    <div className="absolute left-0 mt-2 w-60 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-2 space-y-1">
                                        <div className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1">Available Stores</div>
                                        {availableStores.map(s => (
                                            <Link
                                                key={s.username}
                                                href={`/shop/${s.username}`}
                                                onClick={() => setStoresMenuOpen(false)}
                                                className="block px-2.5 py-2 rounded-xl text-xs hover:bg-slate-50 text-slate-800 transition"
                                            >
                                                <div className="font-bold text-slate-900 truncate">{s.name}</div>
                                                <div className="text-[10px] text-slate-400 font-mono">/shop/{s.username}</div>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Search Bar with Instant Query */}
                    <form onSubmit={handleSearchSubmit} className="flex-1 max-w-xl hidden md:block">
                        <div className="relative">
                            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by product name, category, or trend..."
                                value={searchInput}
                                onChange={handleSearch}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-100 hover:bg-slate-100/80 focus:bg-white border border-transparent focus:border-emerald-500 rounded-full text-xs font-medium text-slate-800 outline-none transition"
                            />
                            {searchInput && (
                                <button
                                    type="button"
                                    onClick={() => { setSearchInput(''); if (onSearchChange) onSearchChange(''); }}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    </form>

                    {/* Quick Category Navigation Links */}
                    <nav className="hidden lg:flex items-center gap-6 text-xs font-bold text-slate-600">
                        <Link href="/#catalog" className="hover:text-emerald-600 transition">
                            All Products
                        </Link>
                        <Link href="/#flash-deals" className="hover:text-emerald-600 transition flex items-center gap-1 text-rose-600 font-extrabold">
                            🔥 Flash Deals
                        </Link>
                        <Link href="/#reviews" className="hover:text-emerald-600 transition">
                            Reviews
                        </Link>
                    </nav>

                    {/* Right Action Icons */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        {/* Wishlist Button */}
                        <button
                            onClick={onOpenWishlist}
                            className="relative p-2.5 text-slate-600 hover:text-rose-600 hover:bg-slate-100 rounded-full transition"
                            title="View Wishlist"
                        >
                            <Heart size={20} />
                            {wishlistCount > 0 && (
                                <span className="absolute top-1 right-1 size-4 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center animate-in zoom-in">
                                    {wishlistCount}
                                </span>
                            )}
                        </button>

                        {/* Cart Drawer Trigger Button */}
                        <button
                            onClick={onOpenCart}
                            className="relative p-2.5 sm:px-4 sm:py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-full flex items-center gap-2 shadow-sm transition active:scale-98"
                            title="Open Cart"
                        >
                            <ShoppingBag size={18} />
                            <span className="hidden sm:inline text-xs font-bold">Cart</span>
                            {cartCount > 0 && (
                                <span className="size-4 sm:size-5 bg-emerald-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                                    {cartCount}
                                </span>
                            )}
                        </button>

                        {/* Owner Quick Access */}
                        {isOwner && (
                            <Link
                                href="/dashboard"
                                className="hidden sm:inline-flex p-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-full transition"
                                title="Store HQ / Cloner"
                            >
                                <Store size={18} />
                            </Link>
                        )}

                        {/* Mobile Hamburger Menu */}
                        <button
                            onClick={() => setMobileMenuOpen(true)}
                            className="p-2 text-slate-700 hover:bg-slate-100 rounded-xl md:hidden"
                        >
                            <Menu size={22} />
                        </button>
                    </div>

                </div>

                {/* Mobile Search Input */}
                <form onSubmit={handleSearchSubmit} className="pb-3 md:hidden">
                    <div className="relative">
                        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search catalog..."
                            value={searchInput}
                            onChange={handleSearch}
                            className="w-full pl-9 pr-4 py-2 bg-slate-100 border border-slate-200 rounded-full text-xs font-medium text-slate-800 outline-none"
                        />
                    </div>
                </form>
            </div>

            {/* Mobile Drawer */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs md:hidden animate-in fade-in">
                    <div className="fixed inset-y-0 right-0 w-full max-w-xs bg-white p-6 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right">
                        <div>
                            <div className="flex items-center justify-between pb-6 border-b border-slate-100">
                                <div className="flex items-center gap-2">
                                    <div className="size-8 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                                        <Zap size={16} className="fill-white" />
                                    </div>
                                    <span className="font-extrabold text-base text-slate-900">GumShop</span>
                                </div>
                                <button onClick={() => setMobileMenuOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex flex-col gap-2 mt-6 text-sm font-bold text-slate-700">
                                <Link 
                                    href="/#catalog" 
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="p-3 rounded-xl hover:bg-slate-50 transition"
                                >
                                    Browse All Products
                                </Link>
                                <Link 
                                    href="/#flash-deals" 
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="p-3 rounded-xl bg-rose-50 text-rose-700 font-extrabold transition flex items-center justify-between"
                                >
                                    <span>🔥 Flash Deals</span>
                                    <span className="text-[10px] bg-rose-200 px-2 py-0.5 rounded-full">Limited</span>
                                </Link>
                                <Link 
                                    href="/#reviews" 
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="p-3 rounded-xl hover:bg-slate-50 transition"
                                >
                                    Customer Reviews
                                </Link>
                                <Link 
                                    href="/track" 
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="p-3 rounded-xl hover:bg-slate-50 transition"
                                >
                                    📦 Track My Order
                                </Link>
                                <Link 
                                    href="/cart" 
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="p-3 rounded-xl hover:bg-slate-50 transition flex items-center justify-between"
                                >
                                    <span>My Cart</span>
                                    <span className="text-xs bg-slate-900 text-white size-5 rounded-full flex items-center justify-center">
                                        {cartCount}
                                    </span>
                                </Link>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-100">
                            {isOwner ? (
                                <Link
                                    href="/dashboard"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="w-full py-3 bg-emerald-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm"
                                >
                                    <Store size={15} />
                                    <span>Enter Owner HQ</span>
                                </Link>
                            ) : (
                                <Link
                                    href="/login"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="w-full py-3 bg-slate-900 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2"
                                >
                                    <span>Store Owner Access</span>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}