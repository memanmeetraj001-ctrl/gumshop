'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * ⚡ Zero-Bloat Native Client Analytics Tracker
 * - < 2KB payload footprint, 0 third-party libraries.
 * - Non-blocking keepalive fetch & sendBeacon.
 * - Automated pageviews, 30s live heartbeats, and custom funnel triggers.
 */

function getOrCreateVisitorId() {
    if (typeof window === 'undefined') return 'anon';
    try {
        let vid = localStorage.getItem('gumshop_vid');
        if (!vid) {
            vid = typeof crypto !== 'undefined' && crypto.randomUUID 
                ? crypto.randomUUID() 
                : `v_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
            localStorage.setItem('gumshop_vid', vid);
        }
        return vid;
    } catch {
        return 'anon';
    }
}

function getOrCreateSessionId() {
    if (typeof window === 'undefined') return 'sess_anon';
    try {
        let sid = sessionStorage.getItem('gumshop_sid');
        if (!sid) {
            sid = `s_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
            sessionStorage.setItem('gumshop_sid', sid);
        }
        return sid;
    } catch {
        return 'sess_anon';
    }
}

// Global programmatic dispatcher for custom events (e.g. product_view, add_to_cart, initiate_checkout)
export function trackEvent(eventType, metadata = {}) {
    if (typeof window === 'undefined') return;
    try {
        const pathname = window.location.pathname;
        if (!pathname || pathname.startsWith('/dashboard') || pathname.startsWith('/store') || pathname.startsWith('/admin') || pathname.startsWith('/api')) {
            return;
        }
        const vid = getOrCreateVisitorId();
        const sid = getOrCreateSessionId();

        // Automatically resolve storeSlug from URL if not explicitly provided
        let storeSlug = metadata.storeSlug || metadata.storeId || '';
        if (!storeSlug) {
            if (pathname.startsWith('/shop/')) {
                storeSlug = pathname.split('/shop/')[1]?.split('/')[0] || '';
            } else if (pathname.startsWith('/creator/')) {
                storeSlug = pathname.split('/creator/')[1]?.split('/')[0] || '';
            } else if (typeof window !== 'undefined' && window.location.search) {
                try {
                    const params = new URLSearchParams(window.location.search);
                    storeSlug = params.get('store') || '';
                } catch {}
            }
        }

        const payload = {
            visitorId: vid,
            sessionId: sid,
            eventType: eventType || 'custom',
            pathname,
            pageTitle: document.title || 'GumShop',
            referrer: document.referrer || '',
            deviceType: window.innerWidth < 640 ? 'mobile' : (window.innerWidth < 1024 ? 'tablet' : 'desktop'),
            storeId: storeSlug,
            storeSlug: storeSlug,
            productId: metadata.productId || '',
            productName: metadata.productName || '',
            metadata: metadata.data || metadata
        };

        const jsonStr = JSON.stringify(payload);
        if (typeof fetch !== 'undefined') {
            fetch('/api/analytics/track', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: jsonStr,
                keepalive: true
            }).catch(() => {
                if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
                    navigator.sendBeacon('/api/analytics/track', new Blob([jsonStr], { type: 'text/plain;charset=UTF-8' }));
                }
            });
        } else if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
            navigator.sendBeacon('/api/analytics/track', new Blob([jsonStr], { type: 'text/plain;charset=UTF-8' }));
        }
    } catch (e) {
        console.warn('Analytics dispatch note:', e.message);
    }
}

export default function AnalyticsTracker() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const lastTrackedPath = useRef('');

    // Register window global dispatcher
    useEffect(() => {
        if (typeof window !== 'undefined') {
            window.gumshopTrack = trackEvent;
            
            const handleCustomTrack = (e) => {
                if (e.detail && e.detail.eventType) {
                    trackEvent(e.detail.eventType, e.detail);
                }
            };
            window.addEventListener('gumshop_track', handleCustomTrack);
            return () => window.removeEventListener('gumshop_track', handleCustomTrack);
        }
    }, []);

    // Automated Pageview Tracking on Route Change
    useEffect(() => {
        if (!pathname || pathname.startsWith('/dashboard') || pathname.startsWith('/store') || pathname.startsWith('/admin') || pathname.startsWith('/api')) return;
        const fullPath = searchParams?.toString() ? `${pathname}?${searchParams.toString()}` : pathname;
        if (fullPath === lastTrackedPath.current) return;
        lastTrackedPath.current = fullPath;

        // Extract context (store, product, utm)
        let storeSlug = searchParams?.get('store') || '';
        let productId = '';

        if (pathname.startsWith('/shop/')) {
            storeSlug = pathname.split('/shop/')[1]?.split('/')[0] || storeSlug;
        } else if (pathname.startsWith('/creator/')) {
            storeSlug = pathname.split('/creator/')[1]?.split('/')[0] || storeSlug;
        } else if (pathname.startsWith('/product/')) {
            productId = pathname.split('/product/')[1]?.split('/')[0] || '';
        }

        const utmSource = searchParams?.get('utm_source') || '';
        const utmMedium = searchParams?.get('utm_medium') || '';
        const utmCampaign = searchParams?.get('utm_campaign') || '';
        const utmContent = searchParams?.get('utm_content') || '';

        trackEvent('page_view', {
            storeSlug,
            productId,
            utmSource,
            utmMedium,
            utmCampaign,
            utmContent
        });
    }, [pathname, searchParams]);

    // Throttled Presence Pulse (120s) & Session Exit Beacon
    useEffect(() => {
        const interval = setInterval(() => {
            if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
                const p = window.location.pathname;
                if (p && !p.startsWith('/dashboard') && !p.startsWith('/store') && !p.startsWith('/admin') && !p.startsWith('/api')) {
                    trackEvent('heartbeat');
                }
            }
        }, 120000);

        // 2. Beacon on page hide / exit
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                const p = window.location.pathname;
                if (p && !p.startsWith('/dashboard') && !p.startsWith('/store') && !p.startsWith('/admin') && !p.startsWith('/api')) {
                    trackEvent('session_pause');
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            clearInterval(interval);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    return null;
}
