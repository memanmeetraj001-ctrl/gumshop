import { NextResponse } from 'next/server';
import { setServerGumroadToken, clearServerGumroadToken } from '@/lib/serverVault';

/**
 * POST /api/gumroad/connect
 * Verifies a proposed token directly with Gumroad API before vaulting it securely server-side.
 * Never leaks the raw token back to the client or browser storage.
 */
export async function POST(req) {
    try {
        const body = await req.json().catch(() => ({}));
        const { token, action } = body;

        if (action === 'disconnect') {
            await clearServerGumroadToken();
            return NextResponse.json({
                success: true,
                connected: false,
                message: 'Gumroad disconnected successfully.'
            });
        }

        if (!token || typeof token !== 'string' || !token.trim()) {
            return NextResponse.json({
                success: false,
                error: 'Please provide a valid Gumroad access token.'
            }, { status: 400 });
        }

        const cleanToken = token.trim();

        // Validate directly with Gumroad API
        const testRes = await fetch('https://api.gumroad.com/v2/user', {
            headers: {
                'Authorization': `Bearer ${cleanToken}`
            },
            signal: AbortSignal.timeout(6000)
        }).catch(() => null);

        if (!testRes || !testRes.ok) {
            return NextResponse.json({
                success: false,
                error: 'Verification failed: Gumroad returned unauthorized or invalid token.'
            }, { status: 401 });
        }

        const data = await testRes.json().catch(() => ({}));

        // Vault the token strictly server-side
        await setServerGumroadToken(cleanToken);

        // Return verified account info without exposing the token
        return NextResponse.json({
            success: true,
            connected: true,
            message: `Connected successfully as ${data.user?.name || 'Gumroad Merchant'}!`,
            user: {
                name: data.user?.name || '',
                email: data.user?.email || '',
                url: data.user?.url || '',
                currency: data.user?.currency_type || 'USD'
            }
        });

    } catch (err) {
        console.error('API /api/gumroad/connect error:', err);
        return NextResponse.json({
            success: false,
            error: 'Server error while contacting Gumroad API.'
        }, { status: 500 });
    }
}
