'use client'
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Zap, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function LoginGate() {
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [show, setShow] = useState(false);
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(true);

    // If already authenticated, go straight to dashboard
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const storedToken = typeof window !== 'undefined' ? localStorage.getItem('gumshop_admin_token') : null;
                const headers = {};
                if (storedToken) {
                    headers['Authorization'] = `Bearer ${storedToken}`;
                }

                const res = await fetch(`/api/admin/auth?t=${Date.now()}`, {
                    cache: 'no-store',
                    credentials: 'include',
                    headers
                });
                const data = await res.json().catch(() => ({}));
                if (data.authenticated) {
                    if (data.token && typeof window !== 'undefined') {
                        localStorage.setItem('gumshop_admin_token', data.token);
                    }
                    window.location.href = '/dashboard';
                    return;
                }
            } catch (err) {
                console.warn('Auth check error:', err);
            } finally {
                setChecking(false);
            }
        };

        checkAuth();
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!password.trim()) return;
        setLoading(true);
        try {
            const res = await fetch('/api/admin/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ password: password.trim() }),
            });
            const data = await res.json().catch(() => ({}));
            if (data.success) {
                if (data.token && typeof window !== 'undefined') {
                    localStorage.setItem('gumshop_admin_token', data.token);
                }
                toast.success('Welcome back to Store HQ! 🚀');
                window.location.href = '/dashboard';
            } else {
                toast.error(data.error || 'Wrong master password');
                setPassword('');
            }
        } catch {
            toast.error('Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    if (checking) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-3">
                <div className="size-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-slate-400">Verifying session...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4">
            <div className="w-full max-w-sm">
                {/* Back to Store link */}
                <div className="mb-6 flex items-center justify-between">
                    <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition">
                        <ArrowLeft size={14} />
                        <span>Return to Storefront</span>
                    </Link>
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        HQ Portal
                    </span>
                </div>

                {/* Logo */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    <div className="size-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <Zap size={20} className="text-white fill-white" />
                    </div>
                    <span className="text-white font-black text-xl tracking-tight">GumShop</span>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
                    <div className="flex items-center justify-center size-12 bg-slate-800 rounded-2xl mx-auto mb-6">
                        <Lock size={20} className="text-emerald-400" />
                    </div>
                    <h1 className="text-white font-bold text-xl text-center mb-1">Store Owner Access</h1>
                    <p className="text-slate-400 text-xs text-center mb-8">Enter your master password to manage your stores</p>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="relative">
                            <input
                                type={show ? 'text' : 'password'}
                                placeholder="Master password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                autoFocus
                                className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-2xl px-4 py-3.5 text-sm outline-none focus:border-emerald-500 transition pr-12"
                            />
                            <button
                                type="button"
                                onClick={() => setShow(s => !s)}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                            >
                                {show ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        <button
                            type="submit"
                            disabled={loading || !password.trim()}
                            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-sm rounded-2xl shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2 cursor-pointer"
                        >
                            {loading ? (
                                <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Zap size={16} className="fill-white" />
                                    <span>Enter Command Center</span>
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <p className="text-slate-600 text-xs text-center mt-6">Private store management only</p>
            </div>
        </div>
    );
}
