'use client'
import { Zap, Sparkles, ShoppingCart, Film, Layers, Truck, ShieldCheck, HeartHandshake } from 'lucide-react';

const FeaturesGrid = () => {
    const features = [
        {
            icon: Sparkles,
            title: "1-Click Full Store Cloner",
            desc: "Paste any store URL. In under 60 seconds, our engine extracts hero banners, product catalog, and customer star reviews directly into your store.",
            tag: "Speed Engine"
        },
        {
            icon: ShoppingCart,
            title: "White-Labeled Gumroad Checkout",
            desc: "Customers click '⚡ Buy Now' and pay inside an elegant in-page iframe overlay modal (Cards, Apple Pay, PayPal) for the exact dynamic cart total with zero Gumroad branding.",
            tag: "Payment Magic"
        },
        {
            icon: Layers,
            title: "6 High-Converting Niche Templates",
            desc: "Prebuilt conversion architectures for Digital Creators, TikTok Winners, Fashion Lookbooks, Tech Hardware, Clean Beauty, and Curated Superstores.",
            tag: "Prebuilt Themes"
        },
        {
            icon: HeartHandshake,
            title: "All-in-One Creator Bio Mode",
            desc: "Dedicated mobile-first route (/creator/[username]) designed like Stan Store and Beacons with verified avatar, bio, digital product cards, and instant buy.",
            tag: "Link-in-Bio"
        },
        {
            icon: Zap,
            title: "Quantity Breaks & Exit-Intent",
            desc: "Double your Average Order Value with 'Buy More, Save More' tiers and recover 15% of bouncing shoppers with intelligent exit-intent discount popups.",
            tag: "Conversion Booster"
        },
        {
            icon: Truck,
            title: "Live Order Tracking Portal",
            desc: "Dedicated tracking route (/track) where customers can track package milestones, carrier checkpoints, and shipping updates in realtime with zero support tickets.",
            tag: "Customer Care"
        }
    ];

    return (
        <section className="py-20 sm:py-28 bg-slate-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Section Header */}
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-200/60 px-3 py-1 rounded-full">
                        ⚡ Built For Maximum Conversion
                    </span>
                    <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-950 tracking-tight mt-4">
                        Everything You Need to Print Sales. <br />
                        <span className="text-emerald-600">Zero Extra Apps Required.</span>
                    </h2>
                    <p className="mt-3 text-base sm:text-lg text-slate-600">
                        Other platforms force you to pay for 10 different apps. GumShop gives you the complete dropshipping and creator stack out of the box for $0.
                    </p>
                </div>

                {/* 6 Grid Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feat, idx) => {
                        const Icon = feat.icon;
                        return (
                            <div key={idx} className="p-8 rounded-3xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md hover:border-emerald-500/40 transition-all group">
                                <div className="flex items-center justify-between">
                                    <div className="size-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                                        <Icon size={24} />
                                    </div>
                                    <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                        {feat.tag}
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mt-6 group-hover:text-emerald-700 transition">
                                    {feat.title}
                                </h3>
                                <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                                    {feat.desc}
                                </p>
                            </div>
                        );
                    })}
                </div>

            </div>
        </section>
    );
};

export default FeaturesGrid;
