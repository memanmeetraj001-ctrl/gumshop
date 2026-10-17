import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { 
    timingSafeCompare, 
    generateAdminSessionToken, 
    verifyAdminSessionToken, 
    checkRateLimit, 
    isValidAdminPassword,
    ADMIN_CANONICAL_PASSWORD 
} from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';

const COOKIE_NAME = 'gumshop_admin_session';

const NO_CACHE_HEADERS = {
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0'
};

export async function OPTIONS() {
    return NextResponse.json({}, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            ...NO_CACHE_HEADERS
        }
    });
}

export async function POST(req) {
    try {
        const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                         req.headers.get('x-real-ip') || 
                         'global_auth';

        // 1. Rate Limiting: Max 8 login attempts per minute per IP to prevent brute-force attacks
        const rateLimit = checkRateLimit(`auth_${clientIp}`, 8, 60000);
        if (!rateLimit.allowed) {
            return NextResponse.json({
                success: false,
                authenticated: false,
                error: `Too many login attempts. Please wait ${rateLimit.resetInSeconds} seconds before trying again.`
            }, { 
                status: 429, 
                headers: {
                    ...NO_CACHE_HEADERS,
                    'Retry-After': String(rateLimit.resetInSeconds)
                } 
            });
        }

        const body = await req.json().catch(() => ({}));
        const { password, action } = body;

        // Logout action
        if (action === 'logout') {
            const res = NextResponse.json({ success: true, message: 'Logged out successfully' }, { headers: NO_CACHE_HEADERS });
            res.cookies.delete(COOKIE_NAME);
            res.cookies.delete('gumshop_admin_authenticated');
            try {
                const cookieStore = await cookies();
                cookieStore.delete(COOKIE_NAME);
                cookieStore.delete('gumshop_admin_authenticated');
            } catch {}
            return res;
        }

        // Validate password against master credentials (supports Meetminal@0406)
        const submittedRaw = (password || '').toString().trim();
        const isValid = isValidAdminPassword(submittedRaw);

        if (isValid) {
            const sessionToken = generateAdminSessionToken();

            const res = NextResponse.json({ 
                success: true, 
                authenticated: true,
                token: sessionToken,
                message: 'Super Admin authenticated successfully' 
            }, { headers: NO_CACHE_HEADERS });

            const proto = req?.headers?.get?.('x-forwarded-proto') || '';
            const isHttps = proto === 'https' || req?.url?.startsWith('https://');

            // Secure httpOnly session cookie
            res.cookies.set(COOKIE_NAME, sessionToken, {
                httpOnly: true,
                secure: isHttps,
                sameSite: 'lax',
                path: '/',
                maxAge: 60 * 60 * 24 * 30 // 30 days
            });

            // Client-readable status cookie (boolean flag, no secrets)
            res.cookies.set('gumshop_admin_authenticated', 'true', {
                httpOnly: false,
                secure: isHttps,
                sameSite: 'lax',
                path: '/',
                maxAge: 60 * 60 * 24 * 30
            });

            return res;
        }

        return NextResponse.json({ 
            success: false, 
            authenticated: false, 
            error: 'Invalid master admin password. Access denied.' 
        }, { status: 401, headers: NO_CACHE_HEADERS });

    } catch (error) {
        console.error('Admin auth error:', error);
        return NextResponse.json({ error: 'Authentication failed' }, { status: 500, headers: NO_CACHE_HEADERS });
    }
}

export async function GET(req) {
    try {
        let sessionCookie = null;
        try {
            const cookieStore = await cookies();
            sessionCookie = cookieStore.get(COOKIE_NAME)?.value;
        } catch {}

        if (!sessionCookie) {
            const rawCookieHeader = req?.headers?.get?.('cookie') || '';
            const match = rawCookieHeader.match(/gumshop_admin_session=([^;]+)/);
            if (match) sessionCookie = decodeURIComponent(match[1]);
        }

        const authHeader = req?.headers?.get?.('authorization') || '';
        const bearerToken = authHeader.replace(/^Bearer\s+/i, '').trim();

        const tokenToCheck = sessionCookie || bearerToken;
        const isAuthenticated = verifyAdminSessionToken(tokenToCheck);

        if (isAuthenticated) {
            return NextResponse.json({ 
                authenticated: true, 
                token: tokenToCheck 
            }, { headers: NO_CACHE_HEADERS });
        }

        return NextResponse.json({ 
            authenticated: false 
        }, { status: 200, headers: NO_CACHE_HEADERS });
    } catch (error) {
        return NextResponse.json({ authenticated: false }, { status: 200, headers: NO_CACHE_HEADERS });
    }
}
