'use client'
import React, { useState, useEffect } from 'react';
import { Smartphone, ExternalLink, X } from 'lucide-react';

export default function InAppBrowserBanner() {
    const [isInAppBrowser, setIsInAppBrowser] = useState(false);
    const [dismissed, setDismissed] = useState(true);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        // Check if already dismissed this session
        const isDismissed = sessionStorage.getItem('gumshop_inapp_dismissed');
        if (isDismissed) return;

        const ua = navigator.userAgent || navigator.vendor || window.opera || '';
        const detected = /Instagram|TikTok|ByteDance|musical_ly|FBAN|FBAV|Twitter|Snapchat/i.test(ua);

        if (detected) {
            setIsInAppBrowser(true);
            setDismissed(false);
        }
    }, []);

    const handleDismiss = () => {
        setDismissed(true);
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('gumshop_inapp_dismissed', 'true');
        }
    };

    if (!isInAppBrowser || dismissed) return null;

    return (
        <aside 
            aria-label="In-app browser recommendation"
            className="sticky top-0 z-50 bg-slate-950 text-white px-3.5 py-2.5 text-xs shadow-md border-b border-slate-800 animate-in slide-in-from-top duration-300"
        >
            <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                    <span className="size-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                        <Smartphone size={13} />
                    </span>
                    <p className="truncate text-slate-200">
                        Viewing in app? Tap <strong className="text-white">•••</strong> & select <strong className="text-emerald-400">Open in Browser</strong> for smooth checkout & live package tracking.
                    </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                    <button
                        onClick={handleDismiss}
                        className="text-[11px] font-bold text-slate-300 hover:text-white px-2 py-0.5 rounded-md hover:bg-slate-800 transition"
                    >
                        Got It
                    </button>
                    <button
                        onClick={handleDismiss}
                        aria-label="Close notification"
                        className="text-slate-400 hover:text-slate-200 p-1"
                    >
                        <X size={13} />
                    </button>
                </div>
            </div>
        </aside>
    );
}
