'use client'
import { useState, useEffect } from 'react';
import { Zap, X, Gift, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ExitIntentModal({ onApplyCoupon }) {
    const [isOpen, setIsOpen] = useState(false);
    const [hasTriggered, setHasTriggered] = useState(false);

    useEffect(() => {
        // Detect desktop mouse leaving viewport towards top tab bar
        const handleMouseLeave = (e) => {
            if (e.clientY <= 10 && !hasTriggered) {
                // Check if user has already dismissed in session
                const dismissed = sessionStorage.getItem('gumshop_exit_dismissed');
                if (!dismissed) {
                    setIsOpen(true);
                    setHasTriggered(true);
                }
            }
        };

        document.addEventListener('mouseleave', handleMouseLeave);
        return () => document.removeEventListener('mouseleave', handleMouseLeave);
    }, [hasTriggered]);

    const handleClaimDiscount = () => {
        if (onApplyCoupon) {
            onApplyCoupon('SAVE10', 10);
        }
        toast.success("Coupon 'SAVE10' applied! 10% discount activated 🎉");
        sessionStorage.setItem('gumshop_exit_dismissed', 'true');
        setIsOpen(false);
    };

    const handleClose = () => {
        sessionStorage.setItem('gumshop_exit_dismissed', 'true');
        setIsOpen(false);
    };

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
            onClick={handleClose}
        >
            <div 
                className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border-2 border-emerald-500/30 text-center relative animate-in zoom-in-95"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button 
                    onClick={handleClose}
                    className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full transition"
                >
                    <X size={18} />
                </button>

                <div className="size-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                    <Gift size={32} />
                </div>

                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-2">
                    <Sparkles size={13} /> Exclusive One-Time Offer
                </span>

                <h3 className="text-2xl font-extrabold text-slate-950 tracking-tight">
                    Wait! Don't Leave Empty-Handed.
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                    Take an extra <strong className="text-emerald-600">10% OFF</strong> your entire order right now before you go. Valid for the next 15 minutes!
                </p>

                {/* Coupon Code Pill */}
                <div className="mt-5 p-3 rounded-2xl bg-emerald-50/70 border border-dashed border-emerald-500/50 flex items-center justify-center gap-2">
                    <span className="text-xs font-medium text-slate-600">Promo Code:</span>
                    <strong className="text-base font-extrabold text-emerald-700 font-mono tracking-wider">SAVE10</strong>
                </div>

                <div className="mt-6 flex flex-col gap-2.5">
                    <button
                        onClick={handleClaimDiscount}
                        className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition"
                    >
                        <Zap size={16} className="fill-white" />
                        <span>Claim 10% Off & Keep Shopping</span>
                    </button>
                    <button
                        onClick={handleClose}
                        className="text-xs text-slate-400 hover:text-slate-600 font-medium py-1"
                    >
                        No thanks, I prefer paying full price
                    </button>
                </div>
            </div>
        </div>
    );
}
