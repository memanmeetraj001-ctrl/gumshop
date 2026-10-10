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
        <aside className="inline-flex h-full flex-col justify-between border-r border-slate-200 sm:min-w-64 bg-white select-none">
            <div>
                {/* Admin Header */}
                <div className="flex flex-col gap-2 justify-center items-center pt-8 pb-6 px-4 border-b border-slate-100 max-sm:hidden text-center">
                    <div className="size-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-extrabold flex items-center justify-center text-xl shadow-md shadow-emerald-500/20">
                        ⚡
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm mt-1">Super Admin</h3>
                    <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold">
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
                                        ? 'bg-emerald-50 text-emerald-700 font-bold border-l-3 border-emerald-600' 
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                }`}
                            >
                                <Icon size={18} className={`shrink-0 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                                <span className="max-sm:hidden">{link.name}</span>
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Bottom System Status */}
            <div className="p-4 m-3 rounded-2xl bg-slate-50 border border-slate-200 max-sm:hidden text-xs text-slate-600">
                <div className="flex items-center gap-2">
                    <div className="size-2 rounded-full bg-emerald-500 animate-ping" />
                    <span className="font-bold text-slate-900">System Online</span>
                </div>
                <p className="mt-1 text-[11px] text-slate-500 font-mono">Node Edge • GumShop 1.0</p>
            </div>
        </aside>
    )
}

export default AdminSidebar