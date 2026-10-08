'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'

export default function GlobalError({ error, reset }) {
    useEffect(() => {
        console.error('App runtime error caught by boundary:', error);
    }, [error]);

    const handleHardReload = () => {
        try {
            if (typeof window !== 'undefined') {
                window.location.reload();
            }
        } catch {}
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center">
                <div className="size-14 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-red-500/10">
                    <AlertCircle size={28} />
                </div>
                <h1 className="text-xl font-bold mb-2">Something went wrong</h1>
                <p className="text-slate-400 text-xs mb-6">
                    A temporary interface issue occurred. You can reload the page or return to the storefront.
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={() => {
                            try { reset(); } catch { handleHardReload(); }
                        }}
                        className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20"
                    >
                        <RefreshCw size={14} />
                        <span>Reload Page</span>
                    </button>
                    <Link
                        href="/"
                        className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 border border-slate-700"
                    >
                        <Home size={14} />
                        <span>Storefront</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
