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
}

export function getAllLocalStores() {
    if (typeof window === 'undefined') return [];
    try {
        if (localStorage.getItem('gumshop_stores_cleared') === 'true' || localStorage.getItem('gumshop_empty_dashboard_ack') === 'true') {
            return [];
        }
        const activeSlug = (localStorage.getItem('active_store_slug') || getCookie('active_store_slug') || '').toLowerCase().trim();
        if (activeSlug && !isStoreDeleted(activeSlug)) {
            return [{
                id: activeSlug.startsWith('store_') ? activeSlug : `store_${activeSlug}`,
                username: activeSlug.replace(/^store_/, ''),
                name: activeSlug.replace(/^store_/, ''),
                status: 'active'
            }];
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
        if (!activeSlug || isStoreDeleted(activeSlug) || isStoreDeleted(`store_${activeSlug}`)) {
            return null;
        }

        const storeToken = getStoreGumroadToken(activeSlug);
        return {
            id: activeSlug.startsWith('store_') ? activeSlug : `store_${activeSlug}`,
            username: activeSlug.replace(/^store_/, ''),
            name: activeSlug.replace(/^store_/, ''),
            gumroadToken: storeToken
        };
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
                    return remoteMatch;
                }
            } catch {}

            return getActiveStoreSync();
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
    
    const cleanSlug = (typeof slugOrStore === 'object'
        ? (slugOrStore.username || slugOrStore.name || slugOrStore.id || 'shop')
        : String(slugOrStore)
    ).toLowerCase().trim().replace(/^store_/, '').replace(/[^a-z0-9-]+/g, '-');

    if (!cleanSlug || isStoreDeleted(cleanSlug) || isStoreDeleted(`store_${cleanSlug}`)) return;

    localStorage.setItem('active_store_slug', cleanSlug);
    setCookie('active_store_slug', cleanSlug, 30);

    // Explicitly wipe legacy store dumps from storage so no stale products can linger
    try {
        localStorage.removeItem('gumshop_active_store');
        localStorage.removeItem('active_store_cache');
        localStorage.removeItem(`cloned_store_${cleanSlug}`);
        localStorage.removeItem(`store_${cleanSlug}`);
        sessionStorage.removeItem(`cloned_store_${cleanSlug}`);
        sessionStorage.removeItem(`store_${cleanSlug}`);
    } catch {}

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

    return {
        id: slug.startsWith('store_') ? slug : `store_${slug}`,
        username: slug.replace(/^store_/, ''),
        name: slug.replace(/^store_/, '')
    };
}

export function getHomepageMode() {
    if (typeof window === 'undefined') return 'single';
    try {
        const mode = localStorage.getItem('gumshop_homepage_mode') || getCookie('gumshop_homepage_mode') || 'single';
        return mode === 'all' ? 'all' : 'single';
    } catch {
        return 'single';
    }
}

export function setHomepageMode(mode, storeSlug = '') {
    if (typeof window === 'undefined') return Promise.resolve();
    const cleanMode = mode === 'all' ? 'all' : 'single';
    localStorage.setItem('gumshop_homepage_mode', cleanMode);
    setCookie('gumshop_homepage_mode', cleanMode, 30);
    window.dispatchEvent(new Event('homepage_mode_changed'));
    window.dispatchEvent(new Event('homepage_store_changed'));

    return fetch('/api/store/homepage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: cleanMode, storeSlug: storeSlug || undefined })
    }).catch(() => {});
}

