'use client'
import { usePathname } from "next/navigation"
import { HomeIcon, LayoutListIcon, SquarePenIcon, SquarePlusIcon, TicketPercentIcon, SettingsIcon, Sparkles, Film, ExternalLink, Smartphone, Package, Users, Tag, BarChart3 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { getActiveStoreSync } from "@/lib/activeStore"

const StoreSidebar = ({ storeInfo }) => {
    const pathname = usePathname();
    const active = getActiveStoreSync();
    const storeSlug = storeInfo?.username || storeInfo?.name?.toLowerCase().replace(/[^a-z0-9-]+/g, '') || active?.username || active?.id || 'store';

    const sidebarLinks = [
        { name: '← Master Dashboard', href: '/dashboard', icon: HomeIcon, highlight: true },
        { name: 'Import Store (AI)', href: `/store/import?store=${storeSlug}`, icon: Sparkles, highlight: true },
        { name: '+ Create Blank Shop', href: '/create-store', icon: SquarePlusIcon },
        { name: 'Analytics & Overview', href: `/store?store=${storeSlug}`, icon: BarChart3 },
        { name: '📱 Edit Stan / Mobile Bio', href: `/store/bio-editor?store=${storeSlug}`, icon: Smartphone, highlight: true, badge: 'New' },
        { name: 'Creator Bio Link', href: `/creator/${storeSlug}`, icon: ExternalLink, highlight: false, external: true, badge: 'Live' },
        { name: 'Manage Products', href: `/store/manage-product?store=${storeSlug}`, icon: SquarePenIcon },
        { name: 'Add Product', href: `/store/add-product?store=${storeSlug}`, icon: SquarePlusIcon },
        { name: 'Orders & Shipping', href: `/store/orders?store=${storeSlug}`, icon: Package },
        { name: 'Customers CRM', href: `/store/customers?store=${storeSlug}`, icon: Users },
        { name: 'Coupons & Discounts', href: `/store/coupons?store=${storeSlug}`, icon: TicketPercentIcon },
        { name: 'Marketing & Upsells', href: `/store/marketing?store=${storeSlug}`, icon: Tag },
        { name: 'Gumroad Payments', href: `/store/settings?tab=gumroad&store=${storeSlug}`, icon: SettingsIcon },
        { name: 'Store Settings', href: `/store/settings?store=${storeSlug}`, icon: SettingsIcon },
    ];

    return (
        <aside className="inline-flex h-full flex-col justify-between border-r border-slate-200/80 sm:min-w-64 bg-white select-none">
            <div>
                {/* Store Profile Header */}
                <div className="flex flex-col gap-2 justify-center items-center pt-8 pb-6 px-4 border-b border-slate-100 max-sm:hidden text-center">
                    {storeInfo?.logo ? (
                        <img className="size-16 rounded-2xl shadow-sm border border-slate-100 object-cover" src={storeInfo.logo} alt="" />
                    ) : (
                        <div className="size-16 rounded-2xl bg-emerald-100 text-emerald-700 font-extrabold flex items-center justify-center text-xl shadow-sm">
                            {storeInfo?.name?.charAt(0) || 'G'}
                        </div>
                    )}
                    <h3 className="font-bold text-slate-800 text-sm mt-1">{storeInfo?.name || 'My Store'}</h3>
                    
                    {/* View Live Storefront & Bio Link */}
                    <div className="flex flex-col gap-1.5 mt-2 w-full px-2">
                        <Link 
                            href={`/shop/${storeSlug}`}
                            target="_blank"
                            className="inline-flex items-center justify-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200/60 transition"
                        >
                            <span>View Storefront</span>
                            <ExternalLink size={12} />
                        </Link>
                        <Link 
                            href="/store/bio-editor"
                            className="inline-flex items-center justify-center gap-1.5 text-[11px] font-bold text-rose-700 hover:text-rose-800 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200/60 transition"
                        >
                            <Smartphone size={12} />
                            <span>Edit Stan / Mobile Bio</span>
                        </Link>
                    </div>
                </div>

                {/* Navigation Links */}
                <nav className="py-4 space-y-1">
                    {sidebarLinks.map((link, index) => {
                        const Icon = link.icon;
                        const isActive = pathname === link.href;
                        return (
                            <Link 
                                key={index} 
                                href={link.href}
                                target={link.external ? "_blank" : undefined}
                                className={`relative flex items-center justify-between px-4 py-3 text-xs sm:text-sm font-medium transition ${
                                    isActive 
                                        ? 'bg-emerald-50 text-emerald-700 font-bold' 
                                        : link.highlight
                                            ? 'text-emerald-700 hover:bg-emerald-50/50'
                                            : 'text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <Icon size={18} className={`shrink-0 ${isActive || link.highlight ? 'text-emerald-600' : 'text-slate-400'}`} />
                                    <span className="max-sm:hidden">{link.name}</span>
                                </div>
                                {link.badge && (
                                    <span className="max-sm:hidden text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700">
                                        {link.badge}
                                    </span>
                                )}
                                {isActive && (
                                    <span className="absolute bg-emerald-600 right-0 top-1 bottom-1 w-1 rounded-l"></span>
                                )}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Bottom Help Box */}
            <div className="p-4 m-3 rounded-2xl bg-slate-50 border border-slate-200/80 max-sm:hidden text-xs text-slate-500">
                <p className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-emerald-600" /> GumShop Free Plan
                </p>
                <p className="mt-1 text-[11px]">100% Free Forever. Zero transaction fees.</p>
            </div>
        </aside>
    );
};

export default StoreSidebar;