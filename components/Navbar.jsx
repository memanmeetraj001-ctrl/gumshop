'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Store, 
  Layers, 
  ShoppingBag, 
  Copy, 
  RefreshCw, 
  Trash2, 
  Plus, 
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Navbar({ stores = [], activeStore, onStoreChange }) {
  const pathname = usePathname();
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/sync', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        toast.success('1-Click Sync complete! All storefronts & creator links updated.');
        router.refresh();
      } else {
        toast.error('Sync failed: ' + (data.error || 'Unknown'));
      }
    } catch {
      toast.error('Sync request failed');
    } finally {
      setSyncing(false);
    }
  };

  const handleResetAll = async () => {
    if (!confirm('WARNING: Are you sure you want to completely erase ALL stores and products in Supabase to zero? This action cannot be undone.')) {
      return;
    }
    const toastId = toast.loading('Erasing all store and product data...');
    try {
      const res = await fetch('/api/reset', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        toast.success('All stores & products reset to 0!', { id: toastId });
        window.location.href = '/dashboard';
      } else {
        toast.error('Reset failed: ' + (data.error || 'Server error'), { id: toastId });
      }
    } catch (e) {
      toast.error('Reset error: ' + e.message, { id: toastId });
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2.5 font-black text-lg tracking-tight hover:opacity-90 transition">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/20">
              G
            </div>
            <span className="bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
              GumShop <span className="text-xs uppercase px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 font-semibold border border-indigo-500/30">v2 Pure</span>
            </span>
          </Link>

          {/* Store Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition"
            >
              <Store className="w-3.5 h-3.5 text-indigo-400" />
              <span>{activeStore?.name || 'No Store Selected'}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
            </button>

            {dropdownOpen && (
              <div className="absolute left-0 mt-2 w-56 rounded-xl bg-slate-800 border border-slate-700 shadow-xl py-2 z-50">
                <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-700/60">
                  Switch Active Store ({stores.length})
                </div>
                {stores.length === 0 ? (
                  <div className="px-3 py-3 text-xs text-slate-400 text-center">
                    No active stores
                  </div>
                ) : (
                  stores.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        onStoreChange?.(s);
                        setDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-700 transition ${
                        activeStore?.id === s.id ? 'bg-indigo-600/20 text-indigo-300 font-bold' : 'text-slate-300'
                      }`}
                    >
                      <span className="truncate">{s.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">/{s.slug}</span>
                    </button>
                  ))
                )}
                <div className="border-t border-slate-700/60 mt-1 pt-1 px-2">
                  <Link
                    href="/store/create"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-2 py-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create New Store</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 text-xs font-medium text-slate-300">
          <Link 
            href="/dashboard"
            className={`px-3 py-2 rounded-lg transition ${pathname === '/dashboard' ? 'bg-slate-800 text-white font-semibold' : 'hover:bg-slate-800/60'}`}
          >
            Dashboard
          </Link>
          <Link 
            href={`/store/manage-product${activeStore ? `?store=${activeStore.slug}` : ''}`}
            className={`px-3 py-2 rounded-lg transition ${pathname.includes('manage-product') ? 'bg-slate-800 text-white font-semibold' : 'hover:bg-slate-800/60'}`}
          >
            Products & Margins
          </Link>
          <Link 
            href={`/store/cloner${activeStore ? `?store=${activeStore.slug}` : ''}`}
            className={`px-3 py-2 rounded-lg transition ${pathname.includes('cloner') ? 'bg-slate-800 text-white font-semibold' : 'hover:bg-slate-800/60'}`}
          >
            Store Cloner
          </Link>

          {activeStore && (
            <>
              <a 
                href={`/shop/${activeStore.slug}`} 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-slate-800/60 text-indigo-300"
              >
                <span>Storefront</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <a 
                href={`/creator/${activeStore.slug}`} 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-slate-800/60 text-purple-300"
              >
                <span>Link-in-Bio</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </>
          )}
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* 1-Click Sync Button */}
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow transition disabled:opacity-50"
            title="1-Click Sync Catalog across Storefront and Link-in-Bio"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">1-Click Sync</span>
          </button>

          {/* Wipe All Data Button */}
          <button
            onClick={handleResetAll}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-800/50 text-red-300 text-xs font-semibold transition"
            title="Wipe database to zero"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Wipe to 0</span>
          </button>
        </div>
      </div>
    </header>
  );
}
