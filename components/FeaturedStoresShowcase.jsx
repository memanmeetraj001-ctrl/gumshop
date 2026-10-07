'use client'
import Link from 'next/link';
import { ExternalLink, Zap, Star, Sparkles, Store, ArrowRight } from 'lucide-react';

const FEATURED_STORES = [
    {
        id: "aura-trends",
        name: "Aura Trends",
        slug: "aura-trends",
        category: "Viral Beauty & Lifestyle",
        description: "Curated personal care and viral beauty tools trending across TikTok and Instagram.",
        logo: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200",
        cover: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600",
        rating: 4.9,
        reviews: 142,
        productsCount: 12,
        theme: "TikTok Lander"
    },
    {
        id: "neon-vault",
        name: "Neon Vault",
        slug: "neon-vault",
        category: "Gaming & Cyberpunk Audio",
        description: "Spatial audio studio headsets, custom RGB desk pads, and desk aesthetics.",
        logo: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200",
        cover: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600",
        rating: 4.8,
        reviews: 98,
        productsCount: 8,
        theme: "Tech Hardware"
    },
    {
        id: "clean-glow",
        name: "Clean Glow",
        slug: "clean-glow",
        category: "Home & Ambient Lighting",
        description: "Eco-friendly minimalist lamps, ambient circadian lights, and smart home essentials.",
        logo: "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=200",
        cover: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600",
        rating: 5.0,
        reviews: 64,
        productsCount: 15,
        theme: "Clean Minimalist"
    }
];

export default function FeaturedStoresShowcase() {
    return (
        <section className="py-20 sm:py-28 bg-slate-50 border-t border-slate-200/80">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/80 border border-emerald-200 px-3.5 py-1 rounded-full">
                        👑 Real Creator Success Stories
                    </span>
                    <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-950 tracking-tight mt-4">
                        Live Stores Built on GumShop
                    </h2>
                    <p className="mt-3 text-base sm:text-lg text-slate-600">
                        Explore high-converting storefronts launched in 60 seconds. 100% white-labeled with $0 monthly app fees.
                    </p>
                </div>

                {/* 3 Featured Stores Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {FEATURED_STORES.map((store) => (
                        <div 
                            key={store.id} 
                            className="flex flex-col bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-xl hover:border-emerald-500/40 transition-all duration-300 group"
                        >
                            {/* Store Cover Preview */}
                            <div className="relative h-44 overflow-hidden bg-slate-900">
                                <img 
                                    src={store.cover} 
                                    alt={store.name} 
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90" 
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                                
                                <span className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-900/90 text-white backdrop-blur-xs border border-white/10">
                                    {store.theme}
                                </span>

                                {/* Logo floating */}
                                <div className="absolute -bottom-4 left-6 size-14 rounded-2xl bg-white p-1 border-2 border-slate-100 shadow-md">
                                    <img src={store.logo} alt="" className="size-full rounded-xl object-cover" />
                                </div>
                            </div>

                            {/* Store Content */}
                            <div className="p-6 pt-7 flex flex-col justify-between flex-1">
                                <div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
                                            {store.category}
                                        </span>
                                        <div className="flex items-center gap-1 text-xs font-bold text-slate-700">
                                            <Star size={13} className="text-amber-400 fill-amber-400" />
                                            <span>{store.rating}</span>
                                            <span className="text-slate-400 font-normal">({store.reviews})</span>
                                        </div>
                                    </div>

                                    <h3 className="text-xl font-bold text-slate-900 mt-2 group-hover:text-emerald-700 transition">
                                        {store.name}
                                    </h3>

                                    <p className="text-xs text-slate-500 mt-2 leading-relaxed line-clamp-2">
                                        {store.description}
                                    </p>
                                </div>

                                {/* Action Buttons */}
                                <div className="mt-6 pt-5 border-t border-slate-100 flex items-center gap-2">
                                    <Link
                                        href={`/shop/${store.slug}`}
                                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition"
                                    >
                                        <span>View Store</span>
                                        <ExternalLink size={13} />
                                    </Link>
                                    
                                    <Link
                                        href={`/store/cloner?target=${encodeURIComponent(`https://gumshop.online/shop/${store.slug}`)}`}
                                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm shadow-emerald-600/20 active:scale-95 transition"
                                    >
                                        <Zap size={13} className="fill-white" />
                                        <span>Clone Store</span>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Bottom CTA */}
                <div className="mt-14 text-center">
                    <Link
                        href="/store/cloner"
                        className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md transition group"
                    >
                        <span>Launch Your Own 100% Free Store</span>
                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>

            </div>
        </section>
    );
}
