import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const MASTER_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Meetminal@0406';
const ADMIN_SESSION_TOKEN = 'gumshop_superadmin_session_meetminal_verified_2026';
const COOKIE_NAME = 'gumshop_admin_session';

export async function POST(req) {
    try {
        const body = await req.json();
        const { password, action } = body;

        // Logout action
        if (action === 'logout') {
            const cookieStore = await cookies();
            cookieStore.delete(COOKIE_NAME);
            return NextResponse.json({ success: true, message: 'Logged out successfully' });
        }

        // Verify Master Password
        if (password === MASTER_ADMIN_PASSWORD) {
            const cookieStore = await cookies();
            cookieStore.set(COOKIE_NAME, ADMIN_SESSION_TOKEN, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
                maxAge: 60 * 60 * 24 * 7 // 7 days session
            });

            return NextResponse.json({ 
                success: true, 
                message: 'Super Admin authenticated successfully' 
            });
        }

        return NextResponse.json({ 
            success: false, 
            error: 'Invalid master admin password. Access denied.' 
        }, { status: 401 });

    } catch (error) {
        console.error('Admin auth error:', error);
        return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
    }
}

export async function GET() {
    try {
        const cookieStore = await cookies();
        const session = cookieStore.get(COOKIE_NAME);

        if (session && session.value === ADMIN_SESSION_TOKEN) {
            return NextResponse.json({ authenticated: true });
        }

        return NextResponse.json({ authenticated: false }, { status: 401 });
    } catch (error) {
        return NextResponse.json({ authenticated: false }, { status: 500 });
    }
}
