'use client'
import React, { useState } from 'react';
import Link from 'next/link';
import { Zap, ShieldCheck, Truck, Lock, ArrowRight, Heart, Store } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Footer() {
    const [email, setEmail] = useState('');

    const handleSubscribe = (e) => {
        e.preventDefault();
        if (email.trim()) {
            toast.success('Welcome to the VIP Club! Use code VIP15 for 15% off 🎉');
            setEmail('');
        }
    };

    return (
        <footer className="bg-slate-950 text-slate-400 border-t border-slate-900 pt-14 pb-10 text-xs">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Newsletter Box */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 mb-14 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="max-w-md text-center md:text-left">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                            VIP Club Perks
                        </span>
                        <h3 className="text-xl sm:text-2xl font-black text-white mt-2">
                            Unlock 15% Off Your First Order
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">
                            Get early access to flash deals, new viral product releases, and private discount codes.
                        </p>
                    </div>

                    <form onSubmit={handleSubscribe} className="w-full md:w-auto flex flex-col sm:flex-row gap-2 max-w-md">
                        <input
                            type="email"
                            placeholder="Enter your email address..."
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="px-4 py-3 bg-slate-800 border border-slate-700 rounded-2xl text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition w-full sm:w-72"
                        />
                        <button
                            type="submit"
                            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 active:scale-98 text-slate-950 font-black text-xs rounded-2xl shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5 transition whitespace-nowrap"
                        >
                            <span>Claim 15% Off</span>
                            <ArrowRight size={14} />
                        </button>
                    </form>
                </div>

                {/* Main Footer Links Columns */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                    
                    {/* Brand Column */}
                    <div className="col-span-2 md:col-span-1">
                        <Link href="/" className="flex items-center gap-2 mb-3">
                            <div className="size-8 bg-emerald-500 rounded-xl flex items-center justify-center text-slate-950">
                                <Zap size={16} className="fill-slate-950" />
                            </div>
                            <span className="text-base font-black text-white tracking-tight">
                                GUM<span className="text-emerald-400">SHOP</span>
                            </span>
                        </Link>
                        <p className="text-slate-400 text-xs leading-relaxed max-w-xs">
                            Curated high-converting viral gadgets, sound aesthetics, and modern lifestyle tech delivered with express worldwide shipping.
                        </p>
                    </div>

                    {/* Shop Links */}
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">Shop Collections</h4>
                        <ul className="space-y-2">
                            <li><a href="/#catalog" className="hover:text-emerald-400 transition">All Products</a></li>
                            <li><a href="/#flash-deals" className="hover:text-emerald-400 transition text-rose-400 font-bold">🔥 Flash Deals</a></li>
                            <li><Link href="/shop" className="hover:text-emerald-400 transition">Trending Collections</Link></li>
                            <li><a href="/#reviews" className="hover:text-emerald-400 transition">Customer Reviews</a></li>
                        </ul>
                    </div>

                    {/* Customer Care */}
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">Customer Care</h4>
                        <ul className="space-y-2">
                            <li><Link href="/track" className="hover:text-emerald-400 transition flex items-center gap-1"><span>📦 Track Package</span></Link></li>
                            <li><Link href="/contact" className="hover:text-emerald-400 transition">Contact & Support Desk</Link></li>
                            <li><Link href="/policies/shipping" className="hover:text-emerald-400 transition">Shipping Policy</Link></li>
                            <li><Link href="/policies/refund" className="hover:text-emerald-400 transition">Refund & Return Policy</Link></li>
                            <li><Link href="/cart" className="hover:text-emerald-400 transition">Shopping Cart</Link></li>
                        </ul>
                    </div>

                    {/* Trust & Legal */}
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">Trust & Legal</h4>
                        <ul className="space-y-2">
                            <li><Link href="/policies/privacy" className="hover:text-emerald-400 transition flex items-center gap-1.5"><ShieldCheck size={13} className="text-emerald-400" /><span>Privacy Policy</span></Link></li>
                            <li><Link href="/policies/terms" className="hover:text-emerald-400 transition flex items-center gap-1.5"><Lock size={13} className="text-emerald-400" /><span>Terms of Service</span></Link></li>
                            <li><Link href="/policies/refund" className="hover:text-emerald-400 transition">30-Day Money Back</Link></li>
                            <li><Link href="/policies/shipping" className="hover:text-emerald-400 transition flex items-center gap-1.5"><Truck size={13} className="text-emerald-400" /><span>Worldwide Delivery</span></Link></li>
                            <li className="pt-2">
                                <Link 
                                    href="/login" 
                                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-emerald-400 transition"
                                >
                                    <Store size={12} />
                                    <span>Store Owner HQ</span>
                                </Link>
                            </li>
                        </ul>
                    </div>

                </div>

                {/* Bottom Bar with Policy Links */}
                <div className="pt-8 border-t border-slate-900 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
                    <p>© {new Date().getFullYear()} GumShop Super Store. All rights reserved.</p>
                    
                    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-slate-400">
                        <Link href="/policies/privacy" className="hover:text-emerald-400 transition">Privacy Policy</Link>
                        <span>•</span>
                        <Link href="/policies/terms" className="hover:text-emerald-400 transition">Terms of Service</Link>
                        <span>•</span>
                        <Link href="/policies/refund" className="hover:text-emerald-400 transition">Refund Policy</Link>
                        <span>•</span>
                        <Link href="/policies/shipping" className="hover:text-emerald-400 transition">Shipping Policy</Link>
                        <span>•</span>
                        <Link href="/contact" className="hover:text-emerald-400 transition">Contact Us</Link>
                    </div>

                    <div className="flex items-center gap-1">
                        <span>Engineered with</span>
                        <Heart size={12} className="text-rose-500 fill-rose-500" />
                    </div>
                </div>

            </div>
        </footer>
    );
}