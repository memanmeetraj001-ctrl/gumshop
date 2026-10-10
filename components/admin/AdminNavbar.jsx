'use client'
import Link from "next/link"
import { ShieldCheck, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"

const AdminNavbar = () => {
    const router = useRouter()

    const handleLogout = async () => {
        try {
            await fetch('/api/admin/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ action: 'logout' })
            })
        } catch (e) {
            console.error('Logout error:', e)
        }
        if (typeof window !== 'undefined') {
            localStorage.removeItem('gumshop_admin_token');
            sessionStorage.removeItem('gumshop_admin_token');
            document.cookie = 'gumshop_admin_session=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            document.cookie = 'gumshop_admin_authenticated=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        }
        window.location.href = '/login';
    }

    return (
        <div className="flex items-center justify-between px-6 lg:px-12 py-3 bg-white border-b border-slate-200 transition-all shadow-xs">
            <Link href="/dashboard" className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-xs">
                    <ShieldCheck className="w-5 h-5" />
                </div>
                <span className="text-xl font-bold tracking-tight text-slate-900">
                    GumShop<span className="text-emerald-600">.online</span>
                </span>
                <span className="px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 rounded-full border border-emerald-200">
                    Super Admin
                </span>
            </Link>

            <div className="flex items-center gap-4">
                <span className="text-xs text-slate-500 hidden sm:inline-block font-medium">Master Session Active</span>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 text-xs text-slate-700 hover:text-red-600 border border-slate-200 hover:border-red-200 px-3 py-1.5 rounded-xl transition bg-slate-50 hover:bg-red-50 font-bold"
                >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Lock Command Center</span>
                </button>
            </div>
        </div>
    )
}

export default AdminNavbar