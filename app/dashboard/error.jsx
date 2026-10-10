'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertCircle, RefreshCw, ShieldCheck, Home } from 'lucide-react'

export default function DashboardError({ error, reset }) {
    useEffect(() => {
        console.error('Dashboard error boundary caught exception:', error);
    }, [error]);

    const handleClearAndReload = () => {
        try {
            if (typeof window !== 'undefined') {
                window.location.reload();
            }
        } catch {}
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 shadow-xl text-center">
                <div className="size-14 bg-amber-50 border border-amber-200 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-xs">
                    <ShieldCheck size={28} />
                </div>
                <h1 className="text-xl font-bold mb-2 text-slate-900">Master HQ Recovering</h1>
                <p className="text-slate-600 text-xs mb-6">
                    A transient session or state issue was intercepted. Click below to refresh your command center.
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={() => {
                            try { reset(); } catch { handleClearAndReload(); }
                        }}
                        className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                    >
                        <RefreshCw size={14} />
                        <span>Recover Dashboard</span>
                    </button>
                    <Link
                        href="/"
                        className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 border border-slate-200"
                    >
                        <Home size={14} />
                        <span>Return to Store</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
