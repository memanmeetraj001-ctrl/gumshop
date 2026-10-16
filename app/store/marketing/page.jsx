'use client'
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { getActiveStore, getActiveStoreSync } from "@/lib/activeStore";
import { 
    Film, 
    Copy, 
    Sparkles, 
    Download, 
    Check, 
    ExternalLink, 
    Play, 
    Share2, 
    Smartphone, 
    Zap,
    QrCode,
    Link2,
    Users,
    Mail,
    Calendar,
    ArrowUpRight,
    TrendingUp,
    Store
} from "lucide-react";
import toast from "react-hot-toast";

export default function StoreMarketingLaunchKit() {
    const { user } = useAuth();
    const [storeInfo, setStoreInfo] = useState(() => getActiveStoreSync());
    const [activeTab, setActiveTab] = useState('content'); // 'content' | 'utm' | 'qr' | 'leads'
    const [copiedIndex, setCopiedIndex] = useState(null);
    const [copiedBio, setCopiedBio] = useState(false);
    const [copiedUtm, setCopiedUtm] = useState(false);
    const [mountedOrigin, setMountedOrigin] = useState('');

    // UTM Link Builder State
    const [utmSource, setUtmSource] = useState('tiktok');
    const [utmMedium, setUtmMedium] = useState('bio');
    const [utmCampaign, setUtmCampaign] = useState('launch_promo');
    const [utmDestination, setUtmDestination] = useState('creator'); // 'creator' | 'shop'

    // QR Code Studio State
    const [qrDestination, setQrDestination] = useState('creator');
    const [qrSize, setQrSize] = useState('500');

    // Leads State
    const [leads, setLeads] = useState([]);
    const [loadingLeads, setLoadingLeads] = useState(false);

    useEffect(() => {
        setMountedOrigin(window.location.origin);
    }, []);

    useEffect(() => {
        const load = async () => {
            const s = await getActiveStore(user) || getActiveStoreSync();
            setStoreInfo(s);
        };
        load();
    }, [user]);

    const activeSyncStore = storeInfo || getActiveStoreSync();
    const storeSlug = activeSyncStore?.username || activeSyncStore?.name?.toLowerCase().replace(/[^a-z0-9-]+/g, '') || (typeof window !== 'undefined' ? (localStorage.getItem('active_store_slug') || '') : '') || '';
    const baseOrigin = mountedOrigin || 'https://gumshop.online';
    const storeLink = storeSlug ? `${baseOrigin}/shop/${storeSlug}` : `${baseOrigin}/dashboard`;
    const bioLink = storeSlug ? `${baseOrigin}/creator/${storeSlug}` : `${baseOrigin}/dashboard`;

    // Fetch leads when switching to leads tab
    useEffect(() => {
        if (activeTab === 'leads' && storeSlug) {
            setLoadingLeads(true);
            fetch(`/api/store/leads?store=${encodeURIComponent(storeSlug)}`)
                .then(r => r.json())
                .then(data => {
                    if (data.success && Array.isArray(data.leads)) {
                        setLeads(data.leads);
                    } else {
                        setLeads([]);
                    }
                })
                .catch(() => setLeads([]))
                .finally(() => setLoadingLeads(false));
        }
    }, [activeTab, storeSlug]);

    // Computed UTM Link
    const targetBaseUrl = utmDestination === 'creator' ? bioLink : storeLink;
    const computedUtmUrl = (() => {
        if (!storeSlug) return '';
        try {
            const u = new URL(targetBaseUrl);
            if (utmSource) u.searchParams.set('utm_source', utmSource);
            if (utmMedium) u.searchParams.set('utm_medium', utmMedium);
            if (utmCampaign) u.searchParams.set('utm_campaign', utmCampaign);
            return u.toString();
        } catch {
            return `${targetBaseUrl}?utm_source=${utmSource}&utm_medium=${utmMedium}&utm_campaign=${utmCampaign}`;
        }
    })();

    // Computed QR Code Image URL (High-res 500x500 PNG via standard QR endpoint)
    const qrTargetUrl = qrDestination === 'creator' ? bioLink : storeLink;
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(qrTargetUrl)}&format=png&margin=10`;

    const handleDownloadQr = async () => {
        try {
            toast.loading("Preparing high-res QR code...", { id: 'qr-dl' });
            const res = await fetch(qrImageUrl);
            const blob = await res.blob();
            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = `qrcode_${storeSlug}_${qrDestination}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(blobUrl);
            toast.success("QR Code downloaded! 🖼️", { id: 'qr-dl' });
        } catch (e) {
            toast.error("Failed to download QR code. Try right-clicking to save image.", { id: 'qr-dl' });
        }
    };

    const handleExportLeadsCsv = () => {
        if (leads.length === 0) {
            toast.error("No subscribers to export yet!");
            return;
        }

        const headers = ["Email", "Source", "Campaign / Lead Magnet", "Subscribed At"];
        const rows = leads.map(l => [
            `"${l.email || ''}"`,
            `"${l.source || 'Stan Bio'}"`,
            `"${l.leadMagnetTitle || ''}"`,
            `"${l.createdAt ? new Date(l.createdAt).toLocaleDateString() : ''}"`
        ]);

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `leads_${storeSlug}_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(`Exported ${leads.length} leads to CSV! 📥`);
    };

    const captionTemplates = [
        {
            title: "Viral TikTok FOMO Hook (Recommended)",
            caption: `Run don't walk 😭 Finally found the viral ${storeInfo?.name || 'trend'} everyone's gatekeeping! Quality is literally 10/10.\n\nLink in my bio before it sells out again ⚡👇\n${bioLink}\n\n#tiktokmademebuyit #musthaves #dropshipping #aesthetic #trending`
        },
        {
            title: "Before & After Aesthetic Hook",
            caption: `I honestly didn't believe the hype until I tried this myself... 100% worth every penny. Free worldwide shipping on orders this week only!\n\nShop the official collection here 📦✨\n${storeLink}\n\n#viralproduct #lifehack #finds #onlineshopping #unboxing`
        },
        {
            title: "Flash Sale / Urgency Hook",
            caption: `🚨 24-HOUR FLASH SALE 🚨\nGet up to 30% OFF storewide today only! Limited stock available.\n\nTap the link in bio to claim yours right now ⏳🛍️\n${bioLink}\n\n#deals #flashsale #shoptok #discountcode #foryou`
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
                        <Sparkles size={14} className="text-emerald-600" /> Growth & Marketing Command
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                        Store & Creator Growth Engine
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        High-converting viral assets, tracked UTM campaigns, QR code generation, and lead magnet captures.
                    </p>
                </div>

                <div className="p-2.5 px-4 bg-emerald-50 rounded-2xl border border-emerald-200/60 text-xs font-semibold text-emerald-800 flex items-center gap-2">
                    <Share2 size={16} className="text-emerald-600 shrink-0" />
                    <span suppressHydrationWarning className="truncate max-w-xs">{storeLink}</span>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="mt-6 flex items-center gap-2 border-b border-slate-200 overflow-x-auto no-scrollbar pb-1">
                {[
                    { id: 'content', label: 'Viral Content Kit', icon: Film },
                    { id: 'utm', label: 'UTM Campaign Links', icon: Link2 },
                    { id: 'qr', label: 'QR Code Studio', icon: QrCode },
                    { id: 'leads', label: 'Lead Magnet Subscribers', icon: Users, badge: leads.length > 0 ? leads.length : null }
                ].map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
                                activeTab === tab.id
                                    ? 'bg-slate-900 text-white shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                            }`}
                        >
                            <Icon size={14} />
                            <span>{tab.label}</span>
                            {tab.badge !== null && tab.badge !== undefined && (
                                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                                    activeTab === tab.id ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-700'
                                }`}>
                                    {tab.badge}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* ─── TAB 1: Viral Content & Captions ─── */}
            {activeTab === 'content' && (
                <div className="space-y-8 animate-in fade-in duration-200">
                    {/* Dedicated Instagram & TikTok Link-in-Bio Card (Stan Store / Linktree Killer) */}
                    <div className="mt-6 bg-gradient-to-r from-rose-500/10 via-pink-500/5 to-purple-500/10 border-2 border-rose-200/80 rounded-3xl p-6 sm:p-8 shadow-sm">
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
                                        <span suppressHydrationWarning className="font-mono text-xs font-bold text-slate-800 truncate select-all">{bioLink}</span>
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
                                        suppressHydrationWarning
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
                    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
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
                                    No video reels extracted yet. When you import or clone a TikTok winner with video content, its ad clips will appear here ready for 1-click download!
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Viral Caption Templates */}
                    <div className="space-y-4">
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

                    {/* 3-Step Strategy Formula */}
                    <div className="p-6 sm:p-8 rounded-3xl bg-white text-slate-900 border border-slate-200 shadow-sm">
                        <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
                            <Sparkles size={18} className="text-emerald-600" />
                            <span>The 48-Hour Sales Formula for Beginners</span>
                        </h3>
                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-600">
                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                                <p className="font-bold text-emerald-700 mb-1">Step 1: Bio Setup</p>
                                <p>Paste your GumShop link-in-bio URL (/creator/{storeSlug}) in your TikTok & Instagram bio. Switch account to Creator/Business.</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                                <p className="font-bold text-teal-700 mb-1">Step 2: Post 2x Daily</p>
                                <p>Post 1 reel at 12:00 PM and 1 reel at 6:30 PM using the FOMO caption template with trending sounds.</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                                <p className="font-bold text-emerald-700 mb-1">Step 3: 1-Click Fulfill</p>
                                <p>When customer buys, export your Supplier CSV in your Orders tab to fulfill in 30 seconds!</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── TAB 2: UTM Campaign Link Builder ─── */}
            {activeTab === 'utm' && (
                <div className="mt-6 space-y-6 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                            <div className="size-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                                <Link2 size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">UTM Campaign Link Builder</h2>
                                <p className="text-xs text-slate-500">Generate tracked links to know exactly which TikTok video, Instagram Reel, or ad created each sale.</p>
                            </div>
                        </div>

                        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">Destination Route</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setUtmDestination('creator')}
                                        className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                                            utmDestination === 'creator'
                                                ? 'bg-rose-50 border-rose-400 text-rose-700 shadow-xs'
                                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                                        }`}
                                    >
                                        <Smartphone size={14} />
                                        <span>Link-in-Bio</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setUtmDestination('shop')}
                                        className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                                            utmDestination === 'shop'
                                                ? 'bg-emerald-50 border-emerald-400 text-emerald-700 shadow-xs'
                                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                                        }`}
                                    >
                                        <Store size={14} />
                                        <span>Shop Catalog</span>
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">Traffic Source (`utm_source`)</label>
                                <select
                                    value={utmSource}
                                    onChange={(e) => setUtmSource(e.target.value)}
                                    className="w-full p-3 rounded-2xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-500"
                                >
                                    <option value="tiktok">TikTok (tiktok)</option>
                                    <option value="instagram">Instagram (instagram)</option>
                                    <option value="youtube">YouTube Shorts (youtube)</option>
                                    <option value="facebook">Meta / Facebook (facebook)</option>
                                    <option value="pinterest">Pinterest (pinterest)</option>
                                    <option value="twitter">X / Twitter (twitter)</option>
                                    <option value="email">Email Newsletter (email)</option>
                                    <option value="influencer">Influencer Collab (influencer)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">Traffic Medium (`utm_medium`)</label>
                                <input
                                    type="text"
                                    value={utmMedium}
                                    onChange={(e) => setUtmMedium(e.target.value)}
                                    placeholder="e.g. bio, reel, story, paid_ad"
                                    className="w-full p-3 rounded-2xl border border-slate-200 bg-slate-50 text-xs text-slate-800 font-semibold outline-none focus:border-emerald-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">Campaign Name (`utm_campaign`)</label>
                                <input
                                    type="text"
                                    value={utmCampaign}
                                    onChange={(e) => setUtmCampaign(e.target.value)}
                                    placeholder="e.g. halloween_video1, black_friday"
                                    className="w-full p-3 rounded-2xl border border-slate-200 bg-slate-50 text-xs text-slate-800 font-semibold outline-none focus:border-emerald-500"
                                />
                            </div>
                        </div>

                        {/* Generated URL Box */}
                        <div className="mt-6 p-4 rounded-2xl bg-slate-900 text-white">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block mb-1">
                                Your Tracked Campaign URL:
                            </span>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <span className="font-mono text-xs text-slate-200 break-all select-all">
                                    {computedUtmUrl}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        navigator.clipboard.writeText(computedUtmUrl);
                                        setCopiedUtm(true);
                                        toast.success("Tracked campaign link copied!");
                                        setTimeout(() => setCopiedUtm(false), 2000);
                                    }}
                                    className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 transition active:scale-95 shrink-0"
                                >
                                    {copiedUtm ? <Check size={14} /> : <Copy size={14} />}
                                    <span>{copiedUtm ? "Copied!" : "Copy Tracked Link"}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── TAB 3: QR Code Studio ─── */}
            {activeTab === 'qr' && (
                <div className="mt-6 space-y-6 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                            <div className="size-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                                <QrCode size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">High-Resolution QR Code Studio</h2>
                                <p className="text-xs text-slate-500">Generate and download instant crisp QR codes for packaging inserts, stickers, business cards, and offline flyers.</p>
                            </div>
                        </div>

                        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                            {/* QR Preview Card */}
                            <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-3xl border border-slate-200 text-center">
                                <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-200 mb-4 inline-block">
                                    <img
                                        src={qrImageUrl}
                                        alt={`QR Code for ${storeSlug}`}
                                        className="size-48 sm:size-56 object-contain"
                                    />
                                </div>
                                <span className="font-bold text-xs text-slate-800">
                                    {qrDestination === 'creator' ? 'Link-in-Bio Quick Shop' : 'Store Catalog'}
                                </span>
                                <span className="text-[11px] text-slate-400 font-mono mt-0.5 truncate max-w-xs">
                                    {qrTargetUrl}
                                </span>
                            </div>

                            {/* QR Options */}
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">QR Destination</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setQrDestination('creator')}
                                            className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                                                qrDestination === 'creator'
                                                    ? 'bg-rose-50 border-rose-400 text-rose-700 shadow-xs'
                                                    : 'bg-slate-50 border-slate-200 text-slate-600'
                                            }`}
                                        >
                                            <Smartphone size={14} />
                                            <span>Link-in-Bio (Mobile)</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setQrDestination('shop')}
                                            className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                                                qrDestination === 'shop'
                                                    ? 'bg-emerald-50 border-emerald-400 text-emerald-700 shadow-xs'
                                                    : 'bg-slate-50 border-slate-200 text-slate-600'
                                            }`}
                                        >
                                            <Store size={14} />
                                            <span>Standard Catalog</span>
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Export Resolution</label>
                                    <select
                                        value={qrSize}
                                        onChange={(e) => setQrSize(e.target.value)}
                                        className="w-full p-3 rounded-2xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800"
                                    >
                                        <option value="300">Standard (300 x 300 px) - Web & Social</option>
                                        <option value="500">High-Res (500 x 500 px) - Packaging & Stickers</option>
                                        <option value="1000">Ultra Print (1000 x 1000 px) - Banners & Posters</option>
                                    </select>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleDownloadQr}
                                    className="w-full py-3.5 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-md transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    <Download size={16} />
                                    <span>Download QR Code Image (PNG)</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── TAB 4: Lead Magnet Subscribers ─── */}
            {activeTab === 'leads' && (
                <div className="mt-6 space-y-6 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
                                    <Users size={20} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900">Lead Magnet Subscribers</h2>
                                    <p className="text-xs text-slate-500">Visitors who submitted their email for free samples, guides, or promo codes on your bio route.</p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleExportLeadsCsv}
                                disabled={leads.length === 0}
                                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
                            >
                                <Download size={14} />
                                <span>Export CSV ({leads.length})</span>
                            </button>
                        </div>

                        {loadingLeads ? (
                            <div className="py-12 text-center text-xs text-slate-400">Loading subscribers...</div>
                        ) : leads.length === 0 ? (
                            <div className="p-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 mt-6">
                                <Mail size={32} className="mx-auto text-slate-300 mb-2" />
                                <h3 className="font-bold text-slate-800 text-sm">No Subscribers Yet</h3>
                                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                                    When followers on your bio page enter their email to claim a free sample or guide, their contact details will appear here automatically.
                                </p>
                            </div>
                        ) : (
                            <div className="mt-6 overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                                            <th className="pb-3">Email</th>
                                            <th className="pb-3">Source</th>
                                            <th className="pb-3">Lead Magnet / Promo</th>
                                            <th className="pb-3">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-700">
                                        {leads.map((lead, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50 transition">
                                                <td className="py-3 font-semibold text-slate-900 flex items-center gap-1.5">
                                                    <Mail size={13} className="text-emerald-600" />
                                                    <span>{lead.email}</span>
                                                </td>
                                                <td className="py-3">
                                                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                                                        {lead.source || 'Stan Bio'}
                                                    </span>
                                                </td>
                                                <td className="py-3 text-slate-500">
                                                    {lead.leadMagnetTitle || 'Lead Magnet'}
                                                </td>
                                                <td className="py-3 text-slate-400 font-mono text-[11px]">
                                                    {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : 'Recent'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
