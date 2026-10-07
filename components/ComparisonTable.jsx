'use client'
import { Check, X, Zap } from 'lucide-react';
import Link from 'next/link';

const ComparisonTable = () => {
    const comparisonRows = [
        {
            feature: "Monthly Platform Cost",
            shopify: "$39 to $399 / month",
            gumshop: "$0.00 / month (100% Free Forever)",
            highlight: true
        },
        {
            feature: "Store Setup Time",
            shopify: "3 to 7 Days of manual editing",
            gumshop: "60 Seconds (1-Click URL Clone)",
            highlight: true
        },
        {
            feature: "Reviews & Photo UGC App",
            shopify: "$15 to $35 / mo (Loox / Judge.me)",
            gumshop: "Built-in Free (Auto-scraped)",
            highlight: false
        },
        {
            feature: "All-in-One Creator Bio Mode",
            shopify: "$29 to $49 / mo (Stan Store / Beacons)",
            gumshop: "Built-in Free (/creator/[user])",
            highlight: false
        },
        {
            feature: "Volume Quantity Breaks",
            shopify: "$19 / mo (VolumeBoost)",
            gumshop: "Built-in Free",
            highlight: false
        },
        {
            feature: "Exit-Intent Discount Popup",
            shopify: "$25 / mo (Privy / Popups)",
            gumshop: "Built-in Free",
            highlight: false
        },
        {
            feature: "Payment Gateway KYC & Holds",
            shopify: "Strict merchant KYC, delayed payouts",
            gumshop: "Instant Free Gumroad Token",
            highlight: true
        },
        {
            feature: "Link-in-Bio Speed (Instagram/TikTok)",
            shopify: "Heavy 3-5s load (bloated scripts)",
            gumshop: "Ultra-fast < 800ms WebView load",
            highlight: true
        },
        {
            feature: "1-Click Supplier Bridge",
            shopify: "$20 to $50 / mo (DSers / Spocket)",
            gumshop: "Built-in 1-Click AliExpress Bridge",
            highlight: false
        }
    ];

    return (
        <section className="py-20 sm:py-28 bg-white border-y border-slate-200/80">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Section Header */}
                <div className="text-center max-w-3xl mx-auto">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-200/60 px-3 py-1 rounded-full">
                        🥊 The Unfair Advantage
                    </span>
                    <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-950 tracking-tight mt-4">
                        Why Creators & Dropshippers Choose <span className="text-emerald-600">GumShop</span> over Shopify
                    </h2>
                    <p className="mt-3 text-base sm:text-lg text-slate-600">
                        Stop spending $150+/month on Shopify subscriptions and apps before you even make your first sale.
                    </p>
                </div>

                {/* Comparison Table */}
                <div className="mt-12 sm:mt-16 max-w-4xl mx-auto overflow-hidden rounded-3xl border border-slate-200 shadow-xl bg-white">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50/70">
                                    <th className="py-5 px-6 text-sm font-semibold text-slate-500 w-1/3">Feature / Capability</th>
                                    <th className="py-5 px-6 text-sm font-bold text-slate-500 w-1/3">
                                        <span className="flex items-center gap-1.5 text-slate-700">
                                            🛒 Shopify + Apps
                                        </span>
                                    </th>
                                    <th className="py-5 px-6 text-sm font-extrabold text-emerald-700 bg-emerald-50/80 w-1/3 border-l border-emerald-200/60">
                                        <span className="flex items-center gap-1.5">
                                            <Zap size={16} className="fill-emerald-600 text-emerald-600" /> GumShop.online
                                        </span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {comparisonRows.map((row, idx) => (
                                    <tr key={idx} className={row.highlight ? "bg-emerald-50/20" : "hover:bg-slate-50/50 transition"}>
                                        <td className="py-4 px-6 font-medium text-slate-800">
                                            {row.feature}
                                        </td>
                                        <td className="py-4 px-6 text-slate-500 font-medium">
                                            <span className="inline-flex items-center gap-1.5 text-slate-600">
                                                <X size={15} className="text-rose-500 shrink-0" />
                                                {row.shopify}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 font-bold text-emerald-700 bg-emerald-50/40 border-l border-emerald-200/60">
                                            <span className="inline-flex items-center gap-1.5">
                                                <Check size={16} className="text-emerald-600 stroke-[3] shrink-0" />
                                                {row.gumshop}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Bottom CTA Button */}
                <div className="mt-12 text-center">
                    <Link 
                        href="/store/cloner"
                        className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-base shadow-lg shadow-emerald-600/30 transition-all hover:scale-105"
                    >
                        <Zap size={18} className="fill-white" />
                        <span>Launch Your Store in 60s for $0</span>
                    </Link>
                </div>

            </div>
        </section>
    );
};

export default ComparisonTable;
