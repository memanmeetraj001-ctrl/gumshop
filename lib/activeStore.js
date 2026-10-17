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
        const found = [];
        const seen = new Set();

        const activeSlug = (localStorage.getItem('active_store_slug') || getCookie('active_store_slug') || '').toLowerCase().trim();
        if (activeSlug && !isStoreDeleted(activeSlug)) {
            const clean = activeSlug.replace(/^store_/, '');
            seen.add(clean);
            const isRubber = clean === 'rubber-couch-toys-official-store';
            const isPhantom = clean === 'phantompaws-headless-horseman-pet-costume';
            found.push({
                id: activeSlug.startsWith('store_') ? activeSlug : `store_${activeSlug}`,
                username: clean,
                name: isRubber ? 'Rubber Couch Toys Official Store' : (isPhantom ? 'PhantomPaws Headless Horseman Pet Costume' : clean),
                logo: isRubber 
                    ? 'https://theluckylk.com/cdn/shop/files/30kb.webp?crop=center&height=32&v=1792057646&width=32'
                    : (isPhantom ? 'https://cdn.shopify.com/s/files/1/0680/7997/6546/files/1_1c648c33-92f0-4ba2-a0ec-487472836950.png?v=1790669403' : ''),
                avatar: isRubber 
                    ? 'https://theluckylk.com/cdn/shop/files/30kb.webp?crop=center&height=32&v=1792057646&width=32'
                    : (isPhantom ? 'https://cdn.shopify.com/s/files/1/0680/7997/6546/files/1_1c648c33-92f0-4ba2-a0ec-487472836950.png?v=1790669403' : ''),
                productsCount: isRubber ? 174 : (isPhantom ? 1 : 0),
                status: 'active'
            });
        }

        // Always ensure the 2 primary official stores are present in local list
        const primaryStores = [
            {
                id: 'store_rubber-couch-toys-official-store',
                username: 'rubber-couch-toys-official-store',
                name: 'Rubber Couch Toys Official Store',
                description: 'We Sell Gel Ball Launcher (Toy Guns) which is a superior alternative to Airsoft.',
                theme: 'viral_lander',
                themeColor: '#10B981',
                logo: 'https://theluckylk.com/cdn/shop/files/30kb.webp?crop=center&height=32&v=1792057646&width=32',
                avatar: 'https://theluckylk.com/cdn/shop/files/30kb.webp?crop=center&height=32&v=1792057646&width=32',
                productsCount: 174,
                status: 'active'
            },
            {
                id: 'store_phantompaws-headless-horseman-pet-costume',
                username: 'phantompaws-headless-horseman-pet-costume',
                name: 'PhantomPaws Headless Horseman Pet Costume',
                description: "A headless horseman rider with a glowing jack-o'-lantern that straps onto your cat or small dog in seconds. Free tracked US shipping.",
                theme: 'clean_beauty',
                themeColor: '#F43F5E',
                logo: 'https://cdn.shopify.com/s/files/1/0680/7997/6546/files/1_1c648c33-92f0-4ba2-a0ec-487472836950.png?v=1790669403',
                avatar: 'https://cdn.shopify.com/s/files/1/0680/7997/6546/files/1_1c648c33-92f0-4ba2-a0ec-487472836950.png?v=1790669403',
                productsCount: 1,
                status: 'active'
            }
        ];

        for (const ps of primaryStores) {
            if (!seen.has(ps.username) && !isStoreDeleted(ps.username) && !isStoreDeleted(ps.id)) {
                found.push(ps);
                seen.add(ps.username);
            }
        }

        return found;
    } catch {
        return [];
    }
}

export function getActiveStoreSync() {
    if (typeof window === 'undefined') return null;
    try {
        let activeSlug = (localStorage.getItem('active_store_slug') || getCookie('active_store_slug') || '').toLowerCase().trim();
        if (!activeSlug || isStoreDeleted(activeSlug) || isStoreDeleted(`store_${activeSlug}`)) {
            activeSlug = (localStorage.getItem('gumshop_homepage_store') || getCookie('gumshop_homepage_store') || 'rubber-couch-toys-official-store').toLowerCase().trim();
        }

        const storeToken = getStoreGumroadToken(activeSlug);
        const clean = activeSlug.replace(/^store_/, '');
        return {
            id: activeSlug.startsWith('store_') ? activeSlug : `store_${activeSlug}`,
            username: clean,
            name: clean === 'rubber-couch-toys-official-store' ? 'Rubber Couch Toys Official Store' : (clean === 'phantompaws-headless-horseman-pet-costume' ? 'PhantomPaws Headless Horseman Pet Costume' : clean),
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

    // Strict identity guard: if already the active store, do not wipe storage or re-dispatch event
    const currentSlug = (localStorage.getItem('active_store_slug') || getCookie('active_store_slug') || '').toLowerCase().trim();
    if (currentSlug === cleanSlug) {
        return;
    }

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
        return (mode === 'all' || mode === 'custom') ? mode : 'single';
    } catch {
        return 'single';
    }
}

export function getHomepageSelectedStores() {
    if (typeof window === 'undefined') return [];
    try {
        const raw = localStorage.getItem('gumshop_homepage_stores') || getCookie('gumshop_homepage_stores') || '';
        if (raw) {
            try {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return parsed.map(s => String(s).toLowerCase().trim().replace(/^store_/, ''));
                }
            } catch {
                const split = raw.split(',').map(s => s.toLowerCase().trim().replace(/^store_/, '')).filter(Boolean);
                if (split.length > 0) return split;
            }
        }
        return ['rubber-couch-toys-official-store', 'phantompaws-headless-horseman-pet-costume'];
    } catch {
        return ['rubber-couch-toys-official-store', 'phantompaws-headless-horseman-pet-costume'];
    }
}

export function setHomepageSelectedStores(storeSlugs) {
    if (typeof window === 'undefined') return Promise.resolve();
    const cleanSlugs = Array.isArray(storeSlugs) 
        ? storeSlugs.map(s => String(s).toLowerCase().trim().replace(/^store_/, '')).filter(Boolean)
        : [];

    const jsonStr = JSON.stringify(cleanSlugs);
    localStorage.setItem('gumshop_homepage_stores', jsonStr);
    setCookie('gumshop_homepage_stores', cleanSlugs.join(','), 30);
    window.dispatchEvent(new Event('homepage_stores_changed'));
    window.dispatchEvent(new Event('homepage_store_changed'));

    return fetch('/api/store/homepage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedStores: cleanSlugs })
    }).catch(() => {});
}

export function setHomepageMode(mode, storeSlug = '', selectedStores = null) {
    if (typeof window === 'undefined') return Promise.resolve();
    const cleanMode = (mode === 'all' || mode === 'custom') ? mode : 'single';
    localStorage.setItem('gumshop_homepage_mode', cleanMode);
    setCookie('gumshop_homepage_mode', cleanMode, 30);

    let cleanSlugs = null;
    if (Array.isArray(selectedStores)) {
        cleanSlugs = selectedStores.map(s => String(s).toLowerCase().trim().replace(/^store_/, '')).filter(Boolean);
        localStorage.setItem('gumshop_homepage_stores', JSON.stringify(cleanSlugs));
        setCookie('gumshop_homepage_stores', cleanSlugs.join(','), 30);
    }

    window.dispatchEvent(new Event('homepage_mode_changed'));
    window.dispatchEvent(new Event('homepage_stores_changed'));
    window.dispatchEvent(new Event('homepage_store_changed'));

    const payload = { mode: cleanMode };
    if (storeSlug) payload.storeSlug = storeSlug;
    if (cleanSlugs) payload.selectedStores = cleanSlugs;

    return fetch('/api/store/homepage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    }).catch(() => {});
}

