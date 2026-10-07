import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Server-side in-memory cache for fast zero-latency access across API routes
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

export async function GET() {
    try {
        const cookieStore = await cookies();
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

        const cookieStore = await cookies();

        // Update server memory
        if (gumroadToken) serverStoreConfig.gumroadToken = gumroadToken.trim();
        if (gumroadProductUrl) serverStoreConfig.gumroadProductUrl = gumroadProductUrl.trim();
        if (storeId) serverStoreConfig.activeStoreId = storeId;
        if (storeName) serverStoreConfig.storeName = storeName;
        if (tracking) serverStoreConfig.tracking = tracking;
        serverStoreConfig.updatedAt = new Date().toISOString();

        // Set persistent cookies (30-day expiry)
        if (gumroadToken && gumroadToken.trim()) {
            cookieStore.set(TOKEN_COOKIE_NAME, gumroadToken.trim(), {
                httpOnly: false, // Accessible to client-side scripts as multi-tier fallback
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
                maxAge: 60 * 60 * 24 * 30 // 30 days
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
