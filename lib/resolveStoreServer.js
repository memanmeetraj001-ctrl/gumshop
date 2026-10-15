/**
 * Dedicated Server-First Store Resolver
 * Queries /api/store/data (Supabase + serverDb) first for live, authoritative data.
 * Falls back to local presets only for offline resilience.
 */

export async function resolveStoreFromSlug(targetSlug, user) {
    if (!targetSlug) return null;
    const cleanSlug = String(targetSlug).toLowerCase().trim().replace(/^store_/, '');

    // 1. Authoritative server API (Supabase / serverDb)
    try {
        const res = await fetch(`/api/store/data?slug=${encodeURIComponent(cleanSlug)}`, { cache: 'no-store' });
        if (res.ok) {
            const data = await res.json();
            if (data.success && data.store) {
                return data.store;
            }
        }
    } catch (e) {
        // network or offline
    }

    // 2. Offline / local fallback
    try {
        const { getStoreAndCatalog } = await import('./storePresets.js');
        const resolved = await getStoreAndCatalog(cleanSlug);
        if (resolved?.store) {
            return resolved.store;
        }
    } catch {}

    return null;
}
