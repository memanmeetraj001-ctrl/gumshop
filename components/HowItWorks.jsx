'use client'
import { Sparkles, Key, Rocket, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const HowItWorks = () => {
    const steps = [
        {
            num: "01",
            icon: Sparkles,
            title: "Paste Any Store URL",
            desc: "Find a trending store on TikTok, Instagram, Shopify, or WooCommerce. Paste the link into GumShop.online."
        },
        {
            num: "02",
            icon: Key,
            title: "Connect Your Free Gumroad Token",
            desc: "Connect your free Gumroad token in 10 seconds. Customers pay with Cards, Apple Pay, or PayPal directly to your account."
        },
        {
            num: "03",
            icon: Rocket,
            title: "Put Link in Bio & Print Sales",
            desc: "Drop your custom store link in your TikTok and Instagram bio. Fulfill orders in 30 seconds with 1-click supplier auto-copy."
        }
    ];

    return (
        <section className="py-20 sm:py-28 bg-white" id="how-it-works">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-200/60 px-3 py-1 rounded-full">
                        🚀 Zero Learning Curve
                    </span>
                    <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-950 tracking-tight mt-4">
                        How to Launch in 3 Simple Steps
                    </h2>
                    <p className="mt-3 text-base sm:text-lg text-slate-600">
                        No coding, no manual copy-pasting, and no complicated Shopify setups.
                    </p>
                </div>

                {/* Steps Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                    {steps.map((step, idx) => {
                        const Icon = step.icon;
                        return (
                            <div key={idx} className="relative p-8 rounded-3xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-3xl font-extrabold text-slate-300 font-mono">
                                            {step.num}
                                        </span>
                                        <div className="size-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                                            <Icon size={20} />
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 mt-6">
                                        {step.title}
                                    </h3>
                                    <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                                        {step.desc}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Callout */}
                <div className="mt-12 text-center">
                    <Link 
                        href="/store/cloner"
                        className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-bold text-sm sm:text-base group"
                    >
                        <span>Try it now — clone your first store in 60s</span>
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>

            </div>
        </section>
    );
};

export default HowItWorks;
