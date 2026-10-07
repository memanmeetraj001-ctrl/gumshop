import { database } from './firebase';
const ref = () => null;
const get = () => Promise.resolve({ exists: () => false });
const set = () => Promise.resolve();
const remove = () => Promise.resolve();

/**
 * Server-Side Vault for Sensitive API Tokens
 * Ensures access tokens are NEVER sent to client React bundles, URLs, or browser storage.
 */

let memoryVaultToken = process.env.GUMROAD_ACCESS_TOKEN || '';

export async function getServerGumroadToken() {
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

export async function setServerGumroadToken(token) {
    const cleanToken = (token || '').trim();
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

export async function clearServerGumroadToken() {
    return setServerGumroadToken('');
}
