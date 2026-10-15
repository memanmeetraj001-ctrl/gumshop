'use client'
import { getStoreByUserId, isStoreDeleted } from './firebaseDb.js';

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

export function getStoreGumroadToken(storeSlug = '') {
    if (typeof window === 'undefined') return '';
    const cleanSlug = (storeSlug || '').toLowerCase().replace(/^store_/, '').trim();
    if (!cleanSlug) return '';
    return (
        localStorage.getItem(`gumroad_token_${cleanSlug}`) ||
        localStorage.getItem(`gumroad_token_store_${cleanSlug}`) ||
        getCookie(`gumshop_token_${cleanSlug}`) ||
        ''
    ).trim();
}

export function getGumroadToken(storeSlug = '') {
    if (typeof window === 'undefined') return '';
    const activeSlug = storeSlug || localStorage.getItem('active_store_slug') || getCookie('active_store_slug') || '';
    if (activeSlug) {
        const storeToken = getStoreGumroadToken(activeSlug);
        if (storeToken) return storeToken;
    }
    
    // Check scoped store cache
    try {
        const raw = localStorage.getItem('gumshop_active_store');
        if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed?.gumroadToken) return parsed.gumroadToken.trim();
        }
    } catch {}

    return '';
}

export function setGumroadToken(token, storeSlug = '') {
    if (typeof window === 'undefined') return;
    const cleanToken = (token || '').trim();
    const cleanSlug = (storeSlug || localStorage.getItem('active_store_slug') || getCookie('active_store_slug') || '')
        .toLowerCase().replace(/^store_/, '').trim();

    if (cleanSlug) {
        if (cleanToken) {
            localStorage.setItem(`gumroad_token_${cleanSlug}`, cleanToken);
            localStorage.setItem(`gumroad_token_store_${cleanSlug}`, cleanToken);
            setCookie(`gumshop_token_${cleanSlug}`, cleanToken, 30);

            // Sync to server configuration route strictly scoped to this storeId
            fetch('/api/store/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ storeId: cleanSlug, gumroadToken: cleanToken })
            }).catch(() => {});
        } else {
            localStorage.removeItem(`gumroad_token_${cleanSlug}`);
            localStorage.removeItem(`gumroad_token_store_${cleanSlug}`);
            setCookie(`gumshop_token_${cleanSlug}`, '', -1);
        }
    }

    // Also update cached store in localStorage if matching
    try {
        const raw = localStorage.getItem('gumshop_active_store');
        if (raw) {
            const store = JSON.parse(raw);
            const parsedSlug = (store.username || store.name || store.id || '').toLowerCase().replace(/^store_/, '').trim();
            if (!cleanSlug || parsedSlug === cleanSlug) {
                store.gumroadToken = cleanToken;
                localStorage.setItem('gumshop_active_store', JSON.stringify(store));
            }
        }
    } catch {}
}

export function getAllLocalStores() {
    if (typeof window === 'undefined') return [];
    try {
        if (localStorage.getItem('gumshop_stores_cleared') === 'true' || localStorage.getItem('gumshop_empty_dashboard_ack') === 'true') {
            return [];
        }
        const raw = localStorage.getItem('gumshop_active_store');
        if (raw) {
            try {
                const parsed = JSON.parse(raw);
                if (parsed && (parsed.name || parsed.username || parsed.id)) {
                    const slug = (parsed.username || parsed.name || parsed.id || '').toLowerCase().replace(/[^a-z0-9-]+/g, '-');
                    if (!isStoreDeleted(parsed.id) && !isStoreDeleted(parsed.username) && !isStoreDeleted(slug)) {
                        return [{
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
                        }];
                    }
                }
            } catch {}
        }
        return [];
    } catch {
        return [];
    }
}

export function getActiveStoreSync() {
    if (typeof window === 'undefined') return null;
    try {
        if (localStorage.getItem('gumshop_stores_cleared') === 'true' || localStorage.getItem('gumshop_empty_dashboard_ack') === 'true') {
            return null;
        }

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
                            if (!parsed.gumroadToken) {
                                parsed.gumroadToken = getStoreGumroadToken(parsedSlug);
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
                        const storeSpecificToken = getStoreGumroadToken(activeSlug) || getStoreGumroadToken(parsed.id);
                        if (storeSpecificToken) {
                            parsed.gumroadToken = storeSpecificToken;
                        }
                        return parsed;
                    }
                }
            }

            // Search any store key matching this activeSlug
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (key.startsWith('cloned_store_') || key.startsWith('store_') || key.startsWith('gumshop_db_stores/'))) {
                    try {
                        const parsed = JSON.parse(localStorage.getItem(key) || '{}');
                        const pSlug = (parsed.username || parsed.name || parsed.storeName || parsed.id || '').toLowerCase().replace(/[^a-z0-9-]+/g, '-');
                        if (pSlug === activeSlug || parsed.id === activeSlug || parsed.id === `store_${activeSlug}`) {
                            if (isStoreDeleted(parsed.id) || isStoreDeleted(parsed.username)) continue;
                            const storeSpecificToken = getStoreGumroadToken(activeSlug) || getStoreGumroadToken(parsed.id);
                            if (storeSpecificToken) {
                                parsed.gumroadToken = storeSpecificToken;
                            }
                            return parsed;
                        }
                    } catch {}
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
        if (!firstStore.gumroadToken) {
            firstStore.gumroadToken = getStoreGumroadToken(firstStore.username);
        }
        return firstStore;
    }

    // When no stores exist or all stores were deleted, return null
    return null;
    } catch {
        return null;
    }
}

export async function getActiveStore(user) {
    if (typeof window !== 'undefined') {
        const activeSlug = (localStorage.getItem('active_store_slug') || getCookie('active_store_slug') || '').toLowerCase().trim();
        if (activeSlug) {
            // 1. Authoritative: Query fresh server database first
            try {
                const { getStoreByUsername } = await import('./firebaseDb');
                const remoteMatch = await getStoreByUsername(activeSlug);
                if (remoteMatch) {
                    if (!remoteMatch.gumroadToken) {
                        remoteMatch.gumroadToken = getStoreGumroadToken(remoteMatch.username || activeSlug);
                    }
                    localStorage.setItem('gumshop_active_store', JSON.stringify(remoteMatch));
                    return remoteMatch;
                }
            } catch {}

            // 2. Offline fallback ONLY if remote query failed
            const syncMatch = getActiveStoreSync();
            if (syncMatch) {
                const sSlug = (syncMatch.username || syncMatch.name || syncMatch.id || '').toLowerCase().replace(/[^a-z0-9-]+/g, '-');
                if (sSlug === activeSlug || syncMatch.id === activeSlug || syncMatch.id === `store_${activeSlug}`) {
                    return syncMatch;
                }
            }
            return syncMatch;
        }
    }

    if (user?.uid) {
        try {
            const activeSlug = typeof window !== 'undefined' ? (localStorage.getItem('active_store_slug') || '') : '';
            const remoteStore = await getStoreByUserId(user.uid, activeSlug);
            if (remoteStore) {
                if (!remoteStore.gumroadToken) {
                    remoteStore.gumroadToken = getStoreGumroadToken(remoteStore.username || activeSlug);
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
    try {
        const slug = localStorage.getItem('gumshop_homepage_store') || getCookie('gumshop_homepage_store') || '';
        return slug.toLowerCase().trim();
    } catch {
        return '';
    }
}

export function setHomepageStoreSlug(slugOrStore) {
    if (typeof window === 'undefined' || !slugOrStore) return Promise.resolve();
    const cleanSlug = (typeof slugOrStore === 'object' 
        ? (slugOrStore.username || slugOrStore.name || slugOrStore.id || '') 
        : slugOrStore).toLowerCase().trim().replace(/^store_/, '').replace(/[^a-z0-9-]+/g, '-');
    
    if (!cleanSlug) return Promise.resolve();

    localStorage.setItem('gumshop_homepage_store', cleanSlug);
    setCookie('gumshop_homepage_store', cleanSlug, 30);

    window.dispatchEvent(new Event('homepage_store_changed'));

    // Sync to server API
    return fetch('/api/store/homepage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeSlug: cleanSlug })
    }).catch(() => {});
}

export function getHomepageStoreSync() {
    if (typeof window === 'undefined') return null;
    const slug = getHomepageStoreSlug();
    if (!slug) return null;

    const allStores = getAllLocalStores();
    let found = allStores.find(s => 
        (s.username && s.username.toLowerCase() === slug) || 
        (s.id && (s.id.toLowerCase() === slug || s.id.toLowerCase() === `store_${slug}`))
    );

    if (!found) {
        const keysToTry = [
            `cloned_store_${slug}`,
            `store_${slug}`,
            `store_store_${slug}`,
            `gumshop_db_stores/store_${slug}`,
            `gumshop_db_stores/${slug}`
        ];
        for (const k of keysToTry) {
            try {
                const raw = localStorage.getItem(k);
                if (raw) {
                    const parsed = JSON.parse(raw);
                    if (parsed && (parsed.name || parsed.username || parsed.id)) {
                        found = parsed;
                        break;
                    }
                }
            } catch {}
        }
    }

    return found || null;
}
