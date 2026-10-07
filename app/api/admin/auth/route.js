import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

const MASTER_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Meetminal@0406';
const ADMIN_SESSION_TOKEN = 'gumshop_superadmin_session_meetminal_verified_2026';
const COOKIE_NAME = 'gumshop_admin_session';

const NO_CACHE_HEADERS = {
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0'
};

export async function POST(req) {
    try {
        const body = await req.json().catch(() => ({}));
        const { password, action } = body;

        // Logout action
        if (action === 'logout') {
            const cookieStore = await cookies();
            cookieStore.delete(COOKIE_NAME);
            const response = NextResponse.json({ success: true, message: 'Logged out successfully' }, { headers: NO_CACHE_HEADERS });
            response.cookies.delete(COOKIE_NAME);
            return response;
        }

        // Verify Master Password
        if (password && password.trim() === MASTER_ADMIN_PASSWORD.trim()) {
            const cookieStore = await cookies();
            const cookieOptions = {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
                maxAge: 60 * 60 * 24 * 14 // 14 days session
            };

            cookieStore.set(COOKIE_NAME, ADMIN_SESSION_TOKEN, cookieOptions);

            const res = NextResponse.json({ 
                success: true, 
                authenticated: true,
                token: ADMIN_SESSION_TOKEN,
                message: 'Super Admin authenticated successfully' 
            }, { headers: NO_CACHE_HEADERS });

            res.cookies.set(COOKIE_NAME, ADMIN_SESSION_TOKEN, cookieOptions);
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
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get(COOKIE_NAME)?.value;

        // Also check Authorization header or searchParams for fail-safe client token validation
        const authHeader = req?.headers?.get?.('authorization') || '';
        const bearerToken = authHeader.replace(/^Bearer\s+/i, '').trim();
        const url = new URL(req.url);
        const queryToken = url.searchParams.get('token');

        const isAuthenticated = 
            sessionCookie === ADMIN_SESSION_TOKEN || 
            bearerToken === ADMIN_SESSION_TOKEN || 
            queryToken === ADMIN_SESSION_TOKEN;

        if (isAuthenticated) {
            return NextResponse.json({ 
                authenticated: true,
                token: ADMIN_SESSION_TOKEN 
            }, { headers: NO_CACHE_HEADERS });
        }

        return NextResponse.json({ 
            authenticated: false 
        }, { status: 200, headers: NO_CACHE_HEADERS });
    } catch (error) {
        return NextResponse.json({ authenticated: false }, { status: 200, headers: NO_CACHE_HEADERS });
    }
}
