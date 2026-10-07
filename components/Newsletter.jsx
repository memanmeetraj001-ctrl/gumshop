'use client'
import React, { useState } from 'react';
import Title from './Title';
import toast from 'react-hot-toast';
import { Mail, Sparkles, CheckCircle2 } from 'lucide-react';

const Newsletter = () => {
    const [email, setEmail] = useState('');
    const [subscribed, setSubscribed] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        const trimmed = email.trim();
        if (!trimmed || !trimmed.includes('@') || !trimmed.includes('.')) {
            return toast.error('Please enter a valid email address');
        }

        try {
            if (typeof window !== 'undefined') {
                const subs = JSON.parse(localStorage.getItem('gumshop_subscribers') || '[]');
                if (!subs.includes(trimmed)) {
                    subs.push(trimmed);
                    localStorage.setItem('gumshop_subscribers', JSON.stringify(subs));
                }
            }
        } catch {}

        setSubscribed(true);
        toast.success('Welcome! Use code SAVE10 for 10% off your order! 🎉');
    };

    return (
        <div className='flex flex-col items-center mx-4 my-24 sm:my-32'>
            <Title 
                title="Join VIP Newsletter" 
                description="Subscribe to get secret flash discounts, daily winner drops, and insider updates delivered straight to your inbox." 
                visibleButton={false} 
            />
            
            {subscribed ? (
                <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm px-6 py-4 rounded-2xl my-8 animate-in fade-in">
                    <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
                    <div>
                        <p className="font-bold">You are subscribed!</p>
                        <p className="text-xs text-emerald-700">Your 10% coupon code: <strong className="font-mono bg-white px-1.5 py-0.5 rounded border border-emerald-300">SAVE10</strong></p>
                    </div>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className='flex bg-white text-sm p-1.5 rounded-full w-full max-w-xl my-8 border border-slate-200 shadow-lg shadow-slate-100 focus-within:border-emerald-500 transition-all'>
                    <div className="flex items-center pl-4 text-slate-400">
                        <Mail size={18} />
                    </div>
                    <input 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className='flex-1 pl-3 pr-2 outline-none text-slate-800 placeholder:text-slate-400 text-xs sm:text-sm' 
                        type="email" 
                        placeholder='Enter your email address' 
                        required
                    />
                    <button 
                        type="submit"
                        className='font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-full text-xs sm:text-sm hover:scale-102 active:scale-95 transition shadow-sm'
                    >
                        Get 10% Off
                    </button>
                </form>
            )}
        </div>
    );
};

export default Newsletter;