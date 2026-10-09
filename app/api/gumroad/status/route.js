import { NextResponse } from 'next/server';
import { getServerGumroadToken } from '@/lib/serverVault';

/**
 * GET /api/gumroad/status
 * Validates Gumroad connectivity server-side without leaking credentials to client bundles.
 */
export async function GET(req) {
    try {
        const authHeader = req.headers.get('authorization') || '';
        const clientToken = authHeader.replace(/^Bearer\s+/i, '').trim();

        // Server-side vaulted token has priority
        const storeKey = req.nextUrl?.searchParams?.get('storeId') || req.nextUrl?.searchParams?.get('store') || new URL(req.url).searchParams.get('storeId') || new URL(req.url).searchParams.get('store') || '';
        const serverToken = (await getServerGumroadToken(storeKey)) || (await getServerGumroadToken()) || clientToken;

        if (!serverToken) {
            return NextResponse.json({
                connected: false,
                message: 'No Gumroad access token configured.',
                account: null
            });
        }

        // Test connection with Gumroad API
        const testRes = await fetch('https://api.gumroad.com/v2/user', {
            headers: {
                'Authorization': `Bearer ${serverToken}`
            },
            signal: AbortSignal.timeout(6000)
        }).catch(() => null);

        if (!testRes || !testRes.ok) {
            return NextResponse.json({
                connected: false,
                message: 'Gumroad token is invalid or expired.',
                statusCode: testRes?.status || 500,
                account: null
            });
        }

        const data = await testRes.json().catch(() => ({}));

        return NextResponse.json({
            connected: true,
            message: 'Gumroad successfully connected and verified.',
            account: {
                name: data.user?.name || 'Gumroad Merchant',
                email: data.user?.email || '',
                url: data.user?.url || '',
                currency: data.user?.currency_type || 'USD'
            }
        });

    } catch (err) {
        console.error('Gumroad status check failed:', err);
        return NextResponse.json({
            connected: false,
            message: 'Unable to reach Gumroad API servers.',
            account: null
        }, { status: 500 });
    }
}
