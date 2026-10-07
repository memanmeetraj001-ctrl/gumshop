'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
    Zap, 
    ArrowLeft, 
    CheckCircle2, 
    XCircle, 
    AlertCircle, 
    RefreshCw, 
    Key, 
    ExternalLink, 
    ShieldCheck, 
    ShoppingBag, 
    Check, 
    Lock,
    Link2,
    Eye
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getActiveStoreSync } from '@/lib/activeStore';
import { GumroadMappingStatus } from '@/lib/paymentStatus';

export default function GumroadIntegrationPage() {
    const [connectionStatus, setConnectionStatus] = useState('checking'); // 'connected' | 'disconnected' | 'checking'
    const [accountInfo, setAccountInfo] = useState(null);
    const [tokenInput, setTokenInput] = useState('');
    const [isConnecting, setIsConnecting] = useState(false);
    const [isTesting, setIsTesting] = useState(false);

    // Active Store & Products
    const [activeStore, setActiveStore] = useState(null);
    const [products, setProducts] = useState([]);
    const [syncingProductId, setSyncingProductId] = useState(null);

    // Check status on load strictly from server vault
    const checkStatus = async () => {
        setConnectionStatus('checking');

        try {
            const res = await fetch('/api/gumroad/status');
            const data = await res.json();

            if (data.connected) {
                setConnectionStatus('connected');
                setAccountInfo(data.account);
            } else {
                setConnectionStatus('disconnected');
                setAccountInfo(null);
            }
        } catch {
            setConnectionStatus('disconnected');
        }
    };

    useEffect(() => {
        checkStatus();
        const store = getActiveStoreSync();
        if (store) {
            setActiveStore(store);
            setProducts(store.products || []);
        }
    }, []);

    // Connect Handler
    const handleConnect = async (e) => {
        e?.preventDefault();
        if (!tokenInput.trim()) {
            toast.error('Please enter a Gumroad API token');
            return;
        }

        setIsConnecting(true);
        try {
            const res = await fetch('/api/gumroad/connect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: tokenInput.trim() })
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.error || 'Gumroad verification failed');
            }

            setConnectionStatus('connected');
            setAccountInfo(data.user);
            setTokenInput('');
            toast.success(data.message || 'Connected to Gumroad! 🎉');
        } catch (err) {
            toast.error(err.message || 'Could not connect to Gumroad');
        } finally {
            setIsConnecting(false);
        }
    };

    // Disconnect Handler
    const handleDisconnect = async () => {
        if (!confirm('Disconnect Gumroad? Live checkout will fall back to standard links.')) return;

        try {
            await fetch('/api/gumroad/connect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'disconnect' })
            });
            setConnectionStatus('disconnected');
            setAccountInfo(null);
            toast.success('Gumroad disconnected.');
        } catch {
            toast.error('Failed to disconnect from server.');
        }
    };

    // Test Connection Handler
    const handleTestConnection = async () => {
        setIsTesting(true);
        await checkStatus();
        setIsTesting(false);
        toast.success('Connection status updated!');
    };

    // Determine Product Gumroad Mapping Status
    const getProductMappingStatus = (prod) => {
        if (connectionStatus !== 'connected') {
            return GumroadMappingStatus.NOT_CONNECTED;
        }
        if (prod.syncError) {
            return GumroadMappingStatus.ERROR;
        }
        if (prod.gumroadProductId || prod.isInstantBuyGumroad || prod.gumroadProductUrl) {
            if (prod.lastSyncedAt) {
                const daysOld = (Date.now() - new Date(prod.lastSyncedAt).getTime()) / (1000 * 60 * 60 * 24);
                if (daysOld > 14) return GumroadMappingStatus.STALE;
            }
            return GumroadMappingStatus.SYNCED;
        }
        if (prod.gumroadPermalink) {
            return GumroadMappingStatus.CONNECTED;
        }
        return GumroadMappingStatus.UNAVAILABLE;
    };

    // Sync Individual Product Handler
    const handleSyncProduct = async (prod) => {
        setSyncingProductId(prod.id);

        try {
            const res = await fetch('/api/gumroad/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId: prod.id,
                    name: prod.name,
                    price: prod.price,
                    description: prod.description
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Sync request failed');
            }

            // Update in local state
            setProducts(prev => prev.map(p => {
                if (p.id === prod.id) {
                    return {
                        ...p,
                        gumroadProductId: data.gumroadId || p.gumroadProductId || 'g_synced',
                        lastSyncedAt: new Date().toISOString()
                    };
                }
                return p;
            }));

            toast.success(`"${prod.name}" synced with Gumroad!`);
        } catch (err) {
            toast.error(err.message || 'Product sync failed');
        } finally {
            setSyncingProductId(null);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased">
            {/* Header */}
            <header className="px-6 py-4 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link
                        href="/dashboard"
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition flex items-center gap-1.5 text-xs font-bold"
                    >
                        <ArrowLeft size={14} /> Master Dashboard
                    </Link>
                    <span className="text-slate-700">|</span>
                    <div className="flex items-center gap-2">
                        <div className="size-7 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center font-black text-sm">
                            G
                        </div>
                        <h1 className="text-sm font-bold text-white tracking-tight">Gumroad Commerce Integration</h1>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1">
                        <ShieldCheck size={12} /> Server-Side Vaulted
                    </span>
                </div>
            </header>

            {/* Main Stage */}
            <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">

                {/* Connection Status Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                        <div className="flex items-center gap-3.5">
                            <div className="size-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center font-black text-xl">
                                G
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-base font-extrabold text-white">Gumroad API Status</h2>
                                    {connectionStatus === 'connected' ? (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                            Connected
                                        </span>
                                    ) : connectionStatus === 'checking' ? (
                                        <span className="text-xs text-slate-400">Verifying...</span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700">
                                            Not Connected
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    {connectionStatus === 'connected' && accountInfo 
                                        ? `Authenticated as ${accountInfo.name} (${accountInfo.email || accountInfo.currency})` 
                                        : 'Connect your Gumroad account to enable zero-redirect checkout and inventory sync.'}
                                </p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <button
                                onClick={handleTestConnection}
                                disabled={isTesting}
                                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1.5"
                            >
                                <RefreshCw size={13} className={isTesting ? 'animate-spin' : ''} />
                                <span>Test Connection</span>
                            </button>
                            {connectionStatus === 'connected' && (
                                <button
                                    onClick={handleDisconnect}
                                    className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-bold transition border border-rose-500/20"
                                >
                                    Disconnect
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Connect Token Form (If disconnected) */}
                    {connectionStatus === 'disconnected' && (
                        <form onSubmit={handleConnect} className="mt-6 space-y-4 max-w-xl">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                                    Gumroad Access Token
                                </label>
                                <div className="relative">
                                    <Key size={16} className="absolute left-3.5 top-3 text-slate-500" />
                                    <input
                                        type="password"
                                        required
                                        placeholder="Paste your Gumroad API Access Token"
                                        value={tokenInput}
                                        onChange={(e) => setTokenInput(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none font-mono"
                                    />
                                </div>
                                <p className="text-[11px] text-slate-500 mt-2">
                                    Generate your token in Gumroad Settings ➔ Advanced ➔ Create Application / Access Token.
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={isConnecting}
                                className="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-xs shadow-md transition active:scale-95 flex items-center gap-2"
                            >
                                <Lock size={13} />
                                <span>{isConnecting ? 'Verifying with Gumroad...' : 'Securely Connect Gumroad'}</span>
                            </button>
                        </form>
                    )}
                </div>

                {/* Product Mapping & Sync Center */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                        <div>
                            <h3 className="text-base font-extrabold text-white">Product Synchronization</h3>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Active Store: <strong className="text-slate-200">{activeStore?.name || 'Selected Store'}</strong> ({products.length} products)
                            </p>
                        </div>
                        <Link
                            href="/store/manage-product"
                            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                        >
                            <span>Manage Products</span>
                            <ExternalLink size={12} />
                        </Link>
                    </div>

                    {products.length > 0 ? (
                        <div className="mt-4 divide-y divide-slate-800/80">
                            {products.map((prod) => {
                                const isSynced = Boolean(prod.gumroadProductId || prod.isInstantBuyGumroad);
                                const isSyncing = syncingProductId === prod.id;

                                return (
                                    <div key={prod.id} className="py-3.5 flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="size-11 rounded-xl bg-slate-800 shrink-0 overflow-hidden border border-slate-700">
                                                <img 
                                                    src={prod.image || prod.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'} 
                                                    alt={prod.name} 
                                                    className="w-full h-full object-cover" 
                                                />
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="text-xs font-bold text-white truncate max-w-md">{prod.name}</h4>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-xs font-black text-emerald-400">${parseFloat(prod.price || 0).toFixed(2)}</span>
                                                    <span className="text-[10px] text-slate-500 font-mono">ID: {prod.id}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 shrink-0">
                                            {(() => {
                                                const mappingStatus = getProductMappingStatus(prod);
                                                switch (mappingStatus) {
                                                    case GumroadMappingStatus.SYNCED:
                                                        return (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                                                                <Check size={11} /> Synced
                                                            </span>
                                                        );
                                                    case GumroadMappingStatus.CONNECTED:
                                                        return (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-bold border border-blue-500/20">
                                                                <Link2 size={11} /> Connected
                                                            </span>
                                                        );
                                                    case GumroadMappingStatus.STALE:
                                                        return (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-bold border border-amber-500/20">
                                                                <AlertCircle size={11} /> Stale
                                                            </span>
                                                        );
                                                    case GumroadMappingStatus.ERROR:
                                                        return (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 text-[10px] font-bold border border-rose-500/20">
                                                                <XCircle size={11} /> Error
                                                            </span>
                                                        );
                                                    case GumroadMappingStatus.UNAVAILABLE:
                                                        return (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 text-[10px] font-bold border border-slate-700">
                                                                — Unavailable
                                                            </span>
                                                        );
                                                    case GumroadMappingStatus.NOT_CONNECTED:
                                                    default:
                                                        return (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 text-[10px] font-bold border border-slate-700">
                                                                Not Connected
                                                            </span>
                                                        );
                                                }
                                            })()}

                                            <button
                                                onClick={() => handleSyncProduct(prod)}
                                                disabled={isSyncing}
                                                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition flex items-center gap-1"
                                            >
                                                <RefreshCw size={11} className={isSyncing ? 'animate-spin' : ''} />
                                                <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-10 text-slate-500 text-xs">
                            No products loaded in the active store catalog.
                        </div>
                    )}
                </div>

            </main>
        </div>
    );
}
