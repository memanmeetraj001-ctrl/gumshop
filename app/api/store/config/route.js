import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getServerGumroadToken, setServerGumroadToken } from '@/lib/serverVault';

// Server-side in-memory cache for fast zero-latency access across API routes
globalThis.__gumshop_server_configs = globalThis.__gumshop_server_configs || new Map();

let serverStoreConfig = {
    gumroadToken: '',
    gumroadProductUrl: '',
    activeStoreId: '',
    storeName: '',
    tracking: {},
    updatedAt: null
};

const TOKEN_COOKIE_NAME = 'gumshop_merchant_token';
const CONFIG_COOKIE_NAME = 'gumshop_store_config';

function normalizeStoreKey(key) {
    if (!key || typeof key !== 'string') return '';
    return key.toLowerCase().replace(/^store_/, '').trim();
}

export async function GET(req) {
    try {
        const url = new URL(req.url);
        const storeId = url.searchParams.get('storeId') || url.searchParams.get('store') || url.searchParams.get('slug') || req.headers.get('x-store-id') || '';
        const cleanId = normalizeStoreKey(storeId);

        const cookieStore = await cookies();

        // If a specific store is requested, strictly resolve that store's configuration
        if (cleanId) {
            const storeMemConfig = globalThis.__gumshop_server_configs.get(cleanId) || 
                                   (storeId ? globalThis.__gumshop_server_configs.get(storeId) : null) || {};

            const tokenCookie = cookieStore.get(`${TOKEN_COOKIE_NAME}_${cleanId}`);
            const configCookie = cookieStore.get(`${CONFIG_COOKIE_NAME}_${cleanId}`);

            let parsedConfig = {};
            if (configCookie?.value) {
                try {
                    parsedConfig = JSON.parse(decodeURIComponent(configCookie.value));
                } catch {}
            }

            const vaultedToken = await getServerGumroadToken(cleanId);
            const effectiveToken = vaultedToken || tokenCookie?.value || storeMemConfig.gumroadToken || parsedConfig.gumroadToken || '';

            return NextResponse.json({
                success: true,
                config: {
                    storeId: storeId || cleanId,
                    storeName: storeMemConfig.storeName || parsedConfig.storeName || '',
                    gumroadProductUrl: storeMemConfig.gumroadProductUrl || parsedConfig.gumroadProductUrl || '',
                    customDomain: storeMemConfig.customDomain || parsedConfig.customDomain || '',
                    tracking: storeMemConfig.tracking || parsedConfig.tracking || {},
                    ...storeMemConfig,
                    ...parsedConfig,
                    gumroadToken: effectiveToken
                }
            });
        }

        // Global un-scoped fallback
        const tokenCookie = cookieStore.get(TOKEN_COOKIE_NAME);
        const configCookie = cookieStore.get(CONFIG_COOKIE_NAME);

        let parsedConfig = {};
        if (configCookie?.value) {
            try {
                parsedConfig = JSON.parse(decodeURIComponent(configCookie.value));
            } catch {}
        }

        const effectiveToken = tokenCookie?.value || parsedConfig.gumroadToken || serverStoreConfig.gumroadToken || '';

        return NextResponse.json({
            success: true,
            config: {
                ...serverStoreConfig,
                ...parsedConfig,
                gumroadToken: effectiveToken
            }
        });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const body = await req.json().catch(() => ({}));
        const { gumroadToken, gumroadProductUrl, storeId, storeName, customDomain, tracking } = body;
        const cleanId = normalizeStoreKey(storeId);

        const cookieStore = await cookies();

        if (cleanId) {
            const storePayload = {
                gumroadToken: gumroadToken ? gumroadToken.trim() : '',
                gumroadProductUrl: gumroadProductUrl ? gumroadProductUrl.trim() : '',
                storeId: storeId || cleanId,
                storeName: storeName || '',
                customDomain: customDomain || '',
                tracking: tracking || {},
                updatedAt: new Date().toISOString()
            };

            globalThis.__gumshop_server_configs.set(cleanId, storePayload);
            if (storeId && storeId !== cleanId) {
                globalThis.__gumshop_server_configs.set(storeId, storePayload);
            }

            // Sync with server vault
            if (gumroadToken !== undefined) {
                await setServerGumroadToken(gumroadToken.trim(), cleanId);
            }

            // Set store-scoped cookies
            if (gumroadToken && gumroadToken.trim()) {
                cookieStore.set(`${TOKEN_COOKIE_NAME}_${cleanId}`, gumroadToken.trim(), {
                    httpOnly: false,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    path: '/',
                    maxAge: 60 * 60 * 24 * 30
                });
            }

            cookieStore.set(`${CONFIG_COOKIE_NAME}_${cleanId}`, encodeURIComponent(JSON.stringify(storePayload)), {
                httpOnly: false,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
                maxAge: 60 * 60 * 24 * 30
            });

            return NextResponse.json({
                success: true,
                message: `Store configuration and token permanently synchronized for ${storeId || cleanId}!`,
                config: storePayload
            });
        }

        // Global fallback update when no storeId provided
        if (gumroadToken) serverStoreConfig.gumroadToken = gumroadToken.trim();
        if (gumroadProductUrl) serverStoreConfig.gumroadProductUrl = gumroadProductUrl.trim();
        if (storeName) serverStoreConfig.storeName = storeName;
        if (tracking) serverStoreConfig.tracking = tracking;
        serverStoreConfig.updatedAt = new Date().toISOString();

        if (gumroadToken && gumroadToken.trim()) {
            await setServerGumroadToken(gumroadToken.trim());
            cookieStore.set(TOKEN_COOKIE_NAME, gumroadToken.trim(), {
                httpOnly: false,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
                maxAge: 60 * 60 * 24 * 30
            });
        }

        const payloadToSave = {
            gumroadToken: gumroadToken ? gumroadToken.trim() : (serverStoreConfig.gumroadToken || ''),
            gumroadProductUrl: gumroadProductUrl ? gumroadProductUrl.trim() : (serverStoreConfig.gumroadProductUrl || ''),
            storeId: storeId || serverStoreConfig.activeStoreId || '',
            storeName: storeName || serverStoreConfig.storeName || '',
            customDomain: customDomain || '',
            tracking: tracking || serverStoreConfig.tracking || {}
        };

        cookieStore.set(CONFIG_COOKIE_NAME, encodeURIComponent(JSON.stringify(payloadToSave)), {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 30
        });

        return NextResponse.json({
            success: true,
            message: 'Store configuration and token permanently synchronized!',
            config: payloadToSave
        });
    } catch (error) {
        console.error('Store config sync error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
