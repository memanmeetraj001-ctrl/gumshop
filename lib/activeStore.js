'use client'
import { getStoreByUserId, isStoreDeleted } from './firebaseDb';

// Cookie helpers for zero-loss persistence across reloads
function getCookie(name) {
    if (typeof document === 'undefined') return '';
    const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
    return match ? decodeURIComponent(match[3]) : '';
}

function setCookie(name, val, days = 30) {
    if (typeof document === 'undefined') return;
    const maxAge = days * 24 * 60 * 60;
    document.cookie = `${name}=${encodeURIComponent(val)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function getGumroadToken() {
    if (typeof window === 'undefined') return '';
    
    // 1. Check primary localStorage keys
    let token = localStorage.getItem('gumshop_gumroad_token') || 
                localStorage.getItem('gumroad_access_token') || 
                localStorage.getItem('gumshop_master_token') || '';

    // 2. Check persistent cookie if localStorage was cleared/empty
    if (!token) {
        token = getCookie('gumshop_merchant_token') || '';
        if (token) {
            // Restore to localStorage so both layers stay synchronized
            localStorage.setItem('gumshop_gumroad_token', token);
            localStorage.setItem('gumroad_access_token', token);
        }
    } else {
        // Ensure cookie has it too
        setCookie('gumshop_merchant_token', token, 30);
    }

    return token.trim();
}

export function setGumroadToken(token) {
    if (typeof window === 'undefined') return;
    const cleanToken = (token || '').trim();

    if (cleanToken) {
        localStorage.setItem('gumshop_gumroad_token', cleanToken);
        localStorage.setItem('gumroad_access_token', cleanToken);
        localStorage.setItem('gumshop_master_token', cleanToken);
        setCookie('gumshop_merchant_token', cleanToken, 30);

        // Fire-and-forget sync to server configuration route
        fetch('/api/store/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ gumroadToken: cleanToken })
        }).catch(() => {});
    } else {
        localStorage.removeItem('gumshop_gumroad_token');
        localStorage.removeItem('gumroad_access_token');
        localStorage.removeItem('gumshop_master_token');
        setCookie('gumshop_merchant_token', '', -1);
    }

    // Also update cached store in localStorage if present
    try {
        const raw = localStorage.getItem('gumshop_active_store');
        if (raw) {
            const store = JSON.parse(raw);
            store.gumroadToken = cleanToken;
            localStorage.setItem('gumshop_active_store', JSON.stringify(store));
        }
    } catch {}
}

export function getAllLocalStores() {
    if (typeof window === 'undefined') return [];
    if (localStorage.getItem('gumshop_stores_cleared') === 'true' || localStorage.getItem('gumshop_empty_dashboard_ack') === 'true') {
        return [];
    }
    const stores = [];
    const seenSlugs = new Set();
    const ignoredKeys = new Set([
        'store_products', 'store_cart', 'store_orders', 'store_token', 
        'store_session', 'store_config', 'store_settings', 'store_info', 
        'store_user', 'gumshop_stores_cleared', 'gumshop_deleted_products', 
        'gumshop_tombstones', 'gumshop_recent_orders', 'gumshop_active_store',
        'gumshop_empty_dashboard_ack'
    ]);

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && !ignoredKeys.has(key) && !key.startsWith('gumshop_recent_orders_') && (key.startsWith('store_') || key.startsWith('cloned_store_') || key.startsWith('gumshop_db_stores/'))) {
            try {
                const parsed = JSON.parse(localStorage.getItem(key) || '{}');
                if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && (parsed.name || parsed.username || parsed.storeName)) {
                    const slug = (parsed.username || parsed.name || parsed.storeName || '').toLowerCase().replace(/[^a-z0-9-]+/g, '-');
                    if (isStoreDeleted(parsed.id) || isStoreDeleted(parsed.username) || isStoreDeleted(slug) || isStoreDeleted(parsed.name)) {
                        continue;
                    }
                    if (slug && !seenSlugs.has(slug)) {
                        seenSlugs.add(slug);
                        stores.push({
                            id: parsed.id || `store_${slug}`,
                            name: parsed.name || parsed.storeName || slug,
                            username: slug,
                            description: parsed.description || '',
                            theme: parsed.theme || 'viral_lander',
                            themeColor: parsed.themeColor || '#10B981',
                            logo: parsed.logo || '',
                            status: parsed.status || 'active',
                            products: Array.isArray(parsed.products) ? parsed.products : [],
                            productsCount: Array.isArray(parsed.products) ? parsed.products.length : 0,
                            createdAt: parsed.createdAt || new Date().toISOString()
                        });
                    }
                }
            } catch {}
        }
    }
    return stores;
}

export function getActiveStoreSync() {
    if (typeof window === 'undefined') return null;
    if (localStorage.getItem('gumshop_stores_cleared') === 'true' || localStorage.getItem('gumshop_empty_dashboard_ack') === 'true') {
        return null;
    }

    const persistentToken = getGumroadToken();
    const activeSlug = (localStorage.getItem('active_store_slug') || getCookie('active_store_slug') || '').toLowerCase().trim();

    // 0. Check primary active store cache (must match activeSlug if activeSlug is set, and must not be deleted)
    try {
        const rawActive = localStorage.getItem('gumshop_active_store');
        if (rawActive) {
            const parsed = JSON.parse(rawActive);
            if (parsed && (parsed.name || parsed.username || parsed.id)) {
                if (isStoreDeleted(parsed.id) || isStoreDeleted(parsed.username)) {
                    localStorage.removeItem('gumshop_active_store');
                    localStorage.removeItem('active_store_slug');
                } else {
                    const parsedSlug = (parsed.username || parsed.name || parsed.id || '').toLowerCase().replace(/[^a-z0-9-]+/g, '-');
                    if (!activeSlug || parsedSlug === activeSlug || parsed.id === activeSlug || parsed.id === `store_${activeSlug}`) {
                        if (!parsed.gumroadToken && persistentToken) {
                            parsed.gumroadToken = persistentToken;
                        }
                        return parsed;
                    }
                }
            }
        }
    } catch {}

    // 1. Check if user explicitly selected a store slug
    if (activeSlug) {
        if (isStoreDeleted(activeSlug) || isStoreDeleted(`store_${activeSlug}`)) {
            localStorage.removeItem('active_store_slug');
            localStorage.removeItem('gumshop_active_store');
            setCookie('active_store_slug', '', -1);
            return null;
        }

        try {
            const keysToTry = [
                `cloned_store_${activeSlug}`,
                `store_${activeSlug}`,
                `store_store_${activeSlug}`,
                `store_${activeSlug.replace(/^store_/, '')}`,
                `gumshop_db_stores/store_${activeSlug}`,
                `gumshop_db_stores/${activeSlug}`
            ];
            for (const k of keysToTry) {
                const raw = localStorage.getItem(k);
                if (raw) {
                    const parsed = JSON.parse(raw);
                    if (parsed && (parsed.name || parsed.username || parsed.storeName)) {
                        if (isStoreDeleted(parsed.id) || isStoreDeleted(parsed.username)) continue;
                        const storeSpecificToken = localStorage.getItem(`gumroad_token_${activeSlug}`) || localStorage.getItem(`gumroad_token_${parsed.id || ''}`);
                        if (storeSpecificToken) {
                            parsed.gumroadToken = storeSpecificToken;
                        } else if (!parsed.gumroadToken && persistentToken) {
                            parsed.gumroadToken = persistentToken;
                        }
                        return parsed;
                    }
                }
            }

            // Search any store key matching this activeSlug
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (key.startsWith('cloned_store_') || key.startsWith('store_') || key.startsWith('gumshop_db_stores/'))) {
                    const parsed = JSON.parse(localStorage.getItem(key) || '{}');
                    const pSlug = (parsed.username || parsed.name || parsed.storeName || parsed.id || '').toLowerCase().replace(/[^a-z0-9-]+/g, '-');
                    if (pSlug === activeSlug || parsed.id === activeSlug || parsed.id === `store_${activeSlug}`) {
                        if (isStoreDeleted(parsed.id) || isStoreDeleted(parsed.username)) continue;
                        const storeSpecificToken = localStorage.getItem(`gumroad_token_${activeSlug}`) || localStorage.getItem(`gumroad_token_${parsed.id || ''}`);
                        if (storeSpecificToken) {
                            parsed.gumroadToken = storeSpecificToken;
                        } else if (!parsed.gumroadToken && persistentToken) {
                            parsed.gumroadToken = persistentToken;
                        }
                        return parsed;
                    }
                }
            }
        } catch {}

        return null;
    }

    // 2. Scan localStorage for any existing store when NO activeSlug is specified
    const localStores = getAllLocalStores();
    if (localStores.length > 0) {
        const firstStore = localStores[0];
        localStorage.setItem('active_store_slug', firstStore.username);
        setCookie('active_store_slug', firstStore.username, 30);
        if (!firstStore.gumroadToken && persistentToken) {
            firstStore.gumroadToken = persistentToken;
        }
        return firstStore;
    }

    // When no stores exist or all stores were deleted, return null
    return null;
}

export async function getActiveStore(user) {
    if (typeof window !== 'undefined') {
        const activeSlug = (localStorage.getItem('active_store_slug') || getCookie('active_store_slug') || '').toLowerCase().trim();
        if (activeSlug) {
            const syncMatch = getActiveStoreSync();
            if (syncMatch) {
                const sSlug = (syncMatch.username || syncMatch.name || syncMatch.id || '').toLowerCase().replace(/[^a-z0-9-]+/g, '-');
                if (sSlug === activeSlug || syncMatch.id === activeSlug || syncMatch.id === `store_${activeSlug}`) {
                    return syncMatch;
                }
            }
            try {
                const { getStoreByUsername } = await import('./firebaseDb');
                const remoteMatch = await getStoreByUsername(activeSlug);
                if (remoteMatch) {
                    const persistentToken = getGumroadToken();
                    if (!remoteMatch.gumroadToken && persistentToken) {
                        remoteMatch.gumroadToken = persistentToken;
                    }
                    return remoteMatch;
                }
            } catch {}
            return syncMatch;
        }
    }

    if (user?.uid) {
        try {
            const activeSlug = typeof window !== 'undefined' ? (localStorage.getItem('active_store_slug') || '') : '';
            const remoteStore = await getStoreByUserId(user.uid, activeSlug);
            if (remoteStore) {
                const persistentToken = getGumroadToken();
                if (!remoteStore.gumroadToken && persistentToken) {
                    remoteStore.gumroadToken = persistentToken;
                }
                return remoteStore;
            }
        } catch {}
    }

    return getActiveStoreSync();
}

export function setActiveStoreSlug(slugOrStore) {
    if (typeof window === 'undefined' || !slugOrStore) return;
    
    if (typeof slugOrStore === 'object') {
        const cleanSlug = (slugOrStore.username || slugOrStore.name || slugOrStore.id || 'shop').toLowerCase().replace(/[^a-z0-9-]+/g, '-');
        if (isStoreDeleted(cleanSlug) || isStoreDeleted(slugOrStore.id)) return;
        localStorage.setItem('active_store_slug', cleanSlug);
        setCookie('active_store_slug', cleanSlug, 30);
        localStorage.setItem('gumshop_active_store', JSON.stringify(slugOrStore));
    } else {
        const cleanSlug = slugOrStore.toLowerCase().replace(/[^a-z0-9-]+/g, '-');
        if (isStoreDeleted(cleanSlug) || isStoreDeleted(`store_${cleanSlug}`)) return;
        localStorage.setItem('active_store_slug', cleanSlug);
        setCookie('active_store_slug', cleanSlug, 30);
        const raw = localStorage.getItem(`cloned_store_${cleanSlug}`) || 
                    localStorage.getItem(`store_${cleanSlug}`) ||
                    localStorage.getItem(`store_store_${cleanSlug}`) ||
                    localStorage.getItem(`gumshop_db_stores/store_${cleanSlug}`) ||
                    localStorage.getItem(`gumshop_db_stores/${cleanSlug}`);
        if (raw) {
            localStorage.setItem('gumshop_active_store', raw);
        } else {
            localStorage.removeItem('gumshop_active_store');
        }
    }
    
    window.dispatchEvent(new Event('active_store_changed'));
}

export function getHomepageStoreSlug() {
    if (typeof window === 'undefined') return '';
    const slug = localStorage.getItem('gumshop_homepage_store') || getCookie('gumshop_homepage_store') || '';
    return slug.toLowerCase().trim();
}

export function setHomepageStoreSlug(slugOrStore) {
    if (typeof window === 'undefined' || !slugOrStore) return;
    const cleanSlug = (typeof slugOrStore === 'object' 
        ? (slugOrStore.username || slugOrStore.name || slugOrStore.id || '') 
        : slugOrStore).toLowerCase().trim().replace(/^store_/, '').replace(/[^a-z0-9-]+/g, '-');
    
    if (!cleanSlug) return;

    localStorage.setItem('gumshop_homepage_store', cleanSlug);
    setCookie('gumshop_homepage_store', cleanSlug, 30);

    // Sync to server API
    fetch('/api/store/homepage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeSlug: cleanSlug })
    }).catch(() => {});

    window.dispatchEvent(new Event('homepage_store_changed'));
}

export function getHomepageStoreSync() {
    if (typeof window === 'undefined') return null;
    const slug = getHomepageStoreSlug();
    if (!slug) return null;

    const allStores = getAllLocalStores();
    const found = allStores.find(s => 
        (s.username && s.username.toLowerCase() === slug) || 
        (s.id && (s.id.toLowerCase() === slug || s.id.toLowerCase() === `store_${slug}`))
    );
    return found || null;
}
