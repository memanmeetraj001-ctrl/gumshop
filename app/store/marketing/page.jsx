'use client'
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { getActiveStore, getActiveStoreSync } from "@/lib/activeStore";
import { Film, Copy, Sparkles, Download, Check, ExternalLink, Play, Share2, Smartphone, Zap } from "lucide-react";
import toast from "react-hot-toast";

export default function StoreMarketingLaunchKit() {
    const { user } = useAuth();
    const [storeInfo, setStoreInfo] = useState(null);
    const [copiedIndex, setCopiedIndex] = useState(null);
    const [copiedBio, setCopiedBio] = useState(false);

    useEffect(() => {
        const load = async () => {
            const s = await getActiveStore(user) || getActiveStoreSync();
            setStoreInfo(s);
        };
        load();
    }, [user]);

    const activeSyncStore = storeInfo || getActiveStoreSync();
    const storeSlug = activeSyncStore?.username || activeSyncStore?.name?.toLowerCase().replace(/[^a-z0-9-]+/g, '') || (typeof window !== 'undefined' ? (localStorage.getItem('active_store_slug') || '') : '') || '';
    const storeLink = typeof window !== 'undefined' ? (storeSlug ? `${window.location.origin}/shop/${storeSlug}` : `${window.location.origin}/dashboard`) : (storeSlug ? `https://gumshop.online/shop/${storeSlug}` : 'https://gumshop.online/dashboard');
    const bioLink = typeof window !== 'undefined' ? (storeSlug ? `${window.location.origin}/creator/${storeSlug}` : `${window.location.origin}/dashboard`) : (storeSlug ? `https://gumshop.online/creator/${storeSlug}` : 'https://gumshop.online/dashboard');

    const captionTemplates = [
        {
            title: "Viral TikTok FOMO Hook (Recommended)",
            caption: `Run don't walk 😭 Finally found the viral ${storeInfo?.name || 'trend'} everyone's gatekeeping! Quality is literally 10/10.\n\nLink in my bio before it sells out again ⚡👇\n${storeLink}\n\n#tiktokmademebuyit #musthaves #dropshipping #aesthetic #trending`
        },
        {
            title: "Before & After Aesthetic Hook",
            caption: `I honestly didn't believe the hype until I tried this myself... 100% worth every penny. Free worldwide shipping on orders this week only!\n\nShop the official collection here 📦✨\n${storeLink}\n\n#viralproduct #lifehack #finds #onlineshopping #unboxing`
        },
        {
            title: "Flash Sale / Urgency Hook",
            caption: `🚨 24-HOUR FLASH SALE 🚨\nGet up to 30% OFF storewide today only! Limited stock available.\n\nTap the link in bio to claim yours right now ⏳🛍️\n${storeLink}\n\n#deals #flashsale #shoptok #discountcode #foryou`
        }
    ];

    const handleCopyCaption = (text, index) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        toast.success("Caption & hashtags copied to clipboard!");
        setTimeout(() => setCopiedIndex(null), 2500);
    };

    return (
        <div className="p-4 sm:p-8 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
                <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
                        <Sparkles size={14} className="text-emerald-600" /> Free Marketing Ammo
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                        Viral Content Launch Kit
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Pre-written viral captions, trending hashtags, and video reel assets to generate your first 10,000 views on TikTok and Instagram.
                    </p>
                </div>

                <div className="p-2.5 px-4 bg-emerald-50 rounded-2xl border border-emerald-200/60 text-xs font-semibold text-emerald-800 flex items-center gap-2">
                    <Share2 size={16} className="text-emerald-600 shrink-0" />
                    <span className="truncate max-w-xs">{storeLink}</span>
                </div>
            </div>

            {/* Dedicated Instagram & TikTok Link-in-Bio Card (Stan Store / Linktree Killer) */}
            <div className="mt-8 bg-gradient-to-r from-rose-500/10 via-pink-500/5 to-purple-500/10 border-2 border-rose-200/80 rounded-3xl p-6 sm:p-8 shadow-sm">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="space-y-2 max-w-xl">
                        <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 shadow-xs">
                                <Zap size={11} className="fill-white" /> Stan Store & Linktree Killer
                            </span>
                            <span className="text-xs font-bold text-rose-700">High Converting Bio Route</span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                            Your Instagram & TikTok Link-in-Bio Shop
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                            Put this single URL in your social media bio. When followers click from Instagram, TikTok, or Twitter/X in-app browsers, it loads a clean single-column mobile shop with instant in-page Gumroad checkout.
                        </p>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-rose-200 shadow-sm flex flex-col gap-3 min-w-[320px]">
                        <div>
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Your Bio URL:</span>
                            <div className="mt-1 p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-2">
                                <span className="font-mono text-xs font-bold text-slate-800 truncate select-all">{bioLink}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    navigator.clipboard.writeText(bioLink);
                                    setCopiedBio(true);
                                    toast.success("Copied Link-in-Bio URL for Instagram/TikTok! 📋");
                                    setTimeout(() => setCopiedBio(false), 2000);
                                }}
                                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/20 transition active:scale-98"
                            >
                                <Copy size={14} />
                                <span>{copiedBio ? "Copied to Clipboard!" : "Copy Link for Bio"}</span>
                            </button>

                            <a
                                href={bioLink}
                                target="_blank"
                                rel="noreferrer"
                                className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition"
                                title="Open Live Mobile Bio View"
                            >
                                <Smartphone size={14} />
                                <ExternalLink size={12} />
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Video Reels Extracted Box */}
            <div className="mt-8 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Film size={20} className="text-emerald-600" />
                        <span>Extracted Video Reels & Ad Clips</span>
                    </h3>
                    <span className="text-xs text-slate-400">Ready to post on TikTok & Reels</span>
                </div>

                {storeInfo?.videoReels && storeInfo.videoReels.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {storeInfo.videoReels.map((reel, idx) => (
                            <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                                <div className="aspect-[9/16] bg-slate-900 rounded-xl overflow-hidden relative group">
                                    <video src={reel} controls className="w-full h-full object-cover" />
                                </div>
                                <a 
                                    href={reel} 
                                    download 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="mt-3 w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
                                >
                                    <Download size={14} /> Download Clip #{idx + 1}
                                </a>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-8 rounded-2xl bg-slate-50 border border-dashed border-slate-300 text-center">
                        <Play size={28} className="text-slate-400 mx-auto mb-2" />
                        <p className="text-xs text-slate-500">
                            No video reels extracted yet. When you clone a TikTok winner with video content, its ad clips will appear here ready for 1-click download!
                        </p>
                    </div>
                )}
            </div>

            {/* Viral Caption Templates */}
            <div className="mt-8 space-y-4">
                <h3 className="text-lg font-bold text-slate-900">
                    3 High-Converting TikTok & Instagram Captions
                </h3>

                {captionTemplates.map((item, idx) => (
                    <div key={idx} className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                                {item.title}
                            </span>
                            <button
                                onClick={() => handleCopyCaption(item.caption, idx)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition"
                            >
                                {copiedIndex === idx ? (
                                    <>
                                        <Check size={14} className="text-emerald-600 stroke-[3]" />
                                        <span className="text-emerald-600">Copied!</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy size={14} />
                                        <span>Copy Caption</span>
                                    </>
                                )}
                            </button>
                        </div>
                        <pre className="mt-4 text-xs sm:text-sm text-slate-700 font-sans whitespace-pre-wrap leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            {item.caption}
                        </pre>
                    </div>
                ))}
            </div>

            {/* Quick 3-Day Posting Strategy Guide */}
            <div className="mt-8 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-950 to-slate-900 text-white border border-slate-800">
                <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
                    <Sparkles size={18} className="text-emerald-400" />
                    <span>The 48-Hour Sales Formula for Beginners</span>
                </h3>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-300">
                    <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                        <p className="font-bold text-emerald-400 mb-1">Step 1: Bio Setup</p>
                        <p>Paste your GumShop link-in-bio URL (/creator/{storeSlug}) in your TikTok & Instagram bio. Switch account to Creator/Business.</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                        <p className="font-bold text-teal-400 mb-1">Step 2: Post 2x Daily</p>
                        <p>Post 1 reel at 12:00 PM and 1 reel at 6:30 PM using the FOMO caption template with trending sounds.</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                        <p className="font-bold text-emerald-400 mb-1">Step 3: 1-Click Fulfill</p>
                        <p>When customer buys, export your Supplier CSV in your Orders tab to fulfill in 30 seconds!</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
