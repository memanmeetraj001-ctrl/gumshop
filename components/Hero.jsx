'use client'
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Zap, Sparkles, ArrowRight, ShieldCheck, CheckCircle2, Copy, Play, ShoppingBag, ExternalLink, Layers, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Hero() {
    const router = useRouter();
    const [storeUrl, setStoreUrl] = useState('');
    const [previewTab, setPreviewTab] = useState('gumshop');

    const handleCloneSubmit = (e) => {
        e.preventDefault();
        if (!storeUrl.trim()) {
            toast.error('Please enter a store URL to clone!');
            return;
        }
        router.push(`/create-store?target=${encodeURIComponent(storeUrl.trim())}`);
    };

    return (
        <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-32 bg-white border-b border-slate-200/80">
            {/* Subtle engineering grid background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none -z-10" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Header Content */}
                <div className="text-center max-w-4xl mx-auto">
                    
                    {/* Launch Pill */}
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 text-white text-xs font-semibold mb-6 shadow-sm">
                        <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span>The 100% Free Shopify Alternative for Creators</span>
                        <span className="text-slate-400">•</span>
                        <span className="text-emerald-400 font-bold">0% Fees Forever</span>
                    </div>

                    {/* Main Headline */}
                    <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-950 leading-[1.1]">
                        Clone Any Winning Store <br className="hidden sm:inline" />
                        <span className="text-emerald-600">
                            In 60 Seconds.
                        </span>
                    </h1>

                    {/* Subheadline */}
                    <p className="mt-6 text-base sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
                        Paste any Instagram, TikTok, or Shopify store link. Our autonomous engine extracts banners, product catalogs, and verified customer reviews into a high-converting storefront in 1 click.
                    </p>

                    {/* The 1-Click Clone URL Bar */}
                    <form onSubmit={handleCloneSubmit} className="mt-8 sm:mt-10 max-w-2xl mx-auto">
                        <div className="flex flex-col sm:flex-row items-center gap-2 p-1.5 bg-slate-50 border-2 border-slate-200 rounded-2xl sm:rounded-full shadow-lg shadow-slate-900/5 focus-within:border-emerald-600 focus-within:bg-white transition-all">
                            <div className="flex items-center gap-3 w-full px-4 py-2 sm:py-0">
                                <Sparkles size={18} className="text-emerald-600 shrink-0" />
                                <input 
                                    type="url"
                                    placeholder="Paste any Shopify, TikTok, or Instagram store URL..."
                                    value={storeUrl}
                                    onChange={(e) => setStoreUrl(e.target.value)}
                                    className="w-full bg-transparent outline-none text-sm sm:text-base text-slate-900 placeholder:text-slate-400"
                                    required
                                />
                            </div>
                            <button 
                                type="submit"
                                className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl sm:rounded-full bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-sm shadow-md shadow-emerald-600/30 transition-all"
                            >
                                <Zap size={16} className="fill-white" />
                                <span>Clone Store Free</span>
                            </button>
                        </div>
                    </form>

                    {/* Trust Proof Points */}
                    <div className="mt-5 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs sm:text-sm text-slate-500 font-medium">
                        <span className="flex items-center gap-1.5">
                            <Check size={16} className="text-emerald-600 font-bold" /> Free Forever ($0/month)
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Check size={16} className="text-emerald-600 font-bold" /> Zero Shopify App Subscriptions
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Check size={16} className="text-emerald-600 font-bold" /> White-Labeled Checkout
                        </span>
                    </div>

                </div>

                {/* Interactive High-Fidelity Studio Comparison Preview */}
                <div className="mt-14 sm:mt-20 max-w-5xl mx-auto rounded-3xl bg-slate-950 p-2 sm:p-4 shadow-2xl border border-slate-800">
                    <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
                        
                        {/* Browser Window Bar */}
                        <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800 text-xs text-slate-400">
                            <div className="flex items-center gap-2">
                                <span className="size-3 rounded-full bg-rose-500/80" />
                                <span className="size-3 rounded-full bg-amber-500/80" />
                                <span className="size-3 rounded-full bg-emerald-500/80" />
                            </div>

                            {/* View Switcher Tabs */}
                            <div className="flex items-center p-1 bg-slate-900 rounded-xl border border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setPreviewTab('gumshop')}
                                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                                        previewTab === 'gumshop'
                                            ? 'bg-emerald-600 text-white shadow-xs'
                                            : 'text-slate-400 hover:text-white'
                                    }`}
                                >
                                    ⚡ GumShop (60s Cloned Store)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPreviewTab('shopify')}
                                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                                        previewTab === 'shopify'
                                            ? 'bg-slate-800 text-slate-200'
                                            : 'text-slate-500 hover:text-slate-300'
                                    }`}
                                >
                                    🛒 Traditional Shopify ($120/mo)
                                </button>
                            </div>

                            <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
                                <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
                                <span>Live Demo</span>
                            </div>
                        </div>

                        {/* Tab Content Display */}
                        {previewTab === 'gumshop' ? (
                            <div className="p-6 sm:p-10 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                                {/* Cloned Store Details */}
                                <div className="md:col-span-2 space-y-4">
                                    <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/80 to-slate-900 border border-emerald-500/30 text-white">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs uppercase font-extrabold tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                                Extracted in 42s
                                            </span>
                                            <span className="text-xs text-slate-400">100% White-Labeled</span>
                                        </div>
                                        <h3 className="text-2xl font-bold mt-3">Aura Trends — Viral Beauty & Lifestyle</h3>
                                        <p className="text-xs text-slate-400 mt-1">12 Products Cloned • 4.9/5 Rating (142 Reviews) • ⚡ Instant Checkout</p>
                                    </div>

                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/60 text-center">
                                            <p className="text-xs text-slate-400 font-medium">Monthly Cost</p>
                                            <p className="text-xl font-black text-emerald-400 mt-1">$0.00</p>
                                        </div>
                                        <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/60 text-center">
                                            <p className="text-xs text-slate-400 font-medium">Checkout Flow</p>
                                            <p className="text-xl font-black text-white mt-1">⚡ In-Page</p>
                                        </div>
                                        <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/60 text-center">
                                            <p className="text-xs text-slate-400 font-medium">Load Latency</p>
                                            <p className="text-xl font-black text-teal-400 mt-1">&lt; 200ms</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Mobile In-Bio Card */}
                                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between shadow-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="size-11 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white text-sm">
                                            AT
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white">@auratrends</p>
                                            <p className="text-[11px] text-emerald-400 font-medium">Verified Pioneer Store</p>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-4 p-3 rounded-xl bg-slate-900 border border-slate-800">
                                        <p className="text-xs font-semibold text-slate-200">Crystal Hair Eraser (Viral)</p>
                                        <p className="text-sm font-bold text-emerald-400 mt-1">$52.99 <span className="line-through text-slate-500 text-xs">$69.99</span></p>
                                    </div>

                                    <div className="mt-4">
                                        <button className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 font-bold text-slate-950 text-xs shadow-md transition flex items-center justify-center gap-1.5 active:scale-95">
                                            <Zap size={14} className="fill-slate-950" /> ⚡ Buy Now ($52.99)
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-6 sm:p-10 space-y-4">
                                <div className="p-6 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-white">
                                    <span className="text-xs uppercase font-extrabold tracking-wider px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                        Shopify Reality Check
                                    </span>
                                    <h3 className="text-2xl font-bold mt-3">Expensive, Complicated & Slow for Beginners</h3>
                                    <p className="text-xs text-slate-400 mt-1">Requires 5-7 days setup, complex liquid code, and expensive monthly apps before your first sale.</p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center text-xs">
                                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                                        <p className="text-slate-400">Basic Plan</p>
                                        <p className="text-lg font-bold text-rose-400 mt-1">$39 / mo</p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                                        <p className="text-slate-400">Reviews App</p>
                                        <p className="text-lg font-bold text-rose-400 mt-1">$29 / mo</p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                                        <p className="text-slate-400">Upsell / Re-order App</p>
                                        <p className="text-lg font-bold text-rose-400 mt-1">$35 / mo</p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                                        <p className="text-slate-400">Total Monthly Burn</p>
                                        <p className="text-lg font-bold text-rose-500 mt-1">$103+ / mo</p>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                </div>

            </div>
        </section>
    );
}