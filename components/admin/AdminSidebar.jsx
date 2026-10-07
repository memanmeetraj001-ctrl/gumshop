'use client'
import { usePathname } from "next/navigation"
import { LayoutDashboard, Store, ShieldCheck, TicketPercent, MessageSquare } from "lucide-react"
import Link from "next/link"

const AdminSidebar = () => {
    const pathname = usePathname()

    const sidebarLinks = [
        { name: 'Master Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Store Overview', href: '/store', icon: Store },
        { name: 'Manage Products', href: '/store/manage-product', icon: ShieldCheck },
        { name: 'Store Coupons', href: '/store/coupons', icon: TicketPercent },
        { name: 'Gumroad Settings', href: '/settings/integrations/gumroad', icon: MessageSquare },
    ]

    return (
        <aside className="inline-flex h-full flex-col justify-between border-r border-slate-800 sm:min-w-64 bg-slate-900 select-none">
            <div>
                {/* Admin Header */}
                <div className="flex flex-col gap-2 justify-center items-center pt-8 pb-6 px-4 border-b border-slate-800 max-sm:hidden text-center">
                    <div className="size-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-extrabold flex items-center justify-center text-xl shadow-lg shadow-emerald-500/20">
                        ⚡
                    </div>
                    <h3 className="font-bold text-white text-sm mt-1">Super Admin</h3>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/70 border border-emerald-800/80 px-2 py-0.5 rounded-full">
                        Full Permissions
                    </span>
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
                                className={`relative flex items-center gap-3 px-4 py-3 text-xs sm:text-sm font-medium transition ${
                                    isActive 
                                        ? 'bg-slate-800 text-emerald-400 font-bold border-l-2 border-emerald-500' 
                                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                                }`}
                            >
                                <Icon size={18} className={`shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                                <span className="max-sm:hidden">{link.name}</span>
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Bottom System Status */}
            <div className="p-4 m-3 rounded-2xl bg-slate-950 border border-slate-800 max-sm:hidden text-xs text-slate-400">
                <div className="flex items-center gap-2">
                    <div className="size-2 rounded-full bg-emerald-500 animate-ping" />
                    <span className="font-semibold text-slate-200">System Online</span>
                </div>
                <p className="mt-1 text-[11px] text-slate-500">Node Edge • GumShop 1.0</p>
            </div>
        </aside>
    )
}

export default AdminSidebar