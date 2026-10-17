/**
 * lib/resolveStoreServer.js
 * 
 * Dedicated Server-First Store Resolver.
 * Resolves stores directly via PostgREST / Supabase data layer with zero relative URL failures.
 */

import { getStoreBySlug } from './db/stores.js';
import { serverGetStore } from './serverDb.js';

export async function resolveStoreFromSlug(targetSlug, user) {
    if (!targetSlug) return null;
    const cleanSlug = String(targetSlug).toLowerCase().trim().replace(/^store_/, '');

    // 1. Direct in-process data layer (fastest, 0 HTTP overhead)
    try {
        const store = await getStoreBySlug(cleanSlug);
        if (store) return store;
    } catch (e) {
        // Continue to fallback
    }

    // 2. ServerDb memory / cache fallback
    try {
        const store = await serverGetStore(cleanSlug);
        if (store) return store;
    } catch (e) {
        // Continue to fallback
    }

    // 3. Optional client-side fetch if called in browser
    if (typeof window !== 'undefined') {
        try {
            const res = await fetch(`/api/store/data?slug=${encodeURIComponent(cleanSlug)}`, { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                if (data.success && data.store) {
                    return data.store;
                }
            }
        } catch (_) {}
    }

    return null;
}
