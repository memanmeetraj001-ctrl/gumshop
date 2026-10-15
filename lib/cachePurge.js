/**
 * Cache Purge & Migration Utility
 * Wipes legacy localStorage & sessionStorage product/catalog caches
 * so that Supabase remains the live, singular source of truth.
 */

export function purgeStaleCatalogCaches() {
    if (typeof window === 'undefined') return;

    try {
        const PURGE_VERSION = 'v3_total_cache_elimination_pure_supabase_2026';
        const keysToRemove = [];

        // Scan localStorage
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key) continue;

            // Remove legacy store and product cache dumps
            if (
                key.startsWith('cloned_store_') ||
                key.startsWith('store_') ||
                key.startsWith('gumshop_db_products/') ||
                key.startsWith('gumshop_db_stores/') ||
                key === 'gumshop_db_products' ||
                key === 'gumshop_db_stores' ||
                key === 'gumshop_active_store' ||
                key === 'active_store_cache'
            ) {
                keysToRemove.push({ storage: localStorage, key });
            }
        }

        // Scan sessionStorage
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (!key) continue;

            if (
                key.startsWith('cloned_store_') ||
                key.startsWith('store_') ||
                key.startsWith('gumshop_db_products/') ||
                key.startsWith('gumshop_db_stores/') ||
                key === 'gumshop_active_store' ||
                key === 'active_store_cache'
            ) {
                keysToRemove.push({ storage: sessionStorage, key });
            }
        }

        // Execute removal
        keysToRemove.forEach(({ storage, key }) => {
            try {
                storage.removeItem(key);
            } catch {}
        });

        localStorage.setItem('gumshop_cache_purge_version', PURGE_VERSION);
        if (keysToRemove.length > 0) {
            console.log(`[GumShop Cache Purge] Cleared ${keysToRemove.length} legacy catalog cache entries. Supabase is live single-source-of-truth.`);
        }
    } catch (e) {
        console.warn('[GumShop Cache Purge] Non-fatal purge notice:', e);
    }
}
