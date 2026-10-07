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
                body: JSON.stringify({ action: 'logout' })
            })
        } catch (e) {
            console.error('Logout error:', e)
        }
        router.push('/login')
    }

    return (
        <div className="flex items-center justify-between px-6 lg:px-12 py-3 bg-slate-900 border-b border-slate-800 transition-all">
            <Link href="/dashboard" className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white shadow-sm shadow-emerald-500/20">
                    <ShieldCheck className="w-5 h-5" />
                </div>
                <span className="text-xl font-bold tracking-tight text-white">
                    GumShop<span className="text-emerald-400">.online</span>
                </span>
                <span className="px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300 bg-emerald-950/60 rounded-full border border-emerald-800">
                    Super Admin
                </span>
            </Link>

            <div className="flex items-center gap-4">
                <span className="text-xs text-slate-400 hidden sm:inline-block">Master Session Active</span>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-red-400 border border-slate-800 hover:border-red-900/60 px-3 py-1.5 rounded-lg transition bg-slate-800/50"
                >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Lock Command Center</span>
                </button>
            </div>
        </div>
    )
}

export default AdminNavbar