import { database } from './firebase.js';
const ref = () => null;
const get = () => Promise.resolve({ exists: () => false });
const set = () => Promise.resolve();
const remove = () => Promise.resolve();

/**
 * Server-Side Vault for Sensitive API Tokens
 * Ensures access tokens are NEVER sent to client React bundles, URLs, or browser storage.
 */

globalThis.__gumshop_store_vault_tokens = globalThis.__gumshop_store_vault_tokens || new Map();
let memoryVaultToken = process.env.GUMROAD_ACCESS_TOKEN || '';

function getStoreKeyVariations(key) {
    if (!key || typeof key !== 'string') return [];
    const raw = key.toLowerCase().trim();
    const clean = raw.replace(/^store_/, '');
    const vHyphen = clean.replace(/_/g, '-');
    const vUnderscore = clean.replace(/-/g, '_');
    return Array.from(new Set([clean, vHyphen, vUnderscore, raw, `store_${vHyphen}`, `store_${vUnderscore}`]));
}

function normalizeStoreKey(key) {
    if (!key || typeof key !== 'string') return '';
    return key.toLowerCase().replace(/^store_/, '').trim();
}

export async function getServerGumroadToken(storeKey = '') {
    const cleanKey = normalizeStoreKey(storeKey);

    // If a store key is provided, strictly resolve that specific store's vaulted token
    if (cleanKey) {
        const variations = getStoreKeyVariations(storeKey);
        for (const v of variations) {
            if (globalThis.__gumshop_store_vault_tokens.has(v)) {
                return globalThis.__gumshop_store_vault_tokens.get(v);
            }
        }

        if (database) {
            try {
                const vaultRef = ref(database, `vault/stores/${cleanKey}/gumroad_token`);
                const snapshot = await get(vaultRef);
                if (snapshot.exists()) {
                    const val = snapshot.val();
                    if (typeof val === 'string' && val.trim()) {
                        for (const v of variations) {
                            globalThis.__gumshop_store_vault_tokens.set(v, val.trim());
                        }
                        return val.trim();
                    }
                }
            } catch (e) {
                console.warn('Server vault store read notice:', e.message);
            }
        }
        return '';
    }

    // 1. Check environment variable first
    if (process.env.GUMROAD_ACCESS_TOKEN && process.env.GUMROAD_ACCESS_TOKEN.trim()) {
        return process.env.GUMROAD_ACCESS_TOKEN.trim();
    }

    // 2. Check in-memory cached token
    if (memoryVaultToken && memoryVaultToken.trim()) {
        return memoryVaultToken.trim();
    }

    // 3. Check server-side Firebase vault path
    if (database) {
        try {
            const vaultRef = ref(database, 'vault/gumroad_token');
            const snapshot = await get(vaultRef);
            if (snapshot.exists()) {
                const val = snapshot.val();
                if (typeof val === 'string' && val.trim()) {
                    memoryVaultToken = val.trim();
                    return memoryVaultToken;
                }
            }
        } catch (e) {
            console.warn('Server vault read notice:', e.message);
        }
    }

    return '';
}

export async function setServerGumroadToken(token, storeKey = '') {
    const cleanToken = (token || '').trim();
    const cleanKey = normalizeStoreKey(storeKey);

    if (cleanKey) {
        const variations = getStoreKeyVariations(storeKey);
        if (cleanToken) {
            for (const v of variations) {
                globalThis.__gumshop_store_vault_tokens.set(v, cleanToken);
            }
        } else {
            for (const v of variations) {
                globalThis.__gumshop_store_vault_tokens.delete(v);
            }
        }

        if (database) {
            try {
                const vaultRef = ref(database, `vault/stores/${cleanKey}/gumroad_token`);
                if (cleanToken) {
                    await set(vaultRef, cleanToken);
                } else {
                    await remove(vaultRef);
                }
            } catch (e) {
                console.warn('Server vault store write notice:', e.message);
            }
        }
        return true;
    }

    memoryVaultToken = cleanToken;

    if (database) {
        try {
            const vaultRef = ref(database, 'vault/gumroad_token');
            if (cleanToken) {
                await set(vaultRef, cleanToken);
            } else {
                await remove(vaultRef);
            }
        } catch (e) {
            console.warn('Server vault write notice:', e.message);
        }
    }

    return true;
}

export async function clearServerGumroadToken(storeKey = '') {
    return setServerGumroadToken('', storeKey);
}
